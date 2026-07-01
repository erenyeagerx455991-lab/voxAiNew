/**
 * V8.2 — UX Heuristics Engine
 *
 * Static code analysis — no LLM calls, no side effects.
 * Scans JSX/HTML source strings to score each UX dimension 0–10.
 * All functions are pure and synchronous.
 */

import type { UXDimensions } from "./uxTypes.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function countMatches(code: string, pattern: RegExp): number {
  return (code.match(pattern) ?? []).length;
}

function clamp(value: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(count: number, baseline: number, max = 10): number {
  return clamp(Math.round((count / baseline) * max));
}

// ── Individual dimension scorers ──────────────────────────────────────────────

/** Visual clarity: text hierarchy, contrast hints, clean layout */
function scoreVisualClarity(code: string): number {
  let score = 5;
  // Positive signals
  if (/<h1[\s>]/i.test(code))   score += 2;
  if (/<h2[\s>]/i.test(code))   score += 1;
  if (/text-5xl|text-6xl|text-7xl|text-8xl/i.test(code)) score += 1;
  if (/font-bold|font-extrabold|font-black/i.test(code)) score += 1;
  // Negative signals — too many competing sizes
  const headingCount = countMatches(code, /<h[1-6][\s>]/gi);
  if (headingCount > 8) score -= 1;
  // Prominent leading section
  if (/hero|<main|<section/i.test(code)) score += 1;
  if (/max-w-\w+/i.test(code))  score += 1;
  return clamp(score);
}

/** Cognitive load: inversely related to element/text density */
function scoreCognitiveLoad(code: string): number {
  // High score = LOW cognitive load = GOOD
  const lineCount   = code.split('\n').length;
  const elementCount = countMatches(code, /<[A-Z][a-zA-Z]+|<div|<section|<article/g);
  const textNodes   = countMatches(code, />[^<]{20,}/g);

  let score = 7;
  if (elementCount > 80)  score -= 2;
  if (elementCount > 120) score -= 2;
  if (textNodes > 30)     score -= 1;
  if (lineCount > 600)    score -= 1;
  // Good: focused, fewer competing items
  if (elementCount < 40)  score += 1;
  if (/focus|single|clean/i.test(code)) score += 1;
  return clamp(score);
}

/** CTA discoverability: presence and prominence of call-to-action elements */
function scoreCtaDiscoverability(code: string): number {
  let score = 2;
  // Primary CTA signals
  const buttonCount = countMatches(code, /<[Bb]utton|<Button/g);
  const ctaKeywords = countMatches(code, /\b(Get Started|Sign Up|Try|Buy|Start|Join|Download|Free|Demo|Request)\b/i);
  score += Math.min(buttonCount, 4);
  score += Math.min(ctaKeywords, 2);
  // Visual prominence signals
  if (/bg-primary|bg-indigo|bg-violet|bg-blue|bg-gradient/i.test(code)) score += 1;
  if (/text-white.*px-|px-.*text-white/i.test(code)) score += 1;
  if (/rounded-full|rounded-lg.*font-/i.test(code)) score += 1;
  // href links acting as CTAs
  if (/href=.*sign|href=.*get-started|href=.*start/i.test(code)) score += 1;
  return clamp(score);
}

/** Reading flow: heading hierarchy and paragraph structure */
function scoreReadingFlow(code: string): number {
  let score = 4;
  const hasH1 = /<h1[\s>]/i.test(code);
  const hasH2 = /<h2[\s>]/i.test(code);
  const hasH3 = /<h3[\s>]/i.test(code);
  const hasP  = /<p[\s>]/i.test(code);

  if (hasH1)               score += 2;
  if (hasH2)               score += 1;
  if (hasH3 && hasH2)     score += 1;
  if (hasP)                score += 1;
  // Well-structured prose
  if (/leading-relaxed|leading-loose/i.test(code)) score += 1;
  // Negative: h1 without any h2 (poor hierarchy)
  if (hasH1 && !hasH2)    score -= 1;
  return clamp(score);
}

/** Trust signals: testimonials, logos, social proof, guarantees */
function scoreTrust(code: string): number {
  let score = 3;
  // Testimonials / reviews
  if (/testimonial|review|quote|said|says/i.test(code))      score += 2;
  // Ratings / stars
  if (/star|rating|\d+\s*\/\s*5|\d+\.\d\s*stars?/i.test(code)) score += 1;
  // Numbers as social proof
  if (/\d{1,3},?\d{3}\+?\s*(users?|customers?|teams?|companies)/i.test(code)) score += 1;
  // Security / trust badges
  if (/secure|ssl|encrypt|gdpr|soc2|iso|verified|badge|shield/i.test(code)) score += 1;
  // Company logos
  if (/logo|partner|powered by|trusted by|as seen/i.test(code)) score += 1;
  // Guarantee / refund
  if (/guarantee|refund|no credit card|risk.free|cancel anytime/i.test(code)) score += 1;
  // Award / press mentions
  if (/award|featured in|press|news|techcrunch|forbes/i.test(code)) score += 1;
  return clamp(score);
}

/** Scanning efficiency: bullets, cards, badges for quick reading */
function scoreScanningEfficiency(code: string): number {
  let score = 3;
  // Lists
  const liCount = countMatches(code, /<li[\s>]/gi);
  score += Math.min(Math.floor(liCount / 3), 3);
  // Cards / grid patterns
  if (/grid|card|flex.*wrap/i.test(code)) score += 1;
  // Badges / chips
  if (/badge|chip|pill|tag/i.test(code)) score += 1;
  // Icons as scannable elements
  if (/CheckIcon|CheckCircle|Icon|svg/i.test(code)) score += 1;
  // Feature bullets with icons
  if (/Check.*text|text.*Check/i.test(code)) score += 1;
  return clamp(score);
}

/** Navigation simplicity: nav structure, item count */
function scoreNavigationSimplicity(code: string): number {
  let score = 4;
  const hasNav  = /<nav[\s>]/i.test(code);
  const hasMenu = /navbar|nav-|navigation|menu/i.test(code);
  if (hasNav || hasMenu) score += 2;
  // Link count — fewer is simpler
  const linkCount = countMatches(code, /<a[\s>]|href=/gi);
  if (linkCount < 10)  score += 2;
  else if (linkCount < 20) score += 1;
  else if (linkCount > 40) score -= 1;
  // Mobile-friendly
  if (/hamburger|mobile-menu|HamburgerMenu|MenuIcon/i.test(code)) score += 1;
  // Dropdown navigation (adds complexity)
  if (/dropdown|submenu|flyout/i.test(code)) score -= 1;
  return clamp(score);
}

/** Form friction: inversely scored (high = low friction = good) */
function scoreFormFriction(code: string): number {
  const hasForm = /<form[\s>]|<Form[\s>]|<input|<Input/i.test(code);
  if (!hasForm) return 7; // no form = no friction

  let score = 5;
  // Labels always present = lower friction
  const labelCount = countMatches(code, /<label|<Label/gi);
  const inputCount = countMatches(code, /<input|<Input/gi);
  if (labelCount >= inputCount) score += 1;
  // Error messages / validation
  if (/error|invalid|required|helperText|FormMessage/i.test(code)) score += 1;
  // Progressive disclosure
  if (/step|wizard|multi-step|progress/i.test(code)) score += 1;
  // Autofill / autocomplete hints
  if (/autoComplete|autocomplete|autoFocus/i.test(code)) score += 1;
  // Too many fields = high friction
  if (inputCount > 8)  score -= 2;
  else if (inputCount > 5) score -= 1;
  // Social login = lower friction
  if (/google|github|sso|oauth/i.test(code)) score += 1;
  return clamp(score);
}

/** Pricing clarity: clear pricing layout */
function scorePricingClarity(code: string): number {
  const hasPricing = /pricing|price|plan|tier|\$\d|\d+\/mo/i.test(code);
  if (!hasPricing) return 6; // no pricing section

  let score = 5;
  if (/\$\d+|€\d+|£\d+/i.test(code))       score += 1;
  if (/\/month|\/year|\/mo|\/yr/i.test(code)) score += 1;
  if (/most popular|recommended|best value/i.test(code)) score += 1;
  if (/compare|feature.*check|check.*feature/i.test(code)) score += 1;
  if (/free.*plan|free tier|freemium/i.test(code)) score += 1;
  if (/faq|question|answer/i.test(code))    score += 1;
  return clamp(score);
}

/** Dashboard usability: data table, charts, filters */
function scoreDashboardUsability(code: string): number {
  const hasDashboard = /dashboard|DataTable|chart|analytics|metrics|statistics/i.test(code);
  if (!hasDashboard) return 6;

  let score = 4;
  if (/DataTable|table|<Table/i.test(code)) score += 2;
  if (/Chart|BarChart|LineChart|PieChart/i.test(code)) score += 2;
  if (/filter|sort|search.*input/i.test(code)) score += 1;
  if (/Skeleton|loading|spinner/i.test(code)) score += 1;
  if (/Tabs?|<Tab[\s>]/i.test(code))        score += 1;
  if (/Badge|status|indicator/i.test(code)) score += 1;
  return clamp(score);
}

/** Information density: balance between content and space */
function scoreInformationDensity(code: string): number {
  // High = good density balance (not too sparse, not too dense)
  const elementCount = countMatches(code, /<[A-Z][a-zA-Z]+|<div|<section/g);
  const codeLen      = code.length;

  if (elementCount < 10) return 4; // too sparse
  if (elementCount > 150) return 4; // too dense
  if (codeLen < 500)     return 3;

  let score = 7;
  // Good: balanced grid
  if (/grid-cols-[2-4]|md:grid-cols/i.test(code)) score += 1;
  if (/gap-\d+|space-[xy]-\d+/i.test(code))       score += 1;
  // Too much text density
  if (codeLen > 15000) score -= 1;
  if (codeLen > 25000) score -= 1;
  return clamp(score);
}

/** Whitespace balance: padding, margin, gap usage */
function scoreWhitespaceBalance(code: string): number {
  let score = 3;
  const pyCount   = countMatches(code, /\bpy-\d+\b/g);
  const pxCount   = countMatches(code, /\bpx-\d+\b/g);
  const gapCount  = countMatches(code, /\bgap-\d+\b/g);
  const spaceCount = countMatches(code, /\bspace-[xy]-\d+\b/g);
  const mbCount   = countMatches(code, /\bmb-\d+\b/g);

  score += Math.min(pyCount,   2);
  score += Math.min(pxCount,   1);
  score += Math.min(gapCount,  2);
  score += Math.min(spaceCount, 1);
  score += Math.min(mbCount,   1);
  // Section-level padding
  if (/py-16|py-20|py-24|py-32/i.test(code)) score += 1;
  return clamp(score);
}

/** Visual hierarchy: heading depth and structure */
function scoreHierarchy(code: string): number {
  let score = 3;
  const h1 = countMatches(code, /<h1[\s>]/gi);
  const h2 = countMatches(code, /<h2[\s>]/gi);
  const h3 = countMatches(code, /<h3[\s>]/gi);

  // Ideal: one h1, several h2s, some h3s
  if (h1 === 1) score += 3;
  else if (h1 > 1) score += 1;
  if (h2 >= 2 && h2 <= 8) score += 2;
  else if (h2 > 0) score += 1;
  if (h3 >= 1 && h2 > 0)  score += 1;
  // Clear visual size variation
  if (/text-5xl|text-6xl/i.test(code)) score += 1;
  return clamp(score);
}

/** Accessibility confidence: aria labels, focus, alt text */
function scoreAccessibilityConfidence(code: string): number {
  let score = 3;
  if (/aria-label|aria-labelledby|aria-describedby/i.test(code)) score += 2;
  if (/focus-visible|focus-within|focus:ring/i.test(code)) score += 2;
  if (/alt=["'][^"']+["']/i.test(code))      score += 1;
  if (/role=/i.test(code))                   score += 1;
  if (/tabIndex|tabindex/i.test(code))       score += 1;
  if (/sr-only|visually-hidden/i.test(code)) score += 1;
  // Missing alt on images is bad
  if (/<img(?![^>]*alt=)/i.test(code))       score -= 1;
  return clamp(score);
}

/** Motion comfort: animation presence vs reduce-motion support */
function scoreMotionComfort(code: string): number {
  let score = 5;
  const hasMotion = /motion\.|framer|animation|transition|animate-/i.test(code);
  const hasReducedMotion = /prefers-reduced-motion|reduce.*motion|motion-safe|motion-reduce/i.test(code);

  if (hasMotion && hasReducedMotion) score += 3;
  else if (hasMotion && !hasReducedMotion) score -= 1; // motion without safety
  else if (!hasMotion) score += 1; // static = universally safe

  // Smooth but not overwhelming
  if (/transition-all|ease-in-out/i.test(code)) score += 1;
  if (/animate-spin|animate-bounce/i.test(code)) score -= 1; // distracting
  return clamp(score);
}

/** Perceived performance: skeleton states, lazy loading, feedback */
function scorePerceivedPerformance(code: string): number {
  let score = 4;
  if (/Skeleton|skeleton/i.test(code))          score += 2;
  if (/Suspense|lazy\(|loading=/i.test(code))   score += 2;
  if (/spinner|loading.*state|isLoading/i.test(code)) score += 1;
  if (/optimistic|instant|debounce/i.test(code)) score += 1;
  if (/blur-up|placeholder.*blur/i.test(code))  score += 1;
  return clamp(score);
}

/** Overall conversion probability: meta-score combining key signals */
function scoreOverallConversion(code: string, dims: Partial<UXDimensions>): number {
  const cta   = dims.ctaDiscoverability   ?? 5;
  const trust = dims.trust                ?? 5;
  const hier  = dims.hierarchy            ?? 5;
  const form  = dims.formFriction         ?? 5;
  const nav   = dims.navigationSimplicity ?? 5;
  return clamp(Math.round((cta * 0.35 + trust * 0.30 + hier * 0.15 + form * 0.10 + nav * 0.10) * 10) / 10);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function analyzeUXHeuristics(code: string): UXDimensions {
  const visualClarity        = scoreVisualClarity(code);
  const cognitiveLoad        = scoreCognitiveLoad(code);
  const ctaDiscoverability   = scoreCtaDiscoverability(code);
  const readingFlow          = scoreReadingFlow(code);
  const trust                = scoreTrust(code);
  const scanningEfficiency   = scoreScanningEfficiency(code);
  const navigationSimplicity = scoreNavigationSimplicity(code);
  const formFriction         = scoreFormFriction(code);
  const pricingClarity       = scorePricingClarity(code);
  const dashboardUsability   = scoreDashboardUsability(code);
  const informationDensity   = scoreInformationDensity(code);
  const whitespaceBalance    = scoreWhitespaceBalance(code);
  const hierarchy            = scoreHierarchy(code);
  const accessibilityConfidence = scoreAccessibilityConfidence(code);
  const motionComfort        = scoreMotionComfort(code);
  const perceivedPerformance = scorePerceivedPerformance(code);
  const partial: Partial<UXDimensions> = {
    ctaDiscoverability, trust, hierarchy, formFriction, navigationSimplicity,
  };
  const overallConversionProbability = scoreOverallConversion(code, partial);

  return {
    visualClarity,
    cognitiveLoad,
    ctaDiscoverability,
    readingFlow,
    trust,
    scanningEfficiency,
    navigationSimplicity,
    formFriction,
    pricingClarity,
    dashboardUsability,
    informationDensity,
    whitespaceBalance,
    hierarchy,
    accessibilityConfidence,
    motionComfort,
    perceivedPerformance,
    overallConversionProbability,
  };
}
