import { describe, it, expect, beforeEach, vi, type MockedFunction } from "vitest";
import { initQueueWorker, isInMemoryMode, closeWorker, executeBuildJob } from "../../src/queue/queueWorker.js";
import { initBuildQueue, closeQueue } from "../../src/queue/buildQueue.js";
import { subscribeToJob, _resetBusForTest } from "../../src/queue/buildEventBus.js";
import { resetQueueMetrics, getQueueMetrics } from "../../src/queue/queueMetrics.js";
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
  prompt: "test prompt",
  chatId: "chat-recovery-001",
  userId: "user-worker-001",
  enqueuedAt: Date.now(),
  groqKey: "gk",
  openrouterKey: "ok",
};

describe("Worker Recovery", () => {
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

  it("worker runs in in-memory mode when Redis unavailable", () => {
    expect(isInMemoryMode()).toBe(true);
  });

  it("executeBuildJob calls runBuildPipeline", async () => {
    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });
    await executeBuildJob("job-r01", JOB);
    expect(mockPipeline).toHaveBeenCalledOnce();
  });

  it("failed pipeline is recorded in metrics", async () => {
    mockPipeline.mockRejectedValueOnce(new Error("Pipeline crash"));
    await executeBuildJob("job-fail-01", JOB);
    expect(getQueueMetrics().failedTotal).toBeGreaterThan(0);
  });

  it("failed pipeline emits error event to event bus", async () => {
    mockPipeline.mockRejectedValueOnce(new Error("Simulated failure"));
    const received: object[] = [];
    const unsub = subscribeToJob("job-fail-02", (e) => received.push(e));
    await executeBuildJob("job-fail-02", { ...JOB, chatId: "chat-fail-02" });
    unsub();
    expect(received.some((e: any) => e.type === "error")).toBe(true);
  });

  it("SSE bridge write() emits parsed events to event bus", async () => {
    const events: object[] = [];
    const unsub = subscribeToJob("job-bridge-01", (e) => events.push(e));
    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"step","step":1,"agent":"Planner","status":"running"}\n\n');
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });
    await executeBuildJob("job-bridge-01", { ...JOB, chatId: "chat-bridge-01" });
    unsub();
    expect(events.some((e: any) => e.type === "step")).toBe(true);
    expect(events.some((e: any) => e.type === "done")).toBe(true);
  });

  it("concurrent job executions are independent", async () => {
    const calls: string[] = [];
    mockPipeline.mockImplementation(async (input: any, res: any) => {
      calls.push(input.chatId);
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });
    await Promise.all([
      executeBuildJob("job-conc-01", { ...JOB, chatId: "chat-c1" }),
      executeBuildJob("job-conc-02", { ...JOB, chatId: "chat-c2" }),
    ]);
    expect(calls).toContain("chat-c1");
    expect(calls).toContain("chat-c2");
  });

  it("completedTotal increments after successful execution", async () => {
    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });
    await executeBuildJob("job-cmp", JOB);
    expect(getQueueMetrics().completedTotal).toBeGreaterThan(0);
  });

  it("closeWorker sets isInMemoryMode to false", async () => {
    await closeWorker();
    expect(isInMemoryMode()).toBe(false);
  });
});
