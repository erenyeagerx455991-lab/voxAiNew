// ── V9.0 Runtime Intelligence — Streaming Strategy Planner ───────────────────
import type { GenerationMode, StreamingStrategy, RuntimeIntelligenceInput } from './runtimeTypes.js';

export function planStreamingStrategy(mode: GenerationMode, _input: RuntimeIntelligenceInput): StreamingStrategy {
  // SSE is always enabled — we never disable it as it would break the frontend
  const enableSSE = true;

  // Batch size: larger batches for quality modes reduce SSE overhead
  const batchSize = mode === 'Fast' ? 1
    : mode === 'Experimental' ? 1
    : mode === 'Enterprise' || mode === 'Quality' ? 4
    : 2;

  // Flush interval: faster for interactive modes
  const flushIntervalMs = mode === 'Fast' || mode === 'Experimental' ? 50
    : mode === 'Quality' || mode === 'Enterprise' ? 200
    : 100;

  return {
    enableSSE,
    batchSize,
    flushIntervalMs,
    rationale: `${mode} streaming: SSE enabled, batch=${batchSize}, flush=${flushIntervalMs}ms`,
  };
}
