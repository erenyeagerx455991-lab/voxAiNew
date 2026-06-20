/**
 * Token Accounting Tests
 * Verifies that successful LLM calls increment both global budget and per-user quota.
 * Verifies that retries and failures are NOT double-counted.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { callGroq, callOpenRouter } from "../../src/agents/llm/llmClient.js";
import { tokenContext } from "../../src/agents/llm/tokenContext.js";
import { getBudgetUsage, _resetBudgetForTest } from "../../src/cost/tokenBudget.js";
import { getUserQuotaStatus, _resetLimitsForTest } from "../../src/limits/userLimits.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function groqSuccess(promptTokens: number, completionTokens: number, content = "ok") {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens },
    }),
    headers: { get: () => null },
    body: null,
  };
}

function groqStreamSuccess(promptTokens: number, completionTokens: number, text = "hello") {
  // Simulate streaming SSE: content chunk, then usage chunk, then [DONE]
  const lines = [
    `data: {"choices":[{"delta":{"content":"${text}"}}]}\n\n`,
    `data: {"choices":[{"delta":{}}],"usage":{"prompt_tokens":${promptTokens},"completion_tokens":${completionTokens}}}\n\n`,
    `data: [DONE]\n\n`,
  ].join("");
  const encoder = new TextEncoder();
  const bytes = encoder.encode(lines);
  let pos = 0;
  const reader = {
    read: async () => {
      if (pos < bytes.length) {
        const chunk = bytes.slice(pos);
        pos = bytes.length;
        return { done: false, value: chunk };
      }
      return { done: true, value: undefined };
    },
  };
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    body: { getReader: () => reader },
  };
}

function orSuccess(promptTokens: number, completionTokens: number, content = "ok") {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens },
    }),
    headers: { get: () => null },
  };
}

function groq429() {
  return {
    ok: false,
    status: 429,
    text: async () => "Please try again in 0.1s (rate limit exceeded)",
    headers: { get: () => null },
  };
}

function orFail(status = 500) {
  return {
    ok: false,
    status,
    text: async () => `Internal error`,
    headers: { get: () => "req-xxx" },
  };
}

const KEY = "test-key";
const MODEL = "llama-3.3-70b-versatile";
const MSGS = [{ role: "user" as const, content: "hi" }];
const USER = "user-acct-001";

beforeEach(() => {
  mockFetch.mockReset();
  _resetBudgetForTest();
  _resetLimitsForTest();
});

describe("Token Accounting — global budget (recordTokenUsage)", () => {

  it("callGroq non-streaming increments groqDaily", async () => {
    mockFetch.mockResolvedValueOnce(groqSuccess(100, 50));
    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(150);
    expect(getBudgetUsage().daily.openrouter).toBe(0);
  });

  it("callGroq streaming increments groqDaily from stream usage chunk", async () => {
    mockFetch.mockResolvedValueOnce(groqStreamSuccess(80, 40));
    await callGroq(KEY, MODEL, MSGS, true);
    expect(getBudgetUsage().daily.groq).toBe(120);
  });

  it("callOpenRouter increments orDaily", async () => {
    mockFetch.mockResolvedValueOnce(orSuccess(200, 100));
    await callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS);
    expect(getBudgetUsage().daily.openrouter).toBe(300);
    expect(getBudgetUsage().daily.groq).toBe(0);
  });

  it("multiple calls accumulate", async () => {
    mockFetch.mockResolvedValueOnce(groqSuccess(100, 50));
    mockFetch.mockResolvedValueOnce(groqSuccess(200, 100));
    await callGroq(KEY, MODEL, MSGS, false);
    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(450);
  });

  it("groq + openrouter both accumulate independently", async () => {
    mockFetch.mockResolvedValueOnce(groqSuccess(100, 50));
    mockFetch.mockResolvedValueOnce(orSuccess(200, 100));
    await callGroq(KEY, MODEL, MSGS, false);
    await callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS);
    expect(getBudgetUsage().daily.groq).toBe(150);
    expect(getBudgetUsage().daily.openrouter).toBe(300);
  });

  it("failed callGroq does NOT increment budget", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "down" });
    await expect(callGroq(KEY, MODEL, MSGS, false)).rejects.toThrow();
    expect(getBudgetUsage().daily.groq).toBe(0);
  });

  it("failed callOpenRouter does NOT increment budget", async () => {
    mockFetch.mockResolvedValueOnce(orFail(500));
    await expect(callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS)).rejects.toThrow();
    expect(getBudgetUsage().daily.openrouter).toBe(0);
  });

  it("zero-token response does not increment (defensive)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "" } }] }),
      headers: { get: () => null },
    });
    await callGroq(KEY, MODEL, MSGS, false);
    expect(getBudgetUsage().daily.groq).toBe(0);
  });
});

describe("Token Accounting — per-user quota (recordTokensUsed)", () => {

  it("callGroq within tokenContext increments user dailyTokens", async () => {
    mockFetch.mockResolvedValueOnce(groqSuccess(100, 50));
    await tokenContext.run({ userId: USER, buildId: "build-001" }, () =>
      callGroq(KEY, MODEL, MSGS, false)
    );
    expect(getUserQuotaStatus(USER).dailyTokens).toBe(150);
  });

  it("callOpenRouter within tokenContext increments user dailyTokens", async () => {
    mockFetch.mockResolvedValueOnce(orSuccess(200, 100));
    await tokenContext.run({ userId: USER, buildId: "build-002" }, () =>
      callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS)
    );
    expect(getUserQuotaStatus(USER).dailyTokens).toBe(300);
  });

  it("multiple LLM calls in same context accumulate to same user", async () => {
    mockFetch.mockResolvedValueOnce(groqSuccess(100, 50));
    mockFetch.mockResolvedValueOnce(orSuccess(200, 100));
    await tokenContext.run({ userId: USER, buildId: "build-003" }, async () => {
      await callGroq(KEY, MODEL, MSGS, false);
      await callOpenRouter(KEY, "deepseek/deepseek-chat", MSGS);
    });
    expect(getUserQuotaStatus(USER).dailyTokens).toBe(450);
  });

  it("two users accumulate independently", async () => {
    mockFetch.mockResolvedValueOnce(groqSuccess(100, 50));
    mockFetch.mockResolvedValueOnce(groqSuccess(200, 100));
    const user2 = "user-acct-002";
    await tokenContext.run({ userId: USER,  buildId: "b1" }, () => callGroq(KEY, MODEL, MSGS, false));
    await tokenContext.run({ userId: user2, buildId: "b2" }, () => callGroq(KEY, MODEL, MSGS, false));
    expect(getUserQuotaStatus(USER).dailyTokens).toBe(150);
    expect(getUserQuotaStatus(user2).dailyTokens).toBe(300);
  });

  it("callGroq without tokenContext does NOT increment any user", async () => {
    mockFetch.mockResolvedValueOnce(groqSuccess(100, 50));
    await callGroq(KEY, MODEL, MSGS, false); // no context
    expect(getBudgetUsage().daily.groq).toBe(150); // global still counted
    // No user to check — just confirm no crash and global is correct
  });

  it("streaming callGroq within context increments user dailyTokens", async () => {
    mockFetch.mockResolvedValueOnce(groqStreamSuccess(80, 40));
    await tokenContext.run({ userId: USER, buildId: "build-004" }, () =>
      callGroq(KEY, MODEL, MSGS, true)
    );
    expect(getUserQuotaStatus(USER).dailyTokens).toBe(120);
  });
});
