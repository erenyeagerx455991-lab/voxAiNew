// ── V8.5 Frontend Architect — Architecture Metrics ────────────────────────────

import type { FrontendArchitectureBlueprint, ProjectType, StateStrategy, ArchitectureDimension } from './frontendTypes.js';

interface ArchitectureMetricsStore {
  totalRuns:             number;
  averageOverallScore:   number;
  averageRoutingScore:   number;
  averageLayoutScore:    number;
  averagePerformanceScore: number;
  averageAccessibilityScore: number;
  averageStateScore:     number;
  averageFolderScore:    number;
  averageReuseScore:     number;
  projectTypeDistribution: Partial<Record<ProjectType, number>>;
  stateStrategyDistribution: Partial<Record<StateStrategy, number>>;
  topArchitecturePatterns: string[];
  learningTrend:         'rising' | 'stable' | 'declining';
  averageRouteCount:     number;
  averageComponentCount: number;
}

const store: ArchitectureMetricsStore = {
  totalRuns: 0,
  averageOverallScore: 0,
  averageRoutingScore: 0,
  averageLayoutScore: 0,
  averagePerformanceScore: 0,
  averageAccessibilityScore: 0,
  averageStateScore: 0,
  averageFolderScore: 0,
  averageReuseScore: 0,
  projectTypeDistribution: {},
  stateStrategyDistribution: {},
  topArchitecturePatterns: [],
  learningTrend: 'stable',
  averageRouteCount: 0,
  averageComponentCount: 0,
};

// Rolling window for trend detection
const recentScores: number[] = [];
const MAX_RECENT = 20;

export function recordArchitectureBuild(blueprint: FrontendArchitectureBlueprint): void {
  const n = store.totalRuns;
  const newN = n + 1;

  // Update rolling averages
  store.averageOverallScore = ((store.averageOverallScore * n) + blueprint.overallScore) / newN;
  store.averageRouteCount   = ((store.averageRouteCount * n) + blueprint.routingArchitecture.routeCount) / newN;
  store.averageComponentCount = ((store.averageComponentCount * n) + blueprint.componentOwnership.totalEstimate) / newN;

  // Per-dimension averages
  const scores = blueprint.validationScores;
  const getScore = (dim: ArchitectureDimension) => scores.find(s => s.dimension === dim)?.score ?? 0;
  store.averageRoutingScore      = ((store.averageRoutingScore * n) + getScore('routing')) / newN;
  store.averageLayoutScore       = ((store.averageLayoutScore * n) + getScore('layouts')) / newN;
  store.averagePerformanceScore  = ((store.averagePerformanceScore * n) + getScore('performance')) / newN;
  store.averageAccessibilityScore = ((store.averageAccessibilityScore * n) + getScore('accessibility')) / newN;
  store.averageStateScore        = ((store.averageStateScore * n) + getScore('state')) / newN;
  store.averageFolderScore       = ((store.averageFolderScore * n) + getScore('folderStructure')) / newN;
  store.averageReuseScore        = ((store.averageReuseScore * n) + getScore('reusability')) / newN;

  // Distribution maps
  const pt = blueprint.projectType;
  store.projectTypeDistribution[pt] = (store.projectTypeDistribution[pt] ?? 0) + 1;
  const ss = blueprint.stateArchitecture.primaryStrategy;
  store.stateStrategyDistribution[ss] = (store.stateStrategyDistribution[ss] ?? 0) + 1;

  store.totalRuns = newN;

  // Top patterns
  store.topArchitecturePatterns = buildTopPatterns();

  // Trend
  recentScores.push(blueprint.overallScore);
  if (recentScores.length > MAX_RECENT) recentScores.shift();
  store.learningTrend = computeTrend(recentScores);
}

function buildTopPatterns(): string[] {
  const patterns: string[] = [];
  const dist = store.stateStrategyDistribution;
  const sortedStrategies = Object.entries(dist).sort(([,a], [,b]) => b - a);
  if (sortedStrategies[0]) patterns.push(`${sortedStrategies[0][0]} state (most common)`);
  const ptDist = store.projectTypeDistribution;
  const sortedTypes = Object.entries(ptDist).sort(([,a], [,b]) => b - a);
  if (sortedTypes[0]) patterns.push(`${sortedTypes[0][0]} (most built)`);
  if (store.averageRoutingScore >= 8) patterns.push('Strong routing architecture');
  if (store.averagePerformanceScore >= 8) patterns.push('High performance planning');
  return patterns.slice(0, 5);
}

function computeTrend(scores: number[]): ArchitectureMetricsStore['learningTrend'] {
  if (scores.length < 4) return 'stable';
  const half = Math.floor(scores.length / 2);
  const first = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const second = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half);
  if (second - first > 0.3) return 'rising';
  if (first - second > 0.3) return 'declining';
  return 'stable';
}

export function getArchitectureMetrics(): ArchitectureMetricsStore {
  return {
    ...store,
    averageOverallScore:    parseFloat(store.averageOverallScore.toFixed(2)),
    averageRoutingScore:    parseFloat(store.averageRoutingScore.toFixed(2)),
    averageLayoutScore:     parseFloat(store.averageLayoutScore.toFixed(2)),
    averagePerformanceScore: parseFloat(store.averagePerformanceScore.toFixed(2)),
    averageAccessibilityScore: parseFloat(store.averageAccessibilityScore.toFixed(2)),
    averageStateScore:      parseFloat(store.averageStateScore.toFixed(2)),
    averageFolderScore:     parseFloat(store.averageFolderScore.toFixed(2)),
    averageReuseScore:      parseFloat(store.averageReuseScore.toFixed(2)),
    averageRouteCount:      parseFloat(store.averageRouteCount.toFixed(1)),
    averageComponentCount:  parseFloat(store.averageComponentCount.toFixed(1)),
  };
}

export function resetArchitectureMetrics(): void {
  store.totalRuns = 0;
  store.averageOverallScore = 0;
  store.averageRoutingScore = 0;
  store.averageLayoutScore = 0;
  store.averagePerformanceScore = 0;
  store.averageAccessibilityScore = 0;
  store.averageStateScore = 0;
  store.averageFolderScore = 0;
  store.averageReuseScore = 0;
  store.projectTypeDistribution = {};
  store.stateStrategyDistribution = {};
  store.topArchitecturePatterns = [];
  store.learningTrend = 'stable';
  store.averageRouteCount = 0;
  store.averageComponentCount = 0;
  recentScores.length = 0;
}
