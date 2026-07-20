// ── V9.7 Autonomous Planning Intelligence Engine — Types ──────────────────────

// ── Context ────────────────────────────────────────────────────────────────────
export interface PlanningIntelligenceContext {
  buildId: string;
  prompt: string;
  complexity: 'simple' | 'standard' | 'enterprise';
  chosenPath: string;
  reasoningScore: number;
  executionMode: string;
  productScore?: number;
  frontendScore?: number;
  backendScore?: number;
  totalTokenBudget?: number;
  expectedTotalCost?: number;
}

// ── Phase 1 — Goal Analysis ────────────────────────────────────────────────────
export interface GoalEntry {
  detected: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface PlanningGoals {
  businessGoal:      GoalEntry;
  technicalGoal:     GoalEntry;
  uxGoal:            GoalEntry;
  performanceGoal:   GoalEntry;
  seoGoal:           GoalEntry;
  securityGoal:      GoalEntry;
  scalabilityGoal:   GoalEntry;
  accessibilityGoal: GoalEntry;
  analyticsGoal:     GoalEntry;
  maintenanceGoal:   GoalEntry;
  primaryGoal: string;
  goalCount: number;
}

// ── Phase 2 — Requirement Extraction ──────────────────────────────────────────
export interface DetectedFeature {
  id: string;
  name: string;
  detected: boolean;
  confidence: number; // 0-1
  source: string;     // keyword that triggered detection
}

export interface RequirementBlueprint {
  pages:         string[];
  layouts:       string[];
  components:    string[];
  apis:          string[];
  database:      string[];
  authentication: boolean;
  authorization:  boolean;
  dashboard:      boolean;
  adminPanel:     boolean;
  forms:          string[];
  cms:            boolean;
  payments:       boolean;
  notifications:  boolean;
  analytics:      boolean;
  search:         boolean;
  settings:       boolean;
  reports:        boolean;
  userRoles:      string[];
  featureFlags:   boolean;
  detectedFeatures: DetectedFeature[];
  totalRequirements: number;
  complexityScore: number; // 0-10
}

// ── Phase 3 — Feature Dependency Graph ────────────────────────────────────────
export interface FeatureNode {
  id: string;
  name: string;
  dependsOn: string[];
  isRoot: boolean;
  isLeaf: boolean;
  depth: number;
}

export interface DependencyBlueprint {
  features:           FeatureNode[];
  featureMap:         Record<string, FeatureNode>;
  edges:              Array<{ from: string; to: string }>;
  cycles:             string[][];
  missingDependencies: Array<{ feature: string; missing: string }>;
  independentBranches: string[][];
  blockingChains:     string[][];
  hasCycle:           boolean;
  isValid:            boolean;
  totalFeatures:      number;
  maxDepth:           number;
}

// ── Phase 4 — Milestone Planning ──────────────────────────────────────────────
export interface Milestone {
  id: string;
  name: string;
  features:       string[];
  estimatedDays:  number;
  criticalPath:   boolean;
  deliverable:    string;
}

export interface MilestoneBlueprint {
  milestones:     Milestone[];
  totalMilestones: number;
  totalDays:      number;
  criticalMilestones: string[];
}

// ── Phase 5 — Roadmap Planning ─────────────────────────────────────────────────
export interface Sprint {
  id: string;
  name: string;
  milestones:      string[];
  features:        string[];
  parallelWork:    string[];
  sequentialWork:  string[];
  criticalDeliverable: string;
  estimatedDays:   number;
}

export interface RoadmapBlueprint {
  sprints:          Sprint[];
  totalSprints:     number;
  totalDays:        number;
  parallelFeatures: string[];
  sequentialFeatures: string[];
  criticalDeliverables: string[];
}

// ── Phase 6 — Feature Planning ─────────────────────────────────────────────────
export type FeatureStatus = 'core' | 'optional' | 'future' | 'blocked';
export type FeatureComplexity = 'low' | 'medium' | 'high' | 'very-high';

export interface PlannedFeature {
  id: string;
  name: string;
  status: FeatureStatus;
  complexity: FeatureComplexity;
  dependencies: string[];
  estimatedHours: number;
}

export interface FeatureBlueprint {
  coreFeatures:     PlannedFeature[];
  optionalFeatures: PlannedFeature[];
  futureFeatures:   PlannedFeature[];
  blockedFeatures:  PlannedFeature[];
  totalFeatures:    number;
  totalCoreHours:   number;
}

// ── Phase 7 — Task Planning ────────────────────────────────────────────────────
export type TaskOwner = 'frontend' | 'backend' | 'fullstack' | 'devops' | 'qa' | 'design';

export interface PlanningTask {
  id: string;
  name: string;
  featureId:     string;
  dependencies:  string[];
  estimatedHours: number;
  priority:      'critical' | 'high' | 'medium' | 'low';
  owner:         TaskOwner;
  parallelGroup: number;
}

export interface TaskBlueprint {
  tasks:          PlanningTask[];
  parallelGroups: number[][];
  totalTasks:     number;
  totalHours:     number;
  criticalTasks:  string[];
}

// ── Phase 8 — Risk Planning ────────────────────────────────────────────────────
export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown';
export type RiskCategory = 'technical' | 'security' | 'architecture' | 'timeline' | 'dependency' | 'performance' | 'compliance' | 'unknown';

export interface Risk {
  id: string;
  name: string;
  level: RiskLevel;
  category: RiskCategory;
  mitigation: string;
  probability: number; // 0-1
  impact: number;      // 0-10
  riskScore: number;   // probability × impact
}

export interface RiskBlueprint {
  risks:          Risk[];
  highRisks:      Risk[];
  mediumRisks:    Risk[];
  lowRisks:       Risk[];
  unknownRisks:   Risk[];
  technicalDebt:  string[];
  overallRiskLevel: RiskLevel;
  riskScore:      number; // 0-10
}

// ── Phase 9 — Estimation Planning ─────────────────────────────────────────────
export interface EstimationBlueprint {
  developmentDays:  number;
  llmTokens:        number;
  filesCount:       number;
  componentsCount:  number;
  apisCount:        number;
  dbTablesCount:    number;
  infrastructure:   string[];
  overallCost:      number; // USD
  costBreakdown: {
    llmCost:     number;
    infraCost:   number;
    totalCost:   number;
  };
  confidence:       number; // 0-1
}

// ── Phase 10 — Increment Planning ─────────────────────────────────────────────
export interface Increment {
  id: string;
  name: string;
  features:         string[];
  milestones:       string[];
  independentlyBuildable: boolean;
  estimatedDays:    number;
  deliverables:     string[];
}

export interface IncrementBlueprint {
  increments:       Increment[];
  totalIncrements:  number;
  totalDays:        number;
}

// ── Phase 11 — Priority Planning ──────────────────────────────────────────────
export interface FeaturePriority {
  featureId:           string;
  featureName:         string;
  businessValue:       number; // 0-10
  technicalImportance: number; // 0-10
  risk:                number; // 0-10
  dependencyWeight:    number; // 0-10
  complexity:          number; // 0-10
  overallScore:        number; // weighted average
  rank:                number;
  priorityLabel:       'critical' | 'high' | 'medium' | 'low';
}

export interface PriorityBlueprint {
  priorities:       FeaturePriority[];
  topPriorities:    string[];  // top-5 feature ids
  criticalFeatures: string[];
  deferredFeatures: string[];
}

// ── Phase 12 — Implementation Planning ────────────────────────────────────────
export interface ImplementationBlueprint {
  sequentialTasks:  string[];
  parallelTasks:    string[][];
  criticalPath:     string[];
  blockedTasks:     string[];
  fastTrackTasks:   string[];
  executionOrder:   string[];
  estimatedTotalMs: number;
}

// ── Phase 13 — Validation ──────────────────────────────────────────────────────
export interface PlanningValidation {
  requirementsScore:  number;
  dependenciesScore:  number;
  roadmapScore:       number;
  milestonesScore:    number;
  tasksScore:         number;
  risksScore:         number;
  estimationScore:    number;
  implementationScore: number;
  completenessScore:  number;
  overallScore:       number;
  planningScore:      number; // alias for overallScore
  valid:              boolean;
  warnings:           string[];
  recommendations:    string[];
}

// ── Main Blueprint ─────────────────────────────────────────────────────────────
export interface PlanningBlueprint {
  buildId:        string;
  goals:          PlanningGoals;
  requirements:   RequirementBlueprint;
  dependencies:   DependencyBlueprint;
  milestones:     MilestoneBlueprint;
  roadmap:        RoadmapBlueprint;
  features:       FeatureBlueprint;
  tasks:          TaskBlueprint;
  risks:          RiskBlueprint;
  estimation:     EstimationBlueprint;
  increments:     IncrementBlueprint;
  priorities:     PriorityBlueprint;
  implementation: ImplementationBlueprint;
  validation:     PlanningValidation;
  planningScore:  number;
  contextString:  string;
  recordedAt:     number;
  version:        number;
}

// ── Learning ───────────────────────────────────────────────────────────────────
export interface PlanningLearningRecord {
  buildId:           string;
  planningScore:     number;
  complexity:        string;
  featureCount:      number;
  riskLevel:         string;
  planningTimeMs:    number;
  buildSucceeded:    boolean;
  roadmapAccuracy:   number; // 0-1
  dependencyAccuracy: number;
  recordedAt:        number;
}

export interface PlanningLearningStats {
  totalRecords:         number;
  averagePlanningScore: number;
  averagePlanningTimeMs: number;
  buildSuccessRate:     number;
  averageRoadmapAccuracy: number;
  averageDependencyAccuracy: number;
  byComplexity:         Record<string, { count: number; avgScore: number }>;
}

// ── Metrics ────────────────────────────────────────────────────────────────────
export interface PlanningMetricRecord {
  planningScore:     number;
  roadmapScore:      number;
  dependencyScore:   number;
  estimationScore:   number;
  riskScore:         number;
  validationScore:   number;
  planningTimeMs:    number;
  complexity:        string;
  featureCount:      number;
  recordedAt:        number;
}

export interface PlanningMetricsSnapshot {
  planningScore:     number;
  roadmapScore:      number;
  dependencyScore:   number;
  estimationScore:   number;
  riskScore:         number;
  validationScore:   number;
  averagePlanningTime: number;
  learningStatistics: PlanningLearningStats;
  plannerDistribution: Record<string, number>;
  persistenceHealth: {
    totalSnapshots: number;
    currentVersion: number;
    capacityUsed:   number;
    oldestVersion:  number | null;
    newestVersion:  number | null;
  };
}

// ── Persistence ────────────────────────────────────────────────────────────────
export interface PlanningSnapshot {
  version:    number;
  buildId:    string;
  blueprint:  PlanningBlueprint;
  savedAt:    number;
}
