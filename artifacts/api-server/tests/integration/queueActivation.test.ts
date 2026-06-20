/**
 * Queue Activation Tests
 * Verifies that /agents/build routes through enqueueBuild, not runBuildPipeline directly.
 */
import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import request from "supertest";

// Must be mocked before app import — both are hoisted
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
  runBuildPipeline: vi.fn().mockRejectedValue(
    new Error("MUST_NOT_CALL_DIRECTLY — route must use enqueueBuild")
  ),
}));

const { enqueueBuild } = await import("../../src/queue/buildQueue.js");
const { runBuildPipeline } = await import("../../src/agents/pipeline/buildPipeline.js");
const mockEnqueue   = enqueueBuild   as MockedFunction<typeof enqueueBuild>;
const mockPipeline  = runBuildPipeline as MockedFunction<typeof runBuildPipeline>;

// App import AFTER mocks are in place
const { default: app } = await import("../../src/app.js");

const VALID_BODY = { prompt: "build me a landing page", chatId: "chat-qa-001" };

beforeEach(() => {
  mockEnqueue.mockReset();
  mockPipeline.mockReset();
  process.env["GROQ_API_KEY"]      = "test-groq-key";
  process.env["OPENROUTER_API_KEY"] = "test-or-key";
});

describe("Queue Activation — /agents/build route", () => {

  it("calls enqueueBuild, not runBuildPipeline directly", async () => {
    mockEnqueue.mockImplementation(async (opts) => {
      opts.onEvent({ type: "done", code: "<html/>" });
      return "job-qa-001";
    });

    await request(app)
      .post("/api/agents/build")
      .send(VALID_BODY);

    expect(mockEnqueue).toHaveBeenCalledOnce();
    expect(mockPipeline).not.toHaveBeenCalled();
  });

  it("passes prompt, chatId, userId, and API keys to enqueueBuild", async () => {
    mockEnqueue.mockImplementation(async (opts) => {
      opts.onEvent({ type: "done", code: "<html/>" });
      return "job-qa-002";
    });

    await request(app)
      .post("/api/agents/build")
      .send({ prompt: "saas dashboard", chatId: "chat-qa-002" });

    const call = mockEnqueue.mock.calls[0][0];
    expect(call.prompt).toBe("saas dashboard");
    expect(call.chatId).toBe("chat-qa-002");
    expect(call.groqKey).toBe("test-groq-key");
    expect(call.openrouterKey).toBe("test-or-key");
    expect(typeof call.userId).toBe("string");
    expect(call.userId.length).toBeGreaterThan(0);
  });

  it("onEvent callback writes SSE to the HTTP response", async () => {
    const received: string[] = [];

    mockEnqueue.mockImplementation(async (opts) => {
      opts.onEvent({ type: "step", step: 0, agent: "Planner", status: "running" });
      opts.onEvent({ type: "step", step: 1, agent: "Design", status: "running" });
      opts.onEvent({ type: "done", code: "<html/>" });
      return "job-qa-003";
    });

    const res = await request(app)
      .post("/api/agents/build")
      .send(VALID_BODY)
      .buffer(true)
      .parse((res, callback) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => callback(null, data));
      });

    const body = res.body as string;
    expect(body).toContain("data: ");
    expect(body).toContain('"type":"step"');
    expect(body).toContain('"type":"done"');
  });

  it("returns SSE content-type header", async () => {
    mockEnqueue.mockImplementation(async (opts) => {
      opts.onEvent({ type: "done", code: "<html/>" });
      return "job-qa-004";
    });

    const res = await request(app)
      .post("/api/agents/build")
      .send(VALID_BODY);

    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
  });

  it("rejects 400 when prompt is missing", async () => {
    const res = await request(app)
      .post("/api/agents/build")
      .send({ chatId: "chat-qa-005" });

    expect(res.status).toBe(400);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("rejects 500 when GROQ_API_KEY is missing", async () => {
    delete process.env["GROQ_API_KEY"];

    const res = await request(app)
      .post("/api/agents/build")
      .send(VALID_BODY);

    expect(res.status).toBe(500);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it("emits error SSE event if enqueueBuild rejects", async () => {
    mockEnqueue.mockRejectedValueOnce(new Error("Queue internal error"));

    const res = await request(app)
      .post("/api/agents/build")
      .send(VALID_BODY)
      .buffer(true)
      .parse((res, callback) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => callback(null, data));
      });

    const body = res.body as string;
    expect(body).toContain('"type":"error"');
    expect(body).toContain("Queue internal error");
  });

  it("enqueueBuild is called with an onEvent function", async () => {
    mockEnqueue.mockImplementation(async (opts) => {
      opts.onEvent({ type: "done", code: "<html/>" });
      return "job-qa-007";
    });

    await request(app)
      .post("/api/agents/build")
      .send(VALID_BODY);

    const opts = mockEnqueue.mock.calls[0][0];
    expect(typeof opts.onEvent).toBe("function");
  });
});
