import { randomUUID } from "crypto";

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  buildId: string | null;
  sessionId: string | null;
  requestId: string;
}

export function createTraceContext(overrides: Partial<TraceContext> = {}): TraceContext {
  return {
    traceId: overrides.traceId ?? randomUUID(),
    spanId: randomUUID(),
    parentSpanId: overrides.parentSpanId ?? null,
    buildId: overrides.buildId ?? null,
    sessionId: overrides.sessionId ?? null,
    requestId: overrides.requestId ?? randomUUID(),
  };
}

export function childSpan(parent: TraceContext): TraceContext {
  return {
    traceId: parent.traceId,
    spanId: randomUUID(),
    parentSpanId: parent.spanId,
    buildId: parent.buildId,
    sessionId: parent.sessionId,
    requestId: parent.requestId,
  };
}

export function withBuildId(ctx: TraceContext, buildId: string): TraceContext {
  return { ...ctx, buildId };
}

export function traceToHeaders(ctx: TraceContext): Record<string, string> {
  return {
    "x-trace-id":   ctx.traceId,
    "x-span-id":    ctx.spanId,
    "x-request-id": ctx.requestId,
    ...(ctx.buildId   ? { "x-build-id":   ctx.buildId }   : {}),
    ...(ctx.sessionId ? { "x-session-id": ctx.sessionId } : {}),
  };
}
