// ── V7.3.4 Responsive Visual Analyzer ────────────────────────────────────────
// Detects responsive design patterns from Tailwind breakpoint classes.

import type { ResponsiveAnalysis, VisualIssue } from "./visualTypes.js";

export function analyzeResponsive(code: string): ResponsiveAnalysis {
  const issues: VisualIssue[] = [];

  // Breakpoint usage
  const hasBreakpoints =
    /\bsm:|md:|lg:|xl:|2xl:/i.test(code);
  if (!hasBreakpoints) {
    issues.push({
      category: 'responsive', severity: 'critical',
      message: 'No responsive breakpoints found — add sm:/md:/lg: prefixes for mobile layouts',
      viewport: 'mobile',
    });
  }

  // Mobile stacking: grid/flex → flex-col on mobile
  const hasMobileStacking =
    /flex-col|sm:flex-row|md:flex-row|md:grid-cols|lg:grid-cols/i.test(code);
  if (!hasMobileStacking) {
    issues.push({
      category: 'responsive', severity: 'major',
      message: 'Columns may not stack on mobile — use flex-col or responsive grid-cols',
      viewport: 'mobile',
    });
  }

  // Responsive text sizing
  const hasResponsiveText =
    /text-\w+\s+(?:sm:|md:|lg:)text-|sm:text-|md:text-|lg:text-/i.test(code) ||
    /clamp\(|fluid|viewport/i.test(code);
  if (!hasResponsiveText) {
    issues.push({
      category: 'responsive', severity: 'minor',
      message: 'Text sizes may not adapt to mobile — use responsive typography (sm:text-*)',
      viewport: 'mobile',
    });
  }

  // Responsive grid
  const hasResponsiveGrid =
    /grid-cols-1.*(?:sm:|md:|lg:)grid-cols|(?:sm:|md:|lg:)grid-cols-[2-9]/i.test(code);

  // No hardcoded pixel widths that break on mobile
  const hardcodedWidths = code.match(/w-\[\d{3,}px\]/g) ?? [];
  const noHardcodedWidths = hardcodedWidths.length === 0;
  if (!noHardcodedWidths) {
    issues.push({
      category: 'responsive', severity: 'major',
      message: `${hardcodedWidths.length} hardcoded pixel width(s) found — use relative units or max-w-*`,
      viewport: 'mobile',
    });
  }

  // Mobile nav handling: hamburger menu or hidden nav on mobile
  const mobileNavHandled =
    /hamburger|MenuIcon|Menu\b|md:hidden|lg:hidden|sm:hidden.*nav|mobile.*menu/i.test(code) ||
    /hidden.*md:flex|hidden.*lg:flex/i.test(code);
  if (!mobileNavHandled) {
    issues.push({
      category: 'responsive', severity: 'major',
      message: 'Navigation may not adapt to mobile — add a hamburger menu or hide nav links on mobile',
      viewport: 'mobile',
    });
  }

  // ── Score ────────────────────────────────────────────────────────────────
  let score = 0;
  if (hasBreakpoints) score += 3;
  if (hasMobileStacking) score += 2.5;
  if (hasResponsiveText) score += 1.5;
  if (hasResponsiveGrid) score += 1.5;
  if (noHardcodedWidths) score += 1;
  if (mobileNavHandled) score += 0.5;

  return {
    score: Math.min(10, score),
    hasBreakpoints,
    hasMobileStacking,
    hasResponsiveText,
    hasResponsiveGrid,
    noHardcodedWidths,
    mobileNavHandled,
    issues,
  };
}
