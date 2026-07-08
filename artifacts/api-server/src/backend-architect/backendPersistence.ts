// ── V8.6 Backend Architect — Persistence ──────────────────────────────────────
import { initBackendPersistence } from './backendLearning.js';

let initialized = false;

export function initBackendArchitectPersistence(): void {
  if (initialized) return;
  initialized = true;
  initBackendPersistence();
}

export function resetBackendArchitectPersistence(): void {
  initialized = false;
  initBackendPersistence();
}
