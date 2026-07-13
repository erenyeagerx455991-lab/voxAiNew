// ── V9.4 Knowledge Engine — Learning ───────────────────────────────────────────
//
// Learns asynchronously from production/telemetry/feedback/repair/DNA/
// runtime/security/QA/deployment events without ever blocking a build.
// Fire-and-forget, in-memory, capped at 500 records — same convention as
// model-orchestrator/modelOrchestratorLearning.ts.
import type { KnowledgeDomain, KnowledgeLearningRecord, KnowledgeLearningStats } from './types.js';

const MAX_RECORDS = 500;
let store: KnowledgeLearningRecord[] = [];

export async function learnFromKnowledgeEvent(record: KnowledgeLearningRecord): Promise<void> {
  try {
    store.push(record);
    if (store.length > MAX_RECORDS) store.shift();
  } catch { /* learning must never stop builds */ }
}

export function getKnowledgeLearningStats(): KnowledgeLearningStats {
  const n = store.length;
  if (n === 0) {
    return { totalRecords: 0, averageScore: 0, productionSuccessRate: 0, byDomain: {} };
  }

  let scoreSum = 0;
  let successCount = 0;
  const byDomainMap = new Map<KnowledgeDomain, { count: number; scoreSum: number }>();

  for (const r of store) {
    scoreSum += r.score;
    if (r.productionSuccess) successCount++;
    const bucket = byDomainMap.get(r.domain) ?? { count: 0, scoreSum: 0 };
    bucket.count++;
    bucket.scoreSum += r.score;
    byDomainMap.set(r.domain, bucket);
  }

  const byDomain: KnowledgeLearningStats['byDomain'] = {};
  for (const [domain, bucket] of byDomainMap) {
    byDomain[domain] = { count: bucket.count, averageScore: parseFloat((bucket.scoreSum / bucket.count).toFixed(2)) };
  }

  return {
    totalRecords:          n,
    averageScore:          parseFloat((scoreSum / n).toFixed(2)),
    productionSuccessRate: parseFloat((successCount / n).toFixed(3)),
    byDomain,
  };
}

export function getKnowledgeLearningRecords(): KnowledgeLearningRecord[] {
  return [...store];
}

export function resetKnowledgeLearning(): void {
  store = [];
}
