// ── V9.0 Runtime Intelligence — Retrieval Intelligence ───────────────────────
//
// Decides how many RAGs to query, which libraries to fetch context from,
// token budgets, and cache usage. Never calls RAG directly — only plans.
import type { GenerationMode, RetrievalIntelligence, RuntimeIntelligenceInput } from './runtimeTypes.js';

const RAG_COUNT: Record<GenerationMode, number> = {
  Fast:         2,
  Balanced:     4,
  Quality:      6,
  Enterprise:   8,
  Creative:     6,
  Strict:       5,
  Experimental: 7,
  Safe:         3,
};

const MAX_CONTEXT_TOKENS: Record<GenerationMode, number> = {
  Fast:         2000,
  Balanced:     4000,
  Quality:      8000,
  Enterprise:   12000,
  Creative:     8000,
  Strict:       6000,
  Experimental: 8000,
  Safe:         4000,
};

function selectLibraries(input: RuntimeIntelligenceInput): string[] {
  const libs: string[] = ['shadcn', 'tailwind', 'react'];
  if (input.hasAuth)          libs.push('auth-patterns');
  if (input.hasPayments)      libs.push('stripe-patterns');
  if (input.hasRealtime)      libs.push('realtime-patterns');
  if (input.backendType === 'Dashboard' || input.productGoal.toLowerCase().includes('dashboard')) {
    libs.push('recharts', 'tanstack-table');
  }
  if (input.backendType === 'AIPlatform') libs.push('ai-ui-patterns');
  if (input.productFeatures.some(f => f.toLowerCase().includes('animation') || f.toLowerCase().includes('motion'))) {
    libs.push('framer-motion');
  }
  return libs;
}

function priorityOrder(libs: string[], input: RuntimeIntelligenceInput): string[] {
  const priorities = [...libs];
  // Move most relevant library to front
  if (input.hasAuth && priorities.includes('auth-patterns')) {
    priorities.splice(priorities.indexOf('auth-patterns'), 1);
    priorities.unshift('auth-patterns');
  }
  return priorities;
}

export function planRetrievalIntelligence(mode: GenerationMode, input: RuntimeIntelligenceInput): RetrievalIntelligence {
  const libraries = selectLibraries(input);
  return {
    ragQueriesCount:   RAG_COUNT[mode],
    libraries,
    maxContextTokens:  MAX_CONTEXT_TOKENS[mode],
    priority:          priorityOrder(libraries, input),
    useCache:          mode !== 'Experimental' && mode !== 'Creative',
    reuseRetrieval:    mode === 'Fast' || mode === 'Safe',
    skipUnnecessary:   mode === 'Fast',
  };
}
