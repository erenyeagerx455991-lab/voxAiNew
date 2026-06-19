import { createHash } from "crypto";
import type { RetrievalResult } from "../registryV2/registryTypes.js";

const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 500;

interface CacheEntry {
  result: RetrievalResult;
  expiresAt: number;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

let cacheHits = 0;
let cacheMisses = 0;

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").slice(0, 16);
}

export function getCached(key: string): RetrievalResult | null {
  const entry = cache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    cacheMisses++;
    return null;
  }
  cacheHits++;
  return entry.result;
}

export function setCached(key: string, result: RetrievalResult): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, {
    result,
    expiresAt: Date.now() + TTL_MS,
    createdAt: Date.now(),
  });
}

export function clearCache(): void {
  cache.clear();
}

export function evictExpired(): number {
  const now = Date.now();
  let evicted = 0;
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
      evicted++;
    }
  }
  return evicted;
}

export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  return {
    size: cache.size,
    maxEntries: MAX_ENTRIES,
    ttlMs: TTL_MS,
    cacheHits,
    cacheMisses,
    hitRate: total > 0 ? ((cacheHits / total) * 100).toFixed(1) + "%" : "n/a",
  };
}
