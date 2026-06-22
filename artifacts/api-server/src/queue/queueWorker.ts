import { Worker } from 'bullmq';
import type { Response } from 'express';
import { getWorkerRedis, isRedisAvailable } from './redisClient.js';
import { setInlineExecutor, updateJobStatus } from './buildQueue.js';
import { emitJobEvent, emitJobDone } from './buildEventBus.js';
import { recordJobStarted, recordJobCompleted, recordJobFailed, recordJobStalled, recordJobRetry, recordJobDead } from './queueMetrics.js';
import { QUEUE_NAME, WORKER_CONCURRENCY, type BuildJobData } from './queueTypes.js';
import { runBuildPipeline } from '../agents/pipeline/buildPipeline.js';
import { tokenContext } from '../agents/llm/tokenContext.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('QueueWorker');

let _worker: Worker<BuildJobData> | null = null;
let _inMemoryActive = false;

/**
 * Creates a mock Express Response whose write() emits parsed SSE events
 * to the in-process event bus. enqueueBuild() subscribes to this bus and
 * relays events to the real HTTP response.
 *
 * Phase 6 upgrade path: swap emitJobEvent() for Redis Pub/Sub without
 * changing this function's signature.
 */
function makeSseBridge(jobId: string): Response {
  return {
    write(chunk: string) {
      if (typeof chunk === 'string') {
        const raw = chunk.replace(/^data: /, '').replace(/\n\n$/, '');
        try {
          emitJobEvent(jobId, JSON.parse(raw));
        } catch { /* ignore non-JSON */ }
      }
      return true;
    },
    setHeader()   { return this; },
    flushHeaders(){ return this; },
    end()         { return this; },
    headersSent:   true,
    writableEnded: false,
  } as unknown as Response;
}

export async function executeBuildJob(jobId: string, data: BuildJobData): Promise<void> {
  const { prompt, chatId, groqKey, openrouterKey, userId } = data;
  updateJobStatus(jobId, 'running');
  recordJobStarted(jobId, userId);
  const t0 = Date.now();
  const bridge = makeSseBridge(jobId);

  try {
    // tokenContext carries userId + buildId through the async chain to callGroq/callOpenRouter
    // without changing any intermediate function signatures (Phase 5 — per-user accounting).
    await tokenContext.run({ userId, buildId: jobId }, () =>
      runBuildPipeline({ prompt, chatId, keys: { groqKey, openrouterKey } }, bridge)
    );
    updateJobStatus(jobId, 'done');
    recordJobCompleted(jobId, userId, Date.now() - t0);
    log.info('JOB_DONE', { jobId, userId, durationMs: Date.now() - t0 });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    updateJobStatus(jobId, 'failed', error);
    recordJobFailed(jobId, userId, error);
    log.error('JOB_FAILED', { jobId, userId, error });
    emitJobDone(jobId, { type: 'error', error });
  }
}

export function initQueueWorker(): void {
  // Always register as inline executor for in-memory mode fallback
  setInlineExecutor(executeBuildJob);

  if (!isRedisAvailable()) {
    log.info('WORKER_IN_MEMORY', { reason: 'Redis unavailable — jobs execute inline via setImmediate' });
    _inMemoryActive = true;
    return;
  }

  const conn = getWorkerRedis()!;
  _worker = new Worker<BuildJobData>(
    QUEUE_NAME,
    async (job) => {
      const jobId = job.id ?? job.data.chatId;
      await executeBuildJob(jobId, job.data);
    },
    { connection: conn, concurrency: WORKER_CONCURRENCY }
  );

  _worker.on('active',    (j)     => log.info ('WORKER_JOB_ACTIVE',     { jobId: j.id }));
  _worker.on('completed', (j)     => log.info ('WORKER_JOB_COMPLETED',  { jobId: j.id }));
  _worker.on('failed',    (j, e)  => {
    if (!j) return;
    const jobId   = j.id ?? 'unknown';
    const userId  = (j.data as BuildJobData).userId ?? 'unknown';
    const error   = e?.message ?? 'unknown';
    const made    = j.attemptsMade ?? 0;
    const total   = (j.opts?.attempts ?? 1);
    if (made >= total) {
      // All attempts exhausted — permanently dead
      recordJobDead(jobId, userId, error);
    } else {
      // Will be retried by BullMQ
      recordJobRetry(jobId, userId, made);
    }
    log.error('WORKER_JOB_FAILED', { jobId, error, attemptsMade: made, maxAttempts: total });
  });
  _worker.on('stalled',   (jobId) => {
    // BullMQ passes jobId (string) for stalled event — data not available
    recordJobStalled(jobId, 'unknown');
    log.warn('WORKER_JOB_STALLED', { jobId });
  });
  _worker.on('error',     (e)     => log.error('WORKER_ERROR',          { error: e.message }));

  log.info('WORKER_INITIALIZED', { concurrency: WORKER_CONCURRENCY, queue: QUEUE_NAME });
}

export function isInMemoryMode(): boolean { return _inMemoryActive; }

export async function closeWorker(): Promise<void> {
  await _worker?.close();
  _worker = null;
  _inMemoryActive = false;
}
