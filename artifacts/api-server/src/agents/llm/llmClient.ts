import type { OpenRouterError } from "../types.js";
import { recordLLMCall } from "../../telemetry/tokenMetrics.js";
import { recordTokenUsage } from "../../cost/tokenBudget.js";
import { recordTokensUsed } from "../../limits/userLimits.js";
import { tokenContext } from "./tokenContext.js";

export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const PLANNER_MODEL  = "llama-3.3-70b-versatile";
export const DESIGN_MODEL   = "google/gemini-2.5-flash-lite";
export const CODEGEN_MODEL  = "deepseek/deepseek-chat";
export const CODEFIX_MODEL  = "llama-3.3-70b-versatile";
export const BACKEND_MODEL  = "llama-3.3-70b-versatile";
export const REPAIR_MODEL   = "llama-3.1-8b-instant";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Wire provider-reported token counts into global budget + per-user quota. */
function accountTokens(provider: 'groq' | 'openrouter', promptTokens: number, completionTokens: number): void {
  const total = promptTokens + completionTokens;
  if (total <= 0) return;
  recordTokenUsage(provider, total);
  const ctx = tokenContext.getStore();
  if (ctx) recordTokensUsed(ctx.userId, total);
}

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
  const start = Date.now();
  let success = false;
  try {
    const resp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // stream_options.include_usage causes Groq to append a final chunk
      // containing usage counts before the [DONE] sentinel — the only
      // provider-reported source for streaming token counts.
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        stream,
        ...(stream ? { stream_options: { include_usage: true } } : {}),
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      if (resp.status === 429 && body.includes("Please try again")) {
        const wait = parseInt(body.match(/try again in (\d+\.?\d*)s/)?.[1] ?? "2") * 1000 + 300;
        await new Promise(r => setTimeout(r, wait));
        // Recursive retry — the new call will record its own usage on success.
        // The 429 response carries no usage, so there is no double-count risk.
        return (callGroq as (a: string, m: string, msgs: ChatMessage[], s: boolean, t?: number, cb?: (t: string) => void) => Promise<string>)(apiKey, model, messages, stream, maxTokens, onToken);
      }
      recordLLMCall({ provider: "groq", model, latencyMs: Date.now() - start, success: false });
      throw new Error(`Groq ${resp.status}: ${body.slice(0, 300)}`);
    }

    if (!stream) {
      const data = await resp.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      success = true;
      const pt = data.usage?.prompt_tokens    ?? 0;
      const ct = data.usage?.completion_tokens ?? 0;
      recordLLMCall({
        provider: "groq", model, latencyMs: Date.now() - start, success: true,
        promptTokens: pt, completionTokens: ct,
      });
      // Wire global budget + per-user quota (Phase 4 & 5 of V7.0.2)
      accountTokens('groq', pt, ct);
      return data.choices?.[0]?.message?.content ?? "";
    }

    // Streaming path — usage arrives in the final chunk when stream_options.include_usage=true
    let full = "";
    let streamPt = 0;
    let streamCt = 0;
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
          const parsed = JSON.parse(raw) as {
            choices?: Array<{ delta?: { content?: string } }>;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };
          const token = parsed.choices?.[0]?.delta?.content ?? "";
          if (token) { full += token; onToken?.(token); }
          // Capture usage from the final chunk (Groq appends it with stream_options)
          if (parsed.usage) {
            streamPt = parsed.usage.prompt_tokens    ?? 0;
            streamCt = parsed.usage.completion_tokens ?? 0;
          }
        } catch {}
      }
    }
    success = true;
    recordLLMCall({
      provider: "groq", model, latencyMs: Date.now() - start, success: true,
      promptTokens: streamPt, completionTokens: streamCt,
    });
    // Wire global budget + per-user quota for streaming path
    accountTokens('groq', streamPt, streamCt);
    return full;
  } catch (err) {
    if (!success) recordLLMCall({ provider: "groq", model, latencyMs: Date.now() - start, success: false });
    throw err;
  }
}

export async function callOpenRouter(apiKey: string, model: string, messages: ChatMessage[], maxTokens = 4000): Promise<string> {
  const start = Date.now();
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
    recordLLMCall({ provider: "openrouter", model, latencyMs: Date.now() - start, success: false });
    const err = new Error(`OpenRouter ${resp.status} for model "${model}" [req:${requestId}]: ${body}`) as OpenRouterError;
    err.status = resp.status;
    err.requestId = requestId;
    err.model = model;
    err.body = body;
    throw err;
    // Note: failed requests have no usage data — no double-count risk for
    // the OpenRouter→Groq fallback in frontendStep.ts.
  }
  const data = await resp.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const pt = data.usage?.prompt_tokens    ?? 0;
  const ct = data.usage?.completion_tokens ?? 0;
  recordLLMCall({
    provider: "openrouter", model, latencyMs: Date.now() - start, success: true,
    promptTokens: pt, completionTokens: ct,
  });
  // Wire global budget + per-user quota (Phase 4 & 5 of V7.0.2)
  accountTokens('openrouter', pt, ct);
  return data.choices?.[0]?.message?.content ?? "";
}
