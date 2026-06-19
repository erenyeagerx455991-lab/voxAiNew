export type JobStatus =
  | 'queued'
  | 'running'
  | 'done'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface BuildJobData {
  prompt: string;
  chatId: string;
  userId: string;
  enqueuedAt: number;
  groqKey: string;
  openrouterKey: string;
}

export interface BuildJobResult {
  status: 'done' | 'failed';
  error?: string;
  durationMs: number;
  sseEventCount: number;
}

export interface JobInfo {
  jobId: string;
  status: JobStatus;
  userId: string;
  enqueuedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  durationMs?: number;
  retryCount: number;
}

export interface EnqueueOptions {
  prompt: string;
  chatId: string;
  userId: string;
  groqKey: string;
  openrouterKey: string;
  onEvent: (event: object) => void;
  timeoutMs?: number;
}

export const QUEUE_NAME = 'nexogen-builds';
export const DEFAULT_JOB_TIMEOUT_MS = 5 * 60 * 1000;
export const MAX_JOB_RETRIES = 1;
export const WORKER_CONCURRENCY = Number(process.env['WORKER_CONCURRENCY'] ?? 3);
