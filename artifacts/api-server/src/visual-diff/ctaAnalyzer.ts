// ── V7.3.4 CTA Visual Analyzer ────────────────────────────────────────────────
// Analyzes CTA prominence, placement, hierarchy, and contrast from code patterns.

import type { CTAAnalysis, VisualIssue } from "./visualTypes.js";

const PRIMARY_CTA_PATTERNS = [
  /variant=['"]default['"]/i,
  /variant=['"]primary['"]/i,
  /className[^"]*bg-primary/i,
  /<Button[^>]*>.*?(get.?start|sign.?up|try|free|start|join|book|request|demo|buy)/is,
  /size=['"]lg['"]/i,
];

const SECONDARY_CTA_PATTERNS = [
  /variant=['"]outline['"]/i,
  /variant=['"]ghost['"]/i,
  /variant=['"]secondary['"]/i,
  /learn.?more|see.?how|watch|explore/i,
];

export function analyzeCTA(code: string): CTAAnalysis {
  const issues: VisualIssue[] = [];

  const primaryCTAVisible = PRIMARY_CTA_PATTERNS.some(p => p.test(code));
  const secondaryCTAVisible = SECONDARY_CTA_PATTERNS.some(p => p.test(code));

  if (!primaryCTAVisible) {
    issues.push({
      category: 'cta', severity: 'critical',
      message: 'No primary CTA button found — add a prominent variant="default" Button',
      repairSuggestion: 'Add <Button size="lg" variant="default">Get Started</Button>',
    });
  }

  // Count total CTA-like buttons — too many fragments attention
  const ctaCount = (code.match(/<Button[\s>]/gi) ?? []).length;
  const clickHierarchy = ctaCount >= 1 && ctaCount <= 4;
  if (ctaCount > 5) {
    issues.push({
      category: 'cta', severity: 'major',
      message: `${ctaCount} CTA buttons found — reduce to ≤4 for clear click hierarchy`,
    });
  }
  if (ctaCount === 0) {
    issues.push({
      category: 'cta', severity: 'critical',
      message: 'No Button components found anywhere in the page',
    });
  }

  // Placement: check if CTA appears near hero/top of file (above-fold heuristic)
  const heroIdx = code.search(/function\s+Hero\s*[(<]/i);
  const ctaIdx = code.search(/<Button[\s>]/i);
  const placement: CTAAnalysis['placement'] =
    ctaCount === 0 ? 'none' :
    heroIdx !== -1 && ctaIdx !== -1 && ctaIdx < heroIdx + 1500 ? 'above-fold' :
    'below-fold';

  if (placement === 'none') {
    issues.push({ category: 'cta', severity: 'critical', message: 'No CTA buttons found on page' });
  } else if (placement === 'below-fold') {
    issues.push({
      category: 'cta', severity: 'major',
      message: 'Primary CTA appears below the fold — move it into the Hero section',
    });
  }

  // Contrast: check if button uses bg-primary or bg-brand or high-contrast pattern
  const hasContrast =
    /bg-primary|var\(--primary\)|bg-\[#[0-9a-f]{3,6}\]|bg-indigo|bg-violet|bg-blue/i.test(code);
  if (!hasContrast) {
    issues.push({
      category: 'cta', severity: 'minor',
      message: 'CTA button may lack contrast — use bg-primary or a high-contrast background',
    });
  }

  // ── Score ────────────────────────────────────────────────────────────────
  let score = 0;
  if (primaryCTAVisible) score += 3.5;
  if (secondaryCTAVisible) score += 1.5;
  if (clickHierarchy) score += 2;
  if (placement === 'above-fold') score += 2;
  else if (placement === 'below-fold') score += 0.5;
  if (hasContrast) score += 1;

  return {
    score: Math.min(10, score),
    primaryCTAVisible,
    secondaryCTAVisible,
    ctaCount,
    hasContrast,
    placement,
    clickHierarchy,
    issues,
  };
}
