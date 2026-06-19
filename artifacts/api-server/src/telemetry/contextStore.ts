import { AsyncLocalStorage } from "async_hooks";

export interface LogContext {
  traceId?:   string;
  requestId?: string;
  buildId?:   string;
  sessionId?: string;
}

const storage = new AsyncLocalStorage<LogContext>();

export function runWithContext<T>(ctx: LogContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getContext(): LogContext {
  return storage.getStore() ?? {};
}

export function setContext(ctx: LogContext): void {
  const store = storage.getStore();
  if (store) {
    Object.assign(store, ctx);
  }
}

export function updateContext(key: keyof LogContext, value: string): void {
  const store = storage.getStore();
  if (store) {
    (store as Record<string, string>)[key] = value;
  }
}
