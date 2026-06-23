// ── V7.2.2 Section RAG Telemetry Store ───────────────────────────────────────
// Tracks per-section retrieval counts, top reference usage, and hit rate.
// Exposed via GET /telemetry/quality → { sectionRag: ... }

import type { SectionType } from './sectionCorpus.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SectionRagTelemetry {
  sectionRetrievals: number;             // total section-level retrieval calls
  sectionCounts:     Record<SectionType, number>;  // calls per section type
  topHeroRefs:       string[];           // top 3 hero refs by usage
  topPricingRefs:    string[];           // top 3 pricing refs by usage
  topFeatureRefs:    string[];           // top 3 feature refs by usage
  topTestimonialRefs: string[];
  topFaqRefs:        string[];
  hitRate:           number;             // fraction of sections that returned ≥1 ref
  corpusSize:        number;
  lastUpdated:       number;
}

// ── In-memory store ───────────────────────────────────────────────────────────

let _totalRetrievals   = 0;
let _hitCount          = 0;
let _retrievalAttempts = 0;

const _sectionCounts: Record<string, number> = {};
const _refUsage: Record<string, number> = {};

// ── Public API ────────────────────────────────────────────────────────────────

/** Called by sectionRetriever.ts after each section retrieval. */
export function recordSectionRetrieval(sectionType: SectionType, refIds: string[]): void {
  _totalRetrievals++;
  _retrievalAttempts++;
  _sectionCounts[sectionType] = (_sectionCounts[sectionType] ?? 0) + 1;

  if (refIds.length > 0) _hitCount++;

  for (const id of refIds) {
    _refUsage[id] = (_refUsage[id] ?? 0) + 1;
  }
}

/** Returns top-N ref ids for a given section prefix (e.g. 'hero-', 'pricing-'). */
function topRefsForSection(prefix: string, n = 3): string[] {
  return Object.entries(_refUsage)
    .filter(([id]) => id.startsWith(prefix))
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([id]) => id);
}

export function getSectionRagMetrics(corpusSize: number): SectionRagTelemetry {
  const sectionTypes: SectionType[] = [
    'hero', 'features', 'pricing', 'testimonials',
    'dashboard', 'faq', 'cta', 'navbar', 'footer',
  ];

  const counts = Object.fromEntries(
    sectionTypes.map(t => [t, _sectionCounts[t] ?? 0]),
  ) as Record<SectionType, number>;

  return {
    sectionRetrievals: _totalRetrievals,
    sectionCounts:     counts,
    topHeroRefs:       topRefsForSection('hero-'),
    topPricingRefs:    topRefsForSection('pricing-'),
    topFeatureRefs:    topRefsForSection('features-'),
    topTestimonialRefs: topRefsForSection('testimonials-'),
    topFaqRefs:        topRefsForSection('faq-'),
    hitRate:           _retrievalAttempts > 0 ? _hitCount / _retrievalAttempts : 0,
    corpusSize,
    lastUpdated:       Date.now(),
  };
}

export function resetSectionRagMetrics(): void {
  _totalRetrievals   = 0;
  _hitCount          = 0;
  _retrievalAttempts = 0;
  for (const key of Object.keys(_sectionCounts)) delete _sectionCounts[key];
  for (const key of Object.keys(_refUsage)) delete _refUsage[key];
}

/** For testing: get raw usage map. */
export function getRefUsageMap(): Readonly<Record<string, number>> {
  return _refUsage;
}
