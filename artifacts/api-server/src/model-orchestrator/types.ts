// ── V9.3 Model & Resource Orchestration Engine — Type Definitions ─────────────
//
// Extends ExecutionBlueprint (V9.2) with model/resource routing detail.
// Does NOT replace or duplicate agent-orchestrator types — imports from there.
import type { AgentName, ModelTier, ProjectComplexity } from '../agent-orchestrator/types.js';

export type ProviderId =
  | 'openrouter'
  | 'groq'
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'deepseek'
  | 'local'
  | 'future';

export type CachePolicy = 'none' | 'prompt' | 'blueprint' | 'full';
export type StreamingPolicy = 'enabled' | 'disabled';
export type CompressionPolicy = 'none' | 'light' | 'aggressive';
export type ReasoningDepth = 'shallow' | 'medium' | 'deep';

export interface ProviderCapabilities {
  providerId:     ProviderId;
  name:           string;
  /** 0-10: higher = faster */
  latency:        number;
  /** 0-10: higher = better quality output */
  quality:        number;
  /** 0-10: higher = cheaper */
  costScore:      number;
  /** Max context tokens */
  contextLength:  number;
  streaming:      boolean;
  reasoning:      boolean;
  /** 0-1: 1 = fully available */
  health:         number;
  /** 0-1: 1 = configured and reachable */
  availability:   number;
  /** Concrete model string to pass to callAI() (null if unavailable) */
  concreteModel:  string | null;
}

export interface FallbackChain {
  primary:    ProviderId;
  backups:    ProviderId[];
  lastResort: ProviderId;
}

/** Per-agent model execution plan — the V9.3 output at agent granularity. */
export interface AgentModelPlan {
  agent:              AgentName;
  modelTier:          ModelTier;
  selectedProvider:   ProviderId;
  fallbackChain:      FallbackChain;
  tokenBudget:        number;   // absolute token count
  tokenBudgetPercent: number;   // 0-100
  promptBudget:       number;   // max prompt tokens
  contextBudget:      number;   // max context tokens
  latencyTarget:      number;   // target ms
  qualityTarget:      number;   // 0-10
  costTarget:         number;   // cost units
  retryModel:         ProviderId;
  cachePolicy:        CachePolicy;
  streamingPolicy:    StreamingPolicy;
  compressionPolicy:  CompressionPolicy;
  reasoningDepth:     ReasoningDepth;
  expectedCost:       number;
  expectedLatencyMs:  number;
  expectedQuality:    number;
}

/** Top-level V9.3 artifact — one per build, attached to ExecutionBlueprint. */
export interface ModelExecutionBlueprint {
  buildId:            string;
  complexity:         ProjectComplexity;
  totalTokenBudget:   number;
  agentPlans:         Record<AgentName, AgentModelPlan>;
  providerDistribution: Record<ProviderId, number>;  // agent count per provider
  expectedTotalCost:  number;
  expectedTotalLatencyMs: number;
  cacheHitPrediction: number;  // 0-1
  fallbackPrediction: number;  // 0-1
  tokenEfficiency:    number;  // 0-1
  budgetUtilization:  number;  // 0-1
  recordedAt:         number;
}

export interface ModelHealthRecord {
  providerId:   ProviderId;
  failureRate:  number;
  averageLatencyMs: number;
  averageCost:  number;
  averageQuality: number;
  timeouts:     number;
  availability: number;
  healthScore:  number;  // 0-100
  sampleCount:  number;
}

export interface ModelOrchestrationOutcome {
  buildId:          string;
  blueprintId:      string;
  actualCost:       number;
  actualLatencyMs:  number;
  cacheHits:        number;
  fallbacksUsed:    number;
  routingScore:     number;  // 0-10
  tokenEfficiency:  number;
  recordedAt:       number;
}

export interface ModelOrchestratorLearningRecord {
  buildId:           string;
  complexity:        ProjectComplexity;
  bestProvider:      ProviderId;
  bestTokenAlloc:    Record<AgentName, number>;
  cacheStrategy:     CachePolicy;
  routingScore:      number;
  costSavings:       number;
  latencySavings:    number;
  recordedAt:        number;
}

export interface ModelOrchestratorLearningStats {
  totalRecords:       number;
  averageRoutingScore: number;
  bestProvider:       ProviderId | null;
  averageCostSavings: number;
  averageLatencySavings: number;
  byComplexity:       Record<string, { count: number; averageScore: number; averageCostSavings: number }>;
}
