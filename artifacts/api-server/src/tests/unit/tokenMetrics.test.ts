import { describe, it, expect } from "vitest";
import { recordLLMCall, getTokenSnapshot } from "../../telemetry/tokenMetrics.js";

describe("tokenMetrics", () => {
  it("records a successful Groq call", () => {
    recordLLMCall({ provider: "groq", model: "llama-3.3-70b-versatile", latencyMs: 800, success: true, promptTokens: 100, completionTokens: 200 });
    const snap = getTokenSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["groq"]["requests"] as number)).toBeGreaterThanOrEqual(1);
    expect((snap["groq"]["totalTokens"] as number)).toBeGreaterThanOrEqual(300);
  });

  it("records a failed Groq call", () => {
    const before = (getTokenSnapshot() as Record<string, Record<string, unknown>>)["groq"]["failures"] as number;
    recordLLMCall({ provider: "groq", model: "llama-3.1-8b-instant", latencyMs: 200, success: false });
    const snap = getTokenSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["groq"]["failures"] as number)).toBe(before + 1);
  });

  it("records a successful OpenRouter call", () => {
    recordLLMCall({ provider: "openrouter", model: "google/gemini-2.5-flash-lite", latencyMs: 1200, success: true, promptTokens: 50, completionTokens: 150 });
    const snap = getTokenSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["openrouter"]["requests"] as number)).toBeGreaterThanOrEqual(1);
    expect((snap["openrouter"]["totalTokens"] as number)).toBeGreaterThanOrEqual(200);
  });

  it("lifetimeTotalTokens accumulates", () => {
    const snap1 = getTokenSnapshot() as Record<string, unknown>;
    recordLLMCall({ provider: "groq", model: "test-model", latencyMs: 100, success: true, promptTokens: 10, completionTokens: 10 });
    const snap2 = getTokenSnapshot() as Record<string, unknown>;
    expect((snap2["lifetimeTotalTokens"] as number)).toBeGreaterThan((snap1["lifetimeTotalTokens"] as number));
  });

  it("model breakdown is tracked", () => {
    recordLLMCall({ provider: "groq", model: "special-model", latencyMs: 500, success: true });
    const snap = getTokenSnapshot() as Record<string, Record<string, unknown>>;
    const breakdown = snap["groq"]["modelBreakdown"] as Record<string, number>;
    expect(breakdown["special-model"]).toBeGreaterThanOrEqual(1);
  });

  it("successRate is a percentage string", () => {
    recordLLMCall({ provider: "openrouter", model: "any", latencyMs: 100, success: true });
    const snap = getTokenSnapshot() as Record<string, Record<string, unknown>>;
    expect(typeof snap["openrouter"]["successRate"]).toBe("string");
    expect(snap["openrouter"]["successRate"] as string).toContain("%");
  });
});
