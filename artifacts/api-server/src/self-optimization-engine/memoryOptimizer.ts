// ── V10.0 — Memory Optimizer ───────────────────────────────────────────────────
import type { SelfOptimizationContext, MemoryBlueprint } from './optimizationTypes.js';

export function optimizeMemory(ctx: SelfOptimizationContext): MemoryBlueprint {
  const usage = ctx.memoryUsage ?? 512;

  let memoryMode: MemoryBlueprint['memoryMode'];
  if (ctx.complexity === 'enterprise') memoryMode = 'generous';
  else if (ctx.complexity === 'simple' || usage < 256) memoryMode = 'minimal';
  else memoryMode = 'standard';

  const estimatedPeakMB = Math.round(usage * (ctx.complexity === 'enterprise' ? 1.8 : ctx.complexity === 'simple' ? 1.2 : 1.5));

  let garbageCollectionHint: MemoryBlueprint['garbageCollectionHint'];
  if (memoryMode === 'minimal') garbageCollectionHint = 'aggressive';
  else if (memoryMode === 'generous') garbageCollectionHint = 'lazy';
  else garbageCollectionHint = 'standard';

  const memoryScore = memoryMode === 'minimal' ? 9
    : memoryMode === 'standard' ? 8
    : 7;

  const recommendations: string[] = [];
  if (estimatedPeakMB > 1500) recommendations.push('Peak memory estimate high — enable aggressive GC');
  if (memoryMode === 'minimal') recommendations.push('Minimal memory mode: use streaming where possible');

  return { memoryMode, estimatedPeakMB, garbageCollectionHint, memoryScore, recommendations };
}
