// ── V7.3.4 Visual Analyzer — Entry Point ─────────────────────────────────────
// Combines hero, CTA, layout, responsive, and DOM analyzers into a single
// VisualAnalysisResult. This is the main function called by the pipeline.

import { analyzeHero } from "./heroAnalyzer.js";
import { analyzeCTA } from "./ctaAnalyzer.js";
import { analyzeLayout } from "./layoutAnalyzer.js";
import { analyzeResponsive } from "./responsiveAnalyzer.js";
import { analyzeDom } from "./domAnalyzer.js";
import { captureVisualSnapshot } from "./screenshotCapture.js";
import type { VisualAnalysisResult, VisualIssue } from "./visualTypes.js";

// Weights for composite visual score
const HERO_WEIGHT       = 0.30;
const CTA_WEIGHT        = 0.25;
const LAYOUT_WEIGHT     = 0.25;
const RESPONSIVE_WEIGHT = 0.20;

export function analyzeVisuals(
  code: string,
  sectionOrder: string[] = [],
  candidateId = 'unknown',
  buildId = 'unknown',
): VisualAnalysisResult {
  const hero       = analyzeHero(code, sectionOrder);
  const cta        = analyzeCTA(code);
  const layout     = analyzeLayout(code);
  const responsive = analyzeResponsive(code);
  const dom        = analyzeDom(code);

  const visualScore =
    hero.score       * HERO_WEIGHT +
    cta.score        * CTA_WEIGHT  +
    layout.score     * LAYOUT_WEIGHT +
    responsive.score * RESPONSIVE_WEIGHT;

  const allIssues: VisualIssue[] = [
    ...hero.issues,
    ...cta.issues,
    ...layout.issues,
    ...responsive.issues,
    ...dom.issues,
  ];

  // Sort: critical → major → minor
  const severityOrder = { critical: 0, major: 1, minor: 2 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const snapshot = captureVisualSnapshot(code, candidateId, buildId, 'desktop');

  return {
    heroScore:       Math.round(hero.score * 10) / 10,
    ctaScore:        Math.round(cta.score * 10) / 10,
    layoutScore:     Math.round(layout.score * 10) / 10,
    responsiveScore: Math.round(responsive.score * 10) / 10,
    visualScore:     Math.round(visualScore * 10) / 10,
    issues:          allIssues,
    domIssues:       dom.overflowIssues,
    snapshot: {
      viewport:          'desktop',
      structureHash:     snapshot.structureHash,
      sectionCount:      snapshot.sectionCount,
      componentCount:    snapshot.componentCount,
      hasHero:           snapshot.hasHero,
      hasCTA:            snapshot.hasCTA,
      hasNav:            snapshot.hasNav,
      hasFooter:         snapshot.hasFooter,
      responsiveClasses: snapshot.responsiveClasses,
      gridClasses:       snapshot.gridClasses,
    },
  };
}

// ── Visual score summary string for prompts ────────────────────────────────────

export function buildVisualContextString(result: VisualAnalysisResult): string {
  const criticals = result.issues.filter(i => i.severity === 'critical');
  const majors    = result.issues.filter(i => i.severity === 'major');
  const lines = [
    `VISUAL QUALITY SCORES:`,
    `  Hero: ${result.heroScore}/10  CTA: ${result.ctaScore}/10  Layout: ${result.layoutScore}/10  Responsive: ${result.responsiveScore}/10`,
    `  Overall Visual Score: ${result.visualScore}/10`,
    ``,
  ];
  if (criticals.length > 0) {
    lines.push(`CRITICAL VISUAL ISSUES (must fix):`);
    criticals.forEach(i => lines.push(`  - [${i.category}] ${i.message}`));
    lines.push('');
  }
  if (majors.length > 0) {
    lines.push(`MAJOR VISUAL ISSUES:`);
    majors.slice(0, 5).forEach(i => lines.push(`  - [${i.category}] ${i.message}`));
  }
  return lines.join('\n');
}
