// ── V9.7 Planning Intelligence — Phase 18: Façade ─────────────────────────────
// Single public API entry point for the entire planning-intelligence module.
import type { PlanningIntelligenceContext, PlanningBlueprint, PlanningLearningRecord } from './planningTypes.js';
import { buildPlanningBlueprint, buildFallbackPlanningBlueprint } from './planningIntelligence.js';
import { savePlanningSnapshot, getCurrentPlanningSnapshot, getPlanningPersistenceStats, resetPlanningPersistence } from './planningPersistence.js';
import { learnFromPlanning, getPlanningLearningStats, resetPlanningLearning } from './planningLearning.js';
import { recordPlanningMetric, getPlanningMetricsSnapshot, resetPlanningMetrics } from './planningMetrics.js';

export interface PlanningFacadeResult {
  blueprint:     PlanningBlueprint;
  contextString: string;
}

export function runPlanningIntelligence(ctx: PlanningIntelligenceContext): PlanningFacadeResult {
  const startedAt = Date.now();
  let blueprint: PlanningBlueprint;

  try {
    blueprint = buildPlanningBlueprint(ctx);
  } catch {
    blueprint = buildFallbackPlanningBlueprint(ctx.buildId);
  }

  // Persist (version assigned inside)
  const snap = savePlanningSnapshot(ctx.buildId, blueprint);
  blueprint = snap.blueprint;

  // Record rolling metric
  const planningTimeMs = Date.now() - startedAt;
  recordPlanningMetric({
    planningScore:  blueprint.planningScore,
    roadmapScore:   blueprint.validation.roadmapScore,
    dependencyScore: blueprint.validation.dependenciesScore,
    estimationScore: blueprint.validation.estimationScore,
    riskScore:      blueprint.risks.riskScore,
    validationScore: blueprint.validation.overallScore,
    planningTimeMs,
    complexity:     ctx.complexity,
    featureCount:   blueprint.features.coreFeatures.length,
    recordedAt:     Date.now(),
  });

  return { blueprint, contextString: blueprint.contextString };
}

export function persistPlanningSnapshot(buildId: string, blueprint: PlanningBlueprint) {
  return savePlanningSnapshot(buildId, blueprint);
}

export function learnFromPlanningResult(
  buildId: string,
  blueprint: PlanningBlueprint,
  buildSucceeded: boolean,
  planningTimeMs: number,
): void {
  const record: PlanningLearningRecord = {
    buildId,
    planningScore:     blueprint.planningScore,
    complexity:        blueprint.estimation.developmentDays > 20 ? 'enterprise' : 'standard',
    featureCount:      blueprint.features.coreFeatures.length,
    riskLevel:         blueprint.risks.overallRiskLevel,
    planningTimeMs,
    buildSucceeded,
    roadmapAccuracy:   blueprint.validation.roadmapScore / 10,
    dependencyAccuracy: blueprint.validation.dependenciesScore / 10,
    recordedAt:        Date.now(),
  };
  // Fire-and-forget — never blocks pipeline
  learnFromPlanning(record).catch(() => { /* never throws into pipeline */ });
}

export { getPlanningMetricsSnapshot as getPlanningMetrics };
export { getPlanningLearningStats as getPlanningStats };
export { getCurrentPlanningSnapshot, getPlanningPersistenceStats };

export { getPlanningSnapshot as rollbackPlanning } from './planningPersistence.js';

export function resetPlanning(): void {
  resetPlanningPersistence();
  resetPlanningLearning();
  resetPlanningMetrics();
}
