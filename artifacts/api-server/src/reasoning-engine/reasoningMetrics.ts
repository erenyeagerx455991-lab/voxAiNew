// ── V9.5 Telemetry ─────────────────────────────────────────────────────────────
import type { ReasoningEngineTelemetrySnapshot } from './types.js';
import { getReasoningLearningStats } from './reasoningLearning.js';
import { getReasoningPersistenceStats } from './reasoningPersistence.js';

const MAX_EXECUTIONS = 500;

interface ExecutionRecord {
  buildId:            string;
  confidenceScore:    number; // 0-10
  decisionQuality:    number; // 0-10 (composite decision-matrix score)
  tradeoffAccuracy:   number; // 0-10 (dominant vs weakest spread proxy)
  riskScore:          number; // 0-10 (higher = riskier)
  alternativesCount:  number;
  decisionLatencyMs:  number;
  recordedAt:         number;
}

let executions: ExecutionRecord[] = [];
let baselineDecisionCount = 0;

export function recordReasoningExecution(record: ExecutionRecord): void {
  executions.push(record);
  if (executions.length > MAX_EXECUTIONS) executions = executions.slice(executions.length - MAX_EXECUTIONS);
}

export function markReasoningGrowthBaseline(): void {
  baselineDecisionCount = executions.length;
}

export function getReasoningEngineMetrics(): ReasoningEngineTelemetrySnapshot {
  const learningStatistics = getReasoningLearningStats();
  const persistenceHealth = getReasoningPersistenceStats();

  if (executions.length === 0) {
    return {
      reasoningScore: 0,
      decisionQuality: 0,
      confidenceScore: 0,
      tradeoffAccuracy: 0,
      decisionConsistency: 0,
      riskAccuracy: 0,
      alternativeCoverage: 0,
      decisionLatency: 0,
      learningStatistics,
      decisionGrowth: 0,
      persistenceHealth,
    };
  }

  const n = executions.length;
  const avg = (fn: (e: ExecutionRecord) => number) => executions.reduce((s, e) => s + fn(e), 0) / n;

  const confidenceScore = avg(e => e.confidenceScore);
  const decisionQuality = avg(e => e.decisionQuality);
  const tradeoffAccuracy = avg(e => e.tradeoffAccuracy);
  const riskAvg = avg(e => e.riskScore);
  const riskAccuracy = Math.max(0, 10 - riskAvg);
  const alternativeCoverage = Math.min(10, avg(e => e.alternativesCount) * 3.3);
  const decisionLatency = avg(e => e.decisionLatencyMs);

  // Decision consistency: inverse of variance in decisionQuality across executions.
  const variance = executions.reduce((s, e) => s + Math.pow(e.decisionQuality - decisionQuality, 2), 0) / n;
  const decisionConsistency = Math.max(0, 10 - Math.sqrt(variance));

  const reasoningScore = Number((decisionQuality * 0.4 + confidenceScore * 0.3 + decisionConsistency * 0.3).toFixed(2));
  const decisionGrowth = executions.length - baselineDecisionCount;

  return {
    reasoningScore,
    decisionQuality: Number(decisionQuality.toFixed(2)),
    confidenceScore: Number(confidenceScore.toFixed(2)),
    tradeoffAccuracy: Number(tradeoffAccuracy.toFixed(2)),
    decisionConsistency: Number(decisionConsistency.toFixed(2)),
    riskAccuracy: Number(riskAccuracy.toFixed(2)),
    alternativeCoverage: Number(alternativeCoverage.toFixed(2)),
    decisionLatency: Number(decisionLatency.toFixed(0)),
    learningStatistics,
    decisionGrowth,
    persistenceHealth,
  };
}

export function resetReasoningEngineMetrics(): void {
  executions = [];
  baselineDecisionCount = 0;
}
