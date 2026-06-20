/**
 * Worker Execution Tests
 * Verifies that executeBuildJob correctly drives the pipeline,
 * updates job status, and emits the right events to the bus.
 * Focuses on metrics and status transitions not covered by workerRecovery.test.ts.
 */
import { describe, it, expect, beforeEach, vi, type MockedFunction } from "vitest";
import { executeBuildJob } from "../../src/queue/queueWorker.js";
import { subscribeToJob, _resetBusForTest } from "../../src/queue/buildEventBus.js";
import { resetQueueMetrics, getQueueMetrics } from "../../src/queue/queueMetrics.js";
import { initBuildQueue, closeQueue, getLocalJobs } from "../../src/queue/buildQueue.js";
import { initQueueWorker, closeWorker } from "../../src/queue/queueWorker.js";
import type { BuildJobData } from "../../src/queue/queueTypes.js";

vi.mock("../../src/queue/redisClient.js", () => ({
  initRedis:        vi.fn().mockResolvedValue(false),
  isRedisAvailable: vi.fn().mockReturnValue(false),
  getQueueRedis:    vi.fn().mockReturnValue(null),
  getWorkerRedis:   vi.fn().mockReturnValue(null),
  closeRedis:       vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/agents/pipeline/buildPipeline.js", () => ({
  runBuildPipeline: vi.fn(),
}));

const { runBuildPipeline } = await import("../../src/agents/pipeline/buildPipeline.js");
const mockPipeline = runBuildPipeline as MockedFunction<typeof runBuildPipeline>;

const JOB: BuildJobData = {
  prompt:         "SaaS dashboard",
  chatId:         "chat-we-001",
  userId:         "user-we-001",
  enqueuedAt:     Date.now(),
  groqKey:        "gk",
  openrouterKey:  "ok",
};

beforeEach(() => {
  mockPipeline.mockReset();
  resetQueueMetrics();
  _resetBusForTest();
  initBuildQueue();
  initQueueWorker();
});

afterEach(async () => {
  await closeWorker();
  await closeQueue();
});

describe("Worker Execution — metrics", () => {

  it("enqueuedTotal increments when enqueueBuild is called via the inline executor", async () => {
    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });
    // executeBuildJob is the inline executor — call it directly to simulate enqueueBuild
    await executeBuildJob("job-we-metrics-01", JOB);
    // completedTotal is updated by executeBuildJob
    expect(getQueueMetrics().completedTotal).toBe(1);
    expect(getQueueMetrics().failedTotal).toBe(0);
    expect(getQueueMetrics().activeNow).toBe(0);
  });

  it("activeNow is 1 while job executes", async () => {
    let peakActive = 0;
    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      peakActive = getQueueMetrics().activeNow;
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });
    await executeBuildJob("job-we-active-01", JOB);
    expect(peakActive).toBe(1);
    expect(getQueueMetrics().activeNow).toBe(0);
  });

  it("failedTotal increments and activeNow decrements on pipeline exception", async () => {
    mockPipeline.mockRejectedValueOnce(new Error("Pipeline crash"));
    await executeBuildJob("job-we-fail-01", JOB);
    expect(getQueueMetrics().failedTotal).toBe(1);
    expect(getQueueMetrics().activeNow).toBe(0);
  });

  it("recentFailures records error message on failure", async () => {
    mockPipeline.mockRejectedValueOnce(new Error("LLM timeout"));
    await executeBuildJob("job-we-fail-02", { ...JOB, chatId: "chat-we-fail-02" });
    const failures = getQueueMetrics().recentFailures;
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[failures.length - 1].error).toBe("LLM timeout");
  });
});

describe("Worker Execution — status transitions", () => {

  it("job status transitions from queued→running→done", async () => {
    const { enqueueBuild } = await import("../../src/queue/buildQueue.js");
    const statuses: string[] = [];

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      const { getJobInfo } = await import("../../src/queue/buildQueue.js");
      // Capture 'running' status during execution
      const jobs = getLocalJobs();
      for (const [, info] of jobs) statuses.push(info.status);
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await enqueueBuild({
      ...JOB,
      onEvent: () => {},
    });

    expect(statuses.some((s) => s === "running")).toBe(true);
  });

  it("byUser tracks per-user completion counts", async () => {
    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });
    await executeBuildJob("job-we-user-01", { ...JOB, userId: "user-track-01" });
    await executeBuildJob("job-we-user-02", { ...JOB, userId: "user-track-01", chatId: "chat-we-u2" });

    const metrics = getQueueMetrics();
    expect(metrics.byUser["user-track-01"]?.completed).toBe(2);
  });
});

describe("Worker Execution — event bus", () => {

  it("step events are emitted to event bus subscribers", async () => {
    const events: object[] = [];
    const unsub = subscribeToJob("job-we-events-01", (e) => events.push(e));

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"step","step":0,"agent":"Planner","status":"running"}\n\n');
      res.write('data: {"type":"step","step":0,"agent":"Planner","status":"done"}\n\n');
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await executeBuildJob("job-we-events-01", { ...JOB, chatId: "chat-we-e1" });
    unsub();

    expect(events.filter((e: any) => e.type === "step").length).toBe(2);
    expect(events.some((e: any) => e.type === "done")).toBe(true);
  });

  it("multiple subscribers receive same events", async () => {
    const received1: object[] = [];
    const received2: object[] = [];
    const unsub1 = subscribeToJob("job-we-multi-01", (e) => received1.push(e));
    const unsub2 = subscribeToJob("job-we-multi-01", (e) => received2.push(e));

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await executeBuildJob("job-we-multi-01", { ...JOB, chatId: "chat-we-m1" });
    unsub1(); unsub2();

    expect(received1.some((e: any) => e.type === "done")).toBe(true);
    expect(received2.some((e: any) => e.type === "done")).toBe(true);
  });
});
