// ── V7.3.4 Pixel Diff Engine ──────────────────────────────────────────────────
// Code-based structural diff between candidates. Since we run server-side with
// no headless browser, "pixel diff" is implemented as tokenized code comparison:
// Jaccard similarity on normalized tokens + section order comparison.

import type { VisualComparison } from "./visualTypes.js";

// ── Token normalization ───────────────────────────────────────────────────────

function tokenize(code: string): Set<string> {
  const tokens = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip comments
    .replace(/\/\/[^\n]*/g, '')
    .replace(/import\s[^;]+;/g, '')   // strip imports
    .match(/[A-Za-z][A-Za-z0-9]*/g) ?? [];
  return new Set(tokens);
}

function extractSections(code: string): string[] {
  const sections: string[] = [];
  const matches = code.matchAll(/function\s+([A-Z][a-zA-Z]+)\s*[(<]/g);
  for (const m of matches) sections.push(m[1]);
  return sections;
}

function extractClasses(code: string): Set<string> {
  const classes = new Set<string>();
  const matches = code.matchAll(/className=['"]([^'"]+)['"]/g);
  for (const m of matches) {
    m[1].split(/\s+/).forEach(cls => classes.add(cls));
  }
  return classes;
}

// ── Jaccard similarity ────────────────────────────────────────────────────────

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 1 : intersection.size / union.size;
}

// ── Section order similarity ──────────────────────────────────────────────────

function sectionOrderSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  let matches = 0;
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / maxLen;
}

// ── Region mismatch detection ─────────────────────────────────────────────────

function detectRegionMismatches(sectionsA: string[], sectionsB: string[]): string[] {
  const setA = new Set(sectionsA);
  const setB = new Set(sectionsB);
  const mismatches: string[] = [];
  setA.forEach(s => { if (!setB.has(s)) mismatches.push(`"${s}" only in A`); });
  setB.forEach(s => { if (!setA.has(s)) mismatches.push(`"${s}" only in B`); });
  return mismatches;
}

// ── Main diff function ────────────────────────────────────────────────────────

export function computeVisualDiff(
  codeA: string,
  codeB: string,
  candidateIdA: string,
  candidateIdB: string,
): VisualComparison {
  const tokensA = tokenize(codeA);
  const tokensB = tokenize(codeB);
  const classesA = extractClasses(codeA);
  const classesB = extractClasses(codeB);
  const sectionsA = extractSections(codeA);
  const sectionsB = extractSections(codeB);

  const tokenSimilarity = jaccard(tokensA, tokensB);
  const classSimilarity = jaccard(classesA, classesB);
  const orderSimilarity = sectionOrderSimilarity(sectionsA, sectionsB);

  // Composite similarity 0–100
  const similarityScore = Math.round(
    (tokenSimilarity * 0.4 + classSimilarity * 0.4 + orderSimilarity * 0.2) * 100
  );

  // Layout shift: how different are the section orderings
  const layoutShiftPercent = Math.round((1 - orderSimilarity) * 100);

  // Spacing delta: infer from gap/padding class differences
  const spacingA = new Set([...(codeA.match(/\b(?:gap|py|px|p|m|my|mx|space)-[\w\[\]]+/g) ?? [])]);
  const spacingB = new Set([...(codeB.match(/\b(?:gap|py|px|p|m|my|mx|space)-[\w\[\]]+/g) ?? [])]);
  const spacingJaccard = jaccard(spacingA, spacingB);
  const spacingDeltaPercent = Math.round((1 - spacingJaccard) * 100);

  // Component displacement: how many component calls differ
  const compA = new Set([...(codeA.match(/<[A-Z][A-Za-z]+[\s>/]/g) ?? [])]);
  const compB = new Set([...(codeB.match(/<[A-Z][A-Za-z]+[\s>/]/g) ?? [])]);
  const compDisplacement = [...compA].filter(c => !compB.has(c)).length +
    [...compB].filter(c => !compA.has(c)).length;

  const regionMismatches = detectRegionMismatches(sectionsA, sectionsB);

  return {
    candidateA: candidateIdA,
    candidateB: candidateIdB,
    similarityScore,
    layoutShiftPercent,
    spacingDeltaPercent,
    componentDisplacement: compDisplacement,
    regionMismatches,
  };
}

// ── Multi-candidate comparison ────────────────────────────────────────────────

export function compareAllCandidates(
  codes: Array<{ id: string; code: string }>
): VisualComparison[] {
  const comparisons: VisualComparison[] = [];
  for (let i = 0; i < codes.length - 1; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      comparisons.push(computeVisualDiff(codes[i].code, codes[j].code, codes[i].id, codes[j].id));
    }
  }
  return comparisons;
}
