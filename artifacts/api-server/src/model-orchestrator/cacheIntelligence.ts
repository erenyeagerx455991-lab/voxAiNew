// ── V9.3 Model Orchestrator — Cache Intelligence ─────────────────────────────
//
// Tracks and predicts cache utilization for prompt/blueprint/retrieval/
// component/evaluation/repair caches. In-memory, deterministic, no LLM calls.
import type { AgentName } from '../agent-orchestrator/types.js';
import type { CachePolicy } from './types.js';

export type CacheType = 'prompt' | 'blueprint' | 'retrieval' | 'component' | 'evaluation' | 'repair';

interface CacheEntry {
  key:        string;
  type:       CacheType;
  agent:      AgentName;
  createdAt:  number;
  hits:       number;
}

interface CacheStats {
  hits:       number;
  misses:     number;
  entries:    number;
}

const MAX_ENTRIES = 500;
const stores = new Map<CacheType, Map<string, CacheEntry>>();
const stats:  Record<CacheType, CacheStats> = {
  prompt:     { hits: 0, misses: 0, entries: 0 },
  blueprint:  { hits: 0, misses: 0, entries: 0 },
  retrieval:  { hits: 0, misses: 0, entries: 0 },
  component:  { hits: 0, misses: 0, entries: 0 },
  evaluation: { hits: 0, misses: 0, entries: 0 },
  repair:     { hits: 0, misses: 0, entries: 0 },
};

function getStore(type: CacheType): Map<string, CacheEntry> {
  let s = stores.get(type);
  if (!s) { s = new Map(); stores.set(type, s); }
  return s;
}

export function cacheSet(type: CacheType, key: string, agent: AgentName): void {
  try {
    const store = getStore(type);
    if (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest) store.delete(oldest);
    }
    store.set(key, { key, type, agent, createdAt: Date.now(), hits: 0 });
    stats[type].entries = store.size;
  } catch { /* cache errors must never stop builds */ }
}

export function cacheGet(type: CacheType, key: string): boolean {
  try {
    const store = getStore(type);
    const entry = store.get(key);
    if (entry) {
      entry.hits++;
      stats[type].hits++;
      return true;
    }
    stats[type].misses++;
    return false;
  } catch {
    return false;
  }
}

export function getCacheHitRate(type?: CacheType): number {
  if (type) {
    const s = stats[type];
    const total = s.hits + s.misses;
    return total > 0 ? parseFloat((s.hits / total).toFixed(3)) : 0;
  }
  let totalHits = 0; let totalMisses = 0;
  for (const s of Object.values(stats)) { totalHits += s.hits; totalMisses += s.misses; }
  const total = totalHits + totalMisses;
  return total > 0 ? parseFloat((totalHits / total).toFixed(3)) : 0;
}

export function getCacheSnapshot(): Record<CacheType, { hitRate: number; entries: number; hits: number; misses: number }> {
  const types: CacheType[] = ['prompt', 'blueprint', 'retrieval', 'component', 'evaluation', 'repair'];
  const out = {} as Record<CacheType, { hitRate: number; entries: number; hits: number; misses: number }>;
  for (const t of types) {
    const s = stats[t];
    const total = s.hits + s.misses;
    out[t] = { hitRate: total > 0 ? parseFloat((s.hits / total).toFixed(3)) : 0, entries: s.entries, hits: s.hits, misses: s.misses };
  }
  return out;
}

export function predictCacheHitRate(policy: CachePolicy, buildCount: number): number {
  if (policy === 'none') return 0;
  const base = policy === 'full' ? 0.4 : policy === 'blueprint' ? 0.25 : 0.15;
  return parseFloat(Math.min(0.8, base + Math.min(buildCount * 0.02, 0.4)).toFixed(3));
}

export function resetCacheIntelligence(): void {
  stores.clear();
  for (const k of Object.keys(stats) as CacheType[]) {
    stats[k] = { hits: 0, misses: 0, entries: 0 };
  }
}
