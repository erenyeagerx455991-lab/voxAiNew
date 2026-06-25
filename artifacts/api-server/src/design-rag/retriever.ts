// ── V7.1.9 Design RAG — Retrieval Engine ─────────────────────────────────────
// Quality-aware, DNA-aware, self-learning ranked retrieval of design references.

import { DESIGN_CORPUS, type DesignReference, type DesignCategory, type DesignStyle } from "./designCorpus.js";
import { getQualityScore, isComponentDeprecated } from "../quality/componentMetrics.js";
import { recordDesignRetrieval } from "../telemetry/qualityMetrics.js";
import { getReferenceQualityScore, recordReferenceUsages } from "./referenceMetrics.js";
import { getDNAQualityScore } from "../design-dna/dnaLearning.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RetrievalInput {
  industry: string[];         // detected industries from prompt
  style: DesignStyle | null;  // dominant DNA style
  keywords: string[];         // meaningful words from prompt
  categories: DesignCategory[]; // sections in blueprint.sectionOrder
  dnaComposition?: Record<string, number>; // raw DNA brand percentages
  authState?: string;         // V7.2.6.1 — auth intent for RAG filtering
}

export interface ScoredReference extends DesignReference {
  retrievalScore: number;
  scoreBreakdown: {
    industryMatch: number;
    styleMatch: number;
    dnaMatch: number;
    keywordMatch: number;
    qualityBoost: number;
    deprecationPenalty: number;
    baseQuality: number;
    referenceQuality: number; // V7.1.9 learnt score contribution
    dnaQualityBonus: number;  // V7.3.5 historical DNA quality signal
  };
}

export interface RetrievalResult {
  references: ScoredReference[];
  totalScanned: number;
  topStyle: DesignStyle | null;
  topCategories: DesignCategory[];
  averageQuality: number;
}

// ── DNA → Style mapping ──────────────────────────────────────────────────────

const DNA_LANG_TO_STYLE: Record<string, DesignStyle> = {
  'minimal-flat':       'linear',
  'premium-gradient':   'stripe',
  'monochrome':         'vercel',
  'bold-motion':        'framer',
  'editorial':          'notion',
  'premium-light':      'apple',
  'glass':              'cursor',
  'dark-glass':         'cursor',
  'neon':               'cursor',
  'raycast':            'raycast',
};

export function dnaLangToStyle(designLanguage: string): DesignStyle | null {
  return DNA_LANG_TO_STYLE[designLanguage] ?? null;
}

// ── Industry keyword detection ────────────────────────────────────────────────

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  saas:         ['saas', 'software', 'platform', 'tool', 'service', 'subscription', 'cloud', 'app'],
  fintech:      ['fintech', 'finance', 'payment', 'banking', 'money', 'invoice', 'wallet', 'crypto', 'invest'],
  health:       ['health', 'wellness', 'medical', 'fitness', 'mental', 'therapy', 'doctor', 'patient', 'clinic'],
  edtech:       ['edtech', 'education', 'learning', 'course', 'lesson', 'student', 'teach', 'school', 'training'],
  ecommerce:    ['ecommerce', 'shop', 'store', 'retail', 'product', 'cart', 'checkout', 'buy', 'sell', 'marketplace'],
  developer:    ['developer', 'devtools', 'api', 'sdk', 'cli', 'npm', 'library', 'framework', 'code', 'programming'],
  enterprise:   ['enterprise', 'b2b', 'business', 'corporate', 'company', 'team', 'organization', 'workforce'],
  startup:      ['startup', 'launch', 'early-stage', 'mvp', 'founding', 'seed'],
  agency:       ['agency', 'creative', 'design', 'marketing', 'branding', 'studio'],
  analytics:    ['analytics', 'dashboard', 'metrics', 'data', 'insight', 'reporting', 'bi', 'intelligence'],
  security:     ['security', 'compliance', 'audit', 'soc2', 'gdpr', 'privacy', 'protection', 'shield'],
  ai:           ['ai', 'artificial intelligence', 'ml', 'machine learning', 'gpt', 'llm', 'neural', 'model', 'automation'],
  social:       ['social', 'community', 'network', 'connect', 'share', 'follow'],
  productivity: ['productivity', 'workflow', 'task', 'project', 'todo', 'collaboration', 'organize'],
  media:        ['media', 'content', 'creator', 'blog', 'newsletter', 'podcast', 'video', 'streaming'],
  travel:       ['travel', 'booking', 'hotel', 'flight', 'trip', 'vacation', 'destination'],
  gaming:       ['gaming', 'game', 'esports', 'player', 'leaderboard'],
  legal:        ['legal', 'law', 'contract', 'compliance', 'attorney', 'regulation'],
  consumer:     ['consumer', 'personal', 'individual', 'user', 'people', 'lifestyle'],
};

export function detectIndustries(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      detected.push(industry);
    }
  }
  return detected.length > 0 ? detected : ['saas', 'startup']; // fallback
}

export function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
    'from','up','about','into','through','is','are','was','were','be','been',
    'have','has','had','do','does','did','will','would','could','should','may',
    'might','must','shall','can','need','dare','ought','used','i','you','he',
    'she','it','we','they','this','that','these','those','my','your','his',
    'her','its','our','their','what','which','who','build','create','make',
    'app','website','landing','page','site','web',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w))
    .slice(0, 30);
}

function getDominantBrand(dna: Record<string, number>): string | null {
  let best: string | null = null;
  let bestPct = 0;
  for (const [brand, pct] of Object.entries(dna)) {
    if (pct > bestPct) { bestPct = pct; best = brand; }
  }
  return best;
}

// ── Scoring algorithm ─────────────────────────────────────────────────────────

const INDUSTRY_MATCH_WEIGHT       = 3;
const STYLE_MATCH_WEIGHT          = 5;
const DNA_MATCH_WEIGHT            = 4;
const KEYWORD_MATCH_WEIGHT        = 2;
const MAX_KEYWORD_BONUS           = 6;
const QUALITY_BASE_SCALE          = 0.5; // qualityHint 0–10 → 0–5 points
const QUALITY_LIVE_BOOST          = 2;   // if live metrics score > 8
const CATEGORY_BONUS              = 6;   // category matches a requested section
const DEPRECATION_PENALTY         = -10;
// V7.1.9: learnt reference quality (0–10) → max +2.5 pts; DNA match dominates at 4–9 pts
const REFERENCE_QUALITY_WEIGHT    = 0.25;

// V7.2.6.1: auth-state signal tags for retrieval filtering
const AUTH_BOOST_TAGS: Record<string, string[]> = {
  admin:         ['admin', 'dashboard', 'management', 'settings', 'control', 'backoffice', 'moderation', 'audit'],
  dashboard:     ['dashboard', 'analytics', 'workspace', 'metrics', 'reporting', 'app', 'saas'],
  authenticated: ['auth', 'profile', 'account', 'user', 'workspace', 'portal'],
  guest:         ['landing', 'marketing', 'hero', 'startup', 'agency', 'product'],
};
const AUTH_PENALIZE_TAGS: Record<string, string[]> = {
  admin:         ['landing', 'marketing', 'guest', 'homepage', 'startup'],
  dashboard:     ['landing', 'marketing', 'guest', 'homepage'],
  authenticated: [],
  guest:         ['admin', 'backoffice', 'management', 'audit'],
};
const AUTH_BOOST_SCORE    = 2.5;
const AUTH_PENALTY_SCORE  = -2.0;

function scoreAuthState(ref: DesignReference, authState?: string): number {
  if (!authState || authState === 'guest') {
    const penalizeTags = AUTH_PENALIZE_TAGS['guest'] ?? [];
    const searchText = [...ref.tags, ref.id].join(' ').toLowerCase();
    if (penalizeTags.some(t => searchText.includes(t))) return AUTH_PENALTY_SCORE;
    return 0;
  }
  const boostTags   = AUTH_BOOST_TAGS[authState]    ?? [];
  const penalizeTags = AUTH_PENALIZE_TAGS[authState] ?? [];
  const searchText  = [...ref.tags, ref.id, ref.description].join(' ').toLowerCase();
  const boosted   = boostTags.some(t => searchText.includes(t));
  const penalized = penalizeTags.some(t => searchText.includes(t));
  if (boosted && !penalized)  return AUTH_BOOST_SCORE;
  if (penalized && !boosted)  return AUTH_PENALTY_SCORE;
  return 0;
}

function scoreReference(
  ref: DesignReference,
  input: RetrievalInput,
): ScoredReference {
  const breakdown = {
    industryMatch: 0,
    styleMatch: 0,
    dnaMatch: 0,
    keywordMatch: 0,
    qualityBoost: 0,
    deprecationPenalty: 0,
    baseQuality: 0,
    referenceQuality: 0, // V7.1.9 learnt score
    dnaQualityBonus: 0,  // V7.3.5 historical DNA quality signal
  };

  // Industry match
  const matchedIndustries = ref.industry.filter(ri =>
    input.industry.some(ii => ri.includes(ii) || ii.includes(ri))
  );
  breakdown.industryMatch = matchedIndustries.length * INDUSTRY_MATCH_WEIGHT;

  // Style match (input.style from DNA)
  if (input.style && ref.style.includes(input.style)) {
    breakdown.styleMatch = STYLE_MATCH_WEIGHT;
  }

  // DNA composition match (secondary brands)
  if (input.dnaComposition) {
    const dominant = getDominantBrand(input.dnaComposition);
    const dominantStyle = dominant ? (dominant as DesignStyle) : null;
    if (dominantStyle && ref.style.includes(dominantStyle) && dominantStyle !== input.style) {
      breakdown.dnaMatch = DNA_MATCH_WEIGHT;
    }
    // Also check secondary brands
    for (const [brand, pct] of Object.entries(input.dnaComposition)) {
      if (pct >= 20 && brand !== dominant && ref.style.includes(brand as DesignStyle)) {
        breakdown.dnaMatch = Math.max(breakdown.dnaMatch, DNA_MATCH_WEIGHT * 0.5);
      }
    }
  }

  // Keyword match against tags and description
  const searchText = [...ref.tags, ref.description.toLowerCase(), ref.id].join(' ');
  const matchedKw = input.keywords.filter(kw => searchText.includes(kw)).length;
  breakdown.keywordMatch = Math.min(matchedKw * KEYWORD_MATCH_WEIGHT, MAX_KEYWORD_BONUS);

  // Category bonus if this ref's category is in requested sections
  const catBonus = input.categories.includes(ref.category) ? CATEGORY_BONUS : 0;

  // Baseline quality
  breakdown.baseQuality = ref.qualityHint * QUALITY_BASE_SCALE;

  // Live component quality boost (Phase 3 integration)
  const liveQuality = Math.max(...ref.componentIds.map(id => getQualityScore(id)));
  if (liveQuality > 8) {
    breakdown.qualityBoost = QUALITY_LIVE_BOOST;
  } else if (liveQuality < 4) {
    breakdown.qualityBoost = -1; // slight penalty for known-bad components
  }

  // Deprecation penalty (Phase 3 integration)
  const hasDeprecated = ref.componentIds.some(id => isComponentDeprecated(id));
  if (hasDeprecated) {
    breakdown.deprecationPenalty = DEPRECATION_PENALTY;
  }

  // V7.1.9: learnt reference quality score influences ranking (max +2.5 pts)
  // DNA+Style match yields 4–9 pts; quality can never flip a bad DNA match to a win.
  breakdown.referenceQuality = getReferenceQualityScore(ref.id) * REFERENCE_QUALITY_WEIGHT;

  // V7.2.6.1: auth-state signal — boost/penalize refs that match or clash with detected auth intent
  const authBonus = scoreAuthState(ref, input.authState);

  // V7.3.5: Historical DNA quality bonus — neutral (0) at cold start; clamped to ±7.5
  const dominantBrandForDNA = input.dnaComposition ? getDominantBrand(input.dnaComposition) : null;
  const dnaHistoricalScore = dominantBrandForDNA
    ? getDNAQualityScore({ primaryBrand: dominantBrandForDNA })
    : 5.0;
  breakdown.dnaQualityBonus = Math.max(-7.5, Math.min(7.5, (dnaHistoricalScore - 5) * 1.5));

  const retrievalScore =
    breakdown.industryMatch +
    breakdown.styleMatch +
    breakdown.dnaMatch +
    breakdown.keywordMatch +
    catBonus +
    breakdown.baseQuality +
    breakdown.qualityBoost +
    breakdown.deprecationPenalty +
    breakdown.referenceQuality +
    breakdown.dnaQualityBonus +
    authBonus;

  return { ...ref, retrievalScore, scoreBreakdown: breakdown };
}

// ── Top-K retrieval (Phase 2) ─────────────────────────────────────────────────

const TOP_K = 5;

export function retrieveDesignReferences(input: RetrievalInput): RetrievalResult {
  const scored = DESIGN_CORPUS.map(ref => scoreReference(ref, input));

  // Sort by score descending, then alphabetically by id for determinism
  scored.sort((a, b) => b.retrievalScore - a.retrievalScore || a.id.localeCompare(b.id));

  // Remove duplicates within same (category, layout)
  const seenLayouts = new Set<string>();
  const deduplicated: ScoredReference[] = [];
  for (const ref of scored) {
    const key = `${ref.category}:${ref.layout}`;
    if (!seenLayouts.has(key)) {
      seenLayouts.add(key);
      deduplicated.push(ref);
    }
  }

  const top = deduplicated.slice(0, TOP_K);
  const avgQuality = top.length > 0
    ? top.reduce((s, r) => s + r.qualityHint, 0) / top.length
    : 0;

  const result: RetrievalResult = {
    references: top,
    totalScanned: DESIGN_CORPUS.length,
    topStyle: input.style,
    topCategories: [...new Set(top.map(r => r.category))],
    averageQuality: Math.round(avgQuality * 100) / 100,
  };

  // Phase 7: record retrieval telemetry
  recordDesignRetrieval({
    count: top.length,
    style: input.style ?? 'unknown',
    categories: result.topCategories,
    averageQuality: result.averageQuality,
  });

  // V7.1.9: record usage for self-learning ranking
  if (top.length > 0) {
    recordReferenceUsages(
      top.map(r => ({
        id: r.id,
        category: r.category,
        dna: r.style[0] ?? 'unknown',
      }))
    );
  }

  return result;
}

// ── Context builder (Phase 4+5: Planner + Frontend injection) ─────────────────

export function buildRetrievalContext(result: RetrievalResult): string {
  if (result.references.length === 0) return '';

  const lines: string[] = [
    '## RETRIEVED DESIGN REFERENCES',
    'Use these proven design patterns as structural inspiration. Do NOT copy text/content. Adapt layouts only.',
    '',
  ];

  for (const ref of result.references) {
    lines.push(`### ${ref.category.toUpperCase()} — ${ref.id}`);
    lines.push(`Layout: ${ref.layout}`);
    lines.push(`Style: ${ref.style.join(', ')}`);
    lines.push(`Tags: ${ref.tags.join(', ')}`);
    lines.push(`Pattern: ${ref.description}`);
    if (ref.componentIds.length > 0) {
      lines.push(`Component: ${ref.componentIds[0]}`);
    }
    lines.push('');
  }

  lines.push('Apply these patterns to enhance layout quality. Do not generate generic layouts when strong references exist.');

  return lines.join('\n');
}

// ── Intent extraction from pipeline data ─────────────────────────────────────

export function extractRetrievalIntent(
  prompt: string,
  sectionOrder: string[],
  designLanguage: string,
  dnaComposition?: Record<string, number>,
  authState?: string,
): RetrievalInput {
  const industry = detectIndustries(prompt);
  const style = dnaLangToStyle(designLanguage);
  const keywords = extractKeywords(prompt);

  // Map sectionOrder strings to DesignCategory
  const VALID_CATEGORIES: DesignCategory[] = [
    'hero', 'features', 'pricing', 'testimonials', 'dashboard', 'faq', 'cta', 'navbar',
  ];
  const categories = sectionOrder
    .map(s => s.toLowerCase() as DesignCategory)
    .filter(s => VALID_CATEGORIES.includes(s));

  return { industry, style, keywords, categories, dnaComposition, authState };
}
