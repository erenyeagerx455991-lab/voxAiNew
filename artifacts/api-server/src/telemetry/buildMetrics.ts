import { globalMetrics } from "./metricsProvider.js";
import type { TraceContext } from "./traceContext.js";

interface BuildRecord {
  buildId: string;
  traceId: string;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  status: "started" | "success" | "failed";
  prompt?: string;
}

const builds = new Map<string, BuildRecord>();
const durations: number[] = [];
let totalBuilds = 0;
let successfulBuilds = 0;
let failedBuilds = 0;

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export function recordBuildStart(buildId: string, ctx: TraceContext, prompt?: string): void {
  builds.set(buildId, { buildId, traceId: ctx.traceId, startedAt: Date.now(), status: "started", prompt: prompt ? prompt.slice(0, 80) : undefined });
  totalBuilds++;
  globalMetrics.increment("builds.started");
  syncSnapshot();
}

export function recordBuildSuccess(buildId: string): void {
  const b = builds.get(buildId);
  if (!b) return;
  const now = Date.now();
  const dur = now - b.startedAt;
  b.completedAt = now;
  b.durationMs = dur;
  b.status = "success";
  successfulBuilds++;
  durations.push(dur);
  globalMetrics.increment("builds.success");
  globalMetrics.recordDuration("builds.duration", dur);
  syncSnapshot();
}

export function recordBuildFailure(buildId: string, error?: string): void {
  const b = builds.get(buildId);
  if (!b) return;
  const now = Date.now();
  b.completedAt = now;
  b.durationMs = now - b.startedAt;
  b.status = "failed";
  failedBuilds++;
  globalMetrics.increment("builds.failed");
  if (error) globalMetrics.increment(`builds.failed.${error.slice(0, 32).replace(/\W/g, "_")}`);
  syncSnapshot();
}

function syncSnapshot(): void {
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  globalMetrics.setSection("builds", {
    totalBuilds,
    successfulBuilds,
    failedBuilds,
    successRate: totalBuilds > 0 ? ((successfulBuilds / totalBuilds) * 100).toFixed(1) + "%" : "n/a",
    avgBuildTimeMs: Math.round(avg),
    p50BuildTimeMs: computePercentile(sorted, 50),
    p95BuildTimeMs: computePercentile(sorted, 95),
    p99BuildTimeMs: computePercentile(sorted, 99),
    recentBuilds: [...builds.values()].slice(-10).map(b => ({
      buildId: b.buildId,
      status: b.status,
      durationMs: b.durationMs,
    })),
  });
}

export function getBuildSnapshot() {
  syncSnapshot();
  return globalMetrics.snapshot().builds;
}
