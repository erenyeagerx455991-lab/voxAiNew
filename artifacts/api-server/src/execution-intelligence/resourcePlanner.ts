// ── V9.6 Resource Planner ─────────────────────────────────────────────────────
import type { ExecutionIntelligenceContext, ResourceEstimate } from './executionTypes.js';

export function estimateResources(
  tasks: { id: string; estimatedCostTokens: number; estimatedTimeMs: number }[],
  ctx: ExecutionIntelligenceContext,
): ResourceEstimate {
  const totalTokens = tasks.reduce((s, t) => s + t.estimatedCostTokens, 0);
  const llmTasks = tasks.filter(t => t.estimatedCostTokens > 0);
  const apiCalls = llmTasks.length * 3;  // avg 3 API calls per LLM task (retry headroom)

  const cpuIntensive = ctx.complexity === 'enterprise';
  const cpu = cpuIntensive ? 'high' : ctx.complexity === 'standard' ? 'medium' : 'low';

  const memoryMb = ctx.complexity === 'enterprise' ? 512
    : ctx.complexity === 'standard' ? 256 : 128;

  const diskMb = 50;
  const networkKb = Math.round(totalTokens * 0.004);  // ~4 bytes per token over network
  const cacheHits = Math.min(tasks.length, Math.floor(tasks.length * 0.3));
  const tempStorageMb = 200;  // Vite build artifacts

  return { cpu, memoryMb, llmCalls: llmTasks.length, apiCalls, diskMb, networkKb, cacheHits, tempStorageMb };
}
