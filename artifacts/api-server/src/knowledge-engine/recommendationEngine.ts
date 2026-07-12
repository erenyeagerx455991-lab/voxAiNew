// ── V9.4 Recommendation Engine ────────────────────────────────────────────────

import type { KnowledgeDomain, RecommendationResult } from './types.js';
import { rankKnowledge } from './knowledgeRanking.js';
import { queryPatterns } from './patternIntelligence.js';
import { getKnowledgeStore } from './knowledgeLearning.js';

export interface RecommendationContext {
  prompt?:    string;
  tags?:      string[];
  complexity?: 'simple' | 'moderate' | 'complex' | 'enterprise';
  topK?:      number;
}

const DOMAIN_HINTS: Record<KnowledgeDomain, string[]> = {
  Product:        ['product', 'strategy', 'goals', 'features', 'market', 'business'],
  Frontend:       ['react', 'typescript', 'ui', 'components', 'tailwind', 'layout'],
  Backend:        ['api', 'rest', 'graphql', 'server', 'node', 'express'],
  API:            ['endpoint', 'rest', 'graphql', 'websocket', 'http'],
  Database:       ['postgres', 'mysql', 'redis', 'mongodb', 'sql', 'orm'],
  Architecture:   ['microservices', 'monolith', 'patterns', 'ddd', 'hexagonal'],
  Component:      ['button', 'card', 'form', 'modal', 'table', 'list'],
  Design:         ['design', 'color', 'typography', 'spacing', 'ux', 'ui'],
  Motion:         ['animation', 'transition', 'framer', 'motion', 'gesture'],
  Security:       ['auth', 'jwt', 'oauth', 'owasp', 'xss', 'csrf', 'encryption'],
  QA:             ['test', 'vitest', 'jest', 'e2e', 'coverage', 'quality'],
  DevOps:         ['docker', 'kubernetes', 'ci', 'cd', 'deploy', 'cloud'],
  Runtime:        ['runtime', 'performance', 'generation', 'repair', 'build'],
  Business:       ['revenue', 'conversion', 'retention', 'growth', 'kpi'],
  Conversion:     ['cta', 'cro', 'funnel', 'conversion', 'landing'],
  Performance:    ['bundle', 'lazy', 'cache', 'ttfb', 'lcp', 'fcp'],
  Accessibility:  ['wcag', 'aria', 'a11y', 'screen-reader', 'contrast'],
  Prompt:         ['prompt', 'llm', 'ai', 'context', 'instruction'],
  Repair:         ['fix', 'repair', 'error', 'bug', 'patch'],
  Failure:        ['failure', 'fallback', 'error', 'crash', 'timeout'],
  Deployment:     ['deploy', 'release', 'rollout', 'staging', 'production'],
  Benchmark:      ['benchmark', 'metric', 'measure', 'profile', 'score'],
  Telemetry:      ['telemetry', 'log', 'trace', 'metric', 'monitor'],
};

export function recommend(
  domain: KnowledgeDomain,
  context: RecommendationContext,
): RecommendationResult[] {
  const topK = context.topK ?? 5;

  // Pull records from the in-memory store filtered by domain
  const allRecords = getKnowledgeStore().filter(r => r.domain === domain);
  const ranked     = rankKnowledge(allRecords).slice(0, topK * 2);

  // Also pull patterns
  const patterns = queryPatterns(domain, context.tags).slice(0, topK);

  const results: RecommendationResult[] = [];

  // From ranked knowledge records
  for (const r of ranked.slice(0, topK)) {
    results.push({
      id:         r.id,
      domain:     r.domain,
      title:      r.title,
      summary:    r.summary,
      score:      r.compositeScore,
      tags:       r.tags,
      confidence: r.confidence,
      reasoning:  `Ranked score ${r.compositeScore.toFixed(2)} from ${r.sourceAgent}`,
    });
  }

  // Fill from patterns if needed
  for (const p of patterns) {
    if (results.length >= topK) break;
    results.push({
      id:         p.id,
      domain:     p.domain,
      title:      p.name,
      summary:    p.description,
      score:      p.qualityScore,
      tags:       p.tags,
      confidence: p.confidence,
      reasoning:  `Pattern with quality ${p.qualityScore.toFixed(1)}, usage ${p.usageCount}`,
    });
  }

  // If still empty, generate hint-based fallback
  if (results.length === 0) {
    const hints = DOMAIN_HINTS[domain] ?? [];
    results.push({
      id:         `hint-${domain}-${Date.now()}`,
      domain,
      title:      `${domain} Best Practices`,
      summary:    `Default best practices for ${domain}: ${hints.slice(0, 3).join(', ')}`,
      score:      5,
      tags:       hints.slice(0, 5),
      confidence: 0.5,
      reasoning:  'Fallback hint-based recommendation (no historical records)',
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, topK);
}
