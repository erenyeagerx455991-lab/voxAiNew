// ── V9.4 Knowledge Engine — Telemetry / Metrics ───────────────────────────────
//
// Aggregates knowledge engine outcomes for GET /api/telemetry/quality.
// In-memory, capped, additive-only. Exposes exactly the 11 fields required
// by the V9.4 spec (knowledgeScore, retrievalAccuracy, semanticCoverage,
// knowledgeGrowth, relationshipDensity, knowledgeUsage,
// recommendationAccuracy, confidenceScore, learningStatistics,
// persistenceHealth, cacheEfficiency).
import { ALL_KNOWLEDGE_DOMAINS, type KnowledgeEngineTelemetrySnapshot } from './types.js';
import { getAllKnowledgeRecords, getKnowledgeStats } from './knowledgeCollector.js';
import { getSemanticCoverage } from './semanticRetrieval.js';
import { getGraphStats } from './knowledgeGraph.js';
import { getKnowledgeLearningStats } from './knowledgeLearning.js';
import { getKnowledgePersistenceStats } from './knowledgePersistence.js';
import { getRecommendationAccuracy } from './recommendationEngine.js';
import { rankKnowledge } from './knowledgeRanking.js';

const MAX_EXECUTION_RECORDS = 500;

interface ExecutionRecord {
  buildId:        string;
  retrievalHits:  number;
  retrievalTotal: number;
  cacheHit:       boolean;
  recordedAt:     number;
}

let executions: ExecutionRecord[] = [];
let growthBaseline = 0;

export function recordKnowledgeEngineExecution(
  buildId: string,
  retrievalHits: number,
  retrievalTotal: number,
  cacheHit: boolean,
): void {
  try {
    executions.push({ buildId, retrievalHits, retrievalTotal, cacheHit, recordedAt: Date.now() });
    if (executions.length > MAX_EXECUTION_RECORDS) executions.shift();
  } catch { /* telemetry must never break a build */ }
}

/** Call once at process start (or on demand) to establish a growth baseline. */
export function markKnowledgeGrowthBaseline(): void {
  growthBaseline = getKnowledgeStats().totalRecords;
}

export function getKnowledgeEngineMetrics(): KnowledgeEngineTelemetrySnapshot {
  const records = getAllKnowledgeRecords();
  const ranked = rankKnowledge(records);
  const knowledgeScore = ranked.length > 0
    ? parseFloat((ranked.reduce((sum, r) => sum + r.compositeScore, 0) / ranked.length).toFixed(2))
    : 0;

  const n = executions.length;
  const retrievalAccuracy = n > 0
    ? parseFloat(
        (executions.reduce((sum, e) => sum + (e.retrievalTotal > 0 ? e.retrievalHits / e.retrievalTotal : 0), 0) / n).toFixed(3),
      )
    : 0;

  const cacheEfficiency = n > 0
    ? parseFloat((executions.filter(e => e.cacheHit).length / n).toFixed(3))
    : 0;

  const confidenceScore = records.length > 0
    ? parseFloat((records.reduce((sum, r) => sum + r.confidence, 0) / records.length).toFixed(3))
    : 0;

  const knowledgeGrowth = Math.max(0, getKnowledgeStats().totalRecords - growthBaseline);

  return {
    knowledgeScore,
    retrievalAccuracy,
    semanticCoverage:       getSemanticCoverage(ALL_KNOWLEDGE_DOMAINS.length, records),
    knowledgeGrowth,
    relationshipDensity:    getGraphStats().density,
    knowledgeUsage:         records.reduce((sum, r) => sum + r.popularity, 0),
    recommendationAccuracy: getRecommendationAccuracy(),
    confidenceScore,
    learningStatistics:     getKnowledgeLearningStats(),
    persistenceHealth:      getKnowledgePersistenceStats(),
    cacheEfficiency,
  };
}

export function resetKnowledgeEngineMetrics(): void {
  executions = [];
  growthBaseline = 0;
}
