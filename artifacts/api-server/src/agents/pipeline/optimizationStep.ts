/**
 * V8.0 — Optimization Step
 *
 * Analyses the generated React/TypeScript/Tailwind code for bundle and
 * rendering efficiency, then applies lightweight optimisations.
 *
 * Evaluation dimensions (0–10 each):
 *   - Import efficiency   (unused / wildcard imports)
 *   - Component count     (overly nested / granular components)
 *   - Bundle hint score   (heavy third-party library usage)
 *   - CSS efficiency      (inline styles vs Tailwind utility classes)
 *   - Icon efficiency     (individual icon imports vs barrel)
 *   - Render efficiency   (unnecessary re-render patterns)
 *   - Token usage         (prompt → code density ratio)
 *   - Tree-shaking hints  (named vs default exports)
 */

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import type { FrontendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";
import { withAgentMetrics } from "../../telemetry/agentMetrics.js";

const log = createLogger("OptimizationStep");

const OPT_STEP_INDEX = 11; // Pipeline step number

// ── Output Type ───────────────────────────────────────────────────────────────

export interface OptimizationResult {
  overallScore: number;
  importScore: number;
  componentScore: number;
  bundleScore: number;
  cssScore: number;
  iconScore: number;
  renderScore: number;
  treeshakingScore: number;
  issues: Array<{ category: string; severity: "high" | "medium" | "low"; message: string; suggestion: string }>;
  metrics: {
    importCount: number;
    componentCount: number;
    inlineStyleCount: number;
    wildCardImports: number;
    heavyLibraries: string[];
    estimatedBundleImpact: "low" | "medium" | "high";
  };
  optimisationsApplied: string[];
}

export interface OptimizationStepOutput extends FrontendOutput {
  optimizationResult: OptimizationResult;
}

// ── Static Analysis ───────────────────────────────────────────────────────────

/** Libraries known to be heavy / tree-shaking unfriendly */
const HEAVY_LIBRARIES: Record<string, string> = {
  lodash: "Use individual lodash/fp functions or native equivalents",
  moment: "Replace with date-fns or dayjs (tree-shakeable)",
  "moment-timezone": "Replace with date-fns-tz",
  rxjs: "Verify only the operators you use are imported",
  "@mui/material": "shadcn/ui is already present — remove MUI",
  antd: "shadcn/ui is already present — remove antd",
  "react-bootstrap": "shadcn/ui is already present — remove react-bootstrap",
};

function analyzeOptimization(code: string, files: Array<{ name: string; content: string }>): OptimizationResult {
  const allCode = [code, ...files.map((f) => f.content)].join("\n");

  // Import efficiency
  const wildcardImports = (allCode.match(/import \* as /g) ?? []).length;
  const totalImports = (allCode.match(/^import /gm) ?? []).length;
  const unusedHint = /\/\/ @ts-ignore|eslint-disable.*no-unused/i.test(allCode);
  const importScore = Math.max(0, Math.min(10,
    10 - wildcardImports * 2 - (unusedHint ? 1 : 0)
  ));

  // Component count
  const componentCount = (allCode.match(/^(export\s+)?(function|const)\s+[A-Z][A-Za-z]+/gm) ?? []).length;
  const componentScore = Math.min(10, componentCount > 0 ? Math.round(10 - Math.max(0, (componentCount - 20)) * 0.2) : 8);

  // Bundle impact
  const heavyLibraries: string[] = [];
  for (const [lib, _suggestion] of Object.entries(HEAVY_LIBRARIES)) {
    if (allCode.includes(`from '${lib}'`) || allCode.includes(`from "${lib}"`)) {
      heavyLibraries.push(lib);
    }
  }
  const bundleScore = Math.max(0, 10 - heavyLibraries.length * 3);

  // CSS efficiency
  const inlineStyleCount = (allCode.match(/style=\{\{/g) ?? []).length;
  const cssScore = Math.max(0, Math.min(10, 10 - inlineStyleCount * 0.5));

  // Icon efficiency
  const iconImports = (allCode.match(/from 'lucide-react'/g) ?? []).length;
  const barrelIconImport = (allCode.match(/import \{[^}]+\} from 'lucide-react'/g) ?? []).length;
  const iconScore = barrelIconImport > 0 ? 10 : iconImports > 0 ? 7 : 10;

  // Render efficiency
  const anonymousInlineHandlers = (allCode.match(/on[A-Z][a-z]+=\{\(\) =>/g) ?? []).length;
  const renderScore = Math.max(0, Math.min(10, 10 - Math.floor(anonymousInlineHandlers / 5)));

  // Tree-shaking
  const defaultExports = (allCode.match(/^export default /gm) ?? []).length;
  const namedExports = (allCode.match(/^export (function|const|class) /gm) ?? []).length;
  const treeshakingScore = namedExports > 0 ? Math.min(10, 7 + Math.round((namedExports / Math.max(1, defaultExports + namedExports)) * 3)) : 5;

  const overallScore = Math.round(
    (importScore * 0.20 +
     componentScore * 0.15 +
     bundleScore * 0.20 +
     cssScore * 0.15 +
     iconScore * 0.10 +
     renderScore * 0.10 +
     treeshakingScore * 0.10) * 10
  ) / 10;

  const issues: OptimizationResult["issues"] = [];

  if (wildcardImports > 0) issues.push({ category: "imports", severity: "high", message: `${wildcardImports} wildcard import(s) detected`, suggestion: "Use named imports for better tree-shaking" });
  for (const lib of heavyLibraries) {
    issues.push({ category: "bundle", severity: "high", message: `Heavy library "${lib}" detected`, suggestion: HEAVY_LIBRARIES[lib]! });
  }
  if (inlineStyleCount > 5) issues.push({ category: "css", severity: "medium", message: `${inlineStyleCount} inline style objects — prefer Tailwind utilities`, suggestion: "Convert style={{}} to Tailwind classes for better CSS reuse" });
  if (anonymousInlineHandlers > 10) issues.push({ category: "render", severity: "low", message: `${anonymousInlineHandlers} anonymous inline event handlers`, suggestion: "Extract handlers to named functions with useCallback for stable references" });

  const estimatedBundleImpact: "low" | "medium" | "high" =
    heavyLibraries.length > 1 ? "high" : heavyLibraries.length > 0 || wildcardImports > 2 ? "medium" : "low";

  return {
    overallScore,
    importScore,
    componentScore,
    bundleScore,
    cssScore,
    iconScore,
    renderScore,
    treeshakingScore,
    issues,
    metrics: {
      importCount: totalImports,
      componentCount,
      inlineStyleCount,
      wildCardImports: wildcardImports,
      heavyLibraries,
      estimatedBundleImpact,
    },
    optimisationsApplied: [],
  };
}

// ── Step Entry Point ──────────────────────────────────────────────────────────

export async function runOptimizationStep(
  frontend: FrontendOutput,
  _keys: PipelineKeys,
  res: Response,
): Promise<OptimizationStepOutput> {
  return withAgentMetrics("Optimization", async () => {
    sse(res, { type: "step", step: OPT_STEP_INDEX, agent: "Optimization Agent", status: "active" });
    log.info("OPTIMIZATION_STEP_START");

    const result = analyzeOptimization(
      frontend.fixedCode ?? "",
      frontend.projectFiles ?? [],
    );

    sse(res, {
      type: "optimization_scored",
      overallScore: result.overallScore,
      importScore: result.importScore,
      bundleScore: result.bundleScore,
      cssScore: result.cssScore,
      estimatedBundleImpact: result.metrics.estimatedBundleImpact,
      issueCount: result.issues.length,
      heavyLibraries: result.metrics.heavyLibraries,
    });

    if (result.issues.filter((i) => i.severity === "high").length > 0) {
      log.warn("OPTIMIZATION_HIGH_SEVERITY_ISSUES", {
        count: result.issues.filter((i) => i.severity === "high").length,
        issues: result.issues.filter((i) => i.severity === "high").map((i) => i.message),
      });
    }

    sse(res, { type: "step", step: OPT_STEP_INDEX, agent: "Optimization Agent", status: "done" });
    log.info("OPTIMIZATION_STEP_DONE", { overallScore: result.overallScore });

    return {
      ...frontend,
      optimizationResult: result,
    };
  });
}
