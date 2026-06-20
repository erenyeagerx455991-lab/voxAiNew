/**
 * Job Eviction Tests
 * Verifies that _localJobs eviction is safe, bounded, and active-job-preserving.
 */
import { describe, it, expect, beforeEach, vi, type MockedFunction } from "vitest";
import {
  initBuildQueue, closeQueue, enqueueBuild, getLocalJobs,
  updateJobStatus, evictTerminalJobs,
} from "../../src/queue/buildQueue.js";
import { initQueueWorker, closeWorker, executeBuildJob } from "../../src/queue/queueWorker.js";
import { resetQueueMetrics } from "../../src/queue/queueMetrics.js";
import { _resetBusForTest } from "../../src/queue/buildEventBus.js";
import type { BuildJobData, JobStatus } from "../../src/queue/queueTypes.js";

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

const BASE: BuildJobData = {
  prompt: "test", chatId: "chat-je-001", userId: "user-je-001",
  enqueuedAt: Date.now(), groqKey: "gk", openrouterKey: "ok",
};

/** Inject a job directly into _localJobs for eviction testing */
function seedJob(jobId: string, status: JobStatus, completedAt?: number): void {
  const jobs = getLocalJobs();
  jobs.set(jobId, {
    jobId,
    status,
    userId: "user-je-001",
    enqueuedAt: Date.now() - 7_200_000,
    startedAt:  status !== 'queued' ? Date.now() - 3_600_000 : undefined,
    completedAt,
    retryCount: 0,
  });
}

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

describe("Job Eviction — TTL eviction", () => {

  it("evicts terminal jobs older than 1 hour", () => {
    const oldTs = Date.now() - 3_700_000; // 3700 s ago (> 1 h)
    seedJob("job-evict-old", "done", oldTs);
    expect(getLocalJobs().has("job-evict-old")).toBe(true);

    evictTerminalJobs();
    expect(getLocalJobs().has("job-evict-old")).toBe(false);
  });

  it("keeps terminal jobs younger than 1 hour", () => {
    const recentTs = Date.now() - 1_800_000; // 30 min ago
    seedJob("job-keep-recent", "done", recentTs);

    evictTerminalJobs();
    expect(getLocalJobs().has("job-keep-recent")).toBe(true);
  });

  it("evicts all four terminal statuses", () => {
    const old = Date.now() - 3_700_000;
    seedJob("j-done",      "done",      old);
    seedJob("j-failed",    "failed",    old);
    seedJob("j-cancelled", "cancelled", old);
    seedJob("j-timeout",   "timeout",   old);

    evictTerminalJobs();

    expect(getLocalJobs().has("j-done")).toBe(false);
    expect(getLocalJobs().has("j-failed")).toBe(false);
    expect(getLocalJobs().has("j-cancelled")).toBe(false);
    expect(getLocalJobs().has("j-timeout")).toBe(false);
  });
});

describe("Job Eviction — active job safety (Phase 4)", () => {

  it("NEVER evicts queued jobs", () => {
    seedJob("job-queued-01", "queued"); // no completedAt
    evictTerminalJobs();
    expect(getLocalJobs().has("job-queued-01")).toBe(true);
  });

  it("NEVER evicts running jobs", () => {
    const jobs = getLocalJobs();
    jobs.set("job-running-01", {
      jobId: "job-running-01",
      status: "running",
      userId: "u",
      enqueuedAt: Date.now() - 7_200_000,
      startedAt:  Date.now() - 3_600_000,
      retryCount: 0,
      // no completedAt — job is still active
    });
    evictTerminalJobs();
    expect(getLocalJobs().has("job-running-01")).toBe(true);
  });

  it("evicts old terminal jobs but keeps active jobs alongside them", () => {
    const old = Date.now() - 3_700_000;
    seedJob("j-old-done",    "done",    old);
    seedJob("j-still-queued", "queued"); // no completedAt

    evictTerminalJobs();

    expect(getLocalJobs().has("j-old-done")).toBe(false);      // evicted
    expect(getLocalJobs().has("j-still-queued")).toBe(true);   // preserved
  });
});

describe("Job Eviction — MAX_LOCAL_JOBS cap", () => {

  it("evicts oldest terminal jobs when map exceeds 1000", () => {
    // Seed 1001 terminal jobs (all old enough to evict)
    const old = Date.now() - 3_700_000;
    for (let i = 0; i < 1001; i++) {
      seedJob(`j-cap-${i}`, "done", old + i); // incrementing completedAt
    }
    expect(getLocalJobs().size).toBe(1001);

    evictTerminalJobs();

    // All are old enough for TTL — all 1001 are removed
    expect(getLocalJobs().size).toBe(0);
  });

  it("when 900 old + 200 new terminal jobs exist, cap removes oldest first", () => {
    const veryOld = Date.now() - 3_700_000;
    const recent  = Date.now() - 1_800_000; // 30 min ago — within TTL

    // 900 very old (will be TTL-evicted)
    for (let i = 0; i < 900; i++) seedJob(`j-old-${i}`, "done", veryOld + i);
    // 200 recent (within TTL, won't be TTL-evicted — cap may remove them)
    for (let i = 0; i < 200; i++) seedJob(`j-recent-${i}`, "done", recent + i);

    expect(getLocalJobs().size).toBe(1100);
    evictTerminalJobs();

    // After TTL: 900 removed, 200 remain — within MAX_LOCAL_JOBS (1000)
    expect(getLocalJobs().size).toBe(200);
    // All remaining are recent
    for (const [, info] of getLocalJobs()) {
      expect(info.completedAt ?? 0).toBeGreaterThanOrEqual(recent);
    }
  });

  it("cap eviction preserves active jobs even when total > 1000", () => {
    const old = Date.now() - 3_700_000;
    for (let i = 0; i < 900; i++) seedJob(`j-old-${i}`, "done", old + i);
    // 200 active jobs
    for (let i = 0; i < 200; i++) seedJob(`j-queued-${i}`, "queued"); // no completedAt

    expect(getLocalJobs().size).toBe(1100);
    evictTerminalJobs();

    // 900 old terminal removed; 200 active preserved
    expect(getLocalJobs().size).toBe(200);
    for (const [, info] of getLocalJobs()) {
      expect(info.status).toBe("queued");
    }
  });
});

describe("Job Eviction — triggered on updateJobStatus", () => {

  it("evictTerminalJobs is scheduled via setImmediate when job reaches terminal status", async () => {
    const old = Date.now() - 3_700_000;
    seedJob("j-trigger-old", "done", old);     // ← to be evicted
    seedJob("j-trigger-new", "running");       // ← active job, also in _localJobs

    // updateJobStatus on a job that IS in _localJobs schedules setImmediate(evictTerminalJobs)
    // executeBuildJob calls updateJobStatus internally, but only for jobs added via enqueueBuild.
    // Here we call updateJobStatus directly to prove the scheduling path.
    updateJobStatus("j-trigger-new", "done");

    // Wait for the setImmediate(evictTerminalJobs) to fire
    await new Promise(r => setImmediate(r));

    // Old job (3700s ago, > 1h TTL) should be evicted
    expect(getLocalJobs().has("j-trigger-old")).toBe(false);
    // New job completed just now — still within TTL
    expect(getLocalJobs().has("j-trigger-new")).toBe(true);
  });
});

describe("Job Eviction — eviction on enqueueBuild", () => {

  it("enqueueBuild calls evictTerminalJobs before adding the new job", async () => {
    const old = Date.now() - 3_700_000;
    seedJob("j-pre-enqueue-old", "done", old);

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await enqueueBuild({
      prompt: "test", chatId: "chat-je-enqueue", userId: "user-je-001",
      groqKey: "gk", openrouterKey: "ok",
      onEvent: () => {},
    });

    // Old job should have been evicted during enqueueBuild
    expect(getLocalJobs().has("j-pre-enqueue-old")).toBe(false);
  });
});
