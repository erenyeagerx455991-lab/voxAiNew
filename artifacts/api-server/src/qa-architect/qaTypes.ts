// ── V8.8 QA & Reliability Architect — Type Definitions ───────────────────────

// ── Input types ───────────────────────────────────────────────────────────────

export type QAStrategy  = 'unit-first' | 'integration-first' | 'api-first' | 'ui-first' | 'e2e-first';
export type RiskLevel   = 'High' | 'Medium' | 'Low';
export type QADimension =
  | 'testing' | 'coverage' | 'reliability' | 'accessibility'
  | 'performance' | 'security' | 'responsiveness' | 'compatibility'
  | 'risk' | 'maintainability';

export const ALL_QA_DIMENSIONS: QADimension[] = [
  'testing', 'coverage', 'reliability', 'accessibility',
  'performance', 'security', 'responsiveness', 'compatibility',
  'risk', 'maintainability',
];

export type E2EJourney =
  | 'Login' | 'Signup' | 'Dashboard' | 'Checkout'
  | 'Profile' | 'Admin' | 'Settings' | 'Logout'
  | 'Recovery' | 'Onboarding';

export type BrowserName =
  | 'Chrome' | 'Firefox' | 'Safari' | 'Edge'
  | 'Brave' | 'MobileChrome' | 'MobileSafari';

export type Viewport = 'Desktop' | 'Laptop' | 'Tablet' | 'Mobile' | 'Landscape' | 'Portrait';

export type ChaosScenario =
  | 'ServerCrash' | 'RedisFailure' | 'DatabaseOutage' | 'QueueOutage'
  | 'AITimeout' | 'NetworkLatency' | 'HighTraffic';

export type FailureCategory =
  | 'APIFailure' | 'StateMismatch' | 'AuthBug' | 'SlowRendering'
  | 'BrokenForms' | 'NavigationIssues' | 'RaceConditions' | 'HydrationMismatch';

// ── Phase blueprints ──────────────────────────────────────────────────────────

export interface TestStrategyBlueprint {
  strategy:           QAStrategy;
  confidence:         number;
  rationale:          string;
  priorityOrder:      QAStrategy[];
  automationTarget:   number;           // 0–100 %
  testPyramidRatios:  { unit: number; integration: number; e2e: number };
}

export interface UnitTestBlueprint {
  estimatedTests:     number;
  areas:              string[];           // business logic, hooks, stores, etc.
  criticalPaths:      string[];
  frameworks:         string[];
  hasMocking:         boolean;
  hasSnapshotTests:   boolean;
  coverageTarget:     number;
}

export interface IntegrationTestBlueprint {
  estimatedTests:     number;
  integrationPoints:  string[];
  dependencyGraph:    Record<string, string[]>;
  hasDatabaseTests:   boolean;
  hasAuthTests:       boolean;
  hasPaymentTests:    boolean;
  hasStorageTests:    boolean;
  hasQueueTests:      boolean;
  hasCacheTests:      boolean;
}

export interface APITestBlueprint {
  estimatedTests:     number;
  verbs:              Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
  hasHeaderTests:     boolean;
  hasAuthTests:       boolean;
  hasErrorTests:      boolean;
  hasValidationTests: boolean;
  hasRateLimitTests:  boolean;
  hasTimeoutTests:    boolean;
  frameworks:         string[];
}

export interface ContractTestBlueprint {
  hasContractTests:   boolean;
  checkedAspects:     string[];
  hasVersioning:      boolean;
  hasBreakingChangeDetection: boolean;
  hasResponseShape:   boolean;
  hasErrorFormat:     boolean;
  providerTestCount:  number;
  consumerTestCount:  number;
}

export interface E2ETestBlueprint {
  estimatedTests:     number;
  journeys:           E2EJourney[];
  framework:          string;
  hasRecording:       boolean;
  hasRetry:           boolean;
  hasParallelExec:    boolean;
  ciIntegration:      boolean;
}

export interface AccessibilityTestBlueprint {
  standard:           'WCAG2.1-AA' | 'WCAG2.1-AAA';
  hasKeyboardTests:   boolean;
  hasScreenReader:    boolean;
  hasFocusTests:      boolean;
  hasContrastTests:   boolean;
  hasARIATests:       boolean;
  hasLabelTests:      boolean;
  hasNavTests:        boolean;
  tools:              string[];
  automatedChecks:    number;
}

export interface ResponsiveTestBlueprint {
  viewports:          Viewport[];
  breakpoints:        string[];
  hasOrientationTests:boolean;
  tools:              string[];
  snapshotPerViewport:boolean;
}

export interface BrowserCompatibilityBlueprint {
  browsers:           BrowserName[];
  hasAutomation:      boolean;
  matrix:             Record<BrowserName, { support: boolean; minVersion: string }>;
  tools:              string[];
  criticalBrowsers:   BrowserName[];
}

export interface MobileTestBlueprint {
  hasTouchTests:      boolean;
  hasGestureTests:    boolean;
  hasViewportTests:   boolean;
  hasKeyboardTests:   boolean;
  hasSafeAreaTests:   boolean;
  hasOrientationTests:boolean;
  hasPerformanceTests:boolean;
  devices:            string[];
}

export interface PerformanceTestBlueprint {
  hasLoadTests:       boolean;
  hasStressTests:     boolean;
  hasMemoryLeakTests: boolean;
  hasCPUTests:        boolean;
  hasBundleSizeTests: boolean;
  hasHydrationTests:  boolean;
  targetTTFBms:       number;
  targetLCPms:        number;
  targetCLS:          number;
  targetFIDms:        number;
  targetINPms:        number;
  tools:              string[];
  maxConcurrentUsers: number;
}

export interface SecurityTestBlueprint {
  hasAuthTests:       boolean;
  hasAuthzTests:      boolean;
  hasJWTTests:        boolean;
  hasCSRFTests:       boolean;
  hasXSSTests:        boolean;
  hasSQLInjectionTests:boolean;
  hasPromptInjectionTests: boolean;
  hasRateLimitTests:  boolean;
  hasSecretsTests:    boolean;
  tools:              string[];
  penetrationTestSchedule: string;
}

export interface VisualRegressionBlueprint {
  hasScreenshotComparison: boolean;
  hasLayoutDriftDetection: boolean;
  hasSpacingDriftDetection:boolean;
  hasTypographyDriftDetection:boolean;
  hasThemeDriftDetection:  boolean;
  hasMotionDriftDetection: boolean;
  tools:              string[];
  snapshotCount:      number;
  diffThresholdPercent: number;
}

export interface ChaosTestBlueprint {
  scenarios:          ChaosScenario[];
  hasAutomation:      boolean;
  hasGameDays:        boolean;
  recoveryTargetSecs: number;
  tools:              string[];
  schedule:           string;
}

export interface ReliabilityBlueprint {
  predictedAvailabilityPercent: number;
  hasFailover:        boolean;
  hasRetryPolicy:     boolean;
  hasCircuitBreaker:  boolean;
  hasGracefulDegradation: boolean;
  retryMaxAttempts:   number;
  retryBackoffMs:     number;
  mttrMinutes:        number;
  sloTarget:          string;
}

export interface CoverageBlueprint {
  unitPercent:        number;
  integrationPercent: number;
  e2ePercent:         number;
  apiPercent:         number;
  criticalPathPercent:number;
  overallQualityScore:number;
  hasThresholdEnforcement: boolean;
  reportingTool:      string;
}

export interface RiskItem {
  subsystem:  string;
  level:      RiskLevel;
  reason:     string;
  mitigation: string;
}

export interface RiskBlueprint {
  items:              RiskItem[];
  highRiskCount:      number;
  mediumRiskCount:    number;
  lowRiskCount:       number;
  overallRiskScore:   number;           // 0–10; higher = riskier
  mitigationPriority: string[];
}

export interface FailurePrediction {
  category:   FailureCategory;
  probability:'High' | 'Medium' | 'Low';
  rationale:  string;
  prevention: string;
}

// ── Validator ─────────────────────────────────────────────────────────────────

export interface QAQualityScore {
  dimension: QADimension;
  score:     number;               // 0–10
  rationale: string;
}

export interface QAValidationResult {
  qualityScores: QAQualityScore[];
  overallScore:  number;
  confidence:    number;
}

// ── Composed blueprint ────────────────────────────────────────────────────────

export interface QABlueprint {
  // Phase 1
  strategy:           TestStrategyBlueprint;
  // Phase 2–13
  unitTests:          UnitTestBlueprint;
  integrationTests:   IntegrationTestBlueprint;
  apiTests:           APITestBlueprint;
  contractTests:      ContractTestBlueprint;
  e2eTests:           E2ETestBlueprint;
  accessibilityTests: AccessibilityTestBlueprint;
  responsiveTests:    ResponsiveTestBlueprint;
  browserCompatibility: BrowserCompatibilityBlueprint;
  mobileTests:        MobileTestBlueprint;
  performanceTests:   PerformanceTestBlueprint;
  securityTests:      SecurityTestBlueprint;
  visualRegression:   VisualRegressionBlueprint;
  // Phase 14–18
  chaosTests:         ChaosTestBlueprint;
  reliability:        ReliabilityBlueprint;
  coverage:           CoverageBlueprint;
  risk:               RiskBlueprint;
  failurePredictions: FailurePrediction[];
  // Validator output
  qualityScores:      QAQualityScore[];
  overallScore:       number;
}

// ── Orchestrator output ───────────────────────────────────────────────────────

export interface QAArchitectOutput {
  blueprint:              Readonly<QABlueprint>;
  overallScore:           number;
  enrichedPromptWithQA:   string;
  processingTimeMs:       number;
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface QADimensionScores {
  testing:        number;
  coverage:       number;
  reliability:    number;
  accessibility:  number;
  performance:    number;
  security:       number;
  responsiveness: number;
  compatibility:  number;
  risk:           number;
  maintainability:number;
}

export interface QAMetricsSnapshot {
  totalBuilds:            number;
  averageScore:           number;
  averageTestingScore:    number;
  averageCoverageScore:   number;
  averageReliabilityScore:number;
  averageA11yScore:       number;
  averagePerfScore:       number;
  averageSecurityScore:   number;
  averageRiskScore:       number;
  scoreByDimension:       Partial<QADimensionScores>;
  topStrategies:          Array<{ strategy: QAStrategy; count: number }>;
  learningRecordCount:    number;
  lastUpdated:            string;
}
