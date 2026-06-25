// ── V7.3.5 Design DNA Evolution Layer ────────────────────────────────────────
// Learns best patterns from historical build outcomes.
// Builds deterministic optimization hints injected into the planner prompt.
// No LLM calls. Additive only — never removes original DNA personality.

import {
  getTopHeroPatterns, getTopCTAPatterns, getTopLayoutPatterns,
  getTopMotionPatterns, getTopNavbarPatterns, getTopBrandPatterns,
  getTopDNAs, getWorstDNAs, getDNAStoreSize, getDNAStoreCounts, getAverageDNAQuality,
  type DNASummary,
} from './dnaMetrics.js';

// ── Learnt pattern records ────────────────────────────────────────────────────

export interface LearntPattern {
  pattern:      string;    // e.g. "Avatar trust rows"
  dimension:    string;    // e.g. "hero"
  scoreDelta:   number;    // average improvement seen
  occurrences:  number;
}

const _patternStore: LearntPattern[] = [];

export function recordLearntPattern(pattern: LearntPattern): void {
  const existing = _patternStore.find(p => p.pattern === pattern.pattern);
  if (existing) {
    existing.scoreDelta = (existing.scoreDelta * existing.occurrences + pattern.scoreDelta) / (existing.occurrences + 1);
    existing.occurrences++;
  } else {
    _patternStore.push({ ...pattern });
  }
}

export function getTopLearntPatterns(limit = 10): LearntPattern[] {
  return [..._patternStore]
    .sort((a, b) => b.scoreDelta - a.scoreDelta)
    .slice(0, limit);
}

// ── Phase 6 — Pattern extraction from DNA metrics ────────────────────────────
// Learns best hero/CTA/trust/layout/motion/dashboard patterns by reading the
// metrics store. Evolution is additive — extends the winning DNA with proven additions.

export interface EvolutionInsight {
  dimension:   string;
  winner:      string;
  qualityScore: number;
  usageCount:  number;
  note:        string;
}

export function computeEvolutionInsights(): EvolutionInsight[] {
  const insights: EvolutionInsight[] = [];

  const hero = getTopHeroPatterns(3);
  for (const h of hero) {
    if (h._n > 0 || h.usageCount > 0) {
      insights.push({
        dimension: 'hero',
        winner: h.id.replace('hero:', ''),
        qualityScore: h.qualityScore,
        usageCount: h.usageCount,
        note: `Hero style "${h.id.replace('hero:', '')}" scores ${h.qualityScore.toFixed(1)}/10`,
      });
    }
  }

  const cta = getTopCTAPatterns(3);
  for (const c of cta) {
    if (c.usageCount > 0) {
      insights.push({
        dimension: 'cta',
        winner: c.id.replace('cta:', ''),
        qualityScore: c.qualityScore,
        usageCount: c.usageCount,
        note: `CTA style "${c.id.replace('cta:', '')}" scores ${c.qualityScore.toFixed(1)}/10`,
      });
    }
  }

  const layout = getTopLayoutPatterns(3);
  for (const l of layout) {
    if (l.usageCount > 0) {
      insights.push({
        dimension: 'layout',
        winner: l.id.replace('layout:', ''),
        qualityScore: l.qualityScore,
        usageCount: l.usageCount,
        note: `Layout style "${l.id.replace('layout:', '')}" scores ${l.qualityScore.toFixed(1)}/10`,
      });
    }
  }

  const motion = getTopMotionPatterns(2);
  for (const m of motion) {
    if (m.usageCount > 0) {
      insights.push({
        dimension: 'motion',
        winner: m.id.replace('motion:', ''),
        qualityScore: m.qualityScore,
        usageCount: m.usageCount,
        note: `Motion style "${m.id.replace('motion:', '')}" scores ${m.qualityScore.toFixed(1)}/10`,
      });
    }
  }

  const navbar = getTopNavbarPatterns(2);
  for (const n of navbar) {
    if (n.usageCount > 0) {
      insights.push({
        dimension: 'navbar',
        winner: n.id.replace('navbar:', ''),
        qualityScore: n.qualityScore,
        usageCount: n.usageCount,
        note: `Navbar style "${n.id.replace('navbar:', '')}" scores ${n.qualityScore.toFixed(1)}/10`,
      });
    }
  }

  return insights.filter(i => i.qualityScore > 5.5);
}

// ── Phase 7 — Planner optimization hint builder ───────────────────────────────
// Produces a deterministic text block injected into the planner/codegen prompt.
// No LLM call — pure string construction from learned data.

export function buildDNAOptimizationHints(dnaComposition?: Record<string, number>): string {
  const insights = computeEvolutionInsights();
  const topPatterns = getTopLearntPatterns(5);

  if (insights.length === 0 && topPatterns.length === 0) return '';

  const lines: string[] = ['[DNA Optimization Layer — Historical Winner Patterns]'];

  if (insights.length > 0) {
    lines.push('Proven high-scoring DNA patterns (apply when compatible):');
    for (const ins of insights) {
      lines.push(`- ${ins.note}`);
    }
  }

  if (topPatterns.length > 0) {
    lines.push('Learnt additive patterns (augment the selected DNA, never replace):');
    for (const p of topPatterns) {
      const delta = p.scoreDelta > 0 ? `+${p.scoreDelta.toFixed(1)}` : p.scoreDelta.toFixed(1);
      lines.push(`- ${p.pattern} improves score ${delta} avg (${p.occurrences} builds)`);
    }
  }

  // If we know the DNA, suppress suggestions for competing brands
  if (dnaComposition && Object.keys(dnaComposition).length > 0) {
    lines.push('Note: Apply DNA-compatible patterns only. Do not override primary brand identity.');
  }

  lines.push('[End DNA Optimization Layer]');
  return lines.join('\n');
}

// ── Telemetry helpers ─────────────────────────────────────────────────────────

export { getTopDNAs, getWorstDNAs, getTopHeroPatterns, getTopCTAPatterns, getTopLayoutPatterns };

export function getDNAEvolutionMetrics() {
  const { promotedCount, demotedCount } = getDNAStoreCounts();
  return {
    trackedDNAs:       getDNAStoreSize(),
    averageDNAQuality: getAverageDNAQuality(),
    topDNAs:           getTopDNAs(10),
    worstDNAs:         getWorstDNAs(10),
    promotedCount,
    demotedCount,
    topHeroPatterns:    getTopHeroPatterns(10),
    topCTAPatterns:     getTopCTAPatterns(10),
    topLayoutPatterns:  getTopLayoutPatterns(10),
    topLearntPatterns:  getTopLearntPatterns(10),
    evolutionInsights:  computeEvolutionInsights(),
  };
}

export function resetDNAEvolution(): void {
  _patternStore.length = 0;
}

// Typed re-export for tests / leaderboard consumers
export type { DNASummary };
