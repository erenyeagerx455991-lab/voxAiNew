import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callAI } from "../llm/aiService.js";
import { validateTsxFile, runRuntimeValidator, validateRoutes } from "../frontend/codeSystem.js";
import { selectRegistryComponentsServer, computeRegistryHealthServer } from "../dna/dnaAgent.js";
import { estimateTokenCount } from "../../contextManager.js";
import type { ProjectFileSSE } from "../types.js";
import type { FrontendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";
import { recordRepairAttempt, recordRepairSuccess, recordRepairFailure } from "../../telemetry/repairMetrics.js";
import { analyzeVisuals } from "../../visual-diff/visualAnalyzer.js";
import { validateRepairVisuals } from "../../visual-diff/repairValidator.js";
import { recordVisualBuild } from "../../visual-diff/history.js";

const log = createLogger("RepairStep");
const MAX_REPAIR_PASSES = 3;
const REPAIR_SYSTEM = 'You are a React JSX repair agent. Fix ONLY the reported issues. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';

export async function runRepairStep(
  frontend: FrontendOutput,
  keys: PipelineKeys,
  res: Response
): Promise<FrontendOutput> {
  const { openrouterKey } = keys;
  const { projectFiles, fixedCode, architecture, registrySelection } = frontend;
  const { plan } = architecture;
  const { blueprint } = plan;
  const buildId = (frontend as unknown as Record<string, unknown>).buildId as string ?? "unknown";

  let totalRepairAttempts = 0;
  let totalFilesRepaired = 0;
  const tsxTargets = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');

  for (let pass = 0; pass < MAX_REPAIR_PASSES; pass++) {
    const failures = tsxTargets.filter(f => !validateTsxFile(f.name, f.content).valid);
    if (failures.length === 0) {
      log.info("REPAIR_COMPLETE", { pass, status: "all_valid" });
      break;
    }
    if (pass === MAX_REPAIR_PASSES - 1) {
      log.warn("REPAIR_MAX_PASSES", { pass: pass + 1, remainingFailures: failures.length });
      for (const file of failures) {
        recordRepairFailure(buildId, file.name);
      }
      break;
    }
    log.info("REPAIR_PASS_START", { pass: pass + 1, failures: failures.length });

    await Promise.all(failures.map(async (file) => {
      const validation = validateTsxFile(file.name, file.content);
      log.warn("REPAIR_FILE_ISSUES", { file: file.name, pass: pass + 1, issues: validation.issues.join('; ') });
      totalRepairAttempts++;
      recordRepairAttempt(buildId, file.name);
      try {
        const fixed = await callAI(
          openrouterKey,
          [
            { role: 'system', content: REPAIR_SYSTEM },
            { role: 'user', content: `File: ${file.name}\nIssues:\n${validation.issues.map(i => `- ${i}`).join('\n')}\n\nFull file:\n${file.content}` },
          ],
          { label: `repair:${file.name}`, maxTokens: 1500 }
        );
        if (fixed && fixed.length > 80) {
          const cleaned = fixed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
          if (cleaned.length > file.content.length * 0.5) {
            (file as { content: string }).content = cleaned;
            totalFilesRepaired++;
            recordRepairSuccess(buildId, file.name, pass + 1);
            log.info("REPAIR_FILE_SUCCESS", { file: file.name, chars: cleaned.length });
          } else {
            recordRepairFailure(buildId, file.name);
          }
        } else {
          recordRepairFailure(buildId, file.name);
        }
      } catch (e) {
        recordRepairFailure(buildId, file.name);
        log.error("REPAIR_FILE_FAILED", { file: file.name, error: String(e) });
      }
    }));
  }

  const finalTsxFiles = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');
  const passedTsxFiles = finalTsxFiles.filter(f => validateTsxFile(f.name, f.content).valid);
  const validationScore = finalTsxFiles.length > 0
    ? Math.round((passedTsxFiles.length / finalTsxFiles.length) * 100)
    : 100;

  const runtimeResult = runRuntimeValidator(projectFiles);
  if (runtimeResult.issues.length > 0) {
    log.info("RUNTIME_VALIDATOR_ISSUES", { errors: runtimeResult.runtimeErrors, filesValidated: runtimeResult.filesValidated });
  }

  const routeValidation = validateRoutes(projectFiles);
  if (!routeValidation.valid) {
    log.warn("ROUTE_VALIDATION_FAILED", { issueCount: routeValidation.issues.length, issues: routeValidation.issues.join('; ') });
  }

  const buildHealthMetrics = {
    validationScore,
    compileSuccessRate: validationScore,
    repairAttempts: totalRepairAttempts,
    filesRepaired: totalFilesRepaired,
    totalFiles: projectFiles.length,
    passedFiles: passedTsxFiles.length,
    failedFiles: finalTsxFiles.length - passedTsxFiles.length,
    tokenEstimate: estimateTokenCount(fixedCode),
    runtimeScore: runtimeResult.runtimeScore,
    runtimeErrors: runtimeResult.runtimeErrors,
    filesValidated: runtimeResult.filesValidated,
    runtimeRepairAttempts: 0,
    routesValid: routeValidation.valid,
  };

  log.info("BUILD_HEALTH", {
    compileScore: validationScore,
    runtimeScore: runtimeResult.runtimeScore,
    routesValid: routeValidation.valid,
    repairAttempts: totalRepairAttempts,
  });
  sse(res, { type: "build_health", ...buildHealthMetrics });
  if (runtimeResult.issues.length > 0) {
    sse(res, { type: "runtime_validate", issues: runtimeResult.issues, runtimeScore: runtimeResult.runtimeScore, routeIssues: routeValidation.issues });
  }

  if (Object.keys(registrySelection).length > 0) {
    const regHealth = computeRegistryHealthServer(registrySelection, blueprint.sectionOrder);
    log.info("REGISTRY_HEALTH", { coverage: regHealth.coverageScore, mapped: regHealth.mappedSections, total: regHealth.totalSections });
    sse(res, { type: "registry_health", ...regHealth });
  }

  // V7.3.4 Phase 10: Visual Regression Guard
  // Compare winner (original) vs repaired output — abort ship if visuals degrade.
  try {
    const sectionOrder = blueprint.sectionOrder ?? [];
    const winnerCode  = fixedCode;          // pre-repair code (the selected winner)
    const repairedCode = projectFiles
      .filter(f => f.lang === 'tsx' && f.name !== 'main.tsx')
      .map(f => f.content)
      .join('\n');

    const repairValidation = validateRepairVisuals(winnerCode, repairedCode, sectionOrder, buildId);

    // Record in history — visible in telemetry + learning loop
    const winnerVisual = analyzeVisuals(winnerCode, sectionOrder, buildId, buildId);
    recordVisualBuild(buildId, [], winnerVisual.visualScore, repairValidation);

    log.info("VISUAL_REPAIR_VALIDATION", {
      passed:        repairValidation.passed,
      regression:    repairValidation.regression,
      regressionType: repairValidation.regressionType ?? 'none',
      winnerScore:   repairValidation.winnerScore,
      repairedScore: repairValidation.repairedScore,
      delta:         repairValidation.delta,
    });

    sse(res, {
      type:          "visual_repair_validation",
      passed:        repairValidation.passed,
      regression:    repairValidation.regression,
      regressionType: repairValidation.regressionType ?? null,
      winnerScore:   repairValidation.winnerScore,
      repairedScore: repairValidation.repairedScore,
      delta:         repairValidation.delta,
      details:       repairValidation.details,
    });

    if (!repairValidation.passed) {
      log.warn("VISUAL_REGRESSION_DETECTED", {
        regressionType: repairValidation.regressionType,
        delta: repairValidation.delta,
        details: repairValidation.details,
      });
      sse(res, {
        type:    "visual_regression_detected",
        details: repairValidation.details,
        delta:   repairValidation.delta,
      });
      // Do NOT block the build — flag only; code correctness repairs always ship.
      // A future V7.3.5 pass can revert when visual regression exceeds hard threshold.
    }
  } catch (e) {
    log.warn("VISUAL_REPAIR_VALIDATION_FAILED", { error: String(e) });
  }

  return { ...frontend, buildHealthMetrics };
}
