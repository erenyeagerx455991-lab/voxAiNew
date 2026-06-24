// ── V7.3.2 Component Tree Metrics ─────────────────────────────────────────────
// Tracks tree generation statistics across builds.

import type { PageTree } from "../component-tree/componentTreeTypes.js";

interface TreeBuildRecord {
  sectionCount: number;
  totalNodes: number;
  depth: number;
  industry: string;
  primaryDNA: string;
  authState: string;
  treeQualityScore: number;
  componentNames: string[];
  shadcnComponents: string[];
  validationErrors: number;
  validationWarnings: number;
}

interface ComponentTreeMetrics {
  totalTrees: number;
  averageTreeDepth: number;
  averageNodeCount: number;
  averageSectionCount: number;
  averageQualityScore: number;
  mostUsedComponents: Array<{ name: string; count: number }>;
  leastUsedComponents: Array<{ name: string; count: number }>;
  validationPassRate: number;
  industryDistribution: Record<string, number>;
  dnaDistribution: Record<string, number>;
  authStateDistribution: Record<string, number>;
  totalValidationErrors: number;
  totalValidationWarnings: number;
}

// ── In-memory store ───────────────────────────────────────────────────────────

const treeRecords: TreeBuildRecord[] = [];
const componentUsageCounts: Map<string, number> = new Map();

// ── Record a tree build ───────────────────────────────────────────────────────

export function recordTreeBuild(
  tree: PageTree,
  treeQualityScore: number,
  validationErrors = 0,
  validationWarnings = 0,
): void {
  const record: TreeBuildRecord = {
    sectionCount:      tree.statistics.sectionCount,
    totalNodes:        tree.statistics.totalNodes,
    depth:             tree.statistics.maxDepth,
    industry:          tree.metadata.industry,
    primaryDNA:        tree.metadata.primaryDNA,
    authState:         tree.metadata.authState,
    treeQualityScore,
    componentNames:    tree.statistics.componentNames,
    shadcnComponents:  tree.statistics.shadcnComponentsUsed,
    validationErrors,
    validationWarnings,
  };

  treeRecords.push(record);

  // Track component usage frequencies
  for (const name of record.componentNames) {
    componentUsageCounts.set(name, (componentUsageCounts.get(name) ?? 0) + 1);
  }

  // Cap at 500 records
  if (treeRecords.length > 500) treeRecords.splice(0, treeRecords.length - 500);
}

// ── Get metrics snapshot ──────────────────────────────────────────────────────

export function getComponentTreeMetrics(): ComponentTreeMetrics {
  if (treeRecords.length === 0) {
    return {
      totalTrees: 0,
      averageTreeDepth: 0,
      averageNodeCount: 0,
      averageSectionCount: 0,
      averageQualityScore: 0,
      mostUsedComponents: [],
      leastUsedComponents: [],
      validationPassRate: 1,
      industryDistribution: {},
      dnaDistribution: {},
      authStateDistribution: {},
      totalValidationErrors: 0,
      totalValidationWarnings: 0,
    };
  }

  const n = treeRecords.length;

  const avgDepth   = treeRecords.reduce((s, r) => s + r.depth, 0) / n;
  const avgNodes   = treeRecords.reduce((s, r) => s + r.totalNodes, 0) / n;
  const avgSections = treeRecords.reduce((s, r) => s + r.sectionCount, 0) / n;
  const avgQuality = treeRecords.reduce((s, r) => s + r.treeQualityScore, 0) / n;

  const totalErrors   = treeRecords.reduce((s, r) => s + r.validationErrors, 0);
  const totalWarnings = treeRecords.reduce((s, r) => s + r.validationWarnings, 0);
  const passCount     = treeRecords.filter(r => r.validationErrors === 0).length;
  const passRate      = passCount / n;

  const industryDist: Record<string, number> = {};
  const dnaDist: Record<string, number> = {};
  const authDist: Record<string, number> = {};

  for (const r of treeRecords) {
    industryDist[r.industry] = (industryDist[r.industry] ?? 0) + 1;
    dnaDist[r.primaryDNA]    = (dnaDist[r.primaryDNA]    ?? 0) + 1;
    authDist[r.authState]    = (authDist[r.authState]    ?? 0) + 1;
  }

  const sortedComponents = [...componentUsageCounts.entries()].sort(([, a], [, b]) => b - a);
  const mostUsed  = sortedComponents.slice(0, 10).map(([name, count]) => ({ name, count }));
  const leastUsed = sortedComponents.slice(-5).map(([name, count]) => ({ name, count }));

  return {
    totalTrees:          n,
    averageTreeDepth:    Math.round(avgDepth   * 10) / 10,
    averageNodeCount:    Math.round(avgNodes   * 10) / 10,
    averageSectionCount: Math.round(avgSections * 10) / 10,
    averageQualityScore: Math.round(avgQuality * 10) / 10,
    mostUsedComponents:  mostUsed,
    leastUsedComponents: leastUsed,
    validationPassRate:  Math.round(passRate   * 100) / 100,
    industryDistribution: industryDist,
    dnaDistribution:     dnaDist,
    authStateDistribution: authDist,
    totalValidationErrors:   totalErrors,
    totalValidationWarnings: totalWarnings,
  };
}

export function resetComponentTreeMetrics(): void {
  treeRecords.length = 0;
  componentUsageCounts.clear();
}
