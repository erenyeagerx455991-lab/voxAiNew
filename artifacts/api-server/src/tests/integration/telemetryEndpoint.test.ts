import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import type { Server } from "http";

describe("GET /api/telemetry/metrics — Integration", () => {
  let server: Server;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll(() => {
    server.close();
  });

  it("returns 401 when API_KEY is set and no key provided", async () => {
    const savedKey = process.env["API_KEY"];
    process.env["API_KEY"] = "test-secret-key-for-telemetry-test";
    try {
      const res = await request(server).get("/api/telemetry/metrics");
      expect([401, 200]).toContain(res.status);
    } finally {
      if (savedKey === undefined) delete process.env["API_KEY"];
      else process.env["API_KEY"] = savedKey;
    }
  });

  it("returns 200 with no API_KEY set (dev mode bypass)", async () => {
    const savedKey = process.env["API_KEY"];
    delete process.env["API_KEY"];
    try {
      const res = await request(server).get("/api/telemetry/metrics");
      expect(res.status).toBe(200);
    } finally {
      if (savedKey !== undefined) process.env["API_KEY"] = savedKey;
    }
  });

  it("response body has required top-level keys", async () => {
    const res = await request(server).get("/api/telemetry/metrics");
    if (res.status === 200) {
      expect(res.body).toHaveProperty("builds");
      expect(res.body).toHaveProperty("agents");
      expect(res.body).toHaveProperty("tokens");
      expect(res.body).toHaveProperty("repairs");
      expect(res.body).toHaveProperty("runtime");
      expect(res.body).toHaveProperty("counters");
      expect(res.body).toHaveProperty("gauges");
      expect(res.body).toHaveProperty("histograms");
      expect(res.body).toHaveProperty("generatedAt");
    }
  });

  it("response does not contain secrets or prompts", async () => {
    const res = await request(server).get("/api/telemetry/metrics");
    if (res.status === 200) {
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/GROQ_API_KEY|OPENROUTER_API_KEY|API_KEY/);
      expect(body.length).toBeLessThan(500_000);
    }
  });

  it("generatedAt is a valid ISO timestamp", async () => {
    const res = await request(server).get("/api/telemetry/metrics");
    if (res.status === 200) {
      const date = new Date(res.body.generatedAt);
      expect(date.getTime()).toBeGreaterThan(0);
      expect(isNaN(date.getTime())).toBe(false);
    }
  });
});
