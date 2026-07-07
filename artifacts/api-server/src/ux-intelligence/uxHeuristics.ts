// ── V8.2 UX Intelligence — Heuristic Scorers ──────────────────────────────────
// Static code-analysis heuristics for each of the 17 UX dimensions.
// All functions are pure — no LLM calls, no side effects.

import type { UXScoringInput } from './uxTypes.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 10): number {
  return Math.min(max, Math.max(min, v));
}

function extractBlock(code: string, fnName: string): string {
  const pat = new RegExp(`function\\s+${fnName}\\s*\\(`);
  const m = pat.exec(code);
  if (!m) return '';
  let depth = 0, i = m.index, entered = false;
  while (i < code.length) {
    if (code[i] === '{') { depth++; entered = true; }
    else if (code[i] === '}') { depth--; if (entered && depth === 0) return code.slice(m.index, i + 1); }
    i++;
  }
  return code.slice(m.index);
}

function countMatches(code: string, pattern: RegExp): number {
  return (code.match(pattern) ?? []).length;
}

// ── 1. Visual Clarity ─────────────────────────────────────────────────────────
// Measures: color contrast signals, gradient use, dark/light mode consistency

export function scoreVisualClarity(code: string): number {
  let score = 5;
  // Primary color contrast indicators
  if (/text-white|text-black|text-gray-[89]00/.test(code)) score += 1;
  if (/bg-white|bg-black|bg-gray-[89]00/.test(code)) score += 0.5;
  // Dark text on light bg or vice versa
  if (/(bg-white.*text-gray|bg-gray.*text-white|dark:.*light:)/s.test(code)) score += 1;
  // Focus indicators
  if (/focus-visible:|focus:ring/.test(code)) score += 1;
  // Gradient overuse penalty
  const gradients = countMatches(code, /bg-gradient|from-.*to-/g);
  if (gradients > 5) score -= 1;
  // Low contrast warning
  if (/text-gray-[23]00|text-slate-[23]00/.test(code)) score -= 0.5;
  return clamp(Math.round(score * 10) / 10);
}

// ── 2. Cognitive Load ─────────────────────────────────────────────────────────
// Lower cognitive load = higher score. Measured by complexity indicators.

export function scoreCognitiveLoad(code: string, sectionOrder: string[]): number {
  let score = 7; // start positive
  // Too many sections → complexity
  if (sectionOrder.length > 10) score -= 1.5;
  else if (sectionOrder.length < 4) score -= 1;
  // Excessive text blocks
  const textBlocks = countMatches(code, /<p[\s>]/g);
  if (textBlocks > 12) score -= 1;
  // Complex nesting penalty
  const deepNest = countMatches(code, /className="[^"]{200,}"/g);
  if (deepNest > 3) score -= 0.5;
  // Short, clear labels
  if (/aria-label=|aria-describedby=/.test(code)) score += 0.5;
  // Progressive disclosure (tabs, accordions)
  if (/Accordion|Tabs|Collapsible/.test(code)) score += 1;
  // Modal overuse
  const modals = countMatches(code, /Dialog|Modal|Sheet/g);
  if (modals > 3) score -= 0.5;
  return clamp(Math.round(score * 10) / 10);
}

// ── 3. CTA Discoverability ────────────────────────────────────────────────────

export function scoreCtaDiscoverability(code: string): number {
  let score = 0;
  const heroBlock = extractBlock(code, 'Hero');

  // Primary CTA exists
  if (/<Button[^>]*>/.test(heroBlock)) score += 3;
  // CTA is prominent (size classes)
  if (/px-8|px-10|py-3|py-4/.test(heroBlock)) score += 1.5;
  // CTA above the fold (in hero)
  if (/<Button[^>]*>/.test(heroBlock) && /<h1[\s>]/.test(heroBlock)) score += 1.5;
  // Secondary CTA
  if (/variant=["'](outline|ghost)/.test(heroBlock)) score += 1.5;
  // CTA color contrast
  if (/bg-white.*text-black|bg-black.*text-white|bg-primary/.test(heroBlock)) score += 1;
  // CTA in multiple sections (sticky nav, footer)
  const globalCtaCount = countMatches(code, /<Button[^>]*>/g);
  if (globalCtaCount >= 3) score += 0.5;
  return clamp(Math.round(score * 10) / 10);
}

// ── 4. Reading Flow ───────────────────────────────────────────────────────────

export function scoreReadingFlow(code: string, sectionOrder: string[]): number {
  let score = 5;
  // Heading hierarchy
  const hasH1 = /<h1[\s>]/.test(code);
  const hasH2 = /<h2[\s>]/.test(code);
  const hasH3 = /<h3[\s>]/.test(code);
  if (hasH1) score += 1.5;
  if (hasH2) score += 1;
  if (hasH3) score += 0.5;
  // Logical section order (Hero first)
  if (sectionOrder[0]?.toLowerCase().includes('hero') || sectionOrder[0]?.toLowerCase().includes('nav')) score += 1;
  // Short paragraphs (scannable)
  if (/max-w-(xl|2xl|3xl|prose)/.test(code)) score += 0.5;
  // Missing h1 penalty
  if (!hasH1) score -= 2;
  // Correct depth (h1 → h2 → h3)
  const h1Count = countMatches(code, /<h1[\s>]/g);
  if (h1Count > 1) score -= 0.5; // Multiple h1s hurt flow
  return clamp(Math.round(score * 10) / 10);
}

// ── 5. Trust ─────────────────────────────────────────────────────────────────

export function scoreTrust(code: string): number {
  let score = 0;
  // Social proof
  if (/★|⭐|rating|stars|review|testimonial/i.test(code)) score += 2;
  // Logo clouds / partner logos
  if (/logo.*cloud|partner|trusted by|powered by/i.test(code)) score += 1.5;
  // User counts / metrics
  if (/\d[\d,]+\s*(user|team|customer|developer|company)/i.test(code)) score += 1.5;
  // Avatars (social proof)
  if (/Avatar|AvatarImage|AvatarFallback/.test(code)) score += 1;
  // Badges (certifications)
  if (/<Badge[\s>]/.test(code)) score += 0.5;
  // Security signals
  if (/secure|ssl|encrypt|gdpr|soc2|iso\s*27001/i.test(code)) score += 1;
  // Money-back / guarantee
  if (/guarantee|refund|free.*trial|no.*credit/i.test(code)) score += 0.5;
  // Missing trust signals
  if (score === 0) score = 2;
  return clamp(Math.round(score * 10) / 10);
}

// ── 6. Scanning Efficiency ────────────────────────────────────────────────────

export function scoreScanningEfficiency(code: string): number {
  let score = 5;
  // Bullet lists / feature lists
  const listItems = countMatches(code, /<li[\s>]|<ul[\s>]/g);
  if (listItems >= 3) score += 1.5;
  // Icon + text combinations
  if (/lucide|HeroIcon|<svg/.test(code) && /<span|<p/.test(code)) score += 1;
  // Section headings
  const h2Count = countMatches(code, /<h2[\s>]/g);
  if (h2Count >= 2) score += 1;
  // Card grid patterns
  if (/grid-cols|grid grid/.test(code)) score += 1;
  // Excessive prose penalty
  const longParagraphs = countMatches(code, /<p[^>]*>[^<]{200,}<\/p>/g);
  if (longParagraphs > 3) score -= 1;
  return clamp(Math.round(score * 10) / 10);
}

// ── 7. Navigation Simplicity ──────────────────────────────────────────────────

export function scoreNavigationSimplicity(code: string): number {
  let score = 5;
  const navBlock = extractBlock(code, 'Navbar') || extractBlock(code, 'Navigation') || extractBlock(code, 'Header');
  if (!navBlock) return 4;

  // Clear nav links
  const navLinks = countMatches(navBlock, /<a[\s>]|href=/g);
  if (navLinks >= 2 && navLinks <= 7) score += 2;
  else if (navLinks > 7) score -= 1; // too complex

  // Logo present
  if (/logo|brand|company|<a.*href=["']\/["']/i.test(navBlock)) score += 1;

  // CTA in nav
  if (/<Button/.test(navBlock)) score += 1;

  // Mobile menu (responsive)
  if (/Menu|Hamburger|md:flex|lg:flex|hidden.*md:/.test(navBlock)) score += 0.5;

  // Dropdown complexity
  const dropdowns = countMatches(navBlock, /DropdownMenu|NavigationMenu/g);
  if (dropdowns > 2) score -= 0.5;

  return clamp(Math.round(score * 10) / 10);
}

// ── 8. Form Friction ─────────────────────────────────────────────────────────

export function scoreFormFriction(code: string, isForm: boolean): number {
  if (!isForm && !/<form[\s>]|<Form[\s>]|useForm/.test(code)) return 6; // not a form page, neutral+

  let score = 5;
  // Short forms (fewer fields = less friction)
  const inputCount = countMatches(code, /<Input[\s>]|<Textarea[\s>]|<input[\s>]/g);
  if (inputCount <= 3) score += 2;
  else if (inputCount <= 6) score += 1;
  else score -= 1;

  // Labels for every field
  const labelCount = countMatches(code, /<Label[\s>]|<label[\s>]/g);
  if (labelCount >= inputCount) score += 1;

  // Error messages
  if (/error|invalid|required|FormMessage/.test(code)) score += 0.5;

  // Submit button visible
  if (/type=["']submit["']|<Button[^>]*>.*Submit/i.test(code)) score += 1;

  // Loading state
  if (/isLoading|isPending|disabled/.test(code)) score += 0.5;

  return clamp(Math.round(score * 10) / 10);
}

// ── 9. Pricing Clarity ────────────────────────────────────────────────────────

export function scorePricingClarity(code: string, hasPricing: boolean): number {
  const pricingBlock = extractBlock(code, 'Pricing') || extractBlock(code, 'Plans');
  if (!hasPricing && !pricingBlock && !/pricing|plan|tier|\$\d|\d+\/mo/i.test(code)) return 6;

  const block = pricingBlock || code;
  let score = 4;

  // Price clearly shown
  if (/\$\d|\d+\/mo|\d+\/month|per month|per year/i.test(block)) score += 2;
  // Feature comparison
  if (/Check|✓|included|feature/i.test(block)) score += 1;
  // Highlighted plan
  if (/popular|recommended|most.*chosen|badge/i.test(block)) score += 1;
  // CTA per plan
  const planCtaCount = countMatches(block, /<Button/g);
  if (planCtaCount >= 2) score += 1;
  // Annual/monthly toggle
  if (/annual|monthly|toggle|Switch/i.test(block)) score += 0.5;

  return clamp(Math.round(score * 10) / 10);
}

// ── 10. Dashboard Usability ───────────────────────────────────────────────────

export function scoreDashboardUsability(code: string, isDashboard: boolean): number {
  const dashBlock = extractBlock(code, 'Dashboard') || extractBlock(code, 'Overview');
  if (!isDashboard && !dashBlock) return 6;

  const block = dashBlock || code;
  let score = 4;

  // Data tables
  if (/DataTable|Table|<table/.test(block)) score += 1.5;
  // Charts / metrics
  if (/Chart|recharts|Graph|metric|stat/i.test(block)) score += 1.5;
  // Skeleton loading
  if (/Skeleton|loading|isLoading/.test(block)) score += 1;
  // Tabs for navigation
  if (/Tabs|Tab/.test(block)) score += 0.5;
  // Summary cards
  const cardCount = countMatches(block, /<Card/g);
  if (cardCount >= 2) score += 0.5;
  // Badge status indicators
  if (/Badge|status|indicator/i.test(block)) score += 0.5;

  return clamp(Math.round(score * 10) / 10);
}

// ── 11. Information Density ───────────────────────────────────────────────────

export function scoreInformationDensity(code: string, sectionOrder: string[]): number {
  // Target: not too sparse, not too dense (ideal range 5–8)
  const sectionCount = sectionOrder.length;
  const totalLength = code.length;

  let score = 6;
  // Too sparse
  if (sectionCount < 3) score -= 1.5;
  if (totalLength < 2000) score -= 1;
  // Too dense
  if (sectionCount > 12) score -= 1;
  if (totalLength > 15000) score -= 0.5;
  // Good density
  if (sectionCount >= 5 && sectionCount <= 9) score += 1;
  if (totalLength >= 3000 && totalLength <= 10000) score += 1;
  // Cards help density
  const cardCount = countMatches(code, /<Card[\s>]/g);
  if (cardCount >= 2 && cardCount <= 6) score += 0.5;

  return clamp(Math.round(score * 10) / 10);
}

// ── 12. Whitespace Balance ────────────────────────────────────────────────────

export function scoreWhitespaceBalance(code: string): number {
  let score = 5;
  // Section padding
  if (/py-16|py-20|py-24|py-32/.test(code)) score += 1.5;
  // Component spacing
  if (/gap-4|gap-6|gap-8|space-y-/.test(code)) score += 1;
  // Max width constraints
  if (/max-w-[4-9]xl|max-w-screen|container/.test(code)) score += 1;
  // Missing padding penalty
  if (!/py-/.test(code)) score -= 1.5;
  // Excessive padding
  const largePad = countMatches(code, /py-48|py-64|pt-96/g);
  if (largePad > 2) score -= 0.5;
  return clamp(Math.round(score * 10) / 10);
}

// ── 13. Hierarchy ─────────────────────────────────────────────────────────────

export function scoreHierarchy(code: string): number {
  let score = 4;
  // Font size variation
  if (/text-[456789]xl|text-8xl/.test(code)) score += 2; // large headline
  if (/text-[23]xl/.test(code)) score += 1; // mid headings
  if (/text-sm|text-base/.test(code)) score += 0.5; // body
  // Font weight variation
  if (/font-black|font-bold|font-semibold/.test(code)) score += 1;
  // Color hierarchy (muted secondary text)
  if (/text-muted|text-gray|text-white\/[567]/.test(code)) score += 1;
  // Missing large heading penalty
  const h1Count = countMatches(code, /<h1[\s>]/g);
  if (h1Count === 0) score -= 2;
  return clamp(Math.round(score * 10) / 10);
}

// ── 14. Accessibility Confidence ─────────────────────────────────────────────

export function scoreAccessibilityConfidence(code: string): number {
  let score = 4;
  // ARIA labels
  if (/aria-label=/.test(code)) score += 1.5;
  if (/aria-describedby=|aria-expanded=|aria-controls=/.test(code)) score += 0.5;
  // Focus management
  if (/focus-visible:|focus:ring/.test(code)) score += 1.5;
  // Alt text
  if (/alt=["'][^"']+["']/.test(code)) score += 1;
  // Role attributes
  if (/role=["'](main|navigation|banner|contentinfo|button)["']/.test(code)) score += 0.5;
  // Type=button on buttons
  const buttons = countMatches(code, /<Button[\s>]/g);
  const typedButtons = countMatches(code, /type=["']button["']/g);
  if (buttons > 0 && typedButtons / buttons >= 0.5) score += 0.5;
  // Missing focus indicators
  if (!/focus/.test(code)) score -= 1;
  return clamp(Math.round(score * 10) / 10);
}

// ── 15. Motion Comfort ────────────────────────────────────────────────────────

export function scoreMotionComfort(code: string): number {
  let score = 7; // default good (no motion = comfortable)
  // Has motion but purposeful (framer-motion with sensible defaults)
  if (/motion\.|framer-motion|animate=/.test(code)) {
    score = 6;
    // Short durations = comfortable
    if (/duration.*0\.[12]|duration.*200|duration.*300/.test(code)) score += 1.5;
    if (/duration.*0\.[456789]|duration.*[5-9]00/.test(code)) score -= 1; // long animations
    // Ease curves
    if (/easeOut|easeInOut|spring/.test(code)) score += 0.5;
    // Respect prefers-reduced-motion
    if (/prefers-reduced-motion|useReducedMotion/.test(code)) score += 1;
  }
  // Excessive transitions
  const transitionCount = countMatches(code, /transition-|animate-/g);
  if (transitionCount > 10) score -= 1;
  return clamp(Math.round(score * 10) / 10);
}

// ── 16. Perceived Performance ─────────────────────────────────────────────────

export function scorePerceivedPerformance(code: string): number {
  let score = 6;
  // Skeleton loading states (makes perceived perf better)
  if (/Skeleton|loading|isLoading|isPending/.test(code)) score += 1.5;
  // Image optimization hints
  if (/loading=["']lazy["']|placeholder/.test(code)) score += 0.5;
  // Optimistic UI
  if (/optimistic|toast|Toaster/.test(code)) score += 0.5;
  // Heavy animations penalty
  if (/backdrop-blur-xl|backdrop-filter/.test(code)) score -= 0.5;
  // Excessive re-renders (many useState)
  const stateCount = countMatches(code, /useState\(/g);
  if (stateCount > 8) score -= 0.5;
  return clamp(Math.round(score * 10) / 10);
}
