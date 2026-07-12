// ── V9.3 Model Orchestrator — Learning ───────────────────────────────────────
//
// Learns best model/provider/token-allocation/cache strategy per agent.
// Fire-and-forget, in-memory, capped at 500 records, async, never throws.
import type { ModelOrchestratorLearningRecord, ModelOrchestratorLearningStats, ProjectComplexity } from './types.js';
import type { ProviderId } from './types.js';

const MAX_RECORDS = 500;
let store: ModelOrchestratorLearningRecord[] = [];

export async function learnFromModelOrchestration(record: ModelOrchestratorLearningRecord): Promise<void> {
  try {
    store.push(record);
    if (store.length > MAX_RECORDS) store.shift();
  } catch { /* learning never stops builds */ }
}

export function getModelOrchestratorLearningStats(): ModelOrchestratorLearningStats {
  const n = store.length;
  if (n === 0) {
    return {
      totalRecords: 0, averageRoutingScore: 0, bestProvider: null,
      averageCostSavings: 0, averageLatencySavings: 0, byComplexity: {},
    };
  }

  let scoreSum = 0;
  let costSum = 0;
  let latencySum = 0;
  const providerCount = new Map<ProviderId, number>();
  const byComplexityMap = new Map<ProjectComplexity, { count: number; scoreSum: number; costSum: number }>();

  for (const r of store) {
    scoreSum  += r.routingScore;
    costSum   += r.costSavings;
    latencySum += r.latencySavings;

    const pc = (providerCount.get(r.bestProvider) ?? 0) + 1;
    providerCount.set(r.bestProvider, pc);

    const bucket = byComplexityMap.get(r.complexity) ?? { count: 0, scoreSum: 0, costSum: 0 };
    bucket.count++;
    bucket.scoreSum += r.routingScore;
    bucket.costSum  += r.costSavings;
    byComplexityMap.set(r.complexity, bucket);
  }

  // Best provider = most frequently selected
  let bestProvider: ProviderId | null = null;
  let maxCount = 0;
  for (const [p, c] of providerCount) {
    if (c > maxCount) { maxCount = c; bestProvider = p; }
  }

  const byComplexity: ModelOrchestratorLearningStats['byComplexity'] = {};
  for (const [complexity, bucket] of byComplexityMap) {
    byComplexity[complexity] = {
      count: bucket.count,
      averageScore: parseFloat((bucket.scoreSum / bucket.count).toFixed(2)),
      averageCostSavings: parseFloat((bucket.costSum / bucket.count).toFixed(6)),
    };
  }

  return {
    totalRecords:          n,
    averageRoutingScore:   parseFloat((scoreSum / n).toFixed(2)),
    bestProvider,
    averageCostSavings:    parseFloat((costSum / n).toFixed(6)),
    averageLatencySavings: parseFloat((latencySum / n).toFixed(2)),
    byComplexity,
  };
}

export function getModelOrchestratorLearningRecords(): ModelOrchestratorLearningRecord[] {
  return [...store];
}

export function resetModelOrchestratorLearning(): void {
  store = [];
}
