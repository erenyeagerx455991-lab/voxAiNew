import { globalMetrics } from "./metricsProvider.js";

let runtimeChecks = 0;
let runtimePasses = 0;
let runtimeFailures = 0;
const viteBuildDurations: number[] = [];
const repairLoopDurations: number[] = [];
const validationDurations: number[] = [];

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export function recordRuntimeCheck(passed: boolean): void {
  runtimeChecks++;
  if (passed) {
    runtimePasses++;
    globalMetrics.increment("runtime.passes");
  } else {
    runtimeFailures++;
    globalMetrics.increment("runtime.failures");
  }
  syncSnapshot();
}

export function recordViteBuildDuration(durationMs: number): void {
  viteBuildDurations.push(durationMs);
  globalMetrics.recordDuration("runtime.vite_build", durationMs);
  syncSnapshot();
}

export function recordRepairLoopDuration(durationMs: number): void {
  repairLoopDurations.push(durationMs);
  globalMetrics.recordDuration("runtime.repair_loop", durationMs);
  syncSnapshot();
}

export function recordValidationDuration(durationMs: number): void {
  validationDurations.push(durationMs);
  globalMetrics.recordDuration("runtime.validation", durationMs);
  syncSnapshot();
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function syncSnapshot(): void {
  const viteSorted = [...viteBuildDurations].sort((a, b) => a - b);
  const repairSorted = [...repairLoopDurations].sort((a, b) => a - b);
  globalMetrics.setSection("runtime", {
    runtimeChecks,
    runtimePasses,
    runtimeFailures,
    runtimePassRate: runtimeChecks > 0 ? ((runtimePasses / runtimeChecks) * 100).toFixed(1) + "%" : "n/a",
    viteBuild: {
      count: viteBuildDurations.length,
      avgMs: Math.round(avg(viteBuildDurations)),
      p95Ms: percentile(viteSorted, 95),
    },
    repairLoop: {
      count: repairLoopDurations.length,
      avgMs: Math.round(avg(repairLoopDurations)),
      p95Ms: percentile(repairSorted, 95),
    },
    validation: {
      count: validationDurations.length,
      avgMs: Math.round(avg(validationDurations)),
    },
  });
}

export function getRuntimeSnapshot() {
  syncSnapshot();
  return globalMetrics.snapshot().runtime;
}
