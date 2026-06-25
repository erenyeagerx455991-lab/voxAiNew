// ── V7.2.1 Benchmark Schema — Shared Types ────────────────────────────────────

export type Provider = 'voxai' | 'lovable' | 'bolt' | 'v0';

export const ALL_PROVIDERS: Provider[] = ['voxai', 'lovable', 'bolt', 'v0'];

export const BENCHMARK_CATEGORIES = [
  'SaaS', 'AI', 'Fintech', 'Agency', 'Startup',
  'Dashboard', 'Portfolio', 'Healthcare', 'Ecommerce', 'Restaurant',
] as const;

export type BenchmarkCategory = typeof BENCHMARK_CATEGORIES[number];

// ── Raw result stored per build ───────────────────────────────────────────────

export interface EvaluatorScores {
  hero:          number;
  layout:        number;
  cta:           number;
  accessibility: number;
  shadcn:        number;
  consistency:   number;
  overall:       number;
  visualScore:   number;
  heroVisual:    number;
  ctaVisual:     number;
  layoutVisual:  number;
  responsiveVisual: number;
}

export interface LighthouseScores {
  performance:   number;
  accessibility: number;
  bestPractices: number;
  seo:           number;
  captured:      boolean;
}

export interface BenchmarkResult {
  provider:        Provider;
  promptId:        string;
  category:        BenchmarkCategory;
  timestamp:       number;
  evaluatorScores: EvaluatorScores;
  lighthouseScores: LighthouseScores;
  repairPasses:    number;
  repairRequired:  boolean;
  buildDurationMs: number;
  html?:           string;
  metadata:        Record<string, unknown>;
}

// ── Aggregated per-provider average ──────────────────────────────────────────

export interface ProviderAverage {
  provider:        Provider;
  sampleCount:     number;
  evaluator: {
    hero:          number;
    layout:        number;
    cta:           number;
    accessibility: number;
    shadcn:        number;
    consistency:   number;
    overall:       number;
    visualScore:   number;
    heroVisual:    number;
    ctaVisual:     number;
    layoutVisual:  number;
    responsiveVisual: number;
  };
  lighthouse: {
    performance:   number;
    accessibility: number;
    bestPractices: number;
    seo:           number;
    captured:      boolean;
  };
  repairRate:      number;
}

// ── Category-level scores ─────────────────────────────────────────────────────

export interface CategoryScore {
  category:    BenchmarkCategory;
  provider:    Provider;
  sampleCount: number;
  avgOverall:  number;
  avgHero:     number;
  avgLayout:   number;
}

// ── Quality delta (VoxAI vs one competitor) ───────────────────────────────────

export interface QualityDelta {
  competitor:    Provider;
  evaluator: {
    hero:          number;   // positive = VoxAI wins
    layout:        number;
    cta:           number;
    accessibility: number;
    shadcn:        number;
    consistency:   number;
    overall:       number;
    visualScore:   number;
    heroVisual:    number;
    ctaVisual:     number;
    layoutVisual:  number;
    responsiveVisual: number;
  };
  lighthouse: {
    performance:   number;
    accessibility: number;
    bestPractices: number;
    seo:           number;
  };
  repairRateDelta: number;   // positive = VoxAI needs fewer repairs
}

// ── Weakness entry ────────────────────────────────────────────────────────────

export type WeaknessDimension =
  | 'hero' | 'layout' | 'cta' | 'accessibility' | 'shadcn' | 'consistency'
  | 'lighthouse.performance' | 'lighthouse.accessibility'
  | 'lighthouse.bestPractices' | 'lighthouse.seo'
  | 'repairRate';

export interface Weakness {
  rank:      number;
  dimension: WeaknessDimension;
  voxaiScore: number;
  bestCompetitorScore: number;
  bestCompetitor: Provider;
  gap:       number;           // bestCompetitorScore - voxaiScore (positive = we lose)
  severity:  'critical' | 'moderate' | 'minor';
  recommendation: string;
}

// ── Full benchmark report ─────────────────────────────────────────────────────

export interface BenchmarkReport {
  generatedAt:    number;
  totalRuns:      number;
  providers:      Provider[];
  averageScores:  Record<Provider, ProviderAverage>;
  categoryScores: CategoryScore[];
  deltas:         Record<Provider, QualityDelta>;   // keyed by competitor
  weaknesses:     Weakness[];
  dataQuality: {
    voxaiRuns:    number;
    lovableRuns:  number;
    boltRuns:     number;
    v0Runs:       number;
    isBaselineData: boolean;
  };
}

// ── Telemetry shape for /telemetry/quality ────────────────────────────────────

export interface BenchmarkTelemetry {
  runs:           number;
  providers:      string[];
  averageScores:  Partial<Record<Provider, Partial<ProviderAverage>>>;
  categoryScores: CategoryScore[];
  weaknesses:     Weakness[];
  isBaselineData: boolean;
  lastUpdated:    number;
}
