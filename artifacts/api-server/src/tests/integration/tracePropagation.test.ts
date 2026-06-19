import { describe, it, expect } from "vitest";
import { createTraceContext, childSpan, withBuildId, traceToHeaders } from "../../telemetry/traceContext.js";

describe("Trace Context Propagation", () => {
  it("createTraceContext generates unique IDs", () => {
    const a = createTraceContext();
    const b = createTraceContext();
    expect(a.traceId).not.toBe(b.traceId);
    expect(a.requestId).not.toBe(b.requestId);
  });

  it("childSpan inherits traceId but gets new spanId", () => {
    const parent = createTraceContext();
    const child = childSpan(parent);
    expect(child.traceId).toBe(parent.traceId);
    expect(child.spanId).not.toBe(parent.spanId);
    expect(child.parentSpanId).toBe(parent.spanId);
    expect(child.requestId).toBe(parent.requestId);
  });

  it("childSpan of childSpan still shares traceId", () => {
    const root = createTraceContext();
    const child = childSpan(root);
    const grandchild = childSpan(child);
    expect(grandchild.traceId).toBe(root.traceId);
    expect(grandchild.parentSpanId).toBe(child.spanId);
  });

  it("withBuildId attaches buildId without changing other fields", () => {
    const ctx = createTraceContext();
    const withBuild = withBuildId(ctx, "build-123");
    expect(withBuild.buildId).toBe("build-123");
    expect(withBuild.traceId).toBe(ctx.traceId);
    expect(withBuild.requestId).toBe(ctx.requestId);
  });

  it("traceToHeaders produces correct header map", () => {
    const ctx = createTraceContext({ buildId: "build-abc", sessionId: "sess-xyz" });
    const headers = traceToHeaders(ctx);
    expect(headers["x-trace-id"]).toBe(ctx.traceId);
    expect(headers["x-span-id"]).toBe(ctx.spanId);
    expect(headers["x-request-id"]).toBe(ctx.requestId);
    expect(headers["x-build-id"]).toBe("build-abc");
    expect(headers["x-session-id"]).toBe("sess-xyz");
  });

  it("traceToHeaders omits optional keys when null", () => {
    const ctx = createTraceContext();
    const headers = traceToHeaders(ctx);
    expect(Object.keys(headers)).not.toContain("x-build-id");
    expect(Object.keys(headers)).not.toContain("x-session-id");
  });

  it("parentSpanId is null for root span", () => {
    const ctx = createTraceContext();
    expect(ctx.parentSpanId).toBeNull();
  });

  it("createTraceContext with overrides respects traceId", () => {
    const ctx = createTraceContext({ traceId: "custom-trace-123" });
    expect(ctx.traceId).toBe("custom-trace-123");
  });

  it("trace survives JSON serialisation (simulates cross-step propagation)", () => {
    const ctx = createTraceContext({ buildId: "build-pipeline-test" });
    const serialised = JSON.stringify(ctx);
    const restored = JSON.parse(serialised) as typeof ctx;
    expect(restored.traceId).toBe(ctx.traceId);
    expect(restored.buildId).toBe("build-pipeline-test");
    expect(restored.requestId).toBe(ctx.requestId);
  });
});
