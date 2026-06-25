// ── V7.3.4 Layout Visual Analyzer ────────────────────────────────────────────
// Measures layout quality from Tailwind/CSS grid, flex, gap, and spacing patterns.

import type { LayoutAnalysis, VisualIssue } from "./visualTypes.js";

export function analyzeLayout(code: string): LayoutAnalysis {
  const issues: VisualIssue[] = [];

  // Grid usage
  const hasGrid = /className[^"]*grid[\s"]/i.test(code) ||
    /grid-cols-|grid-rows-/i.test(code);

  // Flex usage
  const hasFlex = /className[^"]*flex[\s"]/i.test(code) ||
    /flex-col|flex-row|flex-wrap/i.test(code);

  if (!hasGrid && !hasFlex) {
    issues.push({
      category: 'layout', severity: 'major',
      message: 'Layout uses neither grid nor flexbox — add grid or flex containers for structure',
    });
  }

  // Gap / whitespace
  const hasGap = /\bgap-\d|\bgap-\[/i.test(code);
  if (!hasGap) {
    issues.push({
      category: 'layout', severity: 'minor',
      message: 'No gap utility found — use gap-* between grid/flex children for spacing rhythm',
    });
  }

  // Padding / section whitespace
  const hasWhitespace = /py-\d{2,}|py-\[|section|padding/i.test(code) &&
    /py-16|py-20|py-24|py-32|py-\[6|py-\[8/i.test(code);
  if (!hasWhitespace) {
    issues.push({
      category: 'layout', severity: 'minor',
      message: 'Sections may lack vertical breathing room — use py-16+ for section padding',
    });
  }

  // Alignment consistency
  const alignmentConsistent =
    /items-center|justify-center|mx-auto|text-center/i.test(code) &&
    !/text-left.*text-right|text-right.*text-left/i.test(code);
  if (!alignmentConsistent) {
    issues.push({
      category: 'layout', severity: 'minor',
      message: 'Mixed alignment detected — choose a consistent alignment strategy',
    });
  }

  // Max-width container (prevents overly wide layouts)
  const hasContainer = /max-w-\w+|container|mx-auto/i.test(code);
  if (!hasContainer) {
    issues.push({
      category: 'layout', severity: 'major',
      message: 'No max-width container found — content may stretch to full viewport width',
    });
  }

  // Card balance: if cards exist, check for consistent widths
  const hasCards = /Card|card-\w/i.test(code);
  const hasCardBalance = !hasCards || /grid-cols-\d|lg:grid-cols|md:grid-cols/i.test(code);
  if (hasCards && !hasCardBalance) {
    issues.push({
      category: 'layout', severity: 'minor',
      message: 'Cards found but no responsive grid — use grid-cols for visual card balance',
    });
  }

  // Section count heuristic
  const sectionMatches = code.match(/function\s+(Hero|Features?|Pricing|Testimonials?|CTA|FAQ|Dashboard|About|Footer|Navbar)\s*[(<]/gi);
  const sectionCount = sectionMatches ? sectionMatches.length : 0;

  // ── Score ────────────────────────────────────────────────────────────────
  let score = 0;
  if (hasGrid || hasFlex) score += 2.5;
  if (hasGap) score += 1.5;
  if (hasWhitespace) score += 2;
  if (alignmentConsistent) score += 1.5;
  if (hasContainer) score += 1.5;
  if (hasCardBalance) score += 1;

  return {
    score: Math.min(10, score),
    hasGrid,
    hasFlex,
    hasGap,
    alignmentConsistent,
    sectionCount,
    hasWhitespace,
    hasCardBalance,
    issues,
  };
}
