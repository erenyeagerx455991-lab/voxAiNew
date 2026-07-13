// ── V9.4 Knowledge Engine — Collector ─────────────────────────────────────────
//
// Normalizes knowledge from existing subsystem outputs (already threaded
// through the pipeline step's function signature) into a common
// KnowledgeRecord shape and stores it in a capped in-memory array, one store
// per domain conceptually (implemented as a single capped array filterable
// by domain — avoids duplicating the capped-array machinery per domain).
import type { KnowledgeDomain, KnowledgeRecord } from './types.js';
import { addNode, linkIntoChain } from './knowledgeGraph.js';

const MAX_RECORDS = 1000;
let store: KnowledgeRecord[] = [];
let idCounter = 0;

export interface KnowledgeInput {
  domain:             KnowledgeDomain;
  title:              string;
  summary:            string;
  tags?:              string[];
  sourceAgent:        string;
  buildId:            string;
  quality?:           number;
  confidence?:        number;
  productionSuccess?: number;
  popularity?:        number;
  repairRate?:        number;
  runtimePerformance?: number;
  accessibilityScore?: number;
  securityScore?:     number;
  businessSuccess?:   number;
  relatedIds?:        string[];
}

function nextId(domain: KnowledgeDomain): string {
  idCounter++;
  return `kn-${domain.toLowerCase()}-${idCounter}`;
}

export function ingestKnowledge(input: KnowledgeInput): KnowledgeRecord {
  const now = Date.now();
  const record: KnowledgeRecord = {
    id:                 nextId(input.domain),
    domain:             input.domain,
    title:              input.title,
    summary:            input.summary,
    tags:               input.tags ?? [],
    sourceAgent:        input.sourceAgent,
    buildId:            input.buildId,
    quality:            clamp(input.quality ?? 5, 0, 10),
    confidence:         clamp(input.confidence ?? 0.5, 0, 1),
    productionSuccess:  clamp(input.productionSuccess ?? 0.5, 0, 1),
    popularity:         Math.max(0, input.popularity ?? 0),
    repairRate:         clamp(input.repairRate ?? 0, 0, 1),
    runtimePerformance: clamp(input.runtimePerformance ?? 5, 0, 10),
    accessibilityScore: clamp(input.accessibilityScore ?? 5, 0, 10),
    securityScore:      clamp(input.securityScore ?? 5, 0, 10),
    businessSuccess:    clamp(input.businessSuccess ?? 5, 0, 10),
    version:            1,
    createdAt:          now,
    updatedAt:          now,
    relatedIds:         input.relatedIds ?? [],
  };

  try {
    store.push(record);
    if (store.length > MAX_RECORDS) store.splice(0, store.length - MAX_RECORDS);

    // Mirror into the knowledge graph as a generic node keyed by domain.
    addNode({ id: record.id, type: 'Generic', label: record.title, domain: record.domain, data: { buildId: record.buildId } });
    linkIntoChain({ id: record.id, type: domainToChainType(record.domain), label: record.title, domain: record.domain });
  } catch { /* collection must never stop a build */ }

  return record;
}

function domainToChainType(domain: KnowledgeDomain): 'Product' | 'Feature' | 'Component' | 'Pattern' | 'Performance' | 'Security' | 'Accessibility' | 'Conversion' | 'Generic' {
  switch (domain) {
    case 'Product':        return 'Product';
    case 'Frontend':
    case 'Backend':        return 'Feature';
    case 'Component':      return 'Component';
    case 'Design':
    case 'Motion':         return 'Pattern';
    case 'Performance':
    case 'Runtime':        return 'Performance';
    case 'Security':       return 'Security';
    case 'Accessibility':  return 'Accessibility';
    case 'Conversion':
    case 'Business':       return 'Conversion';
    default:                return 'Generic';
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getAllKnowledgeRecords(): KnowledgeRecord[] {
  return [...store];
}

export function getKnowledgeByDomain(domain: KnowledgeDomain): KnowledgeRecord[] {
  return store.filter(r => r.domain === domain);
}

export function getKnowledgeStats(): { totalRecords: number; capacityUsed: number; byDomain: Record<string, number> } {
  const byDomain: Record<string, number> = {};
  for (const r of store) byDomain[r.domain] = (byDomain[r.domain] ?? 0) + 1;
  return {
    totalRecords: store.length,
    capacityUsed: Math.round((store.length / MAX_RECORDS) * 100),
    byDomain,
  };
}

export function resetKnowledgeCollector(): void {
  store = [];
  idCounter = 0;
}
