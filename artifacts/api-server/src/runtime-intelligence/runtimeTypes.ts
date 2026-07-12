// ── V9.0 Runtime Intelligence Engine — Type Definitions ──────────────────────
//
// The Runtime Intelligence Engine is the generation strategy brain that
// decides HOW the AI builds software. It runs after all architects
// (Product, Frontend, Backend, DevOps, QA, Security) and BEFORE the Planner.
// It NEVER generates UI and does NOT duplicate any existing architect module.

// ── Core enumerations ─────────────────────────────────────────────────────────

export type GenerationMode =
  | 'Fast'         // single candidate, skip repair, minimal prompt depth
  | 'Balanced'     // 2 candidates, standard repair, standard evaluation
  | 'Quality'      // 3 candidates, multi-repair, deep prompt, strict evaluation
  | 'Enterprise'   // 3 candidates, aggressive repair, enterprise validation, max prompt
  | 'Creative'     // 3-5 candidates, experimental prompts, creative optimization
  | 'Strict'       // 3 candidates, safe repair, strict validation, formal prompts
  | 'Experimental' // 5 candidates, aggressive repair, experimental prompts
  | 'Safe';        // 1 candidate, safe repair, conservative validation

export type RuntimeDimension =
  | 'generation'
  | 'candidate'
  | 'repair'
  | 'evaluation'
  | 'optimization'
  | 'caching'
  | 'context'
  | 'parallelization'
  | 'validation'
  | 'rendering'
  | 'prompt'
  | 'retry'
  | 'streaming'
  | 'deployment'
  | 'risk'
  | 'memory';

export const ALL_RUNTIME_DIMENSIONS: RuntimeDimension[] = [
  'generation', 'candidate', 'repair', 'evaluation', 'optimization',
  'caching', 'context', 'parallelization', 'validation', 'rendering',
  'prompt', 'retry', 'streaming', 'deployment', 'risk', 'memory',
];

export type CandidateCount = 1 | 2 | 3 | 5;

export type CandidateType =
  | 'full'
  | 'component-only'
  | 'page-only'
  | 'layout-only'
  | 'skip';

export type RepairPolicy =
  | 'single'
  | 'multi'
  | 'aggressive'
  | 'safe'
  | 'skip'
  | 'components-only'
  | 'css-only'
  | 'typescript-only'
  | 'runtime-only';

export type ValidationLevel = 'minimal' | 'standard' | 'strict' | 'enterprise';
export type ContextDepth    = 'minimal' | 'standard' | 'deep';
export type PromptDepth     = 'minimal' | 'standard' | 'deep' | 'expert';
export type CompressionLevel = 'none' | 'light' | 'aggressive';
export type RenderingType   = 'csr' | 'ssr' | 'hybrid' | 'static';
export type DeploymentType  = 'standard' | 'blue-green' | 'canary' | 'rolling' | 'immediate';
export type BundleSizeTarget = 'minimal' | 'standard' | 'feature-rich';
export type RiskLevel       = 'low' | 'moderate' | 'high' | 'critical';

// ── Strategy blueprints ───────────────────────────────────────────────────────

export interface GenerationStrategy {
  mode:            GenerationMode;
  isIncremental:   boolean;
  isParallel:      boolean;
  isDeterministic: boolean;
  maxIterations:   number;
  contextDepth:    ContextDepth;
  rationale:       string;
}

export interface CandidateStrategy {
  count:               CandidateCount;
  type:                CandidateType;
  parallelGeneration:  boolean;
  rationale:           string;
}

export interface RepairStrategy {
  policy:        RepairPolicy;
  maxPasses:     number;
  threshold:     number;   // minimum quality score to stop repair (0-10)
  isConservative:boolean;
  rationale:     string;
}

export interface EvaluationStrategy {
  isStrict:          boolean;
  weights:           Record<string, number>;  // dynamic per-dimension evaluator weights
  threshold:         number;                  // minimum passing score
  priorityDimension: string;
  rationale:         string;
  /** V9.1: name of the weight profile selected (e.g. 'landing-page', 'saas'). */
  profile:           string;
}

export interface OptimizationStrategy {
  performanceOverAnimation: boolean;
  seoOverMotion:            boolean;
  designQualityOverSpeed:   boolean;
  accessibilityPriority:    boolean;
  bundleSizeTarget:         BundleSizeTarget;
  rationale:                string;
}

export interface CachingStrategy {
  useCache:        boolean;
  reuseRetrieval:  boolean;
  cacheTTLSeconds: number;
  rationale:       string;
}

export interface ContextStrategy {
  maxTokens:        number;
  compressionLevel: CompressionLevel;
  prioritizeRecent: boolean;
  includeHistory:   boolean;
  rationale:        string;
}

export interface ParallelizationStrategy {
  parallelizeArchitects: boolean;
  parallelizeCandidates: boolean;
  parallelizeRAG:        boolean;
  maxConcurrency:        number;
  rationale:             string;
}

export interface ValidationStrategy {
  level:                 ValidationLevel;
  validateTypes:         boolean;
  validateRuntime:       boolean;
  validateAccessibility: boolean;
  failFast:              boolean;
  rationale:             string;
}

export interface RenderingStrategy {
  strategy:           RenderingType;
  lazyLoadComponents: boolean;
  codesplit:          boolean;
  rationale:          string;
}

export interface PromptStrategy {
  depth:                PromptDepth;
  includeExamples:      boolean;
  includeConstraints:   boolean;
  includeArchitecture:  boolean;
  maxSystemTokens:      number;
  rationale:            string;
}

export interface RetryStrategy {
  maxRetries:          number;
  backoffMs:           number;
  retryOnQualityFail:  boolean;
  rationale:           string;
}

export interface StreamingStrategy {
  enableSSE:      boolean;
  batchSize:      number;
  flushIntervalMs:number;
  rationale:      string;
}

export interface DeploymentStrategy {
  strategy:    DeploymentType;
  cdnEnabled:  boolean;
  rationale:   string;
}

export interface RiskStrategy {
  level:              RiskLevel;
  mitigationPriority: string[];
  failSafe:           boolean;
  rationale:          string;
}

export interface MemoryStrategy {
  maxContextRecords:    number;
  compressionEnabled:   boolean;
  keepArchitectContext: boolean;
  rationale:            string;
}

// ── Intelligence modules ──────────────────────────────────────────────────────

export interface PerformancePrediction {
  estimatedBuildTimeMs:             number;
  estimatedRepairCount:             number;
  estimatedTokenUsage:              number;
  estimatedRuntimeCostUnits:        number;
  estimatedMemoryMB:                number;
  estimatedBundleSizeKB:            number;
  estimatedCompletionProbability:   number;  // 0–1
}

export interface RetrievalIntelligence {
  ragQueriesCount:   number;
  libraries:         string[];
  maxContextTokens:  number;
  priority:          string[];
  useCache:          boolean;
  reuseRetrieval:    boolean;
  skipUnnecessary:   boolean;
}

// ── Runtime Context (immutable merged context injected into Planner) ──────────

export interface RuntimeContext {
  generationContext:   { mode: GenerationMode; candidateCount: CandidateCount; isParallel: boolean };
  promptContext:       { depth: PromptDepth; maxTokens: number; includeExamples: boolean };
  architectureContext: { backendType: string; infraType: string; serviceCount: number };
  memoryContext:       { maxRecords: number; compressionEnabled: boolean };
  retrievalContext:    { ragCount: number; libraries: string[]; maxTokens: number };
  designContext:       { evaluationPriority: string; dynamicWeights: Record<string, number> };
  backendContext:      { backendType: string; score: number; hasAuth: boolean };
  securityContext:     { score: number; hasCompliance: boolean; riskLevel: RiskLevel };
  qaContext:           { score: number; validationLevel: ValidationLevel };
  optimizationContext: { performanceOverAnimation: boolean; seoOverMotion: boolean; accessibilityPriority: boolean };
}

// ── Quality scoring ───────────────────────────────────────────────────────────

export interface RuntimeQualityScore {
  dimension: RuntimeDimension;
  score:     number;    // 0–10
  rationale: string;
}

// ── Main RuntimeBlueprint ─────────────────────────────────────────────────────

export interface RuntimeBlueprint {
  mode:                    GenerationMode;
  generationStrategy:      GenerationStrategy;
  candidateStrategy:       CandidateStrategy;
  repairStrategy:          RepairStrategy;
  evaluationStrategy:      EvaluationStrategy;
  optimizationStrategy:    OptimizationStrategy;
  cachingStrategy:         CachingStrategy;
  contextStrategy:         ContextStrategy;
  parallelizationStrategy: ParallelizationStrategy;
  validationStrategy:      ValidationStrategy;
  renderingStrategy:       RenderingStrategy;
  promptStrategy:          PromptStrategy;
  retryStrategy:           RetryStrategy;
  streamingStrategy:       StreamingStrategy;
  deploymentStrategy:      DeploymentStrategy;
  riskStrategy:            RiskStrategy;
  memoryStrategy:          MemoryStrategy;
  performancePrediction:   PerformancePrediction;
  retrievalIntelligence:   RetrievalIntelligence;
  runtimeContext:          RuntimeContext;
  qualityScores:           RuntimeQualityScore[];
  overallScore:            number;
  recommendations:         string[];
}

// ── Input & Output types ──────────────────────────────────────────────────────

/** Signals extracted from all architect outputs — keeps runtime-intelligence decoupled */
export interface RuntimeIntelligenceInput {
  prompt:            string;
  buildId:           string;
  // Product signals
  productGoal:       string;
  productFeatures:   string[];
  businessObjective: string;
  // Architecture signals
  backendType:       string;
  infraType:         string;
  serviceCount:      number;
  hasAuth:           boolean;
  hasPayments:       boolean;
  hasRealtime:       boolean;
  hasCompliance:     boolean;
  // Quality scores from previous architects (0–10)
  productScore:      number;
  frontendScore:     number;
  backendScore:      number;
  devopsScore:       number;
  qaScore:           number;
  securityScore:     number;
}

export interface RuntimeIntelligenceOutput {
  blueprint:        Readonly<RuntimeBlueprint>;
  overallScore:     number;
  processingTimeMs: number;
  /** Injected into enrichedPromptWithArchitecture before Planner step */
  contextString:    string;
}

// ── Persistence ───────────────────────────────────────────────────────────────

export interface RuntimeSnapshot {
  version:      number;
  buildId:      string;
  mode:         GenerationMode;
  overallScore: number;
  blueprint:    Readonly<RuntimeBlueprint>;
  recordedAt:   number;
}

// ── Learning ──────────────────────────────────────────────────────────────────

export interface RuntimeLearningInput {
  buildId:             string;
  blueprint:           RuntimeBlueprint;
  actualBuildTimeMs:   number;
  actualRepairCount:   number;
  overallBuildScore:   number;
}

export interface RuntimeLearningRecord {
  buildId:              string;
  mode:                 GenerationMode;
  overallScore:         number;
  actualBuildTimeMs:    number;
  estimatedBuildTimeMs: number;
  actualRepairCount:    number;
  estimatedRepairCount: number;
  candidateCount:       CandidateCount;
  generationScore:      number;
  repairScore:          number;
  evaluationScore:      number;
  improved:             boolean;
  recordedAt:           number;
  /** V9.1: which evaluator weight profile drove this build's evaluation. */
  weightProfile:        string;
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface RuntimeIntelligenceMetricsSnapshot {
  totalBuilds:             number;
  averageScore:            number;
  averageGenerationTime:   number;
  repairEfficiency:        number;
  evaluationEfficiency:    number;
  optimizationEfficiency:  number;
  tokenEfficiency:         number;
  candidateEfficiency:     number;
  cacheHitRate:            number;
  scoreByDimension:        Partial<Record<RuntimeDimension, number>>;
  strategyDistribution:    Partial<Record<GenerationMode, number>>;
  learningRecordCount:     number;
  lastUpdated:             number;
}
