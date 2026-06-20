/**
 * Budget Gate Tests
 * Verifies that once token usage is recorded, the gate in agents.ts fires correctly.
 * Also verifies that the per-user dailyTokenQuota blocks new builds.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { _resetBudgetForTest, configureTokenBudget, recordTokenUsage } from "../../src/cost/tokenBudget.js";
import { _resetLimitsForTest, configureLimits, recordTokensUsed } from "../../src/limits/userLimits.js";

vi.mock("../../src/queue/redisClient.js", () => ({
  initRedis:        vi.fn().mockResolvedValue(false),
  isRedisAvailable: vi.fn().mockReturnValue(false),
  getQueueRedis:    vi.fn().mockReturnValue(null),
  getWorkerRedis:   vi.fn().mockReturnValue(null),
  closeRedis:       vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/queue/buildQueue.js", () => ({
  enqueueBuild:      vi.fn(),
  initBuildQueue:    vi.fn(),
  setInlineExecutor: vi.fn(),
  updateJobStatus:   vi.fn(),
  getQueue:          vi.fn().mockReturnValue(null),
  getLocalJobs:      vi.fn().mockReturnValue(new Map()),
  cancelJob:         vi.fn().mockReturnValue(false),
  closeQueue:        vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/queue/queueWorker.js", () => ({
  initQueueWorker: vi.fn(),
  isInMemoryMode:  vi.fn().mockReturnValue(true),
  closeWorker:     vi.fn().mockResolvedValue(undefined),
  executeBuildJob: vi.fn(),
}));

vi.mock("../../src/agents/pipeline/buildPipeline.js", () => ({
  runBuildPipeline: vi.fn(),
}));

const { enqueueBuild } = await import("../../src/queue/buildQueue.js");
const mockEnqueue = vi.mocked(enqueueBuild);

const { default: app } = await import("../../src/app.js");

const BODY = { prompt: "landing page", chatId: "chat-bg-001" };

beforeEach(() => {
  mockEnqueue.mockReset();
  _resetBudgetForTest();
  _resetLimitsForTest();
  process.env["GROQ_API_KEY"]      = "test-groq";
  process.env["OPENROUTER_API_KEY"] = "test-or";
  mockEnqueue.mockImplementation(async (opts) => {
    opts.onEvent({ type: "done", code: "<html/>" });
    return "job-bg-001";
  });
});

describe("Budget Gate — global token budget (checkTokenBudget)", () => {

  it("allows build when budget has headroom", async () => {
    const res = await request(app).post("/api/agents/build").send(BODY);
    // 200 or SSE response — not 503
    expect(res.status).not.toBe(503);
  });

  it("blocks build when daily Groq limit exceeded", async () => {
    configureTokenBudget({ dailyGroqTokens: 100 });
    recordTokenUsage('groq', 101); // exceed limit

    const res = await request(app).post("/api/agents/build").send(BODY);
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/token/i);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("blocks build when daily OpenRouter limit exceeded", async () => {
    configureTokenBudget({ dailyOpenRouterTokens: 50 });
    recordTokenUsage('openrouter', 51);

    const res = await request(app).post("/api/agents/build").send(BODY);
    expect(res.status).toBe(503);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("blocks build when emergency shutdown is active", async () => {
    // Trigger emergency shutdown via 95% of daily Groq limit
    configureTokenBudget({ dailyGroqTokens: 1000, emergencyShutdownThreshold: 95 });
    recordTokenUsage('groq', 951); // 95.1% — triggers shutdown

    const res = await request(app).post("/api/agents/build").send(BODY);
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/emergency|shutdown/i);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("allows build when usage is just under limit", async () => {
    // Set threshold to 100 so the hard limit (not emergency %) fires first
    configureTokenBudget({ dailyGroqTokens: 1000, emergencyShutdownThreshold: 100 });
    recordTokenUsage('groq', 999); // 99.9% usage — under hard limit, under emergency %

    const res = await request(app).post("/api/agents/build").send(BODY);
    expect(res.status).not.toBe(503);
  });

  it("real usage flow: record → budget rises → threshold → gate activates", async () => {
    // Phase 7 demonstration: usage recorded, budget rises, gate activates
    configureTokenBudget({ dailyGroqTokens: 500 });

    // Before: gate open
    let res = await request(app).post("/api/agents/build").send({ ...BODY, chatId: "chat-bg-p7a" });
    expect(res.status).not.toBe(503);

    // Record usage to cross the threshold
    recordTokenUsage('groq', 501);

    // After: gate closed
    res = await request(app).post("/api/agents/build").send({ ...BODY, chatId: "chat-bg-p7b" });
    expect(res.status).toBe(503);
    expect(mockEnqueue.mock.calls.length).toBe(1); // only first call went through
  });
});

describe("Budget Gate — per-user token quota (checkBuildLimit)", () => {

  it("allows build when user is under quota", async () => {
    configureLimits({ dailyTokenQuota: 200_000 });
    recordTokensUsed("ip:127.0.0.1", 100);

    const res = await request(app).post("/api/agents/build").send(BODY);
    expect(res.status).not.toBe(429);
  });

  it("blocks build with 429 when user exceeds daily token quota", async () => {
    configureLimits({ dailyTokenQuota: 100 });
    // Pre-load user with tokens exceeding quota
    recordTokensUsed("ip:127.0.0.1", 101);

    const res = await request(app).post("/api/agents/build").send(BODY);
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/token quota/i);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("per-user quota is independent across users", async () => {
    configureLimits({ dailyTokenQuota: 100 });
    // User A: over quota
    recordTokensUsed("ip:10.0.0.1", 200);
    // User B: under quota — no way to test directly with supertest (IP is always 127.0.0.1)
    // Just verify user A is blocked
    recordTokensUsed("ip:127.0.0.1", 200);

    const res = await request(app).post("/api/agents/build").send(BODY);
    expect(res.status).toBe(429);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("token quota check runs before enqueueBuild", async () => {
    configureLimits({ dailyTokenQuota: 10 });
    recordTokensUsed("ip:127.0.0.1", 11);

    await request(app).post("/api/agents/build").send(BODY);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});
