// ── V10.1 — Meta Analyzer ──────────────────────────────────────────────────────
// Analyzes every engine, pipeline stage, and historical telemetry.
// Produces MetaAnalysisBlueprint. Zero LLM calls.
import type { MetaContext, MetaAnalysisBlueprint } from './metaTypes.js';

const KNOWN_ENGINES = [
  'ProductManager', 'FrontendArchitect', 'BackendArchitect', 'DevOpsArchitect',
  'QAArchitect', 'RuntimeIntelligence', 'Orchestrator', 'ModelOrchestrator',
  'KnowledgeEngine', 'ReasoningEngine', 'ExecutionIntelligence',
  'PlanningIntelligence', 'AdaptiveIntelligence', 'SelfOptimizationEngine',
  'MetaIntelligence', 'Planner', 'Frontend', 'Repair', 'DesignEvaluator',
  'DesignCritic', 'Conversion', 'Accessibility', 'Backend', 'RuntimeValidation',
];

export function analyzeSystem(ctx: MetaContext): MetaAnalysisBlueprint {
  const latencies    = ctx.agentLatencies    ?? {};
  const failureRates = ctx.agentFailureRates ?? {};

  // Weak modules: engines with score < 6
  const scoreMap: Record<string, number> = {
    ReasoningEngine:        ctx.reasoningScore,
    PlanningIntelligence:   ctx.planningScore,
    ExecutionIntelligence:  ctx.executionScore,
    AdaptiveIntelligence:   ctx.adaptiveScore,
    SelfOptimizationEngine: ctx.optimizationScore,
    KnowledgeEngine:        ctx.knowledgeScore ?? 7,
    RuntimeIntelligence:    ctx.runtimeScore   ?? 7,
  };
  const weakModules = Object.entries(scoreMap)
    .filter(([, s]) => s < 6)
    .map(([n]) => n);

  // Slow modules: latency > 15 000 ms
  const slowModules = Object.entries(latencies)
    .filter(([, ms]) => ms > 15_000)
    .map(([n]) => n);

  // Expensive modules: high failure rate → reruns cost tokens
  const expensiveModules = Object.entries(failureRates)
    .filter(([, r]) => r > 0.15)
    .map(([n]) => n);

  // Unstable modules: failure rate > 0.1
  const unstableModules = Object.entries(failureRates)
    .filter(([, r]) => r > 0.1)
    .map(([n]) => n);

  // Unused intelligence: low quality + high optimization → planner may not be consuming output
  const unusedIntelligence: string[] = [];
  if ((ctx.qualityScore ?? 8) < 6 && ctx.optimizationScore > 7) {
    unusedIntelligence.push('SelfOptimizationEngine recommendations under-utilized');
  }
  if ((ctx.workflowScore ?? 8) < 6 && ctx.adaptiveScore > 7) {
    unusedIntelligence.push('AdaptiveIntelligence workflow recommendations under-utilized');
  }

  // Duplicate work: multiple low-latency LLM engines could be merged
  const duplicateWork: string[] = [];
  if (ctx.complexity === 'simple' && (ctx.repairAttempts ?? 0) > 2) {
    duplicateWork.push('Excessive repair passes for simple build — consider raising repair threshold');
  }

  // Bottlenecks: slowest agent
  const bottlenecks: string[] = [];
  const allMs = Object.values(latencies);
  if (allMs.length > 0) {
    const maxMs = Math.max(...allMs);
    if (maxMs > 20_000) {
      const bottleneckAgent = Object.entries(latencies).find(([, ms]) => ms === maxMs)?.[0] ?? 'unknown';
      bottlenecks.push(`${bottleneckAgent} (${Math.round(maxMs / 1000)}s)`);
    }
  }
  if ((ctx.parallelEfficiency ?? 0.7) < 0.5) bottlenecks.push('low-parallel-efficiency');
  if ((ctx.cacheHitRate ?? 0.5) < 0.3)        bottlenecks.push('low-cache-hit-rate');

  // Success / failure patterns
  const successPatterns: string[] = [];
  const failurePatterns: string[] = [];

  if ((ctx.historicalSuccessRate ?? 0.9) >= 0.9) successPatterns.push('high-historical-success-rate');
  if ((ctx.cacheHitRate ?? 0.5) >= 0.6)          successPatterns.push('effective-cache-utilization');
  if ((ctx.parallelEfficiency ?? 0.7) >= 0.75)   successPatterns.push('good-parallel-execution');
  if ((ctx.repairAttempts ?? 0) === 0)            successPatterns.push('zero-repair-needed');

  if ((ctx.retryCount ?? 0) > 2)                 failurePatterns.push('high-retry-frequency');
  if ((ctx.repairAttempts ?? 0) > 3)             failurePatterns.push('high-repair-frequency');
  if ((ctx.historicalSuccessRate ?? 0.9) < 0.7)  failurePatterns.push('low-historical-success-rate');
  if ((ctx.memoryUsage ?? 0) > 1_500)            failurePatterns.push('high-memory-usage');

  // Analysis score: composite based on weak/slow/expensive counts and patterns
  const issueCount = weakModules.length + slowModules.length + expensiveModules.length + bottlenecks.length;
  const successBonus = successPatterns.length * 0.5;
  const rawScore = Math.max(0, 10 - issueCount * 1.5 + successBonus);
  const analysisScore = Math.min(10, Math.round(rawScore * 10) / 10);

  const recommendations: string[] = [];
  if (weakModules.length > 0)      recommendations.push(`Investigate weak modules: ${weakModules.join(', ')}`);
  if (slowModules.length > 0)      recommendations.push(`Optimize slow modules: ${slowModules.join(', ')}`);
  if (bottlenecks.length > 0)      recommendations.push(`Address pipeline bottlenecks: ${bottlenecks.join(', ')}`);
  if (unusedIntelligence.length > 0) recommendations.push(unusedIntelligence[0]!);
  if (successPatterns.length > 0)  recommendations.push(`Reinforce success patterns: ${successPatterns[0]}`);

  return {
    engineCount:        KNOWN_ENGINES.length,
    analyzedEngines:    Object.keys(scoreMap),
    weakModules,
    slowModules,
    expensiveModules,
    unstableModules,
    unusedIntelligence,
    duplicateWork,
    bottlenecks,
    successPatterns,
    failurePatterns,
    analysisScore,
    recommendations,
  };
}
