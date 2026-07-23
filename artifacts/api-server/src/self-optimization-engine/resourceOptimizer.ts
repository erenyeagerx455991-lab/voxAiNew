// ── V10.0 — Resource Optimizer ─────────────────────────────────────────────────
import type { SelfOptimizationContext, ResourceBlueprint } from './optimizationTypes.js';

export function optimizeResources(ctx: SelfOptimizationContext): ResourceBlueprint {
  const efficiency = ctx.tokenEfficiency ?? 0.75;
  const memory = ctx.memoryUsage ?? 512;

  // CPU allocation %
  const cpuAllocation = ctx.complexity === 'enterprise' ? 95
    : ctx.complexity === 'simple' ? 50
    : 75;

  // Memory MB
  const memoryAllocationMB = ctx.complexity === 'enterprise' ? 2048
    : ctx.complexity === 'simple' ? 256
    : 768;

  // Disk budget MB
  const diskBudgetMB = ctx.complexity === 'enterprise' ? 512 : 128;

  // Network budget (relative, 1-10)
  const networkBudget = ctx.complexity === 'enterprise' ? 10 : ctx.complexity === 'simple' ? 4 : 6;

  // LLM concurrency
  const llmConcurrency = ctx.complexity === 'enterprise' ? 4 : ctx.complexity === 'simple' ? 1 : 2;

  // API concurrency
  const apiConcurrency = ctx.complexity === 'enterprise' ? 8 : ctx.complexity === 'simple' ? 2 : 4;

  // Cache allocation MB
  const cacheAllocationMB = ctx.complexity === 'enterprise' ? 256 : ctx.complexity === 'simple' ? 32 : 128;

  // Score based on utilization vs available
  const memoryPressure = memory / memoryAllocationMB;
  const resourceScore = memoryPressure <= 0.6 && efficiency >= 0.7 ? 9
    : memoryPressure <= 0.8 ? 7.5
    : memoryPressure <= 1.0 ? 6
    : 4;

  const recommendations: string[] = [];
  if (memoryPressure > 0.8) recommendations.push(`Memory usage ${Math.round(memoryPressure * 100)}% of budget — optimize agent memory`);
  if (efficiency < 0.6) recommendations.push('Reduce LLM concurrency to lower resource pressure');

  return {
    cpuAllocation, memoryAllocationMB, diskBudgetMB, networkBudget,
    llmConcurrency, apiConcurrency, cacheAllocationMB, resourceScore, recommendations,
  };
}
