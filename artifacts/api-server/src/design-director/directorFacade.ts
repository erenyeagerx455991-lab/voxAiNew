// ── V8.3 Autonomous AI Design Director — Public Facade ────────────────────────
// Single entry point for all Design Director operations.

export { runDesignDirector, buildCategoryScoreMap } from './designDirector.js';
export { learnFromDirector, getDirectorLearningTrend, getDirectorLearningHistory, resetDirectorLearning, hydrateDirectorLearning } from './directorLearning.js';
export { recordDirectorRun, getDirectorMetrics, resetDirectorMetrics } from './directorMetrics.js';
export { initDirectorPersistence, saveDirectorSnapshot, loadDirectorSnapshot } from './directorPersistence.js';
export { computeDirectorScore, extractTopRecommendations, extractCriticalIssues, extractMostCommonProblems, buildCreativeDirection, computeDirectorConfidence, computeReviewDistribution, DIRECTOR_WEIGHTS } from './directorRecommendations.js';
export type { DirectorReview, DirectorCategoryReview, DirectorReviewInput, DirectorCategory, DirectorSeverity, DirectorLearningRecord, DirectorLearningInput } from './directorTypes.js';
