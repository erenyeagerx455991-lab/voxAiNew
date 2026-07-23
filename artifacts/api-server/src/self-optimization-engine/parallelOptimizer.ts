// ── V10.0 — Parallel Optimizer ─────────────────────────────────────────────────
import type { SelfOptimizationContext, ParallelBlueprint } from './optimizationTypes.js';

export function optimizeParallel(ctx: SelfOptimizationContext): ParallelBlueprint {
  // Wave-based parallelism groups
  const parallelGroups: string[][] = [
    ['RuntimeIntelligence'],
    ['KnowledgeEngine', 'ReasoningEngine'],
    ['ExecutionIntelligence', 'PlanningIntelligence', 'AdaptiveIntelligence'],
    ['Backend', 'Auth', 'Database'],
    ['DesignEvaluator', 'ConversionIntelligence', 'Accessibility'],
  ];

  const blockingChains = ['Planner→Architecture→Frontend', 'Architecture→Backend'];

  const efficiency = ctx.parallelEfficiency ?? 0.7;
  const idleWorkerCount = Math.max(0, Math.round((1 - efficiency) * 4));

  let maxDegree: number;
  if (ctx.complexity === 'enterprise') maxDegree = 6;
  else if (ctx.complexity === 'simple') maxDegree = 3;
  else maxDegree = 4;

  const parallelScore = efficiency >= 0.8 ? 9
    : efficiency >= 0.65 ? 7.5
    : efficiency >= 0.5  ? 6
    : 4;

  const recommendations: string[] = [];
  if (efficiency < 0.6) recommendations.push('Increase parallel agent execution — current efficiency below 60%');
  if (idleWorkerCount > 2) recommendations.push(`${idleWorkerCount} idle worker slots detected — schedule more parallel tasks`);
  if (ctx.complexity === 'enterprise') recommendations.push('Use maximum parallelism (degree=6) for enterprise builds');

  return { parallelGroups, blockingChains, idleWorkerCount, parallelScore, maxDegree, recommendations };
}
