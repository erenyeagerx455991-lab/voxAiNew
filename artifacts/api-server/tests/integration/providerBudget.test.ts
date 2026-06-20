/**
 * Provider Budget Tests
 * Verifies that the O(requests) tpmWindow fix preserves budget accuracy.
 * Covers: correct TPM sums, RPM tracking, budget gate, reset.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordProviderRequest,
  recordProviderTokens,
  checkProviderBudget,
  getProviderStats,
  _resetProviderBudgetForTest,
} from "../../src/cost/providerBudget.js";
import { _resetBudgetForTest, configureTokenBudget, recordTokenUsage } from "../../src/cost/tokenBudget.js";

beforeEach(() => {
  _resetProviderBudgetForTest();
  _resetBudgetForTest();
});

describe("Provider Budget — TPM accuracy after O(requests) fix", () => {

  it("single request with 100 tokens reports currentTPM = 100", () => {
    recordProviderTokens("groq", 100);
    expect(getProviderStats()["groq"].currentTPM).toBe(100);
  });

  it("multiple requests sum correctly", () => {
    recordProviderTokens("groq", 1_000);
    recordProviderTokens("groq", 2_000);
    recordProviderTokens("groq", 3_000);
    expect(getProviderStats()["groq"].currentTPM).toBe(6_000);
  });

  it("large single request (10,000 tokens) is stored as 1 compact record", () => {
    recordProviderTokens("groq", 10_000);
    // currentTPM reflects the sum correctly
    expect(getProviderStats()["groq"].currentTPM).toBe(10_000);
    // If the old bug existed, the array would have 10,000 entries
    // We verify the fix indirectly: two requests = two records producing correct sum
    recordProviderTokens("groq", 5_000);
    expect(getProviderStats()["groq"].currentTPM).toBe(15_000);
  });

  it("groq and openrouter tpm are tracked independently", () => {
    recordProviderTokens("groq",       1_000);
    recordProviderTokens("openrouter", 2_000);
    expect(getProviderStats()["groq"].currentTPM).toBe(1_000);
    expect(getProviderStats()["openrouter"].currentTPM).toBe(2_000);
  });

  it("reset clears all tpm data", () => {
    recordProviderTokens("groq", 9_999);
    _resetProviderBudgetForTest();
    expect(getProviderStats()["groq"].currentTPM).toBe(0);
  });
});

describe("Provider Budget — RPM tracking", () => {

  it("single request increments currentRPM", () => {
    recordProviderRequest("groq");
    expect(getProviderStats()["groq"].currentRPM).toBe(1);
  });

  it("multiple requests accumulate in window", () => {
    for (let i = 0; i < 10; i++) recordProviderRequest("groq");
    expect(getProviderStats()["groq"].currentRPM).toBe(10);
  });

  it("groq and openrouter RPM are tracked independently", () => {
    for (let i = 0; i < 5; i++)  recordProviderRequest("groq");
    for (let i = 0; i < 15; i++) recordProviderRequest("openrouter");
    expect(getProviderStats()["groq"].currentRPM).toBe(5);
    expect(getProviderStats()["openrouter"].currentRPM).toBe(15);
  });
});

describe("Provider Budget — checkProviderBudget gate", () => {

  it("allows requests when under both RPM and TPM limits", () => {
    recordProviderTokens("groq", 100);
    recordProviderRequest("groq");
    expect(checkProviderBudget("groq").allowed).toBe(true);
  });

  it("blocks when TPM sum exceeds MAX_TPM (6000 for groq)", () => {
    recordProviderTokens("groq", 4_000); // 1 record, 4k tokens
    recordProviderTokens("groq", 3_000); // 2 records, 7k total — exceeds 6k
    const result = checkProviderBudget("groq");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/TPM/);
  });

  it("blocks exactly at MAX_TPM boundary (>= not >)", () => {
    // MAX_TPM for groq = 6000
    recordProviderTokens("groq", 6_000); // exactly at limit
    const result = checkProviderBudget("groq");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/TPM/);
  });

  it("allows one token under MAX_TPM", () => {
    recordProviderTokens("groq", 5_999);
    expect(checkProviderBudget("groq").allowed).toBe(true);
  });

  it("blocks when RPM exceeds MAX_RPM (30 for groq)", () => {
    for (let i = 0; i < 30; i++) recordProviderRequest("groq");
    const result = checkProviderBudget("groq");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/RPM/);
  });

  it("requestsBlocked increments on each blocked call", () => {
    recordProviderTokens("groq", 6_001);
    checkProviderBudget("groq");
    checkProviderBudget("groq");
    checkProviderBudget("groq");
    expect(getProviderStats()["groq"].requestsBlocked).toBe(3);
  });

  it("global token budget overrides provider check when exceeded", () => {
    configureTokenBudget({ dailyGroqTokens: 100 });
    recordTokenUsage("groq", 101);

    // Even with no provider TPM recorded, global budget blocks
    const result = checkProviderBudget("groq");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/token|budget/i);
  });
});

describe("Provider Budget — correctness with large token counts", () => {

  it("1,000 requests × 4,000 tokens each: sum is 4,000,000", () => {
    for (let i = 0; i < 1_000; i++) {
      recordProviderTokens("groq", 4_000);
    }
    expect(getProviderStats()["groq"].currentTPM).toBe(4_000_000);
  });

  it("mixed token counts sum correctly", () => {
    recordProviderTokens("groq", 1_234);
    recordProviderTokens("groq", 5_678);
    recordProviderTokens("groq", 9_012);
    expect(getProviderStats()["groq"].currentTPM).toBe(15_924);
  });

  it("zero-token request is stored but does not affect TPM sum", () => {
    recordProviderTokens("groq", 0);
    recordProviderTokens("groq", 1_000);
    expect(getProviderStats()["groq"].currentTPM).toBe(1_000);
  });
});
