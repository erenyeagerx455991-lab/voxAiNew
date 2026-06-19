import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initBuildQueue, enqueueBuild, cancelJob, getLocalJobs,
  closeQueue,
} from "../../src/queue/buildQueue.js";
import { initQueueWorker, closeWorker } from "../../src/queue/queueWorker.js";
import { resetQueueMetrics, getQueueMetrics } from "../../src/queue/queueMetrics.js";
import { _resetBusForTest } from "../../src/queue/buildEventBus.js";

vi.mock("../../src/queue/redisClient.js", () => ({
  initRedis:        vi.fn().mockResolvedValue(false),
  isRedisAvailable: vi.fn().mockReturnValue(false),
  getQueueRedis:    vi.fn().mockReturnValue(null),
  getWorkerRedis:   vi.fn().mockReturnValue(null),
  closeRedis:       vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/agents/pipeline/buildPipeline.js", () => ({
  runBuildPipeline: vi.fn().mockImplementation(async (_input: unknown, res: { write: (s: string) => boolean }) => {
    res.write('data: {"type":"step","step":0,"agent":"Planner","status":"running"}\n\n');
    res.write('data: {"type":"done","code":"<html/>","plan":"p"}\n\n');
  }),
}));

const OPTS = {
  groqKey: "gk",
  openrouterKey: "ok",
};

describe("Queue Flow — In-Memory Mode", () => {
  beforeEach(() => {
    resetQueueMetrics();
    _resetBusForTest();
    initBuildQueue();
    initQueueWorker();
  });

  afterEach(async () => {
    await closeWorker();
    await closeQueue();
  });

  it("enqueueBuild resolves with a jobId string", async () => {
    const events: object[] = [];
    const jobId = await enqueueBuild({
      prompt: "test prompt", chatId: "chat-001", userId: "user-001", ...OPTS,
      onEvent: (e) => events.push(e),
    });
    expect(typeof jobId).toBe("string");
    expect(jobId.length).toBeGreaterThan(0);
  });

  it("job is tracked in local jobs map after enqueue", async () => {
    const events: object[] = [];
    const jobId = await enqueueBuild({
      prompt: "another prompt", chatId: "chat-002", userId: "user-001", ...OPTS,
      onEvent: (e) => events.push(e),
    });
    expect(getLocalJobs().has(jobId)).toBe(true);
  });

  it("onEvent receives step and done events from pipeline", async () => {
    const events: object[] = [];
    await enqueueBuild({
      prompt: "event test", chatId: "chat-003", userId: "user-002", ...OPTS,
      onEvent: (e) => events.push(e),
    });
    expect(events.some((e: any) => e.type === "step")).toBe(true);
    expect(events.some((e: any) => e.type === "done")).toBe(true);
  });

  it("enqueue increments queue metrics", async () => {
    await enqueueBuild({
      prompt: "metric test", chatId: "chat-004", userId: "user-002", ...OPTS,
      onEvent: () => {},
    });
    expect(getQueueMetrics().enqueuedTotal).toBeGreaterThan(0);
  });

  it("cancelJob returns false for unknown jobId", () => {
    expect(cancelJob("nonexistent-job-id")).toBe(false);
  });

  it("two sequential builds both resolve with distinct jobIds", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 2; i++) {
      const id = await enqueueBuild({
        prompt: `prompt ${i}`, chatId: `chat-seq-${i}`, userId: "user-seq", ...OPTS,
        onEvent: () => {},
      });
      ids.push(id);
    }
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("queue metrics track completed jobs after pipeline runs", async () => {
    await enqueueBuild({
      prompt: "completed test", chatId: "chat-cmp", userId: "user-cmp", ...OPTS,
      onEvent: () => {},
    });
    const metrics = getQueueMetrics();
    expect(metrics.completedTotal + metrics.failedTotal).toBeGreaterThan(0);
  });

  it("resetQueueMetrics clears all counters", () => {
    resetQueueMetrics();
    const m = getQueueMetrics();
    expect(m.enqueuedTotal).toBe(0);
    expect(m.completedTotal).toBe(0);
    expect(m.failedTotal).toBe(0);
  });

  it("getQueueMetrics has all required fields", () => {
    const m = getQueueMetrics();
    expect(m).toHaveProperty("enqueuedTotal");
    expect(m).toHaveProperty("completedTotal");
    expect(m).toHaveProperty("failedTotal");
    expect(m).toHaveProperty("activeNow");
    expect(m).toHaveProperty("queuedNow");
    expect(m).toHaveProperty("avgWaitMs");
    expect(m).toHaveProperty("p95WaitMs");
    expect(m).toHaveProperty("byUser");
    expect(m).toHaveProperty("recentFailures");
  });
});
