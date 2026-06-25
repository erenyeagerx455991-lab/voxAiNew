// ── V7.3.4 Hero Visual Analyzer ───────────────────────────────────────────────
// Static code-based analysis of the hero section visual quality.
// No browser required — infers visual properties from JSX/HTML/Tailwind patterns.

import type { HeroAnalysis, VisualIssue } from "./visualTypes.js";

export function analyzeHero(code: string, sectionOrder: string[]): HeroAnalysis {
  const issues: VisualIssue[] = [];

  const hasHeroSection = sectionOrder.some(s => /hero/i.test(s)) ||
    /function\s+Hero\s*[(<]|section[^>]*hero|id=['"]hero|class[^>]*hero/i.test(code);

  if (!hasHeroSection) {
    return {
      score: 5, // neutral if no hero needed
      hasHeadline: false,
      hasCTA: false,
      hasTrustSignal: false,
      hasBadge: false,
      hasDescription: false,
      hasHeroHeight: false,
      issues: [],
    };
  }

  // Extract hero block for targeted analysis
  const heroBlock = extractHeroBlock(code);
  const target = heroBlock || code;

  // ── Checks ────────────────────────────────────────────────────────────────

  const hasHeadline = /<h1[\s>]/i.test(target);
  if (!hasHeadline) {
    issues.push({
      category: 'hero', severity: 'critical',
      message: 'Hero missing <h1> headline — add a large, bold heading as the focal point',
      repairSuggestion: 'Add <h1 className="text-5xl font-bold">...</h1> inside the hero section',
    });
  }

  const hasCTA = /Button|<button|\bbtn\b/i.test(target) &&
    /primary|cta|get.?start|sign.?up|try|free|start/i.test(target);
  if (!hasCTA) {
    issues.push({
      category: 'hero', severity: 'critical',
      message: 'Hero missing a primary CTA button — add a prominent action button',
      repairSuggestion: 'Add a <Button size="lg" variant="default">Get Started</Button> below the headline',
    });
  }

  const hasTrustSignal =
    /trust|users?|customer|review|rating|stars?|testimonial|social.?proof|[0-9]+k?\+?\s*(user|team|compan)/i.test(target) ||
    /AvatarGroup|SocialProof|TrustBadge/i.test(target);
  if (!hasTrustSignal) {
    issues.push({
      category: 'hero', severity: 'minor',
      message: 'Hero lacks trust signals — add user count, ratings, or social proof',
    });
  }

  const hasBadge = /Badge|pill|chip/i.test(target) &&
    /<Badge[\s>]|className[^"]*badge|className[^"]*pill/i.test(target);
  if (!hasBadge) {
    issues.push({
      category: 'hero', severity: 'minor',
      message: 'Hero missing badge/pill label — add a <Badge> above the headline',
    });
  }

  const hasDescription = /<p[\s>]/i.test(target) && target.includes('<p');
  if (!hasDescription) {
    issues.push({
      category: 'hero', severity: 'major',
      message: 'Hero missing subheadline/description — add a <p> clarifying the value proposition',
    });
  }

  const hasHeroHeight =
    /min-h-\[|h-screen|min-h-screen|vh|py-\d{2,}|py-\[/i.test(target);
  if (!hasHeroHeight) {
    issues.push({
      category: 'hero', severity: 'major',
      message: 'Hero lacks sufficient height — use min-h-screen or min-h-[80vh]',
    });
  }

  // ── Score ────────────────────────────────────────────────────────────────
  let score = 0;
  if (hasHeadline) score += 2.5;
  if (hasCTA) score += 2.5;
  if (hasDescription) score += 2;
  if (hasHeroHeight) score += 1;
  if (hasBadge) score += 1;
  if (hasTrustSignal) score += 1;

  return {
    score: Math.min(10, score),
    hasHeadline,
    hasCTA,
    hasTrustSignal,
    hasBadge,
    hasDescription,
    hasHeroHeight,
    issues,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractHeroBlock(code: string): string {
  // Try to isolate the Hero function body
  const heroFnMatch = /function\s+Hero\s*[(<]/i.exec(code);
  if (!heroFnMatch) return '';
  const start = heroFnMatch.index;
  let depth = 0;
  let entered = false;
  for (let i = start; i < code.length; i++) {
    if (code[i] === '{') { depth++; entered = true; }
    else if (code[i] === '}') {
      depth--;
      if (entered && depth === 0) return code.slice(start, i + 1);
    }
  }
  return code.slice(start, Math.min(start + 2000, code.length));
}
