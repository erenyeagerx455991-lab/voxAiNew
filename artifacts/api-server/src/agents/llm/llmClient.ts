import type { OpenRouterError } from "../types.js";

export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const PLANNER_MODEL  = "llama-3.3-70b-versatile";
export const DESIGN_MODEL   = "google/gemini-2.5-flash-lite";
export const CODEGEN_MODEL  = "deepseek/deepseek-chat";
export const CODEFIX_MODEL  = "llama-3.3-70b-versatile";
export const BACKEND_MODEL  = "llama-3.3-70b-versatile";
export const REPAIR_MODEL   = "llama-3.1-8b-instant";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callGroq(apiKey: string, model: string, messages: ChatMessage[], stream: false, maxTokens?: number): Promise<string>;
export async function callGroq(apiKey: string, model: string, messages: ChatMessage[], stream: true, maxTokens?: number, onToken?: (t: string) => void): Promise<string>;
export async function callGroq(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  stream: boolean,
  maxTokens = 4000,
  onToken?: (t: string) => void
): Promise<string> {
  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 429 && body.includes("Please try again")) {
      const wait = parseInt(body.match(/try again in (\d+\.?\d*)s/)?.[1] ?? "2") * 1000 + 300;
      await new Promise(r => setTimeout(r, wait));
      return (callGroq as (a: string, m: string, msgs: ChatMessage[], s: boolean, t?: number, cb?: (t: string) => void) => Promise<string>)(apiKey, model, messages, stream, maxTokens, onToken);
    }
    throw new Error(`Groq ${resp.status}: ${body.slice(0, 300)}`);
  }

  if (!stream) {
    const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  }

  let full = "";
  const reader = resp.body!.getReader();
  const dec = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value);
    for (const line of chunk.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const raw = trimmed.slice(5).trim();
      if (raw === "[DONE]") break;
      try {
        const parsed = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string } }> };
        const token = parsed.choices?.[0]?.delta?.content ?? "";
        if (token) { full += token; onToken?.(token); }
      } catch {}
    }
  }
  return full;
}

export async function callOpenRouter(apiKey: string, model: string, messages: ChatMessage[], maxTokens = 4000): Promise<string> {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://voxai.replit.app",
      "X-Title": "VoxAI",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });
  const requestId = resp.headers.get("x-request-id") ?? resp.headers.get("cf-ray") ?? "unknown";
  if (!resp.ok) {
    const body = await resp.text();
    const err = new Error(`OpenRouter ${resp.status} for model "${model}" [req:${requestId}]: ${body}`) as OpenRouterError;
    err.status = resp.status;
    err.requestId = requestId;
    err.model = model;
    err.body = body;
    throw err;
  }
  const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
