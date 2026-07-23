// ── V9.2 Adaptive Multi-Agent Orchestrator — Type Definitions ────────────────
//
// The Orchestrator is the central execution brain. It does NOT replace any
// existing Architect, does NOT duplicate planners, and does NOT modify
// business logic inside existing agents. It decides which agents run, in
// what order, which run in parallel, which are skipped, and with what
// retry/timeout/context/model policy — then produces an ExecutionBlueprint
// that the pipeline consults for real (load-bearing) skip/parallel decisions.

/** Every agent the Orchestrator is aware of. Mirrors the existing pipeline
 *  step names 1:1 — this is a scheduling view, not a duplicate implementation. */
export type AgentName =
  | 'ProductManager'
  | 'FrontendArchitect'
  | 'BackendArchitect'
  | 'DevOpsArchitect'
  | 'QAArchitect'
  | 'SecurityIntelligence'
  | 'RuntimeIntelligence'
  | 'Planner'
  | 'Architecture'
  | 'ComponentTree'
  | 'Frontend'
  | 'CandidateSelection'
  | 'Repair'
  | 'UXIntelligence'
  | 'DesignEvaluator'
  | 'DesignCritic'
  | 'ConversionIntelligence'
  | 'Accessibility'
  | 'Optimization'
  | 'DesignDirector'
  | 'Scaffold'
  | 'RuntimeValidation'
  | 'ReasoningEngine'
  | 'ExecutionIntelligence'
  | 'PlanningIntelligence'
  | 'AdaptiveIntelligence'
  | 'SelfOptimizationEngine';

export type ProjectComplexity = 'simple' | 'standard' | 'enterprise';

export type ModelTier =
  | 'fast'              // planning / classification — cheap+fast model
  | 'high-quality'      // design / codegen — best available model
  | 'cheap-reasoning'   // repair passes — inexpensive reasoning model
  | 'highest-reasoning' // security — most capable reasoning model
  | 'balanced';         // QA / general — mid-tier model

export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RecoveryMode = 'skip' | 'retry' | 'fallback' | 'abort';
export type AgentHealthStatus = 'healthy' | 'warning' | 'critical';

export interface RetryPolicy {
  retryCount:      number;
  retryDelayMs:    number;
  backoffStrategy: 'none' | 'linear' | 'exponential';
  failureSeverity: FailureSeverity;
  critical:        boolean;
  recoveryMode:    RecoveryMode;
}

export interface TimeoutPolicy {
  timeoutMs:     number;
  onTimeout:     RecoveryMode;
}

/** Static declarative metadata every agent exposes to the Orchestrator. */
export interface AgentDeclaration {
  name:          AgentName;
  requires:      AgentName[];   // must have already produced output
  produces:      string[];      // logical context keys this agent produces
  consumes:      string[];      // logical context keys this agent reads
  dependsOn:     AgentName[];   // alias of requires, kept distinct for clarity/tests
  skippable:     boolean;       // can this agent be omitted for simple builds?
  retryPolicy:   RetryPolicy;
  timeoutPolicy: TimeoutPolicy;
  modelTier:     ModelTier;
  baseCostTokens: number;       // rough token cost estimate when it runs
  baseDurationMs: number;       // rough wall-clock estimate when it runs
}

export interface DependencyGraphNode {
  name:      AgentName;
  dependsOn: AgentName[];
}

export interface DependencyGraphStats {
  totalNodes:        number;
  totalEdges:        number;
  maxDepth:          number;
  parallelGroupCount: number;
  hasCycle:          boolean;
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  /** Topologically-sorted waves — every agent in a wave can run concurrently. */
  waves: AgentName[][];
  stats: DependencyGraphStats;
}

export interface ContextDistributionEntry {
  agent:  AgentName;
  fields: string[]; // subset of the full context bundle this agent receives
}

export interface ExecutionCostPrediction {
  totalTokens:        number;
  totalCost:          number; // arbitrary cost units, proportional to tokens
  totalTimeMs:        number;
  llmCalls:           number;
  cacheHits:          number;
  parallelSavingsMs:  number;
  optimizationSavingsMs: number;
}

export interface ExecutionBlueprint {
  buildId:            string;
  complexity:         ProjectComplexity;
  mode:               string; // GenerationMode from Runtime Intelligence, echoed for context
  executionGraph:     DependencyGraph;
  agentPriority:      AgentName[]; // flat priority order (highest first)
  parallelGroups:     AgentName[][];
  sequentialGroups:   AgentName[][];
  skippedAgents:      AgentName[];
  retryPolicy:        Record<AgentName, RetryPolicy>;
  timeoutPolicy:      Record<AgentName, TimeoutPolicy>;
  failureStrategy:    RecoveryMode;
  recoveryStrategy:   RecoveryMode;
  contextDistribution: ContextDistributionEntry[];
  modelAllocation:    Record<AgentName, ModelTier>;
  resourceBudget:     ExecutionCostPrediction;
  executionCost:      number;      // = resourceBudget.totalCost, surfaced flat for convenience
  estimatedDurationMs: number;
  expectedQuality:    number;      // 0-10
  riskLevel:          'Low' | 'Medium' | 'High';
  recordedAt:         number;
}

export interface AgentExecutionOutcome {
  agent:        AgentName;
  buildId:      string;
  success:      boolean;
  durationMs:   number;
  retries:      number;
  timedOut:     boolean;
  qualityScore?: number;
  costTokens?:  number;
}

export interface AgentHealthSnapshot {
  agent:            AgentName;
  failureRate:      number;
  averageDurationMs: number;
  averageQuality:   number;
  averageCost:      number;
  retryCount:       number;
  timeoutRate:      number;
  healthScore:      number; // 0-100
  status:           AgentHealthStatus;
  sampleCount:      number;
}

export interface OrchestratorLearningRecord {
  buildId:           string;
  complexity:        ProjectComplexity;
  mode:              string;
  skippedAgents:     AgentName[];
  parallelGroupCount: number;
  overallScore:      number;
  actualDurationMs:  number;
  estimatedDurationMs: number;
  recordedAt:        number;
}

export interface OrchestratorLearningStats {
  totalRecords:        number;
  averageScore:        number;
  averageDurationMs:   number;
  durationAccuracy:    number; // 0-1
  bestExecutionGraph:  { complexity: ProjectComplexity; parallelGroupCount: number; averageScore: number } | null;
  byComplexity:        Record<string, { count: number; averageScore: number; averageDurationMs: number }>;
}
