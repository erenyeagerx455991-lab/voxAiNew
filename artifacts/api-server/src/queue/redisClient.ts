import { Redis } from 'ioredis';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('RedisClient');

let _queue: Redis | null = null;
let _worker: Redis | null = null;
let _available = false;
let _attempted = false;

const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

function makeClient(opts: { maxRetriesPerRequest: number | null }): Redis {
  const client = new Redis(REDIS_URL, {
    ...opts,
    enableOfflineQueue: false,
    lazyConnect: true,
    connectTimeout: 3000,
    commandTimeout: 5000,
    retryStrategy: (times) => (times < 3 ? Math.min(times * 200, 1000) : null),
  });
  client.on('connect', () => {
    _available = true;
    log.info('REDIS_CONNECTED', { url: REDIS_URL.replace(/:[^:@]*@/, ':***@') });
  });
  client.on('error', (err) => {
    if (_available) log.warn('REDIS_ERROR', { message: err.message });
    _available = false;
  });
  client.on('close', () => { _available = false; });
  return client;
}

export async function initRedis(): Promise<boolean> {
  if (_attempted) return _available;
  _attempted = true;
  try {
    _queue  = makeClient({ maxRetriesPerRequest: 3 });
    _worker = makeClient({ maxRetriesPerRequest: null });
    await Promise.all([_queue.connect(), _worker.connect()]);
    _available = true;
  } catch {
    log.warn('REDIS_UNAVAILABLE', { message: 'Redis not reachable — queue runs in-memory mode' });
    _available = false;
  }
  return _available;
}

export function getQueueRedis(): Redis | null   { return _available ? _queue  : null; }
export function getWorkerRedis(): Redis | null  { return _available ? _worker : null; }
export function isRedisAvailable(): boolean     { return _available; }

export async function closeRedis(): Promise<void> {
  await Promise.allSettled([_queue?.quit(), _worker?.quit()]);
  _queue = _worker = null;
  _available = false;
  _attempted = false;
}
