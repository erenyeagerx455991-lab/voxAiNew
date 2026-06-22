/**
 * Phase 9 — Provider Budget Gate Integration Tests
 *
 * Verifies the full budget gate: RPM blocked, TPM blocked,
 * successful recording, failed recording, streaming, emergency shutdown.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  _resetProviderBudgetForTest,
  _configureProviderLimitsForTest,
  checkProviderBudget,
  recordProviderTokens,
  recordProviderRequest,
  getProviderStats,
} from "../../cost/providerBudget.js";
import {
  _resetBudgetForTest,
  configureTokenBudget,
  checkTokenBudget,
  getBudgetUsage,
} from "../../cost/tokenBudget.js";
import { callAI } from "../../agents/llm/aiService.js";

describe("Phase 9 — Provider Budget Gate", () => {
  beforeEach(() => {
    _resetProviderBudgetForTest();
    _resetBudgetForTest();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    _resetProviderBudgetForTest();
    _resetBudgetForTest();
    vi.restoreAllMocks();
  });

  // ── Test 1: OpenRouter blocked via RPM ──────────────────────────────────────
  it("1. OpenRouter blocked when RPM limit reached", () => {
    _configureProviderLimitsForTest("openrouter", 2, 100_000);
    _resetProviderBudgetForTest();

    recordProviderRequest("openrouter");
    recordProviderRequest("openrouter");

    const result = checkProviderBudget("openrouter");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("RPM limit");
  });

  // ── Test 2: OpenRouter blocked via TPM ──────────────────────────────────────
  it("2. OpenRouter blocked when TPM limit reached", () => {
    _configureProviderLimitsForTest("openrouter", 10_000, 100);
    _resetProviderBudgetForTest();

    recordProviderTokens("openrouter", 150);

    const result = checkProviderBudget("openrouter");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("TPM limit");
  });

  // ── Test 3: Successful request records token usage ───────────────────────────
  it("3. Successful request records token usage in provider TPM window", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "success" } }],
        usage: { prompt_tokens: 50, completion_tokens: 30 },
      }),
    } as Response);

    _resetProviderBudgetForTest();
    _resetBudgetForTest();

    await callAI("test-key", [{ role: "user", content: "hello" }], { label: "record-test" });

    const stats = getProviderStats();
    const tpm = stats["openrouter"].currentTPM;
    expect(tpm).toBe(80); // 50 + 30
  });

  // ── Test 4: Failed request records nothing ────────────────────────────────────
  it("4. Failed request records no tokens in TPM window", async () => {
    // Mock all 3 models to fail (callAI iterates MODEL_CHAIN)
    vi.spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("network error"));

    _resetProviderBudgetForTest();
    _resetBudgetForTest();

    await expect(
      callAI("test-key", [{ role: "user", content: "hello" }], { label: "fail-test" })
    ).rejects.toThrow();

    const stats = getProviderStats();
    expect(stats["openrouter"].currentTPM).toBe(0);
  });

  // ── Test 5: Streaming request records usage ──────────────────────────────────
  it("5. Streaming request records token usage via stream_options.include_usage", async () => {
    const usageChunk = JSON.stringify({
      choices: [{ delta: { content: "" } }],
      usage: { prompt_tokens: 20, completion_tokens: 10 },
    });

    const rawSSE = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: "hello" } }] })}`,
      `data: ${usageChunk}`,
      "data: [DONE]",
    ].join("\n\n") + "\n\n";

    const encoder = new TextEncoder();
    const encoded = encoder.encode(rawSSE);
    let pos = 0;

    const mockStream = new ReadableStream({
      pull(controller) {
        if (pos < encoded.length) {
          controller.enqueue(encoded.slice(pos, pos + 200));
          pos += 200;
        } else {
          controller.close();
        }
      },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    _resetProviderBudgetForTest();
    _resetBudgetForTest();

    const tokens: string[] = [];
    await callAI(
      "test-key",
      [{ role: "user", content: "stream me" }],
      { label: "stream-test", stream: true, onToken: (t) => tokens.push(t) }
    );

    const stats = getProviderStats();
    expect(stats["openrouter"].currentTPM).toBe(30); // 20 + 10
  });

  // ── Test 6: Emergency shutdown triggers ─────────────────────────────────────
  it("6. Emergency shutdown triggers when daily budget threshold exceeded", () => {
    configureTokenBudget({ dailyOpenRouterTokens: 100, emergencyShutdownThreshold: 80 });
    recordProviderTokens("openrouter", 85);

    const usage = getBudgetUsage();
    expect(usage.emergencyShutdown).toBe(true);

    const check = checkTokenBudget();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("Emergency");
  });

  // ── Test 7: Budget allowed below threshold ──────────────────────────────────
  it("7. Budget allowed when below threshold", () => {
    configureTokenBudget({ dailyOpenRouterTokens: 1_000_000 });
    const result = checkProviderBudget("openrouter");
    expect(result.allowed).toBe(true);
  });

  // ── Test 8: Provider window self-purges on reset ─────────────────────────────
  it("8. Provider RPM window resets and recovers", () => {
    _configureProviderLimitsForTest("openrouter", 2, 100_000);
    _resetProviderBudgetForTest();

    recordProviderRequest("openrouter");
    recordProviderRequest("openrouter");

    expect(checkProviderBudget("openrouter").allowed).toBe(false);

    // Reset clears the window — simulates window expiry
    _resetProviderBudgetForTest();
    expect(checkProviderBudget("openrouter").allowed).toBe(true);
  });

  // ── Test 9: checkProviderBudget is called by callAI before fetch ────────────
  it("9. checkProviderBudget fires before fetch — verified via throw behavior", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    configureTokenBudget({ dailyOpenRouterTokens: 1 });
    recordProviderTokens("openrouter", 100);

    await expect(
      callAI("key", [{ role: "user", content: "x" }], { label: "preflight" })
    ).rejects.toMatchObject({ code: "PROVIDER_BUDGET_EXCEEDED" });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
