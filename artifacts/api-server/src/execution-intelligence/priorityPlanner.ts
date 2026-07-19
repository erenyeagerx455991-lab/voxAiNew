// ── V9.6 Priority Planner ─────────────────────────────────────────────────────
import type { ExecutionIntelligenceContext, TaskPriority } from './executionTypes.js';

interface TaskDef {
  id: string;
  dependsOn: string[];
  baseCostTokens: number;
  baseDurationMs: number;
  retryable: boolean;
  rollbackRequired: boolean;
}

// Business-value heuristics per task
const BUSINESS_VALUE_MAP: Record<string, number> = {
  planning:       9,
  architecture:   8,
  frontend:       10,
  'component-tree': 7,
  candidates:     8,
  repair:         7,
  evaluator:      7,
  critic:         6,
  'ux-intel':     6,
  conversion:     6,
  accessibility:  7,
  optimization:   5,
  director:       5,
  scaffold:       8,
  'runtime-val':  9,
};

const USER_IMPACT_MAP: Record<string, number> = {
  planning:       7,
  architecture:   6,
  frontend:       10,
  'component-tree': 6,
  candidates:     9,
  repair:         8,
  evaluator:      7,
  critic:         6,
  'ux-intel':     8,
  conversion:     7,
  accessibility:  9,
  optimization:   6,
  director:       5,
  scaffold:       6,
  'runtime-val':  8,
};

export function computePriorityScore(
  def: TaskDef,
  ctx: ExecutionIntelligenceContext,
): number {
  const businessValue = (BUSINESS_VALUE_MAP[def.id] ?? 6) / 10;
  const userImpact = (USER_IMPACT_MAP[def.id] ?? 6) / 10;
  const dependencyDepth = Math.min(1, def.dependsOn.length / 5);
  const risk = def.rollbackRequired ? 0.8 : 0.4;
  const executionCost = Math.min(1, def.baseCostTokens / 6000);
  const estimatedDuration = Math.min(1, def.baseDurationMs / 30000);
  const criticality = def.retryable ? 0.7 : 0.5;

  // Weighted composite — 7 dimensions
  const score =
    businessValue  * 0.20 +
    userImpact     * 0.20 +
    dependencyDepth * 0.10 +
    risk           * 0.15 +
    executionCost  * 0.10 +
    estimatedDuration * 0.10 +
    criticality    * 0.15;

  // Enterprise builds boost all priorities
  const boost = ctx.complexity === 'enterprise' ? 1.1 : ctx.complexity === 'simple' ? 0.9 : 1.0;
  return Math.min(10, Number((score * 10 * boost).toFixed(2)));
}

export function toPriorityLabel(score: number): TaskPriority {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}
