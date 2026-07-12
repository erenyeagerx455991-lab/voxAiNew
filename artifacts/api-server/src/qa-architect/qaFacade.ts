// ── V8.8 QA Architect — Public Facade (barrel re-exports) ────────────────────

// Types
export type {
  QAStrategy, RiskLevel, QADimension, E2EJourney, BrowserName,
  Viewport, ChaosScenario, FailureCategory,
  TestStrategyBlueprint, UnitTestBlueprint, IntegrationTestBlueprint,
  APITestBlueprint, ContractTestBlueprint, E2ETestBlueprint,
  AccessibilityTestBlueprint, ResponsiveTestBlueprint,
  BrowserCompatibilityBlueprint, MobileTestBlueprint,
  PerformanceTestBlueprint, SecurityTestBlueprint, VisualRegressionBlueprint,
  ChaosTestBlueprint, ReliabilityBlueprint, CoverageBlueprint,
  RiskItem, RiskBlueprint, FailurePrediction,
  QAQualityScore, QAValidationResult,
  QABlueprint, QAArchitectOutput,
  QADimensionScores, QAMetricsSnapshot,
} from './qaTypes.js';

export { ALL_QA_DIMENSIONS } from './qaTypes.js';

// Planners (phases 1–18)
export { planTestStrategy }         from './testStrategyPlanner.js';
export { planUnitTests }            from './unitTestPlanner.js';
export { planIntegrationTests }     from './integrationTestPlanner.js';
export { planAPITests }             from './apiTestPlanner.js';
export { planContractTests }        from './contractTestPlanner.js';
export { planE2ETests }             from './e2ePlanner.js';
export { planAccessibilityTests }   from './accessibilityTestPlanner.js';
export { planResponsiveTests }      from './responsiveTestPlanner.js';
export { planBrowserCompatibility } from './browserCompatibilityPlanner.js';
export { planMobileTests }          from './mobileTestPlanner.js';
export { planPerformanceTests }     from './performanceTestPlanner.js';
export { planSecurityTests }        from './securityTestPlanner.js';
export { planVisualRegression }     from './visualRegressionPlanner.js';
export { planChaosTests }           from './chaosTestPlanner.js';
export { planReliability }          from './reliabilityPlanner.js';
export { planCoverage }             from './coveragePlanner.js';
export { planRisks }                from './riskPlanner.js';
export { predictFailures }          from './failurePrediction.js';

// Validator (phase 19)
export { validateQABlueprint }      from './qaValidator.js';

// Learning (phase 20)
export {
  learnFromQABuild, getQALearningStats, resetQALearning,
} from './qaLearning.js';
export type { QALearningStats }     from './qaLearning.js';

// Metrics (phase 21)
export {
  recordQABuild, getQAMetrics, resetQAMetrics,
} from './qaMetrics.js';

// Persistence (phase 22)
export {
  saveQABlueprint, flushQAPersistence,
  getQASnapshots, getRecentQASnapshots,
  getQASnapshotAtVersion, rollbackQAToVersion,
  getCurrentQAVersion, getQAPersistenceStats, resetQAPersistence,
} from './qaPersistence.js';
export type { QAPersistenceStats }  from './qaPersistence.js';

// Orchestrator
export { runQAArchitect }           from './qaArchitect.js';
