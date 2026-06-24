// ── V7.2.2 Section-Level Retriever ───────────────────────────────────────────
// Retrieves top references for a SINGLE section type.
// Key difference from page-level retriever (retriever.ts):
//   - Filters corpus by sectionType first
//   - Scores within that filtered set → section-specific ranking
//   - Called once per section in the page plan (independent retrieval)

import { SECTION_INDEX, SECTION_CORPUS, type SectionRef, type SectionType, ALL_SECTION_TYPES } from './sectionCorpus.js';
import { type DesignStyle } from './designCorpus.js';
import { getQualityScore, isComponentDeprecated } from '../quality/componentMetrics.js';
import { getReferenceQualityScore, recordReferenceUsages } from './referenceMetrics.js';
import { recordSectionRetrieval } from './sectionRagMetrics.js';
import { getSectionQualityScore } from './sectionReferenceMetrics.js';
import { detectIndustries, extractKeywords, dnaLangToStyle } from './retriever.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SectionRetrievalInput {
  sectionType:    SectionType;
  dna:            Record<string, number>;   // DNA brand composition (brand → %)
  designLanguage: string;
  industry:       string[];
  keywords?:      string[];
  prompt?:        string;
  topK?:          number;
}

export interface SectionScoredRef extends SectionRef {
  retrievalScore: number;
  scoreBreakdown: {
    industryMatch:     number;
    styleMatch:        number;
    dnaMatch:          number;
    keywordMatch:      number;
    baseQuality:       number;
    qualityBoost:      number;
    referenceQuality:  number;
    deprecationPenalty: number;
    sectionLearning:   number;   // V7.2.3: outcome-feedback contribution
  };
}

export interface SectionRetrievalResult {
  sectionType:    SectionType;
  references:     SectionScoredRef[];
  totalScanned:   number;
  topStyle:       DesignStyle | null;
  averageQuality: number;
}

export interface PageSectionRetrievalResult {
  sections:          Map<SectionType, SectionRetrievalResult>;
  allReferenceIds:   string[];
  totalRetrievals:   number;
  hitRate:           number;  // fraction of sections with ≥1 result
}

// ── Scoring weights ───────────────────────────────────────────────────────────
const INDUSTRY_W        = 3;
const STYLE_W           = 6;
const DNA_W             = 4;
const KEYWORD_W         = 2;
const MAX_KW_BONUS      = 6;
const QUALITY_SCALE     = 0.5;
const LIVE_BOOST        = 2;
const REF_QUALITY_W     = 0.25;
const DEPRECATION       = -10;
// V7.2.3: Section learning — outcome-driven quality, max ~20% of total score.
// Quality score is 0-10, neutral=5. Contribution = (score-5) × 1.6 → range -8..+8.
// Theoretical max baseline ≈ 40, so +8 ≈ 20%. DNA (STYLE_W+DNA_W=10) always dominates.
const SECTION_LEARNING_W = 1.6;

// ── Scoring function (within a section-filtered corpus) ───────────────────────

function getDominantStyle(dna: Record<string, number>): DesignStyle | null {
  let best: string | null = null, bestPct = 0;
  for (const [brand, pct] of Object.entries(dna)) {
    if (pct > bestPct) { bestPct = pct; best = brand; }
  }
  return best as DesignStyle | null;
}

function scoreSectionRef(
  ref: SectionRef,
  input: SectionRetrievalInput & { style: DesignStyle | null; keywords: string[] },
): SectionScoredRef {
  const b = {
    industryMatch: 0, styleMatch: 0, dnaMatch: 0, keywordMatch: 0,
    baseQuality: 0, qualityBoost: 0, referenceQuality: 0, deprecationPenalty: 0,
    sectionLearning: 0,
  };

  // Industry match
  const matched = ref.industry.filter(ri =>
    input.industry.some(ii => ri.includes(ii) || ii.includes(ri))
  );
  b.industryMatch = matched.length * INDUSTRY_W;

  // Style match
  if (input.style && ref.style.includes(input.style)) b.styleMatch = STYLE_W;

  // DNA composition match
  const dominant = getDominantStyle(input.dna);
  if (dominant && ref.style.includes(dominant) && dominant !== input.style) {
    b.dnaMatch = DNA_W;
  }
  for (const [brand, pct] of Object.entries(input.dna)) {
    if (pct >= 20 && brand !== dominant && ref.style.includes(brand as DesignStyle)) {
      b.dnaMatch = Math.max(b.dnaMatch, DNA_W * 0.5);
    }
  }

  // Keyword match
  const searchText = [...ref.tags, ref.description.toLowerCase(), ref.id].join(' ');
  const matchedKw = input.keywords.filter(kw => searchText.includes(kw)).length;
  b.keywordMatch = Math.min(matchedKw * KEYWORD_W, MAX_KW_BONUS);

  // Baseline quality
  b.baseQuality = ref.qualityHint * QUALITY_SCALE;

  // Live quality boost
  const liveQ = ref.componentIds.length > 0
    ? Math.max(...ref.componentIds.map(id => getQualityScore(id)))
    : 5;
  if (liveQ > 8) b.qualityBoost = LIVE_BOOST;
  else if (liveQ < 4) b.qualityBoost = -1;

  // Deprecation penalty
  if (ref.componentIds.some(id => isComponentDeprecated(id))) {
    b.deprecationPenalty = DEPRECATION;
  }

  // V7.1.9 learnt reference quality
  b.referenceQuality = getReferenceQualityScore(ref.id) * REF_QUALITY_W;

  // V7.2.3 section outcome feedback — neutral refs get 0, improved/demoted shift ±8
  b.sectionLearning = (getSectionQualityScore(ref.id) - 5) * SECTION_LEARNING_W;

  const retrievalScore =
    b.industryMatch + b.styleMatch + b.dnaMatch +
    b.keywordMatch + b.baseQuality + b.qualityBoost +
    b.referenceQuality + b.deprecationPenalty + b.sectionLearning;

  return { ...ref, retrievalScore, scoreBreakdown: b };
}

// ── Section retrieval ─────────────────────────────────────────────────────────

export function retrieveSectionReferences(input: SectionRetrievalInput): SectionRetrievalResult {
  const topK   = input.topK ?? 5;
  const style  = dnaLangToStyle(input.designLanguage);
  const kwSrc  = input.prompt ?? '';
  const kws    = input.keywords ?? (kwSrc ? extractKeywords(kwSrc) : []);

  // Filter corpus to only this section type
  const sectionPool = SECTION_INDEX[input.sectionType] ?? [];

  // Score within section pool
  const scored = sectionPool.map(ref =>
    scoreSectionRef(ref, { ...input, style, keywords: kws }),
  );

  // Sort descending by score, then alphabetically for determinism
  scored.sort((a, b) => b.retrievalScore - a.retrievalScore || a.id.localeCompare(b.id));

  // Deduplicate by layout within section
  const seenLayouts = new Set<string>();
  const deduped: SectionScoredRef[] = [];
  for (const ref of scored) {
    if (!seenLayouts.has(ref.layout)) {
      seenLayouts.add(ref.layout);
      deduped.push(ref);
    }
  }

  const top = deduped.slice(0, topK);
  const avgQ = top.length > 0 ? top.reduce((s, r) => s + r.qualityHint, 0) / top.length : 0;

  // Record reference usages for V7.1.9 self-learning
  if (top.length > 0) {
    recordReferenceUsages(
      top.map(r => ({ id: r.id, category: r.category as string, dna: r.style[0] ?? 'unknown' })),
    );
  }

  // V7.2.2 section-level telemetry
  recordSectionRetrieval(input.sectionType, top.map(r => r.id));

  return {
    sectionType:  input.sectionType,
    references:   top,
    totalScanned: sectionPool.length,
    topStyle:     style,
    averageQuality: Math.round(avgQ * 100) / 100,
  };
}

// ── Page-level: retrieve all sections independently ───────────────────────────

export function retrieveAllSections(
  sectionOrder: string[],
  options: Omit<SectionRetrievalInput, 'sectionType'>,
): PageSectionRetrievalResult {
  const results = new Map<SectionType, SectionRetrievalResult>();
  const allReferenceIds: string[] = [];
  let hitCount = 0;

  for (const rawSection of sectionOrder) {
    const sectionType = normalizeSectionType(rawSection);
    if (!sectionType) continue;

    // Don't re-retrieve a section type already processed (e.g. two "cta" sections)
    if (results.has(sectionType)) continue;

    const result = retrieveSectionReferences({ ...options, sectionType });
    results.set(sectionType, result);
    allReferenceIds.push(...result.references.map(r => r.id));
    if (result.references.length > 0) hitCount++;
  }

  const sectionCount = results.size;
  return {
    sections:        results,
    allReferenceIds: [...new Set(allReferenceIds)], // deduplicate cross-section
    totalRetrievals: sectionCount,
    hitRate:         sectionCount > 0 ? hitCount / sectionCount : 0,
  };
}

// ── Context builder — section-labeled ────────────────────────────────────────

export function buildSectionRetrievalContext(
  pageResult: PageSectionRetrievalResult,
): string {
  if (pageResult.sections.size === 0) return '';

  const lines: string[] = [
    '## SECTION-LEVEL DESIGN REFERENCES',
    'Each section below has been independently matched to proven design patterns.',
    'Apply the specified layout and style to that section ONLY. Do not mix sections.',
    '',
  ];

  for (const [sectionType, result] of pageResult.sections) {
    if (result.references.length === 0) continue;

    lines.push(`### ${sectionType.toUpperCase()}`);
    for (const ref of result.references) {
      lines.push(`  • ${ref.id} [${ref.layout}] — ${ref.tags.slice(0, 4).join(', ')}`);
      lines.push(`    ${ref.description}`);
    }
    lines.push('');
  }

  lines.push('Each section must follow its specific reference. Do not apply hero patterns to features sections or vice versa.');
  return lines.join('\n');
}

// ── Utility: normalize section name → SectionType ─────────────────────────────

const SECTION_ALIASES: Record<string, SectionType> = {
  'navbar':       'navbar', 'navigation': 'navbar', 'header':     'navbar',
  'hero':         'hero',   'banner':     'hero',   'jumbotron':  'hero', 'above-the-fold': 'hero',
  'features':     'features', 'feature':  'features', 'capabilities': 'features',
  'pricing':      'pricing',  'plans':    'pricing',
  'testimonials': 'testimonials', 'reviews': 'testimonials', 'social-proof': 'testimonials', 'customers': 'testimonials',
  'faq':          'faq', 'frequently asked questions': 'faq', 'questions': 'faq',
  'dashboard':    'dashboard', 'app-preview': 'dashboard', 'preview': 'dashboard',
  'cta':          'cta', 'call-to-action': 'cta', 'signup':    'cta', 'waitlist': 'cta',
  'footer':       'footer',
};

export function normalizeSectionType(raw: string): SectionType | null {
  const lower = raw.toLowerCase().trim();
  if (SECTION_ALIASES[lower]) return SECTION_ALIASES[lower];
  for (const type of ALL_SECTION_TYPES) {
    if (lower.includes(type)) return type;
  }
  return null;
}
