// ── V10.0 — Scheduler Optimizer ───────────────────────────────────────────────
import type { SelfOptimizationContext, SchedulerBlueprint } from './optimizationTypes.js';

export function optimizeScheduler(ctx: SelfOptimizationContext): SchedulerBlueprint {
  let priority: SchedulerBlueprint['priority'];
  if (ctx.complexity === 'enterprise') priority = 'high';
  else if (ctx.complexity === 'simple' && (ctx.tokenEfficiency ?? 0.75) > 0.8) priority = 'low';
  else priority = 'normal';

  let schedulingMode: SchedulerBlueprint['schedulingMode'];
  if (ctx.complexity === 'simple') schedulingMode = 'lazy';
  else if (ctx.complexity === 'enterprise') schedulingMode = 'eager';
  else schedulingMode = 'batch';

  let queueStrategy: SchedulerBlueprint['queueStrategy'];
  if (priority === 'high') queueStrategy = 'priority';
  else if (schedulingMode === 'batch') queueStrategy = 'fifo';
  else queueStrategy = 'round-robin';

  // Score: enterprise=high gets full score, lazy=simple also good
  const schedulerScore = priority === 'high' ? 9
    : schedulingMode === 'batch' ? 8
    : 7;

  const recommendations: string[] = [];
  if (priority === 'high') recommendations.push('Enterprise build: use priority scheduling');
  if (schedulingMode === 'batch') recommendations.push('Batch mode: group LLM calls for throughput');

  return { priority, schedulingMode, queueStrategy, schedulerScore, recommendations };
}
