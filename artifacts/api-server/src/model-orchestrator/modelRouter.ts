// ── V9.3 Model Orchestrator — Dynamic Model Router ───────────────────────────
//
// Maps agent ModelTier → conceptual provider → real available provider via
// fallback chain. Routing table follows the spec:
//   Planning → fast reasoning (Groq)
//   Design/Director → highest quality (OpenRouter)
//   Repair → cheap reasoning (Groq)
//   Security → highest reasoning (OpenRouter)
//   QA → balanced (OpenRouter)
//   Optimization → fast (Groq)
// Deterministic — no LLM calls.
import type { AgentName, ModelTier } from '../agent-orchestrator/types.js';
import type {
  ProviderId, FallbackChain, CachePolicy, StreamingPolicy,
  CompressionPolicy, ReasoningDepth,
} from './types.js';
import { isProviderAvailable } from './providerRegistry.js';
import { AGENT_REGISTRY } from '../agent-orchestrator/agentRegistry.js';

/** Conceptual preferred provider per model tier (before availability check). */
const TIER_PREFERRED: Record<ModelTier, ProviderId[]> = {
  'fast':              ['groq', 'openrouter', 'deepseek', 'local'],
  'high-quality':      ['openai', 'claude', 'openrouter', 'groq'],
  'cheap-reasoning':   ['groq', 'deepseek', 'openrouter', 'local'],
  'highest-reasoning': ['openai', 'claude', 'openrouter', 'groq'],
  'balanced':          ['openrouter', 'groq', 'deepseek', 'local'],
};

const TIER_REASONING_DEPTH: Record<ModelTier, ReasoningDepth> = {
  'fast':              'shallow',
  'high-quality':      'deep',
  'cheap-reasoning':   'medium',
  'highest-reasoning': 'deep',
  'balanced':          'medium',
};

const TIER_CACHE_POLICY: Record<ModelTier, CachePolicy> = {
  'fast':              'prompt',
  'high-quality':      'full',
  'cheap-reasoning':   'blueprint',
  'highest-reasoning': 'full',
  'balanced':          'prompt',
};

const TIER_STREAMING: Record<ModelTier, StreamingPolicy> = {
  'fast':              'enabled',
  'high-quality':      'enabled',
  'cheap-reasoning':   'disabled',
  'highest-reasoning': 'enabled',
  'balanced':          'enabled',
};

const TIER_COMPRESSION: Record<ModelTier, CompressionPolicy> = {
  'fast':              'light',
  'high-quality':      'none',
  'cheap-reasoning':   'aggressive',
  'highest-reasoning': 'light',
  'balanced':          'light',
};

/** Resolve preferred provider list to the first actually-available one. */
export function resolveProvider(tier: ModelTier): ProviderId {
  const candidates = TIER_PREFERRED[tier];
  for (const p of candidates) {
    if (isProviderAvailable(p)) return p;
  }
  // Ultimate fallback — openrouter is always configured
  return 'openrouter';
}

export function buildFallbackChain(tier: ModelTier): FallbackChain {
  const preferred = TIER_PREFERRED[tier];
  const available = preferred.filter(p => isProviderAvailable(p));
  const primary = available[0] ?? 'openrouter';
  const backups = available.slice(1);
  // Always include openrouter as last resort if not already in chain
  const lastResort: ProviderId = backups.includes('openrouter') || primary === 'openrouter'
    ? 'groq'
    : 'openrouter';
  return { primary, backups, lastResort };
}

export interface RoutingDecision {
  selectedProvider:  ProviderId;
  fallbackChain:     FallbackChain;
  retryModel:        ProviderId;
  cachePolicy:       CachePolicy;
  streamingPolicy:   StreamingPolicy;
  compressionPolicy: CompressionPolicy;
  reasoningDepth:    ReasoningDepth;
  latencyTarget:     number;
  qualityTarget:     number;
  costTarget:        number;
}

export function routeAgent(agent: AgentName): RoutingDecision {
  const tier = AGENT_REGISTRY[agent].modelTier;
  const selectedProvider = resolveProvider(tier);
  const fallbackChain = buildFallbackChain(tier);
  const retryModel: ProviderId = fallbackChain.backups[0] ?? fallbackChain.lastResort;

  // Latency target (ms) — tighter for fast/cheap, looser for high-quality
  const latencyTarget = tier === 'fast' ? 2_000
    : tier === 'cheap-reasoning' ? 8_000
    : tier === 'balanced' ? 6_000
    : 20_000;

  const qualityTarget = tier === 'high-quality' || tier === 'highest-reasoning' ? 9
    : tier === 'balanced' ? 7
    : 6;

  const costTarget = tier === 'cheap-reasoning' ? 0.001
    : tier === 'fast' ? 0.002
    : tier === 'balanced' ? 0.005
    : 0.02;

  return {
    selectedProvider,
    fallbackChain,
    retryModel,
    cachePolicy:       TIER_CACHE_POLICY[tier],
    streamingPolicy:   TIER_STREAMING[tier],
    compressionPolicy: TIER_COMPRESSION[tier],
    reasoningDepth:    TIER_REASONING_DEPTH[tier],
    latencyTarget,
    qualityTarget,
    costTarget,
  };
}
