import { MAX_DURATION_SAMPLES } from "./constants.js";

let retrievalCount = 0;
const retrievalDurations: number[] = [];
let cacheHits = 0;
let cacheMisses = 0;
const componentUsage: Map<string, number> = new Map();
const selectionFrequency: Map<string, number> = new Map();

function cappedPush(arr: number[], value: number): void {
  arr.push(value);
  if (arr.length > MAX_DURATION_SAMPLES) arr.shift();
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function recordRetrieval(durationMs: number, hit: boolean): void {
  retrievalCount++;
  cappedPush(retrievalDurations, durationMs);
  if (hit) {
    cacheHits++;
  } else {
    cacheMisses++;
  }
}

export function recordComponentUsage(componentId: string): void {
  componentUsage.set(componentId, (componentUsage.get(componentId) ?? 0) + 1);
}

export function recordComponentSelection(componentId: string): void {
  selectionFrequency.set(componentId, (selectionFrequency.get(componentId) ?? 0) + 1);
}

export function getRegistryMetrics() {
  const totalCacheOps = cacheHits + cacheMisses;
  const topByUsage = [...componentUsage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id, count]) => ({ id, count }));
  const topByFrequency = [...selectionFrequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([id, count]) => ({ id, count }));

  return {
    retrievalCount,
    avgRetrievalMs: Math.round(avg(retrievalDurations)),
    cacheHitRate: totalCacheOps > 0 ? ((cacheHits / totalCacheOps) * 100).toFixed(1) + "%" : "n/a",
    cacheHits,
    cacheMisses,
    componentUsage: topByUsage,
    componentSelectionFrequency: topByFrequency,
    totalUniqueComponents: componentUsage.size,
  };
}
