/**
 * Phase 8A — Network Prevention Proof
 *
 * Verifies that when checkProviderBudget() rejects, fetch() NEVER executes.
 * This test MUST FAIL if any outbound request occurs when budget is exceeded.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  _resetProviderBudgetForTest,
  _configureProviderLimitsForTest,
  checkProviderBudget,
  recordProviderTokens,
  recordProviderRequest,
} from "../../cost/providerBudget.js";
import { _resetBudgetForTest, configureTokenBudget } from "../../cost/tokenBudget.js";
import { callAI } from "../../agents/llm/aiService.js";

describe("Phase 8A — Provider Budget Pre-flight: Network Prevention", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetProviderBudgetForTest();
    _resetBudgetForTest();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    _resetProviderBudgetForTest();
    _resetBudgetForTest();
  });

  it("fetch() never executes when global token budget is exceeded", async () => {
    configureTokenBudget({ dailyOpenRouterTokens: 1 });
    recordProviderTokens("openrouter", 100);

    const budgetCheck = checkProviderBudget("openrouter");
    expect(budgetCheck.allowed).toBe(false);

    await expect(
      callAI("fake-key", [{ role: "user", content: "hello" }], { label: "test" })
    ).rejects.toThrow();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetch() never executes when RPM limit is exceeded", async () => {
    _configureProviderLimitsForTest("openrouter", 2, 100_000);
    _resetProviderBudgetForTest();

    recordProviderRequest("openrouter");
    recordProviderRequest("openrouter");

    const budgetCheck = checkProviderBudget("openrouter");
    expect(budgetCheck.allowed).toBe(false);

    await expect(
      callAI("fake-key", [{ role: "user", content: "hello" }], { label: "rpm-test" })
    ).rejects.toThrow();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fetch() never executes when TPM limit is exceeded", async () => {
    _configureProviderLimitsForTest("openrouter", 10_000, 50);
    _resetProviderBudgetForTest();

    recordProviderTokens("openrouter", 100);

    const budgetCheck = checkProviderBudget("openrouter");
    expect(budgetCheck.allowed).toBe(false);

    await expect(
      callAI("fake-key", [{ role: "user", content: "hello" }], { label: "tpm-test" })
    ).rejects.toThrow();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("PROVIDER_BUDGET_EXCEEDED error code is set when budget is exceeded", async () => {
    configureTokenBudget({ dailyOpenRouterTokens: 1 });
    recordProviderTokens("openrouter", 100);

    try {
      await callAI("fake-key", [{ role: "user", content: "hello" }], { label: "code-test" });
      expect.fail("should have thrown");
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      expect(e.code).toBe("PROVIDER_BUDGET_EXCEEDED");
      expect(e.provider).toBe("openrouter");
    }
  });

  it("fetch() IS called when budget allows (sanity check)", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "hello" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    } as Response);

    const result = await callAI("test-key", [{ role: "user", content: "hi" }]);
    expect(result).toBe("hello");
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
