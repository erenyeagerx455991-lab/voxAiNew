// ── V7.3.3 Token Validator ────────────────────────────────────────────────────
// Detects hardcoded colors, shadows, radius, theme conflicts in generated code.
// Flags violations and produces a tokenQualityScore (0-10).

import type { TokenViolation, TokenValidationResult } from "./tokenTypes.js";

// ── Patterns for hardcoded values ─────────────────────────────────────────────

// Hex colors (3, 6, or 8 digit)
const HEX_COLOR_PATTERN = /#([0-9A-Fa-f]{3}){1,2}([0-9A-Fa-f]{2})?\b/g;

// RGB / RGBA
const RGB_PATTERN = /\brgba?\s*\(\s*\d+/g;

// Direct Tailwind color classes (e.g. text-purple-600, bg-blue-500, border-green-400)
const TAILWIND_COLOR_PATTERN = /\b(?:text|bg|border|ring|fill|stroke|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

// Hardcoded border-radius: rounded-{size} but allow 'rounded' alone
const HARDCODED_RADIUS_PATTERN = /\brounded-(?:none|sm|md|lg|xl|2xl|3xl|full)\b/g;

// Hardcoded shadow classes
const HARDCODED_SHADOW_PATTERN = /\bshadow-(?:sm|md|lg|xl|2xl|inner)\b/g;

// ── Allowlist ─────────────────────────────────────────────────────────────────
// Patterns that are acceptable (inside token definitions or CSS variable blocks)

const ALLOWED_CONTEXT_MARKERS = [
  '/* Design Tokens',
  ':root {',
  '// Token',
  'tokenRegistry',
  'tokenTypes',
  'cssVariables',
  '--primary:',
  '--accent:',
];

function isInAllowedContext(line: string): boolean {
  return ALLOWED_CONTEXT_MARKERS.some(marker => line.includes(marker));
}

// ── Line-by-line violation scanner ───────────────────────────────────────────

function scanLines(code: string): TokenViolation[] {
  const violations: TokenViolation[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

    // Skip token definition lines
    if (isInAllowedContext(line)) continue;

    // Check hex colors
    const hexMatches = line.match(HEX_COLOR_PATTERN);
    if (hexMatches) {
      for (const match of hexMatches) {
        violations.push({
          type: 'hardcoded_color',
          value: match,
          severity: 'warning',
          line: lineNum,
          context: line.trim().slice(0, 80),
        });
      }
    }

    // Check RGB colors
    const rgbMatches = line.match(RGB_PATTERN);
    if (rgbMatches) {
      for (const match of rgbMatches) {
        violations.push({
          type: 'hardcoded_color',
          value: match,
          severity: 'warning',
          line: lineNum,
          context: line.trim().slice(0, 80),
        });
      }
    }

    // Check Tailwind color classes
    const twMatches = line.match(TAILWIND_COLOR_PATTERN);
    if (twMatches) {
      for (const match of twMatches) {
        violations.push({
          type: 'hardcoded_color',
          value: match,
          severity: 'warning',
          line: lineNum,
          context: line.trim().slice(0, 80),
        });
      }
    }

    // Check hardcoded radius
    const radiusMatches = line.match(HARDCODED_RADIUS_PATTERN);
    if (radiusMatches) {
      for (const match of radiusMatches) {
        violations.push({
          type: 'hardcoded_radius',
          value: match,
          severity: 'warning',
          line: lineNum,
          context: line.trim().slice(0, 80),
        });
      }
    }

    // Check hardcoded shadows
    const shadowMatches = line.match(HARDCODED_SHADOW_PATTERN);
    if (shadowMatches) {
      for (const match of shadowMatches) {
        violations.push({
          type: 'hardcoded_shadow',
          value: match,
          severity: 'warning',
          line: lineNum,
          context: line.trim().slice(0, 80),
        });
      }
    }
  }

  return violations;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreFromViolations(violations: TokenViolation[], totalLines: number): number {
  if (totalLines === 0) return 10;

  const colorViolations  = violations.filter(v => v.type === 'hardcoded_color').length;
  const radiusViolations = violations.filter(v => v.type === 'hardcoded_radius').length;
  const shadowViolations = violations.filter(v => v.type === 'hardcoded_shadow').length;

  // Penalty: each violation = 0.2 points off, max penalty = 8 points
  const totalPenalty = Math.min(8, (colorViolations * 0.2) + (radiusViolations * 0.1) + (shadowViolations * 0.1));
  return Math.max(0, Math.round((10 - totalPenalty) * 10) / 10);
}

// ── Main validator ────────────────────────────────────────────────────────────

export function validateTokenUsage(code: string): TokenValidationResult {
  const violations = scanLines(code);
  const totalLines = code.split('\n').length;
  const score = scoreFromViolations(violations, totalLines);

  const hardcodedColorCount  = violations.filter(v => v.type === 'hardcoded_color').length;
  const hardcodedRadiusCount = violations.filter(v => v.type === 'hardcoded_radius').length;
  const hardcodedShadowCount = violations.filter(v => v.type === 'hardcoded_shadow').length;

  return {
    valid: violations.filter(v => v.severity === 'error').length === 0,
    violations,
    violationCount:      violations.length,
    hardcodedColorCount,
    hardcodedRadiusCount,
    hardcodedShadowCount,
    tokenQualityScore:   score,
  };
}

// ── Quick score (no full scan) ────────────────────────────────────────────────

export function quickTokenScore(code: string): number {
  if (!code) return 5;
  const result = validateTokenUsage(code);
  return result.tokenQualityScore;
}

// ── Check if code uses CSS variables ─────────────────────────────────────────

export function usesTokenVariables(code: string): boolean {
  return /var\(--(?:primary|accent|surface|border|text|radius|shadow|space|duration|easing)/.test(code);
}
