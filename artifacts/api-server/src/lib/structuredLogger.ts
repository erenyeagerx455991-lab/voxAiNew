import { getContext, setContext, runWithContext, updateContext } from "../telemetry/contextStore.js";

export { runWithContext, setContext, updateContext, getContext };

type LogLevel = "info" | "warn" | "error" | "debug";

function emit(level: LogLevel, component: string, event: string, data?: Record<string, unknown>): void {
  const ctx = getContext();
  const entry: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
    component,
    event,
    ...(data ?? {}),
  };
  if (ctx.traceId)   entry["traceId"]   = ctx.traceId;
  if (ctx.requestId) entry["requestId"] = ctx.requestId;
  if (ctx.buildId)   entry["buildId"]   = ctx.buildId;
  if (ctx.sessionId) entry["sessionId"] = ctx.sessionId;

  const out = JSON.stringify(entry);
  switch (level) {
    case "error": process.stderr.write(out + "\n"); break;
    case "warn":  process.stderr.write(out + "\n"); break;
    default:      process.stdout.write(out + "\n"); break;
  }
}

function makeLogger(component: string) {
  return {
    info:  (event: string, data?: Record<string, unknown>) => emit("info",  component, event, data),
    warn:  (event: string, data?: Record<string, unknown>) => emit("warn",  component, event, data),
    error: (event: string, data?: Record<string, unknown>) => emit("error", component, event, data),
    debug: (event: string, data?: Record<string, unknown>) => emit("debug", component, event, data),
    child: (childComponent: string) => makeLogger(`${component}:${childComponent}`),
  };
}

export type Logger = ReturnType<typeof makeLogger>;

export function createLogger(component: string): Logger {
  return makeLogger(component);
}

export const logger = createLogger("api-server");

export function setLogContext(ctx: {
  traceId?: string;
  requestId?: string;
  buildId?: string;
  sessionId?: string;
}): void {
  setContext(ctx);
}

export function clearLogContext(): void {
  setContext({ traceId: undefined, requestId: undefined, buildId: undefined, sessionId: undefined });
}
