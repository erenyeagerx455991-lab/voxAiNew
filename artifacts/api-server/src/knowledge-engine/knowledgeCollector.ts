// ── V9.4 Knowledge Collector — normalises subsystem outputs into KnowledgeRecords ──

import type { KnowledgeRecord, KnowledgeDomain } from './types.js';

let _seq = 0;
function nextId(domain: KnowledgeDomain): string {
  return `ke-${domain.toLowerCase()}-${Date.now()}-${++_seq}`;
}

function clamp(v: number, lo = 0, hi = 10): number {
  return Math.max(lo, Math.min(hi, v));
}

function freshness(recordedAt: number): number {
  const age = Date.now() - recordedAt;
  const maxAge = 7 * 24 * 3600 * 1000; // 7 days
  return Math.max(0, 1 - age / maxAge);
}

export interface ProductManagerSnapshot {
  productScore?: number;
  overallScore?: number;
  tags?: string[];
  recordedAt?: number;
  [key: string]: unknown;
}

export interface ArchitectSnapshot {
  overallScore?: number;
  tags?: string[];
  recordedAt?: number;
  [key: string]: unknown;
}

export interface RuntimeSnapshot {
  averageScore?: number;
  tags?: string[];
  recordedAt?: number;
  [key: string]: unknown;
}

export interface TelemetrySnapshot {
  knowledgeScore?: number;
  totalExecutions?: number;
  [key: string]: unknown;
}

export function collectFromProductManager(snap: ProductManagerSnapshot): KnowledgeRecord {
  const score = clamp(snap.productScore ?? snap.overallScore ?? 5);
  return {
    id: nextId('Product'),
    domain: 'Product',
    title: 'Product Manager Output',
    summary: 'Product strategy and business goal analysis',
    tags: snap.tags ?? ['product', 'strategy', 'business'],
    categories: ['Product'],
    keywords: ['product', 'strategy', 'goals', 'features', 'market'],
    quality: score,
    confidence: score / 10,
    freshness: freshness(snap.recordedAt ?? Date.now()),
    productionSuccess: score / 10,
    popularity: 0.8,
    repairFrequency: 0.1,
    runtimePerf: 8,
    accessibility: 5,
    security: 5,
    businessSuccess: score,
    version: 1,
    recordedAt: snap.recordedAt ?? Date.now(),
    sourceAgent: 'ProductManager',
    payload: snap as Record<string, unknown>,
  };
}

export function collectFromFrontendArchitect(snap: ArchitectSnapshot): KnowledgeRecord {
  const score = clamp(snap.overallScore ?? 5);
  return {
    id: nextId('Frontend'),
    domain: 'Frontend',
    title: 'Frontend Architecture Blueprint',
    summary: 'Frontend technology stack, component structure, and design patterns',
    tags: snap.tags ?? ['frontend', 'architecture', 'components', 'design'],
    categories: ['Frontend', 'Architecture'],
    keywords: ['react', 'typescript', 'tailwind', 'components', 'layout', 'design'],
    quality: score,
    confidence: score / 10,
    freshness: freshness(snap.recordedAt ?? Date.now()),
    productionSuccess: score / 10,
    popularity: 0.85,
    repairFrequency: 0.15,
    runtimePerf: 7,
    accessibility: 7,
    security: 5,
    businessSuccess: score * 0.9,
    version: 1,
    recordedAt: snap.recordedAt ?? Date.now(),
    sourceAgent: 'FrontendArchitect',
    payload: snap as Record<string, unknown>,
  };
}

export function collectFromBackendArchitect(snap: ArchitectSnapshot): KnowledgeRecord {
  const score = clamp(snap.overallScore ?? 5);
  return {
    id: nextId('Backend'),
    domain: 'Backend',
    title: 'Backend Architecture Blueprint',
    summary: 'Backend API, database, and service layer architecture',
    tags: snap.tags ?? ['backend', 'api', 'database', 'architecture'],
    categories: ['Backend', 'API', 'Database'],
    keywords: ['api', 'rest', 'database', 'postgres', 'redis', 'auth', 'security'],
    quality: score,
    confidence: score / 10,
    freshness: freshness(snap.recordedAt ?? Date.now()),
    productionSuccess: score / 10,
    popularity: 0.82,
    repairFrequency: 0.12,
    runtimePerf: 8,
    accessibility: 4,
    security: 8,
    businessSuccess: score * 0.85,
    version: 1,
    recordedAt: snap.recordedAt ?? Date.now(),
    sourceAgent: 'BackendArchitect',
    payload: snap as Record<string, unknown>,
  };
}

export function collectFromDevOpsArchitect(snap: ArchitectSnapshot): KnowledgeRecord {
  const score = clamp(snap.overallScore ?? 5);
  return {
    id: nextId('DevOps'),
    domain: 'DevOps',
    title: 'DevOps Architecture Blueprint',
    summary: 'Deployment, infrastructure, monitoring, and CI/CD patterns',
    tags: snap.tags ?? ['devops', 'deployment', 'infrastructure', 'ci'],
    categories: ['DevOps', 'Deployment'],
    keywords: ['docker', 'kubernetes', 'ci', 'cd', 'monitoring', 'infrastructure', 'cloud'],
    quality: score,
    confidence: score / 10,
    freshness: freshness(snap.recordedAt ?? Date.now()),
    productionSuccess: score / 10,
    popularity: 0.75,
    repairFrequency: 0.1,
    runtimePerf: 8,
    accessibility: 3,
    security: 7,
    businessSuccess: score * 0.8,
    version: 1,
    recordedAt: snap.recordedAt ?? Date.now(),
    sourceAgent: 'DevOpsArchitect',
    payload: snap as Record<string, unknown>,
  };
}

export function collectFromQAArchitect(snap: ArchitectSnapshot): KnowledgeRecord {
  const score = clamp(snap.overallScore ?? 5);
  return {
    id: nextId('QA'),
    domain: 'QA',
    title: 'QA Architecture Blueprint',
    summary: 'Testing strategy, reliability, coverage, and quality gates',
    tags: snap.tags ?? ['qa', 'testing', 'reliability', 'coverage'],
    categories: ['QA', 'Benchmark'],
    keywords: ['vitest', 'jest', 'coverage', 'e2e', 'unit', 'integration', 'quality'],
    quality: score,
    confidence: score / 10,
    freshness: freshness(snap.recordedAt ?? Date.now()),
    productionSuccess: score / 10,
    popularity: 0.78,
    repairFrequency: 0.08,
    runtimePerf: 7,
    accessibility: 5,
    security: 6,
    businessSuccess: score * 0.82,
    version: 1,
    recordedAt: snap.recordedAt ?? Date.now(),
    sourceAgent: 'QAArchitect',
    payload: snap as Record<string, unknown>,
  };
}

export function collectFromRuntimeIntelligence(snap: RuntimeSnapshot): KnowledgeRecord {
  const score = clamp(snap.averageScore ?? 5);
  return {
    id: nextId('Runtime'),
    domain: 'Runtime',
    title: 'Runtime Intelligence Output',
    summary: 'Generation strategy, evaluation weights, repair and optimization decisions',
    tags: snap.tags ?? ['runtime', 'performance', 'generation', 'strategy'],
    categories: ['Runtime', 'Performance'],
    keywords: ['runtime', 'generation', 'repair', 'candidates', 'evaluation', 'performance'],
    quality: score,
    confidence: score / 10,
    freshness: freshness(snap.recordedAt ?? Date.now()),
    productionSuccess: score / 10,
    popularity: 0.7,
    repairFrequency: 0.2,
    runtimePerf: score,
    accessibility: 4,
    security: 5,
    businessSuccess: score * 0.75,
    version: 1,
    recordedAt: snap.recordedAt ?? Date.now(),
    sourceAgent: 'RuntimeIntelligence',
    payload: snap as Record<string, unknown>,
  };
}

export function collectFromTelemetry(snap: TelemetrySnapshot): KnowledgeRecord {
  const score = clamp(snap.knowledgeScore ?? 5);
  return {
    id: nextId('Telemetry'),
    domain: 'Telemetry',
    title: 'Telemetry Snapshot',
    summary: 'System-wide telemetry, metrics, and performance data',
    tags: ['telemetry', 'metrics', 'monitoring'],
    categories: ['Telemetry'],
    keywords: ['telemetry', 'metrics', 'latency', 'throughput', 'error', 'success'],
    quality: score,
    confidence: 0.9,
    freshness: freshness(Date.now()),
    productionSuccess: (snap.totalExecutions ?? 0) > 0 ? 0.85 : 0.5,
    popularity: 0.6,
    repairFrequency: 0.05,
    runtimePerf: 8,
    accessibility: 4,
    security: 5,
    businessSuccess: score * 0.7,
    version: 1,
    recordedAt: Date.now(),
    sourceAgent: 'Telemetry',
    payload: snap as Record<string, unknown>,
  };
}

export function collectGeneric(
  domain: KnowledgeDomain,
  sourceAgent: string,
  title: string,
  summary: string,
  tags: string[],
  quality: number,
  payload: Record<string, unknown>,
): KnowledgeRecord {
  const score = clamp(quality);
  return {
    id: nextId(domain),
    domain,
    title,
    summary,
    tags,
    categories: [domain],
    keywords: tags,
    quality: score,
    confidence: score / 10,
    freshness: 1.0,
    productionSuccess: score / 10,
    popularity: 0.5,
    repairFrequency: 0.1,
    runtimePerf: score * 0.9,
    accessibility: 5,
    security: 5,
    businessSuccess: score * 0.8,
    version: 1,
    recordedAt: Date.now(),
    sourceAgent,
    payload,
  };
}
