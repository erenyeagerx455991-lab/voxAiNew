import { globalMetrics } from "./metricsProvider.js";
import { MAX_REPAIR_SAMPLES } from "./constants.js";

interface RepairRecord {
  buildId: string;
  filePath: string;
  attemptCount: number;
  finalResult: "success" | "failure" | "in-progress";
}

const repairRecords: RepairRecord[] = [];
let totalAttempts = 0;
let successfulRepairs = 0;
let failedRepairs = 0;
const repairPassCounts: number[] = [];

function cappedPush(arr: number[], value: number): void {
  arr.push(value);
  if (arr.length > MAX_REPAIR_SAMPLES) arr.shift();
}

export function recordRepairAttempt(buildId: string, filePath: string): void {
  let rec = repairRecords.find(r => r.buildId === buildId && r.filePath === filePath);
  if (!rec) {
    rec = { buildId, filePath, attemptCount: 0, finalResult: "in-progress" };
    repairRecords.push(rec);
    if (repairRecords.length > MAX_REPAIR_SAMPLES) repairRecords.shift();
  }
  rec.attemptCount++;
  totalAttempts++;
  globalMetrics.increment("repairs.attempts");
  syncSnapshot();
}

export function recordRepairSuccess(buildId: string, filePath: string, passes: number): void {
  const rec = repairRecords.find(r => r.buildId === buildId && r.filePath === filePath);
  if (rec) rec.finalResult = "success";
  successfulRepairs++;
  cappedPush(repairPassCounts, passes);
  globalMetrics.increment("repairs.successes");
  syncSnapshot();
}

export function recordRepairFailure(buildId: string, filePath: string): void {
  const rec = repairRecords.find(r => r.buildId === buildId && r.filePath === filePath);
  if (rec) rec.finalResult = "failure";
  failedRepairs++;
  globalMetrics.increment("repairs.failures");
  syncSnapshot();
}

function syncSnapshot(): void {
  const avgPasses = repairPassCounts.length > 0
    ? repairPassCounts.reduce((a, b) => a + b, 0) / repairPassCounts.length
    : 0;
  globalMetrics.setSection("repairs", {
    totalAttempts,
    successfulRepairs,
    failedRepairs,
    successRate: (successfulRepairs + failedRepairs) > 0
      ? ((successfulRepairs / (successfulRepairs + failedRepairs)) * 100).toFixed(1) + "%"
      : "n/a",
    averageRepairPasses: Math.round(avgPasses * 10) / 10,
    recentRepairs: repairRecords.slice(-20).map(r => ({
      buildId: r.buildId,
      filePath: r.filePath,
      attempts: r.attemptCount,
      result: r.finalResult,
    })),
  });
}

export function getRepairSnapshot() {
  syncSnapshot();
  return globalMetrics.snapshot().repairs;
}

export function resetRepairMetrics(): void {
  repairRecords.length = 0;
  totalAttempts = 0;
  successfulRepairs = 0;
  failedRepairs = 0;
  repairPassCounts.length = 0;
  globalMetrics.reset();
}
