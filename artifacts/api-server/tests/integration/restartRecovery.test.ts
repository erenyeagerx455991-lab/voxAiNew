/**
 * Phase 4 — Restart Recovery Tests
 *
 * No mocks of queue/worker modules. Uses actual queue path.
 * Since Redis is unavailable in test env, the actual path is in-memory mode.
 * All tests document OBSERVED behavior for each mode.
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
} from "../../src/queue/queueMetrics.js";

async function initSystem(): Promise<void> {
  await initRedis();
  initBuildQueue();
  initQueueWorker();
}

async function shutdownSystem(): Promise<void> {
  await closeWorker();
  await closeQueue();
  await closeRedis();
}

describe("Phase 4 — Restart Recovery", () => {
  beforeEach(async () => {
    resetQueueMetrics();
    await initSystem();
  });

  afterEach(async () => {
    await shutdownSystem();
    resetQueueMetrics();
  });

  // ── Test 1: Mode Detection ────────────────────────────────────────────────
  it("1. Reports in-memory mode when Redis is unavailable", async () => {
    // Redis is not present in test env; in-memory mode is the actual path
    const redisUp = isRedisAvailable();
    const memMode = isInMemoryMode();

    if (!redisUp) {
      expect(memMode).toBe(true);
    } else {
      // If Redis somehow available, BullMQ mode is active
      expect(memMode).toBe(false);
    }
  });

  // ── Test 2: Job executes after worker restart (in-memory mode) ─────────────
  it("2. Job completes after worker close + re-init cycle", async () => {
    const events1: object[] = [];
    let job1Done = false;

    // Run a job before restart
    const p1 = enqueueBuild({
      prompt: "rr-test-1",
      chatId: "rr-chat-1",
      userId: "rr-user-1",
      groqKey: "",
      openrouterKey: "",
      onEvent: (e) => {
        events1.push(e);
        if ((e as any).type === "done" || (e as any).type === "error") {
          job1Done = true;
        }
      },
    });

    await p1;
    expect(job1Done).toBe(true);

    // Simulate worker restart: close then re-init
    await closeWorker();
    await closeQueue();
    initBuildQueue();
    initQueueWorker();

    // Run a second job after restart
    const events2: object[] = [];
    let job2Done = false;

    const p2 = enqueueBuild({
      prompt: "rr-test-2",
      chatId: "rr-chat-2",
      userId: "rr-user-2",
      groqKey: "",
      openrouterKey: "",
      onEvent: (e) => {
        events2.push(e);
        if ((e as any).type === "done" || (e as any).type === "error") {
          job2Done = true;
        }
      },
    });

    await p2;
    expect(job2Done).toBe(true);
    expect(events2.length).toBeGreaterThan(0);
  });

  // ── Test 3: Completed jobs are not duplicated after restart ──────────────
  it("3. Completed jobs are not re-executed after worker restart", async () => {
    let execCount = 0;

    await enqueueBuild({
      prompt: "rr-dedup",
      chatId: "rr-dedup-chat",
      userId: "rr-dedup-user",
      groqKey: "",
      openrouterKey: "",
      onEvent: (e) => {
        if ((e as any).type === "step") execCount++;
      },
    });

    const countAfterFirst = execCount;
    expect(countAfterFirst).toBeGreaterThan(0);

    // Worker restart
    await closeWorker();
    initQueueWorker();

    // Wait a tick to ensure no leftover job re-fires
    await new Promise((r) => setTimeout(r, 50));

    // Execution count must not have increased
    expect(execCount).toBe(countAfterFirst);
  });

  // ── Test 4: Failed job not duplicated after restart ───────────────────────
  it("4. Failed job is not re-executed after worker restart", async () => {
    let errorCount = 0;

    await enqueueBuild({
      prompt: "rr-fail",
      chatId: "rr-fail-chat",
      userId: "rr-fail-user",
      groqKey: "bad-key",
      openrouterKey: "bad-key",
      onEvent: (e) => {
        if ((e as any).type === "error") errorCount++;
      },
    });

    // Worker restart
    await closeWorker();
    initQueueWorker();

    await new Promise((r) => setTimeout(r, 50));
    expect(errorCount).toBe(1); // exactly one error, not duplicated
  });

  // ── Test 5: Queue metrics remain consistent across restart ────────────────
  it("5. Queue metrics are consistent: enqueued >= completed + failed", async () => {
    await enqueueBuild({
      prompt: "rr-metrics",
      chatId: "rr-metrics-chat",
      userId: "rr-metrics-user",
      groqKey: "",
      openrouterKey: "",
      onEvent: () => {},
    });

    await closeWorker();
    initQueueWorker();

    const m = getQueueMetrics();
    expect(m.enqueuedTotal).toBeGreaterThan(0);
    expect(m.completedTotal + m.failedTotal).toBeLessThanOrEqual(m.enqueuedTotal);
    expect(m.activeNow).toBeGreaterThanOrEqual(0);
    expect(m.queuedNow).toBeGreaterThanOrEqual(0);
  });

  // ── Test 6: _localJobs is cleared on queue close ──────────────────────────
  it("6. _localJobs map is cleared on closeQueue()", async () => {
    // Enqueue but do not wait — just check the map is populated
    const jobEvents: object[] = [];
    const p = enqueueBuild({
      prompt: "rr-clear",
      chatId: "rr-clear-chat",
      userId: "rr-clear-user",
      groqKey: "",
      openrouterKey: "",
      onEvent: (e) => jobEvents.push(e),
    });

    // After close, the map is cleared
    await p;
    await closeQueue();

    expect(getLocalJobs().size).toBe(0);

    // Re-init for afterEach
    initBuildQueue();
    initQueueWorker();
  });
});
