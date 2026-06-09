import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function userHeaders(userToken: string, anonKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${userToken}`,
  };
}

function extractUserId(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || "";
    }
  } catch {}
  return "";
}

interface GroqMessage {
  role: string;
  content: string;
}

async function callGroqStream(
  apiKey: string,
  messages: GroqMessage[],
  systemPrompt?: string
): Promise<ReadableStream<Uint8Array>> {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: "mixtral-8x7b-32768",
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages,
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "Groq API error";
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) {
        errMsg = errJson.error.message;
      }
    } catch {}
    throw new Error(`${response.status}: ${errMsg}`);
  }

  if (!response.body) {
    throw new Error("Groq API returned empty response");
  }

  return response.body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userToken = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    const headers = userHeaders(userToken, anonKey);

    const userId = extractUserId(userToken);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "Groq API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { chatId, message } = await req.json();

      if (!chatId || !message) {
        return new Response(JSON.stringify({ error: "chatId and message are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save user message
      const userMsgRes = await fetch(`${supabaseUrl}/rest/v1/messages`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ chat_id: chatId, role: "user", content: message }),
      });

      if (!userMsgRes.ok) {
        const err = await userMsgRes.text();
        return new Response(JSON.stringify({ error: "Failed to save user message", details: err }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const savedUserMsg = await userMsgRes.json();
      const userMessageId = Array.isArray(savedUserMsg) ? savedUserMsg[0]?.id : savedUserMsg?.id;

      // Fetch recent conversation history
      const historyRes = await fetch(
        `${supabaseUrl}/rest/v1/messages?chat_id=eq.${chatId}&select=role,content&order=created_at.asc&limit=20`,
        { headers }
      );
      const history = await historyRes.json();

      // Build Groq conversation messages
      const messages: GroqMessage[] = history.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      const systemPrompt = "You are VoxAI, a helpful and knowledgeable AI assistant. Be concise, friendly, and informative. Provide clear and accurate responses.";

      let groqStream: ReadableStream<Uint8Array>;
      try {
        groqStream = await callGroqStream(groqApiKey, messages, systemPrompt);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to reach Groq API";
        return new Response(JSON.stringify({ error: errMsg, userMessageId }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let assistantMsgId = "";
      let savedAssistantMsg = false;

      const stream = new ReadableStream({
        async start(controller) {
          const reader = groqStream.getReader();

          try {
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (fullResponse && !savedAssistantMsg) {
                  savedAssistantMsg = true;

                  try {
                    const assistantMsgRes = await fetch(`${supabaseUrl}/rest/v1/messages`, {
                      method: "POST",
                      headers: { ...headers, Prefer: "return=representation" },
                      body: JSON.stringify({ chat_id: chatId, role: "assistant", content: fullResponse }),
                    });
                    if (assistantMsgRes.ok) {
                      const saved = await assistantMsgRes.json();
                      assistantMsgId = Array.isArray(saved) ? saved[0]?.id : saved?.id || "";
                    }
                  } catch {}

                  try {
                    const chatMsgsRes = await fetch(
                      `${supabaseUrl}/rest/v1/messages?chat_id=eq.${chatId}&select=id&limit=2`,
                      { headers }
                    );
                    const chatMsgs = await chatMsgsRes.json();
                    if (chatMsgs.length <= 2) {
                      const title = message.slice(0, 30) + (message.length > 30 ? "..." : "");
                      await fetch(`${supabaseUrl}/rest/v1/chats?id=eq.${chatId}`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({ title }),
                      });
                    }
                  } catch {}

                  try {
                    await fetch(`${supabaseUrl}/rest/v1/rpc/deduct_credits`, {
                      method: "POST",
                      headers,
                      body: JSON.stringify({
                        p_user_id: userId,
                        p_amount: 1,
                        p_feature: "chat",
                        p_reference_id: chatId,
                      }),
                    });
                  } catch {}

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "done", messageId: assistantMsgId, userMessageId: userMessageId || "" })}\n\n`
                    )
                  );
                }

                controller.close();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data: ")) continue;

                const jsonStr = trimmed.slice(6).trim();
                if (!jsonStr || jsonStr === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed?.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: "token", text: content })}\n\n`)
                    );
                  }
                } catch {}
              }
            }
          } catch (err) {
            if (fullResponse && !savedAssistantMsg) {
              savedAssistantMsg = true;
              try {
                await fetch(`${supabaseUrl}/rest/v1/messages`, {
                  method: "POST",
                  headers: { ...headers, Prefer: "return=representation" },
                  body: JSON.stringify({ chat_id: chatId, role: "assistant", content: fullResponse }),
                });
              } catch {}
            }
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", error: err instanceof Error ? err.message : "Stream interrupted" })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
