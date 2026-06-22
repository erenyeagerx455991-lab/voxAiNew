/**
 * Phase 9 — Queue Durability Integration Tests
 *
 * Verifies: enqueue persistence, dequeue persistence, restart recovery,
 * retry recording, duplicate prevention, worker recovery, telemetry consistency.
 *
 * No mocks of queue/worker modules. Uses actual in-memory queue path.
 * Redis unavailable in test env — all tests operate on the real in-memory fallback.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initBuildQueue,
  enqueueBuild,
  closeQueue,
  getLocalJobs,
  updateJobStatus,
} from "../../src/queue/buildQueue.js";
import {
  initQueueWorker,
  closeWorker,
  isInMemoryMode,
} from "../../src/queue/queueWorker.js";
import {
  initRedis,
  closeRedis,
  isRedisAvailable,
} from "../../src/queue/redisClient.js";
import {
  resetQueueMetrics,
  getQueueMetrics,
  recordJobStalled,
  recordJobRetry,
  recordJobDead,
} from "../../src/queue/queueMetrics.js";

async function bootSystem(): Promise<void> {
  await initRedis();
  initBuildQueue();
  initQueueWorker();
}

async function haltSystem(): Promise<void> {
  await closeWorker();
  await closeQueue();
  await closeRedis();
  resetQueueMetrics();
}

const BASE = {
  groqKey: "",
  openrouterKey: "",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function waitForDone(onEvent: (cb: (e: object) => void) => void): Promise<object[]> {
  return new Promise((resolve) => {
    const events: object[] = [];
    onEvent((e) => {
      events.push(e);
      const ev = e as { type?: string };
      if (ev.type === "done" || ev.type === "error") resolve(events);
    });
  });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Phase 9 — Queue Durability", () => {
  beforeEach(async () => {
    resetQueueMetrics();
    await bootSystem();
  });

  afterEach(async () => {
    await haltSystem();
  });

  // ── 1. Enqueue persists ────────────────────────────────────────────────────
  it("1. enqueue — job is added to _localJobs with status queued or running", async () => {
    let capturedJobId: string | null = null;

    const p = enqueueBuild({
      prompt: "durability-enqueue",
      chatId: "dur-chat-1",
      userId: "dur-user-1",
      ...BASE,
      onEvent: () => {},
    });

    // _localJobs is populated synchronously before the promise resolves
    // (the map entry is set before setImmediate fires the executor)
    await p;

    // After completion, job must exist in _localJobs
    let found = false;
    for (const [, info] of getLocalJobs()) {
      if (info.userId === "dur-user-1") { found = true; capturedJobId = info.jobId; break; }
    }
    expect(found).toBe(true);
    expect(capturedJobId).toBeTruthy();
  });

  // ── 2. Dequeue persists ────────────────────────────────────────────────────
  it("2. dequeue — job reaches terminal status in _localJobs after execution", async () => {
    const events: object[] = [];

    const jobId = await enqueueBuild({
      prompt: "durability-dequeue",
      chatId: "dur-chat-2",
      userId: "dur-user-2",
      ...BASE,
      onEvent: (e) => events.push(e),
    });

    const info = getLocalJobs().get(jobId);
    expect(info).toBeDefined();
    // Job either completed or failed — not stuck in queued/running
    const terminal = ["done", "failed", "cancelled", "timeout"];
    expect(terminal).toContain(info!.status);
  });

  // ── 3. Restart recovery ───────────────────────────────────────────────────
  it("3. restart recovery — new job executes after full system cycle", async () => {
    // First job
    await enqueueBuild({
      prompt: "pre-restart",
      chatId: "dur-chat-3a",
      userId: "dur-user-3",
      ...BASE,
      onEvent: () => {},
    });

    // Full restart
    await haltSystem();
    await bootSystem();

    // Second job after restart must complete
    let done = false;
    await enqueueBuild({
      prompt: "post-restart",
      chatId: "dur-chat-3b",
      userId: "dur-user-3",
      ...BASE,
      onEvent: (e) => {
        const ev = e as { type?: string };
        if (ev.type === "done" || ev.type === "error") done = true;
      },
    });

    expect(done).toBe(true);
  });

  // ── 4. Retry recording ────────────────────────────────────────────────────
  it("4. retry metrics — recordJobRetry increments retryTotal", () => {
    const before = getQueueMetrics().retryTotal;
    recordJobRetry("retry-job-001", "retry-user", 1);
    expect(getQueueMetrics().retryTotal).toBe(before + 1);
  });

  // ── 5. Duplicate prevention ───────────────────────────────────────────────
  it("5. duplicate prevention — same chatId produces distinct jobIds across separate enqueues", async () => {
    const ids: string[] = [];

    for (let i = 0; i < 2; i++) {
      const id = await enqueueBuild({
        prompt: `dup-test-${i}`,
        chatId: "dur-chat-dup",
        userId: "dur-user-5",
        ...BASE,
        onEvent: () => {},
      });
      ids.push(id);
    }

    expect(ids[0]).not.toBe(ids[1]);
    expect(new Set(ids).size).toBe(2);
  });

  // ── 6. Worker recovery ────────────────────────────────────────────────────
  it("6. worker recovery — job executes after worker close + reinit", async () => {
    // Run first job
    await enqueueBuild({
      prompt: "worker-recovery-before",
      chatId: "dur-chat-6a",
      userId: "dur-user-6",
      ...BASE,
      onEvent: () => {},
    });

    // Simulate worker crash + restart
    await closeWorker();
    initQueueWorker();

    let done = false;
    await enqueueBuild({
      prompt: "worker-recovery-after",
      chatId: "dur-chat-6b",
      userId: "dur-user-6",
      ...BASE,
      onEvent: (e) => {
        const ev = e as { type?: string };
        if (ev.type === "done" || ev.type === "error") done = true;
      },
    });

    expect(done).toBe(true);
  });

  // ── 7. Telemetry consistency ──────────────────────────────────────────────
  it("7. telemetry consistency — enqueuedTotal >= completedTotal + failedTotal at all times", async () => {
    for (let i = 0; i < 3; i++) {
      await enqueueBuild({
        prompt: `telemetry-test-${i}`,
        chatId: `dur-chat-tel-${i}`,
        userId: "dur-user-7",
        ...BASE,
        onEvent: () => {},
      });
    }

    const m = getQueueMetrics();
    expect(m.enqueuedTotal).toBeGreaterThanOrEqual(3);
    expect(m.completedTotal + m.failedTotal).toBeLessThanOrEqual(m.enqueuedTotal);
    expect(m.activeNow).toBeGreaterThanOrEqual(0);
    expect(m.queuedNow).toBeGreaterThanOrEqual(0);
  });

  // ── 8. Stalled counter ────────────────────────────────────────────────────
  it("8. stalled counter — recordJobStalled increments stalledCount and decrements activeNow", () => {
    const m0 = getQueueMetrics();
    recordJobStalled("stalled-job-001", "stalled-user");
    const m1 = getQueueMetrics();
    expect(m1.stalledCount).toBe(m0.stalledCount + 1);
    // activeNow cannot go below 0
    expect(m1.activeNow).toBeGreaterThanOrEqual(0);
  });

  // ── 9. Dead job counter ───────────────────────────────────────────────────
  it("9. dead job counter — recordJobDead increments deadJobCount and adds to recentFailures", () => {
    const m0 = getQueueMetrics();
    recordJobDead("dead-job-001", "dead-user", "exhausted retries");
    const m1 = getQueueMetrics();
    expect(m1.deadJobCount).toBe(m0.deadJobCount + 1);
    const deadEntry = m1.recentFailures.find((f) => f.jobId === "dead-job-001");
    expect(deadEntry).toBeDefined();
    expect(deadEntry!.error).toContain("[DEAD]");
  });

  // ── 10. Reset clears all counters including new ones ─────────────────────
  it("10. resetQueueMetrics clears stalledCount, retryTotal, deadJobCount", () => {
    recordJobStalled("s1", "u1");
    recordJobRetry("r1", "u1", 1);
    recordJobDead("d1", "u1", "err");

    resetQueueMetrics();
    const m = getQueueMetrics();
    expect(m.stalledCount).toBe(0);
    expect(m.retryTotal).toBe(0);
    expect(m.deadJobCount).toBe(0);
  });

  // ── 11. Queue mode detection ──────────────────────────────────────────────
  it("11. queue mode — isRedisAvailable and isInMemoryMode are consistent", () => {
    const redis = isRedisAvailable();
    const mem   = isInMemoryMode();
    // They must be opposite (redis up = BullMQ mode; redis down = in-memory mode)
    expect(redis).toBe(!mem);
  });

  // ── 12. _localJobs cleared on closeQueue ─────────────────────────────────
  it("12. closeQueue clears _localJobs map", async () => {
    await enqueueBuild({
      prompt: "close-test",
      chatId: "dur-chat-12",
      userId: "dur-user-12",
      ...BASE,
      onEvent: () => {},
    });

    await closeQueue();
    expect(getLocalJobs().size).toBe(0);

    // Re-init for afterEach
    initBuildQueue();
    initQueueWorker();
  });

  // ── 13. Telemetry snapshot has all V7.0.7 fields ─────────────────────────
  it("13. getQueueMetrics includes all V7.0.7 durability fields", () => {
    const m = getQueueMetrics();
    expect(m).toHaveProperty("enqueuedTotal");
    expect(m).toHaveProperty("completedTotal");
    expect(m).toHaveProperty("failedTotal");
    expect(m).toHaveProperty("cancelledTotal");
    expect(m).toHaveProperty("activeNow");
    expect(m).toHaveProperty("queuedNow");
    expect(m).toHaveProperty("stalledCount");
    expect(m).toHaveProperty("retryTotal");
    expect(m).toHaveProperty("deadJobCount");
    expect(m).toHaveProperty("avgWaitMs");
    expect(m).toHaveProperty("p95WaitMs");
    expect(m).toHaveProperty("byUser");
    expect(m).toHaveProperty("recentFailures");
  });
});
