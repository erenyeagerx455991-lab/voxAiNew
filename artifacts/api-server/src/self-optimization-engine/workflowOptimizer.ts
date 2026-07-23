// ── V10.0 — Workflow Optimizer ─────────────────────────────────────────────────
import type { SelfOptimizationContext, WorkflowBlueprint } from './optimizationTypes.js';

const FULL_ORDER = [
  'RuntimeIntelligence', 'Orchestrator', 'ModelOrchestrator', 'KnowledgeEngine',
  'ReasoningEngine', 'ExecutionIntelligence', 'PlanningIntelligence', 'AdaptiveIntelligence',
  'SelfOptimizationEngine', 'Planner', 'Architecture', 'ComponentTree', 'Frontend',
  'CandidateSelection', 'Repair', 'DesignEvaluator', 'DesignCritic',
  'ConversionIntelligence', 'Accessibility', 'Optimization', 'DesignDirector',
  'Backend', 'RuntimeValidation',
];

const OPTIONAL_STEPS: Record<string, string> = {
  DesignDirector: 'simple',
  Accessibility: 'simple',
  Optimization: 'simple',
  ConversionIntelligence: 'simple',
};

export function optimizeWorkflow(ctx: SelfOptimizationContext): WorkflowBlueprint {
  const skippableSteps: string[] = [];
  if (ctx.complexity === 'simple') {
    for (const [step] of Object.entries(OPTIONAL_STEPS)) skippableSteps.push(step);
  }

  const recommendedOrder = FULL_ORDER.filter(s => !skippableSteps.includes(s));

  const mergeableSteps: string[][] = [];
  if (ctx.complexity !== 'enterprise') {
    mergeableSteps.push(['DesignEvaluator', 'DesignCritic']);
  }

  const score = 10 - skippableSteps.length * 0.3 - mergeableSteps.length * 0.2;
  const workflowScore = Math.max(6, Math.min(10, Math.round(score * 10) / 10));

  const recommendations: string[] = [];
  if (skippableSteps.length > 0) recommendations.push(`Skip optional steps for simple builds: ${skippableSteps.join(', ')}`);
  if (mergeableSteps.length > 0) recommendations.push('Merge DesignEvaluator + DesignCritic into single pass for non-enterprise');

  return { recommendedOrder, skippableSteps, mergeableSteps, workflowScore, recommendations };
}
