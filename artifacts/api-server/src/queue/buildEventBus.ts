import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.setMaxListeners(500);

export type SseEventCallback = (event: object) => void;

export function subscribeToJob(jobId: string, cb: SseEventCallback): () => void {
  const channel = `build:${jobId}`;
  bus.on(channel, cb);
  return () => bus.off(channel, cb);
}

export function emitJobEvent(jobId: string, event: object): void {
  bus.emit(`build:${jobId}`, event);
}

export function emitJobDone(jobId: string, event: object): void {
  bus.emit(`build:${jobId}`, event);
  bus.removeAllListeners(`build:${jobId}`);
}

export function listenerCount(jobId: string): number {
  return bus.listenerCount(`build:${jobId}`);
}

export function _resetBusForTest(): void {
  bus.removeAllListeners();
}
