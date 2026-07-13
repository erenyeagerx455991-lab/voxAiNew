// ── V9.4 Knowledge Engine — Context Builder (Knowledge Bundles) ───────────────
//
// Instead of sending all accumulated memory to every agent, builds a focused
// bundle per target agent — the token-reduction "Context Builder" from the
// spec. Frontend gets UI/Components/Layouts/DesignPatterns; Backend gets
// Architecture/Database/API/Caching; Security gets Threats/Compliance/OWASP;
// QA gets Testing/Failures/Coverage; DevOps gets Deployment/Infrastructure/
// Monitoring/Optimization.
import type { KnowledgeBundle, KnowledgeBundleTarget, KnowledgeDomain } from './types.js';
import { getKnowledgeByDomain } from './knowledgeCollector.js';
import { traverse } from './knowledgeGraph.js';
import { recommend } from './recommendationEngine.js';

const TARGET_DOMAINS: Record<KnowledgeBundleTarget, KnowledgeDomain[]> = {
  Frontend: ['Frontend', 'Component', 'Design', 'Motion'],
  Backend:  ['Backend', 'API', 'Database', 'Architecture'],
  Security: ['Security'],
  QA:       ['QA', 'Failure', 'Repair'],
  DevOps:   ['DevOps', 'Deployment', 'Performance'],
  Generic:  ['Product', 'Business', 'Telemetry', 'Benchmark', 'Prompt', 'Runtime', 'Conversion', 'Accessibility'],
};

export function buildKnowledgeBundle(target: KnowledgeBundleTarget, buildId: string, limitPerDomain = 10): KnowledgeBundle {
  const domains = TARGET_DOMAINS[target] ?? TARGET_DOMAINS.Generic;
  const records = domains.flatMap(d => getKnowledgeByDomain(d).slice(-limitPerDomain));

  const relatedNodes = records.length > 0
    ? records.slice(0, 5).flatMap(r => traverse(r.id, 1))
    : [];

  const recommendations = domains.flatMap(d => recommend(d, 3).suggestions).slice(0, 10);

  return {
    target,
    buildId,
    records,
    relatedNodes: dedupeNodes(relatedNodes),
    recommendations,
    domains,
    generatedAt: Date.now(),
  };
}

function dedupeNodes<T extends { id: string }>(nodes: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const n of nodes) {
    if (!seen.has(n.id)) { seen.add(n.id); out.push(n); }
  }
  return out;
}
