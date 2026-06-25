// ── V7.3.5 Design DNA Learning — Outcome Recorder ────────────────────────────
// Records final (post-repair) outcomes for all DNA design dimensions.
// Never uses pre-repair scores. Feeds dnaMetrics.ts store.
// Deterministic — no LLM calls.

import { recordDNADimensionOutcome, getDNAQualityScore as _getQ, type DNAOutcomeInput } from './dnaMetrics.js';

// ── Public types ──────────────────────────────────────────────────────────────

export interface DNABuildOutcome {
  // DNA dimension values — what this build used
  primaryBrand:     string;   // e.g. "linear"
  heroStyle:        string;   // e.g. "split-layout"
  ctaStyle:         string;   // e.g. "primary-gradient"
  layoutStyle:      string;   // e.g. "bold-motion"
  motionStyle:      string;   // e.g. "subtle"
  navbarStyle:      string;   // e.g. "auth-v2"
  formStyle:        string;   // e.g. "react-hook-form"
  dashboardStyle:   string;   // e.g. "data-table"
  pricingStyle:     string;   // e.g. "three-tier"

  // Final post-repair scores (0–10 each)
  overallScore:     number;
  visualScore:      number;
  criticScore:      number;
  conversionScore:  number;
  motionScore:      number;
  tokenScore:       number;
  treeScore:        number;
  repairTriggered:  boolean;
}

// ── Dimension map ─────────────────────────────────────────────────────────────

const DIMENSIONS: Array<{ key: keyof DNABuildOutcome; prefix: string }> = [
  { key: 'primaryBrand',   prefix: 'brand'     },
  { key: 'heroStyle',      prefix: 'hero'      },
  { key: 'ctaStyle',       prefix: 'cta'       },
  { key: 'layoutStyle',    prefix: 'layout'    },
  { key: 'motionStyle',    prefix: 'motion'    },
  { key: 'navbarStyle',    prefix: 'navbar'    },
  { key: 'formStyle',      prefix: 'form'      },
  { key: 'dashboardStyle', prefix: 'dashboard' },
  { key: 'pricingStyle',   prefix: 'pricing'   },
];

// ── Phase 2 — recordDNAOutcome ────────────────────────────────────────────────

export function recordDNAOutcome(outcome: DNABuildOutcome): void {
  const shared: Omit<DNAOutcomeInput, 'dimensionId'> = {
    overallScore:    outcome.overallScore,
    visualScore:     outcome.visualScore,
    criticScore:     outcome.criticScore,
    conversionScore: outcome.conversionScore,
    motionScore:     outcome.motionScore,
    tokenScore:      outcome.tokenScore,
    treeScore:       outcome.treeScore,
    repairTriggered: outcome.repairTriggered,
  };

  for (const { key, prefix } of DIMENSIONS) {
    const val = String(outcome[key] ?? '').trim();
    if (val && val !== 'unknown' && val !== '') {
      recordDNADimensionOutcome({ dimensionId: `${prefix}:${val}`, ...shared });
    }
  }
}

// ── DNA quality score lookup (for evaluator) ──────────────────────────────────
// Computes the average quality across all DNA dimensions of a build.
// Returns 5.0 (neutral) when there is no historical data.

export interface DNAScoreInput {
  primaryBrand?:   string;
  heroStyle?:      string;
  ctaStyle?:       string;
  layoutStyle?:    string;
  motionStyle?:    string;
  navbarStyle?:    string;
  formStyle?:      string;
  dashboardStyle?: string;
  pricingStyle?:   string;
}

export function getDNAQualityScore(input: DNAScoreInput): number {
  const ids: string[] = [];

  const map: Array<[string | undefined, string]> = [
    [input.primaryBrand,   'brand'],
    [input.heroStyle,      'hero'],
    [input.ctaStyle,       'cta'],
    [input.layoutStyle,    'layout'],
    [input.motionStyle,    'motion'],
    [input.navbarStyle,    'navbar'],
    [input.formStyle,      'form'],
    [input.dashboardStyle, 'dashboard'],
    [input.pricingStyle,   'pricing'],
  ];

  for (const [val, prefix] of map) {
    if (val && val.trim() !== '') ids.push(`${prefix}:${val.trim()}`);
  }

  if (ids.length === 0) return 5.0;

  const scores = ids.map(id => _getQ(id));
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  return Math.round(Math.max(0, Math.min(10, avg)) * 100) / 100;
}

// ── Telemetry helper ──────────────────────────────────────────────────────────

export { getDNAQualityScore as lookupDNAQualityScore };
