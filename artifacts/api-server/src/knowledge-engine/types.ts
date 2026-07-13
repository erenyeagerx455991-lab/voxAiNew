// ── V9.4 Autonomous Knowledge Intelligence Engine — Type Definitions ──────────
//
// Long-term intelligence layer: Long-Term Memory + Knowledge Graph + Semantic
// Intelligence + Experience Database + Pattern Intelligence. Static/
// deterministic — no vector DB, no embeddings API, no new LLM calls.
import type { AgentName } from '../telemetry/agentMetrics.js';

export type KnowledgeDomain =
  | 'Product'
  | 'Frontend'
  | 'Backend'
  | 'API'
  | 'Database'
  | 'Architecture'
  | 'Component'
  | 'Design'
  | 'Motion'
  | 'Security'
  | 'QA'
  | 'DevOps'
  | 'Runtime'
  | 'Business'
  | 'Conversion'
  | 'Performance'
  | 'Accessibility'
  | 'Prompt'
  | 'Repair'
  | 'Failure'
  | 'Deployment'
  | 'Benchmark'
  | 'Telemetry';

export const ALL_KNOWLEDGE_DOMAINS: KnowledgeDomain[] = [
  'Product', 'Frontend', 'Backend', 'API', 'Database', 'Architecture',
  'Component', 'Design', 'Motion', 'Security', 'QA', 'DevOps', 'Runtime',
  'Business', 'Conversion', 'Performance', 'Accessibility', 'Prompt',
  'Repair', 'Failure', 'Deployment', 'Benchmark', 'Telemetry',
];

export type CompressionPolicy = 'none' | 'light' | 'aggressive';

/** A single unit of accumulated knowledge, normalized from any subsystem. */
export interface KnowledgeRecord {
  id:                 string;
  domain:             KnowledgeDomain;
  title:              string;
  summary:            string;
  tags:               string[];
  sourceAgent:        AgentName | string;
  buildId:            string;
  quality:            number;   // 0-10
  confidence:         number;   // 0-1
  productionSuccess:  number;   // 0-1
  popularity:         number;   // usage count (raw, non-negative integer)
  repairRate:         number;   // 0-1 (higher = repaired more often = worse)
  runtimePerformance:  number;  // 0-10
  accessibilityScore: number;   // 0-10
  securityScore:      number;   // 0-10
  businessSuccess:    number;   // 0-10
  version:            number;
  createdAt:          number;
  updatedAt:          number;
  relatedIds:         string[];
}

export type KnowledgeNodeType =
  | 'Product' | 'Feature' | 'Component' | 'Pattern' | 'BusinessGoal'
  | 'Performance' | 'Security' | 'Accessibility' | 'Conversion'
  | 'ProductionOutcome' | 'Generic';

export interface KnowledgeNode {
  id:        string;
  type:      KnowledgeNodeType;
  label:     string;
  domain?:   KnowledgeDomain;
  data?:     Record<string, unknown>;
}

export interface KnowledgeEdge {
  from:     string;
  to:       string;
  relation: string;
  weight:   number; // 0-1
}

export interface RankedKnowledgeRecord extends KnowledgeRecord {
  compositeScore: number; // 0-10
  factorBreakdown: KnowledgeRankingFactors;
}

/** The 10 ranking factors from the V9.4 spec, each normalized 0-10. */
export interface KnowledgeRankingFactors {
  quality:            number;
  confidence:         number;
  freshness:          number;
  productionSuccess:  number;
  popularity:         number;
  repairFrequency:    number; // inverted — lower repair rate = higher score
  runtimePerformance: number;
  accessibility:      number;
  security:           number;
  businessSuccess:    number;
}

export interface SemanticQuery {
  text:    string;
  domain?: KnowledgeDomain;
  tags?:   string[];
  limit?:  number;
}

export interface RetrievedKnowledge extends KnowledgeRecord {
  relevanceScore: number; // 0-1
}

export interface SemanticRetrievalResult {
  query:        SemanticQuery;
  results:      RetrievedKnowledge[];
  totalScanned: number;
}

export interface PatternRecord {
  id:                 string;
  domain:             KnowledgeDomain;
  name:               string;
  qualityScore:       number; // 0-10
  performanceScore:   number; // 0-10
  accessibilityScore: number; // 0-10
  conversionScore:    number; // 0-10
  maintainabilityScore: number; // 0-10
  popularity:         number; // 0-1
  usageCount:         number;
  productionSuccess:  number; // 0-1
  failureRate:        number; // 0-1
  repairRate:         number; // 0-1
  confidence:         number; // 0-1
  freshness:          number; // 0-1
  version:            number;
  updatedAt:          number;
}

export interface RecommendationItem {
  title:     string;
  domain:    KnowledgeDomain;
  score:     number; // 0-10
  reason:    string;
  patternId: string | null;
}

export interface RecommendationResult {
  domain:      KnowledgeDomain;
  suggestions: RecommendationItem[];
}

export type KnowledgeBundleTarget =
  | 'Frontend' | 'Backend' | 'Security' | 'QA' | 'DevOps' | 'Generic';

export interface KnowledgeBundle {
  target:            KnowledgeBundleTarget;
  buildId:           string;
  records:           KnowledgeRecord[];
  relatedNodes:      KnowledgeNode[];
  recommendations:   RecommendationItem[];
  domains:           KnowledgeDomain[];
  generatedAt:       number;
}

export interface CompressedKnowledgeBundle {
  target:           KnowledgeBundleTarget;
  buildId:          string;
  recordCount:      number;
  topRecords:       KnowledgeRecord[];
  recommendations:  RecommendationItem[];
  originalLength:   number;
  compressedLength: number;
  compressionRatio: number;
  strategy:         CompressionPolicy;
}

export interface KnowledgeLearningRecord {
  buildId:          string;
  domain:           KnowledgeDomain;
  routingOutcome:   string;
  score:            number; // 0-10
  productionSuccess: boolean;
  recordedAt:       number;
}

export interface KnowledgeLearningStats {
  totalRecords:        number;
  averageScore:        number;
  productionSuccessRate: number;
  byDomain:            Record<string, { count: number; averageScore: number }>;
}

export interface KnowledgeEngineTelemetrySnapshot {
  knowledgeScore:          number;
  retrievalAccuracy:       number;
  semanticCoverage:        number;
  knowledgeGrowth:         number;
  relationshipDensity:     number;
  knowledgeUsage:          number;
  recommendationAccuracy:  number;
  confidenceScore:         number;
  learningStatistics:      KnowledgeLearningStats;
  persistenceHealth:       {
    totalSnapshots: number;
    currentVersion: number;
    oldestVersion:  number | null;
    newestVersion:  number | null;
    capacityUsed:   number;
  };
  cacheEfficiency:         number;
}
