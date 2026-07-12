// ── V9.3 Model Orchestrator — Model Health Monitor ───────────────────────────
//
// Tracks provider-level failure rate, latency, cost, quality, timeouts,
// and availability. In-memory, capped, never throws into pipeline.
import type { ProviderId } from './types.js';
import type { ModelHealthRecord } from './types.js';
import { ALL_PROVIDER_IDS } from './providerRegistry.js';

const MAX_SAMPLES = 200;

interface ProviderSample {
  success:    boolean;
  latencyMs:  number;
  cost:       number;
  quality:    number;
  timedOut:   boolean;
}

const store = new Map<ProviderId, ProviderSample[]>();

function getSamples(provider: ProviderId): ProviderSample[] {
  let s = store.get(provider);
  if (!s) { s = []; store.set(provider, s); }
  return s;
}

export function recordProviderOutcome(
  provider: ProviderId,
  success: boolean,
  latencyMs: number,
  cost: number,
  quality: number,
  timedOut = false,
): void {
  try {
    const samples = getSamples(provider);
    samples.push({ success, latencyMs, cost, quality, timedOut });
    if (samples.length > MAX_SAMPLES) samples.shift();
  } catch { /* health tracking must never break a build */ }
}

export function getProviderHealth(provider: ProviderId): ModelHealthRecord {
  const samples = store.get(provider) ?? [];
  const n = samples.length;

  if (n === 0) {
    return {
      providerId: provider, failureRate: 0, averageLatencyMs: 0,
      averageCost: 0, averageQuality: 8, timeouts: 0, availability: 1,
      healthScore: 100, sampleCount: 0,
    };
  }

  const failures  = samples.filter(s => !s.success).length;
  const timeouts  = samples.filter(s => s.timedOut).length;
  const latencySum = samples.reduce((a, s) => a + s.latencyMs, 0);
  const costSum    = samples.reduce((a, s) => a + s.cost, 0);
  const qualitySum = samples.reduce((a, s) => a + s.quality, 0);

  const failureRate    = failures / n;
  const timeoutRate    = timeouts / n;
  const avgLatencyMs   = Math.round(latencySum / n);
  const avgCost        = parseFloat((costSum / n).toFixed(6));
  const avgQuality     = parseFloat((qualitySum / n).toFixed(2));
  const availability   = parseFloat((1 - failureRate).toFixed(3));

  const healthScore = Math.max(0, Math.min(100, Math.round(
    100 - failureRate * 60 - timeoutRate * 30 + (avgQuality - 5) * 2,
  )));

  return {
    providerId:      provider,
    failureRate:     parseFloat(failureRate.toFixed(3)),
    averageLatencyMs: avgLatencyMs,
    averageCost:     avgCost,
    averageQuality:  avgQuality,
    timeouts,
    availability,
    healthScore,
    sampleCount:     n,
  };
}

export function getAllProviderHealth(): ModelHealthRecord[] {
  return ALL_PROVIDER_IDS.map(getProviderHealth);
}

export function isProviderHealthy(provider: ProviderId, minScore = 50): boolean {
  return getProviderHealth(provider).healthScore >= minScore;
}

export function resetModelHealthMonitor(): void {
  store.clear();
}
