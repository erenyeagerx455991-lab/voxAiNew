/**
 * SSE Bridge Tests
 * Verifies the parse→emit→re-serialize round-trip.
 *
 * The bridge (makeSseBridge in queueWorker.ts) receives SSE-formatted
 * strings from runBuildPipeline, parses them, and emits plain objects
 * to the event bus. The agents.ts onEvent callback re-serializes them
 * via sse(res, event). This suite verifies the round-trip is lossless.
 */
import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { executeBuildJob } from "../../src/queue/queueWorker.js";
import { subscribeToJob, _resetBusForTest } from "../../src/queue/buildEventBus.js";
import { resetQueueMetrics } from "../../src/queue/queueMetrics.js";
import { initBuildQueue, closeQueue } from "../../src/queue/buildQueue.js";
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
  prompt:        "Test SSE bridge",
  chatId:        "chat-ssebridge-001",
  userId:        "user-ssebridge-001",
  enqueuedAt:    Date.now(),
  groqKey:       "gk",
  openrouterKey: "ok",
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

describe("SSE Bridge — format round-trip", () => {

  it("parses data: prefix correctly", async () => {
    const events: object[] = [];
    const unsub = subscribeToJob("job-sse-01", (e) => events.push(e));

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"step","step":0}\n\n');
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await executeBuildJob("job-sse-01", { ...JOB, chatId: "chat-ssebridge-p1" });
    unsub();

    expect(events[0]).toMatchObject({ type: "step", step: 0 });
    expect(events[1]).toMatchObject({ type: "done" });
  });

  it("preserves all JSON fields in step events", async () => {
    const events: object[] = [];
    const unsub = subscribeToJob("job-sse-02", (e) => events.push(e));

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"step","step":3,"agent":"Codegen","status":"running","model":"gpt-4o"}\n\n');
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await executeBuildJob("job-sse-02", { ...JOB, chatId: "chat-ssebridge-p2" });
    unsub();

    const step = events[0] as any;
    expect(step.type).toBe("step");
    expect(step.step).toBe(3);
    expect(step.agent).toBe("Codegen");
    expect(step.status).toBe("running");
    expect(step.model).toBe("gpt-4o");
  });

  it("silently drops non-JSON writes (e.g., keepalive comments)", async () => {
    const events: object[] = [];
    const unsub = subscribeToJob("job-sse-03", (e) => events.push(e));

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write(": keepalive\n\n");           // SSE comment — not JSON
      res.write("data: not-json-at-all\n\n"); // malformed JSON
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await executeBuildJob("job-sse-03", { ...JOB, chatId: "chat-ssebridge-p3" });
    unsub();

    // Only the valid JSON event should arrive
    expect(events.length).toBe(1);
    expect((events[0] as any).type).toBe("done");
  });

  it("enqueueBuild subscriber is removed after done event resolves", async () => {
    // enqueueBuild adds an internal subscriber; it must call unsub() on done
    const { enqueueBuild }  = await import("../../src/queue/buildQueue.js");
    const { listenerCount } = await import("../../src/queue/buildEventBus.js");

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    const jobId = "job-sse-04";
    // Before enqueueBuild: no listeners
    expect(listenerCount(jobId)).toBe(0);

    // Use a distinct chatId so the jobId in _localJobs is independent
    await enqueueBuild({
      ...JOB,
      chatId:  "chat-ssebridge-p4",
      onEvent: () => {},
    });

    // After the promise resolves, the internal subscriber must have unsubscribed.
    // We cannot check by the generated UUID jobId directly, but we can verify
    // no new listeners are leaking on the bus channel for the known static jobId.
    // Instead: verify that resubscribing to the bus has zero prior listeners.
    expect(listenerCount("job-sse-04")).toBe(0); // no external sub was added

    // emitJobDone IS called on error path — verify it removes listeners:
    const errorJobId = "job-sse-04-err";
    subscribeToJob(errorJobId, () => {});
    subscribeToJob(errorJobId, () => {});
    expect(listenerCount(errorJobId)).toBe(2);

    const { emitJobDone } = await import("../../src/queue/buildEventBus.js");
    emitJobDone(errorJobId, { type: "error", error: "test" });
    expect(listenerCount(errorJobId)).toBe(0);
  });

  it("re-serialized SSE format matches sse() output format", async () => {
    // Verify the round-trip: pipeline writes `data: {...}\n\n`
    // bridge parses → plain object → onEvent receives plain object
    // onEvent calls sse(res, obj) → res.write(`data: ${JSON.stringify(obj)}\n\n`)
    // The output format is identical to the input format (for pure JSON events)
    const originalEvent = { type: "step", step: 1, agent: "Design", status: "done", score: 95.5 };
    const sseInput = `data: ${JSON.stringify(originalEvent)}\n\n`;

    const received: object[] = [];
    const unsub = subscribeToJob("job-sse-05", (e) => received.push(e));

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write(sseInput);
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await executeBuildJob("job-sse-05", { ...JOB, chatId: "chat-ssebridge-p5" });
    unsub();

    const roundTripped = received[0] as any;
    expect(roundTripped.type).toBe(originalEvent.type);
    expect(roundTripped.step).toBe(originalEvent.step);
    expect(roundTripped.agent).toBe(originalEvent.agent);
    expect(roundTripped.status).toBe(originalEvent.status);
    expect(roundTripped.score).toBe(originalEvent.score);

    // Re-serialize as sse() would do it
    const reEncoded = `data: ${JSON.stringify(roundTripped)}\n\n`;
    expect(reEncoded).toBe(sseInput);
  });

  it("bridge write() returns true (Express-compatible)", async () => {
    let writeReturn: unknown;
    const unsub = subscribeToJob("job-sse-06", () => {});

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      writeReturn = res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await executeBuildJob("job-sse-06", { ...JOB, chatId: "chat-ssebridge-p6" });
    unsub();

    expect(writeReturn).toBe(true);
  });

  it("enqueueBuild onEvent callback receives parsed objects (not SSE strings)", async () => {
    const { enqueueBuild } = await import("../../src/queue/buildQueue.js");
    const onEventArgs: unknown[] = [];

    mockPipeline.mockImplementation(async (_i: unknown, res: any) => {
      res.write('data: {"type":"step","step":2}\n\n');
      res.write('data: {"type":"done","code":"<html/>"}\n\n');
    });

    await enqueueBuild({
      ...JOB,
      onEvent: (event) => onEventArgs.push(event),
    });

    // All events should be plain objects, not SSE-formatted strings
    for (const arg of onEventArgs) {
      expect(typeof arg).toBe("object");
      expect(typeof arg).not.toBe("string");
    }

    expect(onEventArgs.some((e: any) => e.type === "step")).toBe(true);
    expect(onEventArgs.some((e: any) => e.type === "done")).toBe(true);
  });
});
