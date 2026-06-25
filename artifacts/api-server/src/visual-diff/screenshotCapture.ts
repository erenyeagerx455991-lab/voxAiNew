// ── V7.3.4 Screenshot Capture Engine ─────────────────────────────────────────
// Static code-based visual snapshot extraction. Since the API server has no
// headless browser, screenshots are represented as structural metadata snapshots
// derived from HTML/JSX analysis. Real screenshot URLs are logical paths.

import type { VisualSnapshot, Viewport } from "./visualTypes.js";
import { createHash } from "crypto";

export const VIEWPORTS: Record<Viewport, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet:  { width: 768,  height: 1024 },
  mobile:  { width: 390,  height: 844 },
};

// ── Structural fingerprint ────────────────────────────────────────────────────

function computeStructureHash(code: string): string {
  // Hash a normalized, lightweight representation of the code structure
  const normalized = code
    .replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '"..."') // strip string literals
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000); // cap for performance
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

// ── Metadata extraction ───────────────────────────────────────────────────────

function extractResponsiveClasses(code: string): string[] {
  const classes = new Set<string>();
  const matches = code.matchAll(/(?:sm|md|lg|xl|2xl):[a-zA-Z0-9-[\]]+/g);
  for (const m of matches) classes.add(m[0]);
  return [...classes].slice(0, 20); // cap at 20
}

function extractGridClasses(code: string): string[] {
  const classes = new Set<string>();
  const matches = code.matchAll(/grid-cols-[^\s"']+/g);
  for (const m of matches) classes.add(m[0]);
  return [...classes];
}

function countComponents(code: string): number {
  return (code.match(/<[A-Z][A-Za-z]+[\s>/]/g) ?? []).length;
}

function countSections(code: string): number {
  return (code.match(/function\s+[A-Z][A-Za-z]+\s*[(<]/g) ?? []).length;
}

// ── Main capture function ─────────────────────────────────────────────────────

export function captureVisualSnapshot(
  code: string,
  candidateId: string,
  buildId: string,
  viewport: Viewport = 'desktop',
): VisualSnapshot {
  const screenshotPath = `artifacts/screenshots/${buildId}/${candidateId}-${viewport}.png`;

  return {
    candidateId,
    buildId,
    viewport,
    screenshotPath, // logical — no actual file written
    capturedAt: new Date().toISOString(),
    structureHash: computeStructureHash(code),
    sectionCount: countSections(code),
    componentCount: countComponents(code),
    hasHero: /function\s+Hero\s*[(<]|id=['"]hero|class[^>]*hero-/i.test(code),
    hasCTA: /<Button[\s>]|<button[\s>]/i.test(code),
    hasNav: /Navbar|Header|<header|<nav/i.test(code),
    hasFooter: /Footer|<footer/i.test(code),
    responsiveClasses: extractResponsiveClasses(code),
    gridClasses: extractGridClasses(code),
  };
}

// ── Multi-viewport capture ────────────────────────────────────────────────────

export function captureAllViewports(
  code: string,
  candidateId: string,
  buildId: string,
): Record<Viewport, VisualSnapshot> {
  return {
    desktop: captureVisualSnapshot(code, candidateId, buildId, 'desktop'),
    tablet:  captureVisualSnapshot(code, candidateId, buildId, 'tablet'),
    mobile:  captureVisualSnapshot(code, candidateId, buildId, 'mobile'),
  };
}
