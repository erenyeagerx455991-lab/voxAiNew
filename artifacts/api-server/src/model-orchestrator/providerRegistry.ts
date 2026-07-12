// ── V9.3 Model Orchestrator — Provider Registry ───────────────────────────────
//
// Descriptive capabilities per provider. Only OpenRouter and Groq have real
// credentials configured (OPENROUTER_API_KEY, GROQ_API_KEY). All other
// providers are marked availability=0 so the Dynamic Model Router's fallback
// logic naturally routes everything to OpenRouter/Groq in practice.
// This is purely metadata — no outbound HTTP calls are made here.
import type { ProviderCapabilities, ProviderId } from './types.js';

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderCapabilities> = {
  openrouter: {
    providerId:    'openrouter',
    name:          'OpenRouter (multi-model gateway)',
    latency:       7,
    quality:       8,
    costScore:     8,
    contextLength: 128_000,
    streaming:     true,
    reasoning:     true,
    health:        1,
    availability:  1,  // OPENROUTER_API_KEY is configured
    concreteModel: 'openai/gpt-4o-mini',  // representative; actual model chosen by aiService.ts
  },
  groq: {
    providerId:    'groq',
    name:          'Groq (ultra-fast inference)',
    latency:       10,
    quality:       7,
    costScore:     9,
    contextLength: 32_768,
    streaming:     false,
    reasoning:     true,
    health:        1,
    availability:  1,  // GROQ_API_KEY is configured (used by repair step)
    concreteModel: 'llama3-70b-8192',
  },
  openai: {
    providerId:    'openai',
    name:          'OpenAI (direct)',
    latency:       7,
    quality:       10,
    costScore:     4,
    contextLength: 128_000,
    streaming:     true,
    reasoning:     true,
    health:        0,
    availability:  0,  // No OPENAI_API_KEY configured
    concreteModel: null,
  },
  claude: {
    providerId:    'claude',
    name:          'Anthropic Claude (direct)',
    latency:       6,
    quality:       10,
    costScore:     4,
    contextLength: 200_000,
    streaming:     true,
    reasoning:     true,
    health:        0,
    availability:  0,  // No ANTHROPIC_API_KEY configured
    concreteModel: null,
  },
  gemini: {
    providerId:    'gemini',
    name:          'Google Gemini (direct)',
    latency:       7,
    quality:       9,
    costScore:     6,
    contextLength: 1_000_000,
    streaming:     true,
    reasoning:     true,
    health:        0,
    availability:  0,  // No GOOGLE_API_KEY configured
    concreteModel: null,
  },
  deepseek: {
    providerId:    'deepseek',
    name:          'DeepSeek (direct)',
    latency:       6,
    quality:       8,
    costScore:     9,
    contextLength: 64_000,
    streaming:     true,
    reasoning:     true,
    health:        0,
    availability:  0,  // No DEEPSEEK_API_KEY configured
    concreteModel: null,
  },
  local: {
    providerId:    'local',
    name:          'Local Model (Ollama/LM Studio)',
    latency:       3,
    quality:       6,
    costScore:     10,
    contextLength: 8_000,
    streaming:     true,
    reasoning:     false,
    health:        0,
    availability:  0,  // No local model endpoint configured
    concreteModel: null,
  },
  future: {
    providerId:    'future',
    name:          'Future Provider (reserved)',
    latency:       5,
    quality:       5,
    costScore:     5,
    contextLength: 32_000,
    streaming:     false,
    reasoning:     false,
    health:        0,
    availability:  0,  // Placeholder — not yet configured
    concreteModel: null,
  },
};

export const ALL_PROVIDER_IDS: ProviderId[] = Object.keys(PROVIDER_REGISTRY) as ProviderId[];

export function getProvider(id: ProviderId): ProviderCapabilities {
  return PROVIDER_REGISTRY[id];
}

export function getAvailableProviders(): ProviderCapabilities[] {
  return ALL_PROVIDER_IDS.map(id => PROVIDER_REGISTRY[id]).filter(p => p.availability > 0);
}

export function isProviderAvailable(id: ProviderId): boolean {
  return PROVIDER_REGISTRY[id].availability > 0;
}
