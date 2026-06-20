/**
 * Provider Usage Parsing Tests
 * Verifies exact extraction of prompt_tokens / completion_tokens from each provider.
 * Covers: non-streaming, streaming, retry (no double-count), fallback (no double-count).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { callGroq, callOpenRouter } from "../../src/agents/llm/llmClient.js";
import { getBudgetUsage, _resetBudgetForTest } from "../../src/cost/tokenBudget.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const KEY = "test-key";
const MODEL = "llama-3.3-70b-versatile";
const MSGS = [{ role: "user" as const, content: "test" }];

function groqResp(pt: number, ct: number, content = "ok") {
  return {
    ok: true, status: 200,
    json: async () => ({ choices: [{ message: { content } }], usage: { prompt_tokens: pt, completion_tokens: ct } }),
    headers: { get: () => null },
    body: null,
  };
}

function groqStreamResp(pt: number, ct: number, text = "hi") {
  const lines = [
    `data: {"choices":[{"delta":{"content":"${text}"}}]}\n\n`,
    `data: {"choices":[{"delta":{}}],"usage":{"prompt_tokens":${pt},"completion_tokens":${ct}}}\n\n`,
    `data: [DONE]\n\n`,
  ].join("");
  const bytes = new TextEncoder().encode(lines);
  let pos = 0;
  return {
    ok: true, status: 200,
    headers: { get: () => null },
    body: {
      getReader: () => ({
        read: async () => pos < bytes.length
          ? (() => { const v = bytes.slice(pos); pos = bytes.length; return { done: false, value: v }; })()
          : { done: true, value: undefined },
      }),
    },
  };
}

function groqStreamNoUsage(text = "hi") {
  // Streaming WITHOUT include_usage — final chunk has no usage field
  const lines = [
    `data: {"choices":[{"delta":{"content":"${text}"}}]}\n\n`,
    `data: [DONE]\n\n`,
  ].join("");
  const bytes = new TextEncoder().encode(lines);
  let pos = 0;
  return {
    ok: true, status: 200,
    headers: { get: () => null },
    body: {
      getReader: () => ({
        read: async () => pos < bytes.length
          ? (() => { const v = bytes.slice(pos); pos = bytes.length; return { done: false, value: v }; })()
          : { done: true, value: undefined },
      }),
    },
  };
}

function groq429Resp() {
  return { ok: false, status: 429, text: async () => "Please try again in 0.1s", headers: { get: () => null } };
}

function orResp(pt: number, ct: number) {
  return {
    ok: true, status: 200,
    json: async () => ({ choices: [{ message: { content: "ok" } }], usage: { prompt_tokens: pt, completion_tokens: ct } }),
    headers: { get: () => null },
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  _resetBudgetForTest();
});

describe("Provider Usage Parsing — Groq non-streaming", () => {

  it("reads prompt_tokens and completion_tokens from response body", async () => {
    mockFetch.mockResolvedValueOnce(groqResp(123, 456));
    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(579);
  });

  it("sums to total_tokens correctly (pt + ct)", async () => {
    mockFetch.mockResolvedValueOnce(groqResp(1000, 500));
    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(1500);
  });

  it("handles missing usage gracefully (records 0)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
      headers: { get: () => null },
    });
    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(0);
  });
});

describe("Provider Usage Parsing — Groq streaming", () => {

  it("reads usage from final streaming chunk", async () => {
    mockFetch.mockResolvedValueOnce(groqStreamResp(80, 40));
    await callGroq(KEY, MODEL, MSGS, true);
    expect(getBudgetUsage().daily.groq).toBe(120);
  });

  it("sends stream_options.include_usage=true in request body", async () => {
    mockFetch.mockResolvedValueOnce(groqStreamResp(1, 1));
    await callGroq(KEY, MODEL, MSGS, true);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.stream_options).toBeDefined();
    expect(body.stream_options.include_usage).toBe(true);
    expect(body.stream).toBe(true);
  });

  it("non-streaming requests do NOT include stream_options", async () => {
    mockFetch.mockResolvedValueOnce(groqResp(1, 1));
    await callGroq(KEY, MODEL, MSGS, false);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.stream_options).toBeUndefined();
  });

  it("records 0 when no usage chunk arrives (server omits usage)", async () => {
    mockFetch.mockResolvedValueOnce(groqStreamNoUsage());
    await callGroq(KEY, MODEL, MSGS, true);
    // No crash; budget stays 0 (provider did not report usage)
    expect(getBudgetUsage().daily.groq).toBe(0);
  });
});

describe("Provider Usage Parsing — OpenRouter", () => {

  it("reads prompt_tokens and completion_tokens from response body", async () => {
    mockFetch.mockResolvedValueOnce(orResp(200, 100));
    await callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS);
    expect(getBudgetUsage().daily.openrouter).toBe(300);
  });

  it("sums correctly for large token counts", async () => {
    mockFetch.mockResolvedValueOnce(orResp(8000, 2000));
    await callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS);
    expect(getBudgetUsage().daily.openrouter).toBe(10000);
  });
});

describe("Provider Usage Parsing — Double-count Protection", () => {

  it("Groq 429 retry: counts only once (from the successful retry)", async () => {
    // First call returns 429 (no usage), second call succeeds (records usage)
    mockFetch
      .mockResolvedValueOnce(groq429Resp())
      .mockResolvedValueOnce(groqResp(100, 50));

    await callGroq(KEY, MODEL, MSGS, false);
    // Only the successful response's usage is recorded
    expect(getBudgetUsage().daily.groq).toBe(150);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("Groq 429 retry: two retries before success still counts once", async () => {
    mockFetch
      .mockResolvedValueOnce(groq429Resp())
      .mockResolvedValueOnce(groq429Resp())
      .mockResolvedValueOnce(groqResp(100, 50));

    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(150); // exactly 150, not 300 or 450
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("OpenRouter→Groq fallback: counts OR failure as 0, Groq success as real tokens", async () => {
    // Simulate the frontendStep fallback pattern:
    // callOpenRouter fails → caught by caller → callGroq succeeds
    const orFailResp = {
      ok: false, status: 500,
      text: async () => "model error",
      headers: { get: () => "req-fail" },
    };
    mockFetch.mockResolvedValueOnce(orFailResp);
    await expect(callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS)).rejects.toThrow();
    expect(getBudgetUsage().daily.openrouter).toBe(0); // failure: 0 tokens

    // Now Groq picks up as fallback
    mockFetch.mockResolvedValueOnce(groqResp(100, 50));
    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(150);    // only Groq success counted
    expect(getBudgetUsage().daily.openrouter).toBe(0); // OR still 0
  });

  it("application-level retry: each independent callGroq call counts independently", async () => {
    // Simulate architectureStep validation retry: first Groq returns bad JSON,
    // caller retries with corrected prompt — each is a fresh callGroq call
    mockFetch.mockResolvedValueOnce(groqResp(50, 25));  // attempt 1: bad JSON, but we don't care — usage counted
    mockFetch.mockResolvedValueOnce(groqResp(60, 30));  // attempt 2: good JSON

    await callGroq(KEY, MODEL, MSGS, false);
    await callGroq(KEY, MODEL, [{ role: "user", content: "retry" }], false);

    // Both successful calls counted (75 + 90 = 165)
    expect(getBudgetUsage().daily.groq).toBe(75 + 90);
  });
});
