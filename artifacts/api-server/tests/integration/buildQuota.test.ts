import { describe, it, expect, beforeEach } from "vitest";
import {
  checkBuildLimit, recordBuildStarted, recordBuildCompleted,
  recordBuildQueued, getUserQuotaStatus, extractUserId,
  configureLimits, _resetLimitsForTest, _setUserStateForTest,
} from "../../src/limits/userLimits.js";
import {
  checkTokenBudget, recordTokenUsage, getBudgetUsage,
  configureTokenBudget, _resetBudgetForTest, resetEmergencyShutdown,
} from "../../src/cost/tokenBudget.js";
import {
  checkProviderBudget, recordProviderRequest, recordProviderTokens,
  getProviderStats, _resetProviderBudgetForTest,
} from "../../src/cost/providerBudget.js";
import type { Request } from "express";

describe("User Build Limits", () => {
  beforeEach(() => {
    _resetLimitsForTest();
    configureLimits({
      maxActiveBuildsConcurrent: 2,
      maxQueuedBuilds: 3,
      dailyBuildQuota: 5,
      dailyTokenQuota: 100_000,
    });
  });

  it("checkBuildLimit allows first build", () => {
    const result = checkBuildLimit("user-quota-01");
    expect(result.allowed).toBe(true);
  });

  it("checkBuildLimit blocks when active builds at max", () => {
    _setUserStateForTest("user-quota-02", { activeBuilds: 2 });
    const result = checkBuildLimit("user-quota-02");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("concurrent");
  });

  it("checkBuildLimit blocks when daily quota exhausted", () => {
    _setUserStateForTest("user-quota-03", { dailyBuilds: 5 });
    const result = checkBuildLimit("user-quota-03");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("quota");
  });

  it("checkBuildLimit blocks when queue is full", () => {
    _setUserStateForTest("user-quota-04", { queuedBuilds: 3 });
    const result = checkBuildLimit("user-quota-04");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("queue");
  });

  it("recordBuildStarted increments activeBuilds and dailyBuilds", () => {
    recordBuildStarted("user-quota-05");
    const status = getUserQuotaStatus("user-quota-05");
    expect(status.activeBuilds).toBe(1);
    expect(status.dailyBuilds).toBe(1);
  });

  it("recordBuildCompleted decrements activeBuilds", () => {
    recordBuildStarted("user-quota-06");
    recordBuildCompleted("user-quota-06");
    const status = getUserQuotaStatus("user-quota-06");
    expect(status.activeBuilds).toBe(0);
  });

  it("recordBuildQueued increments queuedBuilds", () => {
    recordBuildQueued("user-quota-07");
    const status = getUserQuotaStatus("user-quota-07");
    expect(status.queuedBuilds).toBe(1);
  });

  it("users have independent quotas", () => {
    _setUserStateForTest("user-independent-A", { dailyBuilds: 5 });
    const resultA = checkBuildLimit("user-independent-A");
    const resultB = checkBuildLimit("user-independent-B");
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });
});

describe("Token Budget Enforcement", () => {
  beforeEach(() => {
    _resetBudgetForTest();
    configureTokenBudget({
      dailyGroqTokens: 1000,
      dailyOpenRouterTokens: 500,
      monthlyGroqTokens: 10_000,
      monthlyOpenRouterTokens: 5_000,
      emergencyShutdownThreshold: 101, // above 100% so daily limit triggers before emergency
    });
  });

  it("checkTokenBudget allows when under limit", () => {
    const result = checkTokenBudget();
    expect(result.allowed).toBe(true);
  });

  it("checkTokenBudget blocks when daily Groq limit exceeded", () => {
    recordTokenUsage("groq", 1001);
    const result = checkTokenBudget();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Groq");
  });

  it("checkTokenBudget blocks when daily OpenRouter limit exceeded", () => {
    recordTokenUsage("openrouter", 501);
    const result = checkTokenBudget();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("OpenRouter");
  });

  it("getBudgetUsage returns current token counts", () => {
    recordTokenUsage("groq", 250);
    const usage = getBudgetUsage();
    expect(usage.daily.groq).toBe(250);
  });

  it("emergencyShutdown triggers at threshold", () => {
    configureTokenBudget({ emergencyShutdownThreshold: 90 });
    recordTokenUsage("groq", 905);
    const result = checkTokenBudget();
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Emergency");
  });

  it("resetEmergencyShutdown clears the flag", () => {
    recordTokenUsage("groq", 905);
    resetEmergencyShutdown();
    _resetBudgetForTest();
    const result = checkTokenBudget();
    expect(result.allowed).toBe(true);
  });
});

describe("Provider Budget (RPM/TPM gates)", () => {
  beforeEach(() => {
    _resetProviderBudgetForTest();
    _resetBudgetForTest();
  });

  it("checkProviderBudget allows initial request", () => {
    const result = checkProviderBudget("groq");
    expect(result.allowed).toBe(true);
  });

  it("getProviderStats has currentRPM and maxRPM", () => {
    const stats = getProviderStats();
    expect(stats.groq).toHaveProperty("currentRPM");
    expect(stats.groq).toHaveProperty("maxRPM");
    expect(stats.openrouter).toHaveProperty("currentRPM");
  });

  it("recordProviderRequest increments RPM window", () => {
    recordProviderRequest("groq");
    recordProviderRequest("groq");
    const stats = getProviderStats();
    expect(stats.groq.currentRPM).toBe(2);
  });
});

describe("extractUserId", () => {
  it("extracts userId from x-api-key header", () => {
    const req = { headers: { "x-api-key": "abcdefgh1234" }, ip: "127.0.0.1", socket: {} } as unknown as Request;
    const id = extractUserId(req);
    expect(id).toContain("key:");
    expect(id).toContain("abcdefg");
  });

  it("falls back to ip when no api key", () => {
    const req = { headers: {}, ip: "10.0.0.1", socket: {} } as unknown as Request;
    const id = extractUserId(req);
    expect(id).toContain("ip:");
  });
});
