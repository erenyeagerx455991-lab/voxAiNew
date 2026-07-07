// ── V8.2 UX Intelligence — Public Facade ─────────────────────────────────────
// Single entry point for all UX Intelligence operations.
// Bundles prediction, learning, metrics, and persistence.

export { predictUX } from './uxPrediction.js';
export { learnFromUX, learnFromRepairUX, learnFromVisualDiff, learnFromBenchmark, getUXLearningHistory, getUXLearningTrend, resetUXLearning } from './uxLearning.js';
export { recordUXRun, getUXQualityMetrics, resetUXMetrics } from './uxMetrics.js';
export { initUXPersistence, saveUXSnapshot, loadUXSnapshot } from './uxPersistence.js';
export type { UXReport, UXMetrics, UXScoringInput, UXLearningInput, UXLearningRecord, ConversionPrediction, UXBehaviorPredictions } from './uxTypes.js';
export { UX_WEIGHTS, computeOverallUXScore, predictConversion, computeConfidence, predictBehavior, extractTopIssues, extractStrengths } from './uxRanking.js';
