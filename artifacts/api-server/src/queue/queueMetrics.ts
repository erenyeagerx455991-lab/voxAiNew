import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('QueueMetrics');

interface QueueSnapshot {
  enqueuedTotal: number;
  completedTotal: number;
  failedTotal: number;
  cancelledTotal: number;
  activeNow: number;
  queuedNow: number;
  avgWaitMs: number;
  avgDurationMs: number;
  p95WaitMs: number;
  p95DurationMs: number;
  byUser: Record<string, { enqueued: number; completed: number; failed: number }>;
  recentFailures: Array<{ jobId: string; userId: string; error: string; at: number }>;
}

let enqueuedTotal = 0;
let completedTotal = 0;
let failedTotal = 0;
let cancelledTotal = 0;
let activeNow = 0;
let queuedNow = 0;

const waitTimes: number[] = [];
const durations: number[] = [];
// Key: jobId (fixed — was a random string that never matched the jobId lookup)
const enqueueTimes = new Map<string, number>();
const startTimes = new Map<string, number>();
const byUser = new Map<string, { enqueued: number; completed: number; failed: number }>();
const recentFailures: Array<{ jobId: string; userId: string; error: string; at: number }> = [];

const MAX_SAMPLES  = 500;
const MAX_FAILURES = 50;

function cappedPush<T>(arr: T[], val: T): void {
  arr.push(val);
  if (arr.length > MAX_SAMPLES) arr.shift();
}

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function avg(arr: number[]): number {
  return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function userEntry(userId: string) {
  if (!byUser.has(userId)) byUser.set(userId, { enqueued: 0, completed: 0, failed: 0 });
  return byUser.get(userId)!;
}

/**
 * @param userId - the user who triggered the build
 * @param jobId  - the job's UUID, used as the enqueueTimes key so recordJobStarted can look it up
 */
export function recordJobEnqueued(userId: string, jobId: string): void {
  enqueuedTotal++;
  queuedNow++;
  // Store by jobId so recordJobStarted can compute real wait time
  enqueueTimes.set(jobId, Date.now());
  userEntry(userId).enqueued++;
}

export function recordJobStarted(jobId: string, userId: string): void {
  // Real wait time: now − time job was enqueued (key now matches jobId)
  const enqueued = enqueueTimes.get(jobId) ?? Date.now();
  const waitMs = Date.now() - enqueued;
  cappedPush(waitTimes, waitMs);
  enqueueTimes.delete(jobId);
  startTimes.set(jobId, Date.now());
  queuedNow = Math.max(0, queuedNow - 1);
  activeNow++;
  log.debug('JOB_STARTED', { jobId, userId, waitMs });
}

export function recordJobCompleted(jobId: string, userId: string, durationMs: number): void {
  completedTotal++;
  activeNow = Math.max(0, activeNow - 1);
  cappedPush(durations, durationMs);
  startTimes.delete(jobId);
  enqueueTimes.delete(jobId); // cleanup if job went queued→done without a start event
  userEntry(userId).completed++;
}

export function recordJobFailed(jobId: string, userId: string, error: string): void {
  failedTotal++;
  activeNow = Math.max(0, activeNow - 1);
  enqueueTimes.delete(jobId); // cleanup: timeout/failed-before-start leaves entry behind
  startTimes.delete(jobId);
  userEntry(userId).failed++;
  recentFailures.push({ jobId, userId, error, at: Date.now() });
  if (recentFailures.length > MAX_FAILURES) recentFailures.shift();
}

export function recordJobCancelled(userId: string, jobId?: string): void {
  cancelledTotal++;
  queuedNow = Math.max(0, queuedNow - 1);
  if (jobId) enqueueTimes.delete(jobId); // cleanup: cancelled-before-start
  userEntry(userId).failed++;
}

export function getQueueMetrics(): QueueSnapshot {
  const sortedWait = [...waitTimes].sort((a, b) => a - b);
  const sortedDur  = [...durations].sort((a, b) => a - b);
  return {
    enqueuedTotal, completedTotal, failedTotal, cancelledTotal,
    activeNow, queuedNow,
    avgWaitMs:     avg(sortedWait),
    avgDurationMs: avg(sortedDur),
    p95WaitMs:     pct(sortedWait, 95),
    p95DurationMs: pct(sortedDur, 95),
    byUser: Object.fromEntries(byUser),
    recentFailures: recentFailures.slice(-10),
  };
}

export function resetQueueMetrics(): void {
  enqueuedTotal = completedTotal = failedTotal = cancelledTotal = 0;
  activeNow = queuedNow = 0;
  waitTimes.length = durations.length = 0;
  enqueueTimes.clear();
  startTimes.clear();
  byUser.clear();
  recentFailures.length = 0;
}
