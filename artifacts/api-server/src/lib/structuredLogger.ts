let _traceId: string | null = null;
let _requestId: string | null = null;
let _buildId: string | null = null;
let _sessionId: string | null = null;

export function setLogContext(ctx: {
  traceId?: string;
  requestId?: string;
  buildId?: string;
  sessionId?: string;
}): void {
  if (ctx.traceId)   _traceId   = ctx.traceId;
  if (ctx.requestId) _requestId = ctx.requestId;
  if (ctx.buildId)   _buildId   = ctx.buildId;
  if (ctx.sessionId) _sessionId = ctx.sessionId;
}

export function clearLogContext(): void {
  _traceId = _requestId = _buildId = _sessionId = null;
}

type LogLevel = "info" | "warn" | "error" | "debug";

function emit(level: LogLevel, component: string, event: string, data?: Record<string, unknown>): void {
  const entry: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
    component,
    event,
    ...(data ?? {}),
  };
  if (_traceId)   entry["traceId"]   = _traceId;
  if (_requestId) entry["requestId"] = _requestId;
  if (_buildId)   entry["buildId"]   = _buildId;
  if (_sessionId) entry["sessionId"] = _sessionId;

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
