// ── V9.3 Intelligent Multi-Model & Resource Orchestration — Types ───────────
//
// Extends the V9.2 Adaptive Multi-Agent Orchestrator (which decides WHICH
// agents run) with a resource-aware layer that decides HOW each active agent
// consumes models, tokens, context, and compute. Does not duplicate Runtime
// Intelligence (generation strategy) or the Orchestrator (agent scheduling).
import type { AgentName, ProjectComplexity } from '../agent-orchestrator/types.js';

export type ModelProvider =
  | 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'groq' | 'deepseek' | 'local';

export type CachePolicy = 'none' | 'read-through' | 'read-write' | 'aggressive';
export type StreamingPolicy = 'off' | 'on' | 'auto';
export type CompressionPolicy = 'none' | 'light' | 'standard' | 'aggressive';
export type ReasoningDepth = 'shallow' | 'standard' | 'deep' | 'maximum';

export interface ProviderCapability {
  provider:          ModelProvider;
  model:             string;
  latencyMsP50:      number;
  qualityScore:      number;   // 0-10
  costPerMTokenUsd:  number;   // $ per 1M tokens (blended input+output estimate)
  contextLength:     number;
  streaming:         boolean;
  reasoning:         boolean;
  baseHealthScore:   number;   // 0-100 static prior, blended with live health
  baseAvailability:  number;   // 0-1 static prior
}

export interface ModelExecutionBlueprint {
  agent:              AgentName;
  modelSelection:     ProviderCapability;
  fallbackChain:      ProviderCapability[];
  tokenBudget:        number;   // absolute token allocation for this agent
  tokenBudgetPercent: number;   // % of the build's total token budget
  promptBudget:       number;   // tokens reserved for prompt/context
  contextBudget:      number;   // tokens reserved for injected context (RAG/history/etc.)
  latencyTargetMs:    number;
  qualityTarget:      number;   // 0-10
  costTargetUsd:      number;
  retryModel:         ProviderCapability;
  cachePolicy:        CachePolicy;
  streamingPolicy:    StreamingPolicy;
  compressionPolicy:  CompressionPolicy;
  reasoningDepth:     ReasoningDepth;
  expectedCostUsd:    number;
  expectedLatencyMs:  number;
  expectedQuality:    number;
}

export interface ModelOrchestrationBlueprint {
  buildId:           string;
  complexity:        ProjectComplexity;
  totalTokenBudget:  number;
  agents:            Record<AgentName, ModelExecutionBlueprint>;
  providerDistribution: Record<ModelProvider, number>;
  expectedTotalCostUsd: number;
  expectedTotalLatencyMs: number;
  expectedOverallQuality: number;
  recordedAt:        number;
}

export type CacheKind = 'prompt' | 'blueprint' | 'retrieval' | 'component' | 'evaluation' | 'repair';

export interface CacheStats {
  kind:      CacheKind;
  size:      number;
  hits:      number;
  misses:    number;
  hitRate:   number;
}

export interface ProviderHealthSnapshot {
  provider:          ModelProvider;
  failureRate:       number;
  averageLatencyMs:  number;
  averageCostUsd:    number;
  averageQuality:    number;
  timeoutRate:       number;
  availability:      number;
  healthScore:       number; // 0-100
  status:            'healthy' | 'warning' | 'critical';
  sampleCount:       number;
}

export interface ModelCallOutcome {
  provider:     ModelProvider;
  model:        string;
  agent:        AgentName;
  buildId:      string;
  success:      boolean;
  latencyMs:    number;
  timedOut:     boolean;
  costUsd:      number;
  qualityScore?: number;
  cacheHit:     boolean;
  fallbackUsed: boolean;
}

export interface ModelLearningRecord {
  buildId:          string;
  agent:            AgentName;
  provider:         ModelProvider;
  model:            string;
  tokenBudget:      number;
  cachePolicy:      CachePolicy;
  contextBudget:    number;
  overallScore:     number;
  actualCostUsd:    number;
  actualLatencyMs:  number;
  recordedAt:       number;
}

export interface ModelLearningStats {
  totalRecords:      number;
  averageScore:      number;
  averageCostUsd:    number;
  averageLatencyMs:  number;
  bestModelByAgent:  Partial<Record<AgentName, { provider: ModelProvider; model: string; averageScore: number }>>;
  bestCachePolicy:   CachePolicy | null;
}
