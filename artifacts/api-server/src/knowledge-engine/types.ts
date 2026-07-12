// ── V9.4 Autonomous Knowledge Intelligence Engine — Types ─────────────────────

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

export interface KnowledgeRecord {
  id:           string;
  domain:       KnowledgeDomain;
  title:        string;
  summary:      string;
  tags:         string[];
  categories:   string[];
  keywords:     string[];
  quality:      number;   // 0-10
  confidence:   number;   // 0-1
  freshness:    number;   // 0-1 (1 = newest)
  productionSuccess: number; // 0-1
  popularity:   number;   // 0-1
  repairFrequency: number; // 0-1 (lower = better)
  runtimePerf:  number;   // 0-10
  accessibility: number;  // 0-10
  security:     number;   // 0-10
  businessSuccess: number; // 0-10
  version:      number;
  recordedAt:   number;
  sourceAgent:  string;
  payload:      Record<string, unknown>;
}

export interface KnowledgeNode {
  id:         string;
  domain:     KnowledgeDomain;
  label:      string;
  properties: Record<string, unknown>;
  recordIds:  string[];
}

export interface KnowledgeEdge {
  from:   string;
  to:     string;
  type:   KnowledgeRelationship;
  weight: number;
}

export type KnowledgeRelationship =
  | 'DEPENDS_ON'
  | 'PRODUCES'
  | 'VALIDATES'
  | 'OPTIMIZES'
  | 'SECURES'
  | 'TESTS'
  | 'DEPLOYS'
  | 'MONITORS'
  | 'INHERITS'
  | 'REFERENCES';

export interface KnowledgeBundle {
  targetAgent:   string;
  domains:       KnowledgeDomain[];
  records:       KnowledgeRecord[];
  topPatterns:   string[];
  recommendations: string[];
  compressedAt?: number;
  tokenEstimate: number;
}

export interface KnowledgeRankingFactors {
  quality:          number; // weight: 0.20
  confidence:       number; // weight: 0.12
  freshness:        number; // weight: 0.10
  productionSuccess: number; // weight: 0.15
  popularity:       number; // weight: 0.08
  repairFrequency:  number; // weight: 0.08
  runtimePerf:      number; // weight: 0.10
  accessibility:    number; // weight: 0.07
  security:         number; // weight: 0.05
  businessSuccess:  number; // weight: 0.05
}

export interface RecommendationResult {
  id:          string;
  domain:      KnowledgeDomain;
  title:       string;
  summary:     string;
  score:       number;
  tags:        string[];
  confidence:  number;
  reasoning:   string;
}
