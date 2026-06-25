// ── V7.3.4 Visual Learning Loop ───────────────────────────────────────────────
// Tracks high/low performing visual patterns and promotes/demotes them.
// Uses the same promotion/demotion pattern as referenceMetrics + criticLearning.

import type { VisualAnalysisResult } from "./visualTypes.js";

interface PatternRecord {
  pattern: string;
  category: 'hero' | 'cta' | 'layout' | 'responsive';
  totalOutcomes: number;
  highScoreCount: number;
  lowScoreCount: number;
  averageScore: number;
  qualityScore: number;   // 0–10 dynamic
  promoted: boolean;
  demoted: boolean;
}

const MIN_OUTCOMES = 3;
const HIGH_THRESHOLD = 8.0;
const LOW_THRESHOLD  = 5.0;
const PROMOTE_QUALITY = 7.5;
const DEMOTE_QUALITY  = 4.0;

const patternStore = new Map<string, PatternRecord>();

// ── Pattern extraction helpers ────────────────────────────────────────────────

function extractHeroPatterns(code: string): string[] {
  const patterns: string[] = [];
  if (/<h1[\s>]/i.test(code) && /Badge|pill/i.test(code)) patterns.push('hero:badge+headline');
  if (/size=['"]lg['"]/i.test(code) && /primary/i.test(code))  patterns.push('hero:large-primary-cta');
  if (/AvatarGroup|SocialProof/i.test(code))                   patterns.push('hero:social-proof');
  if (/min-h-screen|h-screen/i.test(code))                     patterns.push('hero:full-height');
  if (/gradient|from-|to-/i.test(code) && /<h1/i.test(code))  patterns.push('hero:gradient-headline');
  return patterns;
}

function extractCTAPatterns(code: string): string[] {
  const patterns: string[] = [];
  if (/variant=['"]default['"]/i.test(code) && /size=['"]lg['"]/i.test(code)) patterns.push('cta:lg-primary');
  if (/variant=['"]outline['"]/i.test(code)) patterns.push('cta:outline-secondary');
  if (/ArrowRight|→|chevron/i.test(code) && /<Button/i.test(code)) patterns.push('cta:arrow-icon');
  return patterns;
}

function extractLayoutPatterns(code: string): string[] {
  const patterns: string[] = [];
  if (/grid-cols-3/i.test(code))                              patterns.push('layout:3-col-grid');
  if (/grid-cols-2/i.test(code))                              patterns.push('layout:2-col-grid');
  if (/max-w-7xl|max-w-6xl|max-w-5xl/i.test(code))          patterns.push('layout:constrained-max-width');
  if (/py-24|py-32/i.test(code))                              patterns.push('layout:generous-section-padding');
  if (/gap-8|gap-12|gap-16/i.test(code))                     patterns.push('layout:generous-gap');
  return patterns;
}

function extractResponsivePatterns(code: string): string[] {
  const patterns: string[] = [];
  if (/md:grid-cols-3|lg:grid-cols-3/i.test(code))            patterns.push('responsive:3-col-breakpoint');
  if (/flex-col.*md:flex-row|flex-col.*lg:flex-row/i.test(code)) patterns.push('responsive:mobile-stack');
  if (/hidden.*md:flex|hidden.*lg:flex/i.test(code))          patterns.push('responsive:hidden-desktop-nav');
  return patterns;
}

export function extractVisualPatterns(code: string): string[] {
  return [
    ...extractHeroPatterns(code),
    ...extractCTAPatterns(code),
    ...extractLayoutPatterns(code),
    ...extractResponsivePatterns(code),
  ];
}

// ── Record outcome ─────────────────────────────────────────────────────────────

export function recordVisualOutcome(
  code: string,
  result: VisualAnalysisResult,
): void {
  const patterns = extractVisualPatterns(code);
  const isHighScore = result.visualScore >= HIGH_THRESHOLD;
  const isLowScore  = result.visualScore <= LOW_THRESHOLD;

  for (const pattern of patterns) {
    const existing = patternStore.get(pattern);
    const prev = existing ?? {
      pattern,
      category: pattern.split(':')[0] as PatternRecord['category'],
      totalOutcomes: 0,
      highScoreCount: 0,
      lowScoreCount: 0,
      averageScore: result.visualScore,
      qualityScore: result.visualScore,
      promoted: false,
      demoted: false,
    };

    const totalOutcomes  = prev.totalOutcomes + 1;
    const highScoreCount = prev.highScoreCount + (isHighScore ? 1 : 0);
    const lowScoreCount  = prev.lowScoreCount  + (isLowScore  ? 1 : 0);
    const averageScore   = (prev.averageScore * prev.totalOutcomes + result.visualScore) / totalOutcomes;

    // Dynamic quality score
    const winRate     = highScoreCount / totalOutcomes;
    const failRate    = lowScoreCount  / totalOutcomes;
    const rawQuality  = averageScore * 0.6 + winRate * 10 * 0.3 + (1 - failRate) * 10 * 0.1;
    const qualityScore = Math.min(10, Math.max(0, rawQuality));

    const promoted = totalOutcomes >= MIN_OUTCOMES && qualityScore >= PROMOTE_QUALITY;
    const demoted  = totalOutcomes >= MIN_OUTCOMES && qualityScore <= DEMOTE_QUALITY;

    patternStore.set(pattern, {
      ...prev, totalOutcomes, highScoreCount, lowScoreCount,
      averageScore: Math.round(averageScore * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100,
      promoted, demoted,
    });
  }
}

// ── Retrieval ──────────────────────────────────────────────────────────────────

export function getTopVisualPatterns(limit = 5): string[] {
  return [...patternStore.values()]
    .filter(r => r.totalOutcomes >= MIN_OUTCOMES && r.promoted)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, limit)
    .map(r => `${r.pattern} (q=${r.qualityScore})`);
}

export function getWorstVisualPatterns(limit = 5): string[] {
  return [...patternStore.values()]
    .filter(r => r.totalOutcomes >= MIN_OUTCOMES && r.demoted)
    .sort((a, b) => a.qualityScore - b.qualityScore)
    .slice(0, limit)
    .map(r => `${r.pattern} (q=${r.qualityScore})`);
}

export function getVisualLearningMetrics() {
  const all = [...patternStore.values()];
  return {
    totalPatterns:    all.length,
    promotedPatterns: all.filter(r => r.promoted).length,
    demotedPatterns:  all.filter(r => r.demoted).length,
    topPatterns:      getTopVisualPatterns(),
    worstPatterns:    getWorstVisualPatterns(),
  };
}

export function resetVisualLearning(): void {
  patternStore.clear();
}
