// ── V7.3.4 DOM Structure Analyzer ────────────────────────────────────────────
// Pure structural analysis — no AI required. Detects common DOM-level visual
// problems: overflow, empty sections, duplicate sections, broken grids.

import type { DOMAnalysis, VisualIssue } from "./visualTypes.js";

const KNOWN_SECTIONS = [
  'Hero', 'Features', 'Pricing', 'Testimonials', 'CTA', 'FAQ',
  'Dashboard', 'About', 'Footer', 'Navbar', 'Header',
  'Stats', 'Blog', 'HowItWorks', 'Team',
];

export function analyzeDom(code: string): DOMAnalysis {
  const issues: VisualIssue[] = [];
  const overflowIssues: string[] = [];
  const emptySections: string[] = [];
  const duplicateSections: string[] = [];
  const brokenGrids: string[] = [];

  // ── Overflow detection ────────────────────────────────────────────────────
  // Large image containers without overflow-hidden
  const imgContainers = code.match(/relative[^"]*w-full[^"]*h-\[/gi) ?? [];
  imgContainers.forEach((_, i) => {
    if (!code.includes('overflow-hidden')) {
      overflowIssues.push(`Image container ${i + 1} may overflow without overflow-hidden`);
    }
  });

  // Absolute positioned elements without relative parent
  const absoluteCount = (code.match(/absolute\b/gi) ?? []).length;
  const relativeCount = (code.match(/\brelative\b/gi) ?? []).length;
  if (absoluteCount > 0 && relativeCount === 0) {
    overflowIssues.push('Absolute positioned elements found without a relative parent — may overflow viewport');
    issues.push({
      category: 'dom', severity: 'major',
      message: 'Absolute positioned elements found without a relative parent — add position: relative to the parent',
    });
  }

  // ── Empty sections detection ───────────────────────────────────────────────
  KNOWN_SECTIONS.forEach(section => {
    const sectionRegex = new RegExp(`function\\s+${section}\\s*[(<]`, 'i');
    if (!sectionRegex.test(code)) return;

    // Extract block and check if it has real content
    const idx = code.search(sectionRegex);
    const block = code.slice(idx, idx + 500);
    const hasContent = /<h[1-6]|<p|<li|<span|<div[^>]*>[^/]|Button|Card|Image|Img/i.test(block);
    if (!hasContent) {
      emptySections.push(section);
      issues.push({
        category: 'dom', severity: 'major',
        message: `Section "${section}" appears empty or has no visible content`,
        region: { section },
      });
    }
  });

  // ── Duplicate section detection ────────────────────────────────────────────
  KNOWN_SECTIONS.forEach(section => {
    const matches = code.match(new RegExp(`function\\s+${section}\\s*[(<]`, 'gi')) ?? [];
    if (matches.length > 1) {
      duplicateSections.push(section);
      issues.push({
        category: 'dom', severity: 'minor',
        message: `Section "${section}" is defined ${matches.length} times — consolidate into one`,
        region: { section },
      });
    }
  });

  // ── Missing CTA ────────────────────────────────────────────────────────────
  const missingCTA = !/<Button[\s>]|<button[\s>]/i.test(code);
  if (missingCTA) {
    issues.push({
      category: 'dom', severity: 'critical',
      message: 'No CTA buttons found anywhere in the page — add at least one primary action button',
    });
  }

  // ── Missing header/footer ──────────────────────────────────────────────────
  const missingHeader = !/Navbar|Header|<header|<nav/i.test(code);
  if (missingHeader) {
    issues.push({
      category: 'dom', severity: 'major',
      message: 'No navigation/header found — add a Navbar component',
    });
  }

  const missingFooter = !/Footer|<footer/i.test(code);
  if (missingFooter) {
    issues.push({
      category: 'dom', severity: 'minor',
      message: 'No footer section found — consider adding a Footer component',
    });
  }

  // ── Broken grid detection ──────────────────────────────────────────────────
  // Grid with no cols defined — match className attribute values (handles both ' and " delimiters)
  const gridMatches = code.match(/className=['"][^'"]+['"]/gi) ?? [];
  gridMatches.forEach((match, i) => {
    if (/\bgrid\b/.test(match) && !/grid-cols|grid-rows|grid-flow/i.test(match)) {
      brokenGrids.push(`grid-${i}`);
      issues.push({
        category: 'dom', severity: 'minor',
        message: 'Grid container missing grid-cols — define column count with grid-cols-*',
        region: { section: 'unknown', component: `grid-${i}` },
      });
    }
  });

  return {
    overflowIssues,
    emptySections,
    duplicateSections,
    missingCTA,
    missingHeader,
    missingFooter,
    brokenGrids,
    issues,
  };
}
