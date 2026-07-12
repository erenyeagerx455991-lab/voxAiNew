// ── V9.3 Model Orchestrator — Telemetry / Metrics ────────────────────────────
//
// Aggregates model orchestration outcomes for GET /api/telemetry/quality.
// In-memory, capped, additive-only.
import type { ProviderId } from './types.js';
import { getAllProviderHealth } from './modelHealthMonitor.js';
import { getModelOrchestratorLearningStats } from './modelOrchestratorLearning.js';
import { getModelOrchestratorPersistenceStats } from './modelOrchestratorPersistence.js';
import { getCacheHitRate } from './cacheIntelligence.js';

const MAX_RECORDS = 500;

interface RoutingRecord {
  buildId:          string;
  routingScore:     number;
  cacheHitRate:     number;
  fallbackUsed:     boolean;
  tokenEfficiency:  number;
  budgetUtilization: number;
  averageCost:      number;
  averageLatencyMs: number;
  providerUsed:     ProviderId;
  recordedAt:       number;
}

let records: RoutingRecord[] = [];

export function recordModelOrchestration(
  buildId: string,
  routingScore: number,
  cacheHitRate: number,
  fallbackUsed: boolean,
  tokenEfficiency: number,
  budgetUtilization: number,
  averageCost: number,
  averageLatencyMs: number,
  providerUsed: ProviderId,
): void {
  try {
    records.push({
      buildId, routingScore, cacheHitRate, fallbackUsed,
      tokenEfficiency, budgetUtilization, averageCost, averageLatencyMs,
      providerUsed, recordedAt: Date.now(),
    });
    if (records.length > MAX_RECORDS) records.shift();
  } catch { /* telemetry must never break a build */ }
}

export function getModelOrchestrationSnapshot(): {
  routingScore:        number;
  providerDistribution: Record<string, number>;
  averageLatency:      number;
  averageCost:         number;
  cacheHitRate:        number;
  fallbackRate:        number;
  tokenEfficiency:     number;
  budgetUtilization:   number;
  learningStatistics:  ReturnType<typeof getModelOrchestratorLearningStats>;
  persistenceHealth:   ReturnType<typeof getModelOrchestratorPersistenceStats>;
  providerHealth:      ReturnType<typeof getAllProviderHealth>;
  totalExecutions:     number;
} {
  const n = records.length;
  const providerDistribution: Record<string, number> = {};

  if (n === 0) {
    return {
      routingScore: 0, providerDistribution, averageLatency: 0,
      averageCost: 0, cacheHitRate: getCacheHitRate(), fallbackRate: 0,
      tokenEfficiency: 0, budgetUtilization: 0,
      learningStatistics: getModelOrchestratorLearningStats(),
      persistenceHealth: getModelOrchestratorPersistenceStats(),
      providerHealth: getAllProviderHealth(),
      totalExecutions: 0,
    };
  }

  let scoreSum = 0, latencySum = 0, costSum = 0, cacheSum = 0;
  let fallbackCount = 0, effSum = 0, budgetSum = 0;

  for (const r of records) {
    scoreSum   += r.routingScore;
    latencySum += r.averageLatencyMs;
    costSum    += r.averageCost;
    cacheSum   += r.cacheHitRate;
    effSum     += r.tokenEfficiency;
    budgetSum  += r.budgetUtilization;
    if (r.fallbackUsed) fallbackCount++;
    providerDistribution[r.providerUsed] = (providerDistribution[r.providerUsed] ?? 0) + 1;
  }

  return {
    routingScore:        parseFloat((scoreSum / n).toFixed(2)),
    providerDistribution,
    averageLatency:      Math.round(latencySum / n),
    averageCost:         parseFloat((costSum / n).toFixed(6)),
    cacheHitRate:        parseFloat((cacheSum / n).toFixed(3)),
    fallbackRate:        parseFloat((fallbackCount / n).toFixed(3)),
    tokenEfficiency:     parseFloat((effSum / n).toFixed(3)),
    budgetUtilization:   parseFloat((budgetSum / n).toFixed(3)),
    learningStatistics:  getModelOrchestratorLearningStats(),
    persistenceHealth:   getModelOrchestratorPersistenceStats(),
    providerHealth:      getAllProviderHealth(),
    totalExecutions:     n,
  };
}

export function resetModelOrchestratorMetrics(): void {
  records = [];
}
