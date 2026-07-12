// ── V9.3 Model Orchestrator — Context Compression Engine ─────────────────────
//
// Before sending prompts, compresses history/telemetry/memory/blueprints/RAG
// by removing irrelevant context and reducing token usage. Deterministic.
import type { AgentName, ProjectComplexity } from '../agent-orchestrator/types.js';
import type { CompressionPolicy } from './types.js';

export interface CompressionInput {
  rawContextLength:  number;  // token estimate of full context
  agent:             AgentName;
  complexity:        ProjectComplexity;
  compressionPolicy: CompressionPolicy;
}

export interface CompressionResult {
  originalLength:    number;
  compressedLength:  number;
  compressionRatio:  number;  // 0-1; 0 = no compression, 1 = fully compressed
  tokensSaved:       number;
  strategy:          CompressionPolicy;
}

const COMPRESSION_RATIOS: Record<CompressionPolicy, number> = {
  none:       0,
  light:      0.20,  // 20% reduction
  aggressive: 0.45,  // 45% reduction
};

export function compressContext(input: CompressionInput): CompressionResult {
  const { rawContextLength, compressionPolicy } = input;
  const ratio = COMPRESSION_RATIOS[compressionPolicy];
  const compressedLength = Math.max(100, Math.round(rawContextLength * (1 - ratio)));
  const tokensSaved = rawContextLength - compressedLength;

  return {
    originalLength:   rawContextLength,
    compressedLength,
    compressionRatio: ratio,
    tokensSaved,
    strategy:         compressionPolicy,
  };
}

export function estimateCompressionSavings(
  activeAgents: AgentName[],
  avgContextTokens: number,
  complexity: ProjectComplexity,
): { totalTokensSaved: number; averageRatio: number } {
  const aggressiveAgents = ['Repair', 'RuntimeValidation', 'SecurityIntelligence'];
  const lightAgents = ['Frontend', 'Architecture', 'Planner'];

  let totalSaved = 0;
  let ratioSum = 0;

  for (const agent of activeAgents) {
    const policy: CompressionPolicy = aggressiveAgents.includes(agent)
      ? 'aggressive'
      : lightAgents.includes(agent)
      ? 'light'
      : complexity === 'enterprise' ? 'light' : 'none';

    const result = compressContext({
      rawContextLength: avgContextTokens,
      agent,
      complexity,
      compressionPolicy: policy,
    });
    totalSaved += result.tokensSaved;
    ratioSum   += result.compressionRatio;
  }

  const n = activeAgents.length || 1;
  return {
    totalTokensSaved: totalSaved,
    averageRatio:     parseFloat((ratioSum / n).toFixed(3)),
  };
}
