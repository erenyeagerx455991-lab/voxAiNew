// ── V7.3.4 Visual Quality Telemetry ──────────────────────────────────────────

import { getVisualRegressionRate, getRepairImprovementRate } from "../visual-diff/history.js";
import { getTopVisualPatterns, getWorstVisualPatterns } from "../visual-diff/visualLearning.js";
import type { VisualMetrics } from "../visual-diff/visualTypes.js";

interface BuildRecord {
  visualScore:     number;
  heroScore:       number;
  ctaScore:        number;
  layoutScore:     number;
  responsiveScore: number;
}

const records: BuildRecord[] = [];

export function recordVisualBuildMetrics(r: BuildRecord): void {
  records.push(r);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
}

export function getVisualMetrics(): VisualMetrics {
  return {
    totalBuilds:            records.length,
    averageVisualScore:     avg(records.map(r => r.visualScore)),
    averageHeroScore:       avg(records.map(r => r.heroScore)),
    averageCTAScore:        avg(records.map(r => r.ctaScore)),
    averageLayoutScore:     avg(records.map(r => r.layoutScore)),
    averageResponsiveScore: avg(records.map(r => r.responsiveScore)),
    visualRegressionRate:   getVisualRegressionRate(),
    repairImprovementRate:  getRepairImprovementRate(),
    topVisualPatterns:      getTopVisualPatterns(),
    worstVisualPatterns:    getWorstVisualPatterns(),
  };
}

export function resetVisualMetrics(): void {
  records.splice(0);
}
