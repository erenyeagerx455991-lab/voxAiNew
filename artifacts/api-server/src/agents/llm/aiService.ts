/**
 * Centralized AI Service — VoxAI
 *
 * Primary  : openai/gpt-oss-120b:free  (OpenRouter)
 * Fallback1: deepseek/deepseek-chat-v3 (OpenRouter)
 * Fallback2: google/gemini-2.5-flash-lite (OpenRouter)
 *
 * All requests go through OpenRouter.
 * Handles: rate limits, timeouts, invalid responses, network failures.
 * Logs: model used, response time, token usage, errors.
 */

import { recordLLMCall } from "../../telemetry/tokenMetrics.js";
import {
  checkProviderBudget,
  recordProviderTokens,
  recordProviderRequest,
} from "../../cost/providerBudget.js";
import { recordTokensUsed } from "../../limits/userLimits.js";
import { tokenContext } from "./tokenContext.js";
import { createLogger } from "../../lib/structuredLogger.js";
import type { ChatMessage } from "./llmClient.js";

export type { ChatMessage };

const log = createLogger("AIService");

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const PRIMARY_MODEL   = "openai/gpt-oss-120b:free";
export const FALLBACK_1_MODEL = "deepseek/deepseek-chat-v3";
export const FALLBACK_2_MODEL = "google/gemini-2.5-flash-lite";

export const MODEL_CHAIN = [PRIMARY_MODEL, FALLBACK_1_MODEL, FALLBACK_2_MODEL] as const;

export const PROVIDER = "openrouter" as const;

export interface CallAIOptions {
  maxTokens?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
  label?: string;
  timeoutMs?: number;
}

type ErrorKind = "rate_limit" | "timeout" | "invalid_response" | "network" | "api_error";

function classifyError(err: unknown, status?: number): ErrorKind {
  if (status === 429) return "rate_limit";
  if (status === 400 || status === 422) return "invalid_response";
  if (err instanceof Error) {
    if (err.name === "AbortError") return "timeout";
    if (err.message.includes("fetch") || err.message.includes("network") || err.message.includes("ECONNREFUSED") || err.message.includes("ETIMEDOUT")) return "network";
  }
  return "api_error";
}

function shouldRetryOnModel(kind: ErrorKind): boolean {
  return kind === "rate_limit" || kind === "api_error" || kind === "network" || kind === "timeout";
}

function accountTokens(promptTokens: number, completionTokens: number): void {
  const total = promptTokens + completionTokens;
  if (total <= 0) return;
  recordProviderTokens(PROVIDER, total);
  const ctx = tokenContext.getStore();
  if (ctx) recordTokensUsed(ctx.userId, total);
}

async function callModelStreaming(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  onToken: (t: string) => void,
  timeoutMs: number
): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://voxai.replit.app",
        "X-Title": "VoxAI",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      const e = new Error(`OpenRouter ${resp.status} [${model}]: ${body.slice(0, 300)}`);
      (e as unknown as Record<string, unknown>).status = resp.status;
      throw e;
    }

    let full = "";
    let promptTokens = 0;
    let completionTokens = 0;
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
          if (token) { full += token; onToken(token); }
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens ?? 0;
            completionTokens = parsed.usage.completion_tokens ?? 0;
          }
        } catch { /* malformed SSE chunk — skip */ }
      }
    }

    return { text: full, promptTokens, completionTokens };
  } finally {
    clearTimeout(timer);
  }
}

async function callModelNonStreaming(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  timeoutMs: number
): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://voxai.replit.app",
        "X-Title": "VoxAI",
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      const e = new Error(`OpenRouter ${resp.status} [${model}]: ${body.slice(0, 300)}`);
      (e as unknown as Record<string, unknown>).status = resp.status;
      throw e;
    }

    const data = await resp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error(`Model "${model}" returned an empty response`);

    return {
      text,
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function callAI(
  openrouterKey: string,
  messages: ChatMessage[],
  options: CallAIOptions = {}
): Promise<string> {
  const {
    maxTokens = 4000,
    stream = false,
    onToken,
    label = "unknown",
    timeoutMs = 120_000,
  } = options;

  let lastError: unknown = null;

  for (const model of MODEL_CHAIN) {
    // ── Provider pre-flight: check RPM/TPM/budget BEFORE any outbound request ──
    const budgetCheck = checkProviderBudget(PROVIDER);
    if (!budgetCheck.allowed) {
      const err = Object.assign(new Error(budgetCheck.reason ?? "Provider budget exceeded"), {
        code: "PROVIDER_BUDGET_EXCEEDED",
        provider: PROVIDER,
      });
      log.warn("PROVIDER_BUDGET_PREFLIGHT_REJECTED", { label, model, reason: budgetCheck.reason });
      throw err;
    }

    // Record this request in the RPM window before the network call
    recordProviderRequest(PROVIDER);

    const start = Date.now();
    let success = false;
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      let text: string;

      if (stream && onToken) {
        const result = await callModelStreaming(openrouterKey, model, messages, maxTokens, onToken, timeoutMs);
        text = result.text;
        promptTokens = result.promptTokens;
        completionTokens = result.completionTokens;
      } else {
        const result = await callModelNonStreaming(openrouterKey, model, messages, maxTokens, timeoutMs);
        text = result.text;
        promptTokens = result.promptTokens;
        completionTokens = result.completionTokens;
      }

      const latencyMs = Date.now() - start;
      success = true;

      recordLLMCall({
        provider: PROVIDER,
        model,
        latencyMs,
        success: true,
        promptTokens,
        completionTokens,
      });

      // Record actual token usage AFTER successful response only
      accountTokens(promptTokens, completionTokens);

      log.info("AI_CALL_SUCCESS", {
        label,
        model,
        latencyMs,
        promptTokens,
        completionTokens,
      });

      return text;
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const status = (err as Record<string, unknown>).status as number | undefined;

      // Rethrow budget exceeded immediately — no point trying next model
      if ((err as Record<string, unknown>).code === "PROVIDER_BUDGET_EXCEEDED") throw err;

      const kind = classifyError(err, status);

      recordLLMCall({ provider: PROVIDER, model, latencyMs, success: false });

      log.warn("AI_CALL_FAILED", {
        label,
        model,
        kind,
        status,
        error: err instanceof Error ? err.message : String(err),
        willRetry: shouldRetryOnModel(kind) && model !== FALLBACK_2_MODEL,
      });

      lastError = err;

      if (!success && !shouldRetryOnModel(kind)) {
        break;
      }
    }
  }

  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  log.error("AI_ALL_MODELS_FAILED", { label, models: MODEL_CHAIN, error: errMsg });
  throw new Error(`[AIService:${label}] All models exhausted. Last error: ${errMsg}`);
}
