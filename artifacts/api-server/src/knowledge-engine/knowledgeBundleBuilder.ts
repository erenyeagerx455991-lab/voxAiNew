// ── V9.4 Knowledge Bundle Builder — agent-specific context slices ─────────────

import type { KnowledgeBundle, KnowledgeDomain, KnowledgeRecord } from './types.js';
import { rankKnowledge } from './knowledgeRanking.js';
import { getKnowledgeStore } from './knowledgeLearning.js';

export interface BundleContext {
  tags?:       string[];
  complexity?: string;
  topK?:       number;
}

// Per-agent domain mappings (token-reduction: only relevant domains)
const AGENT_DOMAIN_MAP: Record<string, KnowledgeDomain[]> = {
  Frontend:      ['Frontend', 'Component', 'Design', 'Motion', 'Accessibility'],
  Backend:       ['Backend', 'Architecture', 'Database', 'API'],
  Security:      ['Security'],
  QA:            ['QA', 'Failure', 'Benchmark'],
  DevOps:        ['DevOps', 'Deployment'],
  Planner:       ['Product', 'Business', 'Architecture'],
  Architecture:  ['Architecture', 'Backend', 'Database', 'API', 'Security'],
  Runtime:       ['Runtime', 'Performance', 'Benchmark'],
  Conversion:    ['Conversion', 'Business', 'Frontend'],
  Accessibility: ['Accessibility', 'Frontend', 'Component'],
  Product:       ['Product', 'Business', 'Conversion'],
  Orchestrator:  ['Runtime', 'Performance', 'Architecture', 'Telemetry'],
  ModelOrchestrator: ['Runtime', 'Telemetry', 'Benchmark'],
  KnowledgeEngine:   ['Telemetry', 'Benchmark', 'Runtime'],
};

const AGENT_TOP_PATTERN_MAP: Record<string, string[]> = {
  Frontend:      ['UI Components', 'Layout Patterns', 'Design Systems'],
  Backend:       ['API Design', 'Database Patterns', 'Caching Strategies'],
  Security:      ['OWASP Top 10', 'Auth Patterns', 'Data Encryption'],
  QA:            ['Test Strategies', 'Failure Modes', 'Coverage Patterns'],
  DevOps:        ['CI/CD Pipelines', 'Infrastructure as Code', 'Monitoring'],
  Planner:       ['Product Strategy', 'Feature Prioritization', 'Blueprint Patterns'],
  Architecture:  ['Microservices', 'Domain-Driven Design', 'CQRS'],
  Conversion:    ['CTA Patterns', 'Funnel Optimization', 'A/B Testing'],
  Accessibility: ['WCAG Patterns', 'ARIA Roles', 'Color Contrast'],
};

function estimateTokens(records: KnowledgeRecord[]): number {
  // ~150 tokens per record on average
  return records.length * 150;
}

export function buildKnowledgeBundle(
  targetAgent: string,
  context: BundleContext,
): KnowledgeBundle {
  const domains: KnowledgeDomain[] = AGENT_DOMAIN_MAP[targetAgent] ?? ['Runtime', 'Telemetry'];
  const topK = context.topK ?? 10;

  const allRecords = getKnowledgeStore();
  const filtered   = allRecords.filter(r => domains.includes(r.domain));
  const ranked     = rankKnowledge(filtered).slice(0, topK);

  const topPatterns = AGENT_TOP_PATTERN_MAP[targetAgent] ?? ['Best Practices'];
  const recommendations = ranked
    .slice(0, 3)
    .map(r => `${r.domain}: ${r.title} (score=${r.compositeScore.toFixed(1)})`);

  return {
    targetAgent,
    domains,
    records:         ranked,
    topPatterns,
    recommendations,
    tokenEstimate:   estimateTokens(ranked),
  };
}
