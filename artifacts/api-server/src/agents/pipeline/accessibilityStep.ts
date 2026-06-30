/**
 * V8.0 — Accessibility Step
 *
 * Dedicated WCAG 2.1 AA compliance pass executed after the Conversion
 * Intelligence step.  Analyses the generated React/Tailwind code for
 * accessibility issues and applies targeted repairs when the score falls
 * below the threshold.
 *
 * Evaluation categories (0–10 each):
 *   - Semantic HTML (headings, landmarks, lists)
 *   - ARIA attributes (labels, roles, descriptions)
 *   - Keyboard navigation (focus rings, tab order, skip links)
 *   - Colour contrast (text on background)
 *   - Alt text (images, icons)
 *   - Form accessibility (labels, errors, fieldsets)
 *   - Interactive elements (button type, disabled states)
 *   - Motion (prefers-reduced-motion)
 */

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callAI } from "../llm/aiService.js";
import type { FrontendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";
import { withAgentMetrics } from "../../telemetry/agentMetrics.js";

const log = createLogger("AccessibilityStep");

// ── Threshold ─────────────────────────────────────────────────────────────────

const A11Y_REPAIR_THRESHOLD = 7.5; // Trigger repair below this overall score
const A11Y_STEP_INDEX = 10; // Pipeline step number

// ── Output Type ───────────────────────────────────────────────────────────────

export interface AccessibilityResult {
  overallScore: number;
  semanticScore: number;
  ariaScore: number;
  keyboardScore: number;
  contrastScore: number;
  altTextScore: number;
  formA11yScore: number;
  interactiveScore: number;
  motionScore: number;
  issues: Array<{ category: string; severity: "critical" | "warning" | "info"; message: string; suggestion: string }>;
  repairApplied: boolean;
  scoreBeforeRepair: number;
  scoreAfterRepair: number;
}

export interface AccessibilityStepOutput extends FrontendOutput {
  accessibilityResult: AccessibilityResult;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

const SEMANTIC_PATTERNS = [
  { pattern: /<h[1-6][\s>]/i, good: true, score: 1, label: "headings" },
  { pattern: /<main[\s>]/i, good: true, score: 1, label: "main-landmark" },
  { pattern: /<nav[\s>]/i, good: true, score: 1, label: "nav-landmark" },
  { pattern: /<section[\s>]/i, good: true, score: 0.5, label: "section" },
  { pattern: /<footer[\s>]/i, good: true, score: 0.5, label: "footer" },
  { pattern: /<div\s+onClick/i, good: false, score: -1, label: "div-click-handler" },
  { pattern: /<span\s+onClick/i, good: false, score: -0.5, label: "span-click-handler" },
];

const ARIA_PATTERNS = [
  { pattern: /aria-label=/i, good: true, score: 1, label: "aria-label" },
  { pattern: /aria-describedby=/i, good: true, score: 0.5, label: "aria-describedby" },
  { pattern: /role=/i, good: true, score: 0.5, label: "role" },
  { pattern: /aria-hidden=/i, good: true, score: 0.5, label: "aria-hidden" },
];

const KEYBOARD_PATTERNS = [
  { pattern: /focus-visible/i, good: true, score: 1.5, label: "focus-visible" },
  { pattern: /onKeyDown|onKeyUp|onKeyPress/i, good: true, score: 0.5, label: "keyboard-handler" },
  { pattern: /tabIndex=/i, good: true, score: 0.5, label: "tabindex" },
  { pattern: /outline-none/i, good: false, score: -1, label: "outline-removed" },
];

const ALT_PATTERNS = [
  { pattern: /alt="[^"]+"/i, good: true, score: 1, label: "alt-text" },
  { pattern: /alt=""/i, good: true, score: 0.5, label: "decorative-alt" },
  { pattern: /<img(?![^>]*alt=)/i, good: false, score: -1, label: "missing-alt" },
];

const FORM_A11Y_PATTERNS = [
  { pattern: /<Label\b/i, good: true, score: 1, label: "form-label" },
  { pattern: /htmlFor=/i, good: true, score: 0.5, label: "label-for" },
  { pattern: /aria-invalid=/i, good: true, score: 0.5, label: "aria-invalid" },
  { pattern: /aria-required=/i, good: true, score: 0.5, label: "aria-required" },
];

const INTERACTIVE_PATTERNS = [
  { pattern: /type="button"/i, good: true, score: 1, label: "button-type" },
  { pattern: /type="submit"/i, good: true, score: 0.5, label: "submit-type" },
  { pattern: /disabled=/i, good: true, score: 0.5, label: "disabled-attr" },
];

const MOTION_PATTERNS = [
  { pattern: /prefers-reduced-motion/i, good: true, score: 2, label: "reduced-motion" },
  { pattern: /motion-safe:|motion-reduce:/i, good: true, score: 1, label: "tailwind-motion" },
];

function scorePatterns(code: string, patterns: Array<{ pattern: RegExp; good: boolean; score: number; label: string }>): number {
  let score = 5; // baseline 5/10
  for (const { pattern, good, score: delta } of patterns) {
    if (pattern.test(code)) score += good ? delta : delta;
  }
  return Math.max(0, Math.min(10, score));
}

function analyzeAccessibility(code: string): AccessibilityResult {
  const semanticScore = scorePatterns(code, SEMANTIC_PATTERNS);
  const ariaScore = scorePatterns(code, ARIA_PATTERNS);
  const keyboardScore = scorePatterns(code, KEYBOARD_PATTERNS);
  const altTextScore = scorePatterns(code, ALT_PATTERNS);
  const formA11yScore = scorePatterns(code, FORM_A11Y_PATTERNS);
  const interactiveScore = scorePatterns(code, INTERACTIVE_PATTERNS);
  const motionScore = scorePatterns(code, MOTION_PATTERNS);
  const contrastScore = 7; // Contrast analysis requires render — baseline score

  const overallScore = Math.round(
    (semanticScore * 0.20 +
     ariaScore * 0.15 +
     keyboardScore * 0.20 +
     contrastScore * 0.10 +
     altTextScore * 0.10 +
     formA11yScore * 0.10 +
     interactiveScore * 0.10 +
     motionScore * 0.05) * 10
  ) / 10;

  const issues: AccessibilityResult["issues"] = [];

  if (semanticScore < 6) issues.push({ category: "semantic", severity: "warning", message: "Missing semantic HTML landmarks", suggestion: "Add <main>, <nav>, <section> elements instead of generic <div>s" });
  if (ariaScore < 5) issues.push({ category: "aria", severity: "warning", message: "Low ARIA coverage", suggestion: "Add aria-label to interactive elements without visible text" });
  if (keyboardScore < 5) issues.push({ category: "keyboard", severity: "critical", message: "Missing focus-visible styles", suggestion: "Add focus-visible: ring utility to all interactive elements" });
  if (/outline-none/i.test(code)) issues.push({ category: "keyboard", severity: "critical", message: "outline-none removes focus indicators", suggestion: "Replace outline-none with focus-visible:outline-none to preserve keyboard focus" });
  if (/<img(?![^>]*alt=)/i.test(code)) issues.push({ category: "alt-text", severity: "critical", message: "Images missing alt attribute", suggestion: "Add descriptive alt text or alt=\"\" for decorative images" });
  if (!(/prefers-reduced-motion/i.test(code)) && /animate|transition|motion/i.test(code)) issues.push({ category: "motion", severity: "info", message: "Animations present without reduced-motion check", suggestion: "Use Tailwind motion-safe: or @media (prefers-reduced-motion: reduce)" });

  return {
    overallScore,
    semanticScore,
    ariaScore,
    keyboardScore,
    contrastScore,
    altTextScore,
    formA11yScore,
    interactiveScore,
    motionScore,
    issues,
    repairApplied: false,
    scoreBeforeRepair: overallScore,
    scoreAfterRepair: overallScore,
  };
}

// ── Repair ────────────────────────────────────────────────────────────────────

const A11Y_REPAIR_SYSTEM = `You are a React/TypeScript Accessibility Repair Agent (WCAG 2.1 AA).

Your task: fix ONLY the reported accessibility issues in the provided React component.

REQUIRED FIXES (apply all that are relevant):
1. Add aria-label to icon-only buttons: <Button aria-label="Close dialog">
2. Add type="button" to all non-submit buttons
3. Replace outline-none with focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
4. Add alt="" to decorative images, descriptive alt to meaningful images
5. Wrap form inputs with <Label htmlFor="id"> linked via id=
6. Add role="img" aria-label="description" to decorative SVGs
7. Add @media (prefers-reduced-motion: reduce) or motion-safe: Tailwind prefix to all animations
8. Replace <div onClick> with <button> elements
9. Add aria-invalid="true" to inputs with validation errors
10. Add <main> landmark wrapping page content

RULES:
- Return ONLY the complete corrected file
- No markdown fences, no explanation
- Do not change layout, design, or functionality
- Preserve all existing class names and styles`;

async function repairAccessibility(
  code: string,
  issues: AccessibilityResult["issues"],
  openrouterKey: string,
): Promise<string> {
  const topIssues = issues
    .filter((i) => i.severity !== "info")
    .slice(0, 5)
    .map((i) => `- [${i.severity.toUpperCase()}] ${i.category}: ${i.message}. Fix: ${i.suggestion}`)
    .join("\n");

  if (!topIssues) return code;

  const repaired = await callAI(
    openrouterKey,
    [
      { role: "system", content: A11Y_REPAIR_SYSTEM },
      { role: "user", content: `ACCESSIBILITY ISSUES TO FIX:\n${topIssues}\n\nCOMPONENT:\n${code.slice(0, 6000)}` },
    ],
    { label: "a11y-repair", maxTokens: 4000 },
  );

  const cleaned = repaired
    .replace(/^```[a-z]*\r?\n?/im, "")
    .replace(/\r?\n?```$/m, "")
    .trim();

  return cleaned.length > code.length * 0.3 ? cleaned : code;
}

// ── Step Entry Point ──────────────────────────────────────────────────────────

export async function runAccessibilityStep(
  frontend: FrontendOutput,
  keys: PipelineKeys,
  res: Response,
): Promise<AccessibilityStepOutput> {
  return withAgentMetrics("Accessibility", async () => {
    sse(res, { type: "step", step: A11Y_STEP_INDEX, agent: "Accessibility Agent", status: "active" });
    log.info("ACCESSIBILITY_STEP_START");

    const code = frontend.fixedCode ?? "";
    const result = analyzeAccessibility(code);

    sse(res, {
      type: "accessibility_scored",
      overallScore: result.overallScore,
      semanticScore: result.semanticScore,
      ariaScore: result.ariaScore,
      keyboardScore: result.keyboardScore,
      altTextScore: result.altTextScore,
      formA11yScore: result.formA11yScore,
      interactiveScore: result.interactiveScore,
      motionScore: result.motionScore,
      issueCount: result.issues.length,
      criticalCount: result.issues.filter((i) => i.severity === "critical").length,
    });

    let finalResult = result;
    let fixedCode = code;

    if (result.overallScore < A11Y_REPAIR_THRESHOLD && result.issues.length > 0) {
      log.info("ACCESSIBILITY_REPAIR_TRIGGERED", { score: result.overallScore, issues: result.issues.length });
      sse(res, { type: "accessibility_repair_start", score: result.overallScore, threshold: A11Y_REPAIR_THRESHOLD });

      try {
        const repairedCode = await repairAccessibility(code, result.issues, keys.openrouterKey);
        const afterResult = analyzeAccessibility(repairedCode);

        if (afterResult.overallScore >= result.overallScore) {
          fixedCode = repairedCode;
          finalResult = {
            ...afterResult,
            repairApplied: true,
            scoreBeforeRepair: result.overallScore,
            scoreAfterRepair: afterResult.overallScore,
          };
          log.info("ACCESSIBILITY_REPAIR_DONE", { before: result.overallScore, after: afterResult.overallScore });
        }
      } catch (err) {
        log.error("ACCESSIBILITY_REPAIR_ERROR", { error: String(err) });
      }

      sse(res, {
        type: "accessibility_repair_done",
        scoreBeforeRepair: finalResult.scoreBeforeRepair,
        scoreAfterRepair: finalResult.scoreAfterRepair,
        repairApplied: finalResult.repairApplied,
      });
    }

    sse(res, { type: "step", step: A11Y_STEP_INDEX, agent: "Accessibility Agent", status: "done" });
    log.info("ACCESSIBILITY_STEP_DONE", { overallScore: finalResult.overallScore });

    return {
      ...frontend,
      fixedCode,
      accessibilityResult: finalResult,
    };
  });
}
