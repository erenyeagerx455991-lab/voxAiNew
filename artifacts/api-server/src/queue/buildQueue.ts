import { Queue, type ConnectionOptions } from 'bullmq';
import { randomUUID } from 'crypto';
import { getQueueRedis, isRedisAvailable } from './redisClient.js';
import { subscribeToJob, emitJobDone } from './buildEventBus.js';
import { recordJobEnqueued, recordJobFailed } from './queueMetrics.js';
import {
  QUEUE_NAME, DEFAULT_JOB_TIMEOUT_MS, MAX_JOB_RETRIES,
  type BuildJobData, type JobInfo, type JobStatus, type EnqueueOptions,
} from './queueTypes.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('BuildQueue');

let _queue: Queue<BuildJobData> | null = null;
const _localJobs = new Map<string, JobInfo>();

/** Terminal statuses — only these may be evicted */
const TERMINAL_STATUSES = new Set<JobStatus>(['done', 'failed', 'cancelled', 'timeout']);

/** Maximum retained entries in _localJobs (hard cap — prevents unbounded growth) */
const MAX_LOCAL_JOBS = 1000;

/** Time-to-live for completed jobs before eviction (1 hour) */
const TERMINAL_JOB_TTL_MS = 60 * 60 * 1000;

// In-memory mode: worker registers itself so jobs execute inline when Redis is unavailable
type InlineExecutor = (jobId: string, data: BuildJobData) => Promise<void>;
let _inlineExecutor: InlineExecutor | null = null;

export function setInlineExecutor(fn: InlineExecutor): void {
  _inlineExecutor = fn;
}

export function getQueue(): Queue<BuildJobData> | null { return _queue; }

/**
 * Evicts terminal jobs from _localJobs.
 * Rules (Phase 4 safety):
 *   - Never removes queued, running, or retrying jobs.
 *   - Removes terminal jobs older than TERMINAL_JOB_TTL_MS.
 *   - If still over MAX_LOCAL_JOBS after TTL eviction, removes oldest terminal jobs first.
 */
export function evictTerminalJobs(): void {
  const cutoff = Date.now() - TERMINAL_JOB_TTL_MS;

  // TTL pass: remove terminal jobs whose completedAt is older than 1 hour
  for (const [id, info] of _localJobs) {
    if (TERMINAL_STATUSES.has(info.status) && (info.completedAt ?? 0) < cutoff) {
      _localJobs.delete(id);
    }
  }

  // Cap pass: if still over MAX_LOCAL_JOBS, remove oldest terminal jobs by completedAt
  if (_localJobs.size > MAX_LOCAL_JOBS) {
    const terminal = [..._localJobs.entries()]
      .filter(([, info]) => TERMINAL_STATUSES.has(info.status))
      .sort(([, a], [, b]) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
    for (const [id] of terminal) {
      if (_localJobs.size <= MAX_LOCAL_JOBS) break;
      _localJobs.delete(id);
    }
  }
}

export function initBuildQueue(): void {
  if (!isRedisAvailable()) {
    log.info('QUEUE_IN_MEMORY', { reason: 'Redis unavailable — using in-memory job tracking' });
    return;
  }
  const conn = getQueueRedis() as unknown as ConnectionOptions;
  _queue = new Queue<BuildJobData>(QUEUE_NAME, {
    connection: conn,
    defaultJobOptions: {
      attempts: MAX_JOB_RETRIES + 1,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600, count: 500 },
      removeOnFail: { age: 86400, count: 200 },
    },
  });
  log.info('QUEUE_INITIALIZED', { name: QUEUE_NAME });
}

export async function enqueueBuild(opts: EnqueueOptions): Promise<string> {
  const jobId = randomUUID();
  const enqueuedAt = Date.now();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_JOB_TIMEOUT_MS;

  // Evict stale terminal jobs before adding a new one (prevents unbounded growth)
  evictTerminalJobs();

  const jobData: BuildJobData = {
    prompt: opts.prompt, chatId: opts.chatId, userId: opts.userId,
    enqueuedAt, groqKey: opts.groqKey, openrouterKey: opts.openrouterKey,
  };

  const info: JobInfo = { jobId, status: 'queued', userId: opts.userId, enqueuedAt, retryCount: 0 };
  _localJobs.set(jobId, info);
  // Pass jobId so queueMetrics can store enqueue time under the correct key
  recordJobEnqueued(opts.userId, jobId);

  return new Promise<string>((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      updateJobStatus(jobId, 'timeout');
      recordJobFailed(jobId, opts.userId, 'timeout');
      opts.onEvent({ type: 'error', error: 'Build timed out' });
      resolve(jobId);
    }, timeoutMs);

    const unsub = subscribeToJob(jobId, (event) => {
      opts.onEvent(event);
      const e = event as { type?: string };
      if (e.type === 'done' || e.type === 'error') {
        clearTimeout(timer);
        unsub();
        resolve(jobId);
      }
    });

    if (_queue) {
      _queue.add('build', jobData, { jobId }).catch((err) => {
        clearTimeout(timer);
        unsub();
        log.error('ENQUEUE_FAILED', { jobId, error: String(err) });
        emitJobDone(jobId, { type: 'error', error: String(err) });
      });
    } else if (_inlineExecutor) {
      // In-memory mode: run job asynchronously so promise chain is set up first
      setImmediate(() => { _inlineExecutor!(jobId, jobData).catch(() => {}); });
    } else {
      clearTimeout(timer);
      unsub();
      emitJobDone(jobId, { type: 'error', error: 'No build worker registered' });
    }
  });
}

export function updateJobStatus(jobId: string, status: JobStatus, error?: string): void {
  const info = _localJobs.get(jobId);
  if (!info) return;
  info.status = status;
  if (status === 'running') info.startedAt = Date.now();
  if (TERMINAL_STATUSES.has(status)) {
    info.completedAt = Date.now();
    info.durationMs = info.startedAt ? info.completedAt - info.startedAt : undefined;
    // Schedule async eviction — does not block the status update
    setImmediate(evictTerminalJobs);
  }
  if (error) info.error = error;
}

export function getJobInfo(jobId: string): JobInfo | undefined {
  return _localJobs.get(jobId);
}

export function cancelJob(jobId: string): boolean {
  const info = _localJobs.get(jobId);
  if (!info || info.status !== 'queued') return false;
  updateJobStatus(jobId, 'cancelled');
  emitJobDone(jobId, { type: 'error', error: 'Build cancelled' });
  return true;
}

export function getLocalJobs(): Map<string, JobInfo> { return _localJobs; }

export async function closeQueue(): Promise<void> {
  await _queue?.close();
  _queue = null;
  _localJobs.clear();
  _inlineExecutor = null;
}
