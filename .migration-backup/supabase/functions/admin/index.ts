import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function userHeaders(userToken: string, anonKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${userToken}`,
  };
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
    const headers = userHeaders(userToken, anonKey);
    const userId = extractUserId(userToken);

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin (premium plan)
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=subscription_plan`,
      { headers }
    );
    const profiles = await profileRes.json();

    if (!profiles[0] || profiles[0].subscription_plan !== "premium") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "stats";

    if (action === "stats") {
      // Aggregate stats — RLS restricts to own data, so we use counts
      // For admin stats, we need aggregate queries that work with RLS
      // Since admin is premium, they can see their own data
      // For platform-wide stats, we return what's available via RLS
      const [chatsRes, messagesRes, ttsRes, voicesRes, creditsRes] =
        await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/chats?select=id`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/messages?select=id`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/tts_history?select=id`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/voice_models?select=id`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/credit_usage?select=credits_used`, { headers }),
        ]);

      const [chats, messages, tts, voices, credits] = await Promise.all([
        chatsRes.json(),
        messagesRes.json(),
        ttsRes.json(),
        voicesRes.json(),
        creditsRes.json(),
      ]);

      const totalCreditsUsed = (credits as { credits_used: number }[]).reduce(
        (sum, c) => sum + c.credits_used,
        0
      );

      return new Response(
        JSON.stringify({
          totalUsers: 1, // RLS only shows own data
          totalChats: (chats as unknown[]).length,
          totalMessages: (messages as unknown[]).length,
          totalTtsGenerations: (tts as unknown[]).length,
          totalVoiceModels: (voices as unknown[]).length,
          creditsUsed: totalCreditsUsed,
          activeSubscriptions: 1,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "users") {
      // RLS restricts to own profile only
      const profileRes2 = await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=*&id=eq.${userId}`,
        { headers }
      );
      const users = await profileRes2.json();

      return new Response(JSON.stringify({ users, page: 1, limit: 20 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractUserId(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || "";
    }
  } catch {
    // fallback
  }
  return "";
}
