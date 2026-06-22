/**
 * Phase 10 — Edit Quota Tests
 *
 * Verifies that edit, runtime-repair, and autonomous-build routes
 * inherit the same quota enforcement as the build route.
 *
 * Tests 1-2 verify quota gate functions directly (to avoid SSE stream timeouts).
 * Tests 3-7 exercise HTTP routes — all quota rejections return 429/503 before SSE starts.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import agentsRouter from "../../routes/agents.js";
import {
  _resetLimitsForTest,
  configureLimits,
  _setUserStateForTest,
  checkBuildLimit,
} from "../../limits/userLimits.js";
import { _resetBudgetForTest, configureTokenBudget, checkTokenBudget } from "../../cost/tokenBudget.js";
import { _resetProviderBudgetForTest, recordProviderTokens } from "../../cost/providerBudget.js";

function makeApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/api", agentsRouter);
  return app;
}

describe("Phase 10 — Edit Quota Enforcement", () => {
  let app: Express;

  beforeEach(() => {
    _resetLimitsForTest();
    _resetBudgetForTest();
    _resetProviderBudgetForTest();
    app = makeApp();
  });

  afterEach(() => {
    _resetLimitsForTest();
    _resetBudgetForTest();
    _resetProviderBudgetForTest();
  });

  // ── Test 1: checkBuildLimit allows when under quota (unit) ───────────────────
  it("1. checkBuildLimit returns allowed=true when under all limits", () => {
    const result = checkBuildLimit("ip:test-user");
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  // ── Test 2: checkTokenBudget allows when budget is available (unit) ───────────
  it("2. checkTokenBudget returns allowed=true when budget is available", () => {
    configureTokenBudget({ dailyOpenRouterTokens: 1_000_000 });
    const result = checkTokenBudget();
    expect(result.allowed).toBe(true);
  });

  // ── Test 3: Edit blocked at token quota ───────────────────────────────────
  it("3. /agents/edit blocked when daily token quota reached", async () => {
    configureLimits({ dailyTokenQuota: 1 });
    _setUserStateForTest("ip:::1", { dailyTokens: 100 });
    _setUserStateForTest("ip:127.0.0.1", { dailyTokens: 100 });
    _setUserStateForTest("ip::1", { dailyTokens: 100 });
    // Exhaust quota for any IP pattern
    for (const ip of ["ip:::1", "ip:127.0.0.1", "ip::ffff:127.0.0.1", "ip:::ffff:127.0.0.1"]) {
      _setUserStateForTest(ip, { dailyTokens: 100 });
    }

    const res = await request(app)
      .post("/api/agents/edit")
      .send({ prompt: "change colors", projectFiles: [] });

    expect([429, 503]).toContain(res.status);
  });

  // ── Test 4: Edit blocked at build quota ───────────────────────────────────
  it("4. /agents/edit blocked when daily build quota reached", async () => {
    configureLimits({ dailyBuildQuota: 0 });

    const res = await request(app)
      .post("/api/agents/edit")
      .send({ prompt: "change colors", projectFiles: [] });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain("Daily build quota");
  });

  // ── Test 5: Edit blocked at concurrent limit ──────────────────────────────
  it("5. /agents/edit blocked when concurrent build limit reached", async () => {
    configureLimits({ maxActiveBuildsConcurrent: 0 });

    const res = await request(app)
      .post("/api/agents/edit")
      .send({ prompt: "change colors", projectFiles: [] });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain("concurrent");
  });

  // ── Test 6: /agents/runtime-repair quota enforcement ─────────────────────
  it("6. /agents/runtime-repair blocked when concurrent limit reached", async () => {
    configureLimits({ maxActiveBuildsConcurrent: 0 });

    const res = await request(app)
      .post("/api/agents/runtime-repair")
      .send({
        files: [{ name: "App.tsx", content: "function App() { return <div /> }", lang: "tsx", path: "src/" }],
        error: { file: "App.tsx", message: "syntax error" },
        repairAttempt: 0,
      });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain("concurrent");
  });

  // ── Test 7: /agents/autonomous-build quota enforcement ────────────────────
  it("7. /agents/autonomous-build blocked when daily build quota reached", async () => {
    configureLimits({ dailyBuildQuota: 0 });

    const res = await request(app)
      .post("/api/agents/autonomous-build")
      .send({
        files: [{ name: "App.tsx", content: "function App() { return <div /> }", lang: "tsx" }],
      });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain("Daily build quota");
  });

  // ── Test 8: Global budget block via 503 ──────────────────────────────────
  it("8. /agents/edit returns 503 when global budget is exhausted", async () => {
    configureTokenBudget({
      dailyOpenRouterTokens: 100,
      emergencyShutdownThreshold: 80,
    });
    recordProviderTokens("openrouter", 90);

    const res = await request(app)
      .post("/api/agents/edit")
      .send({ prompt: "change colors", projectFiles: [] });

    expect(res.status).toBe(503);
    expect(res.body.error).toBeDefined();
  });
});
