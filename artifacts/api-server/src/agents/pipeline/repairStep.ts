import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callGroq, REPAIR_MODEL } from "../llm/llmClient.js";
import { validateTsxFile, runRuntimeValidator, validateRoutes } from "../frontend/codeSystem.js";
import { selectRegistryComponentsServer, computeRegistryHealthServer } from "../dna/dnaAgent.js";
import { estimateTokenCount } from "../../contextManager.js";
import type { ProjectFileSSE } from "../types.js";
import type { FrontendOutput, PipelineKeys } from "./pipelineTypes.js";

const MAX_REPAIR_PASSES = 3;
const REPAIR_SYSTEM = 'You are a React JSX repair agent. Fix ONLY the reported issues. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';

export async function runRepairStep(
  frontend: FrontendOutput,
  keys: PipelineKeys,
  res: Response
): Promise<FrontendOutput> {
  const { groqKey } = keys;
  const { projectFiles, fixedCode, architecture, registrySelection } = frontend;
  const { plan } = architecture;
  const { blueprint } = plan;

  let totalRepairAttempts = 0;
  let totalFilesRepaired = 0;
  const tsxTargets = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');

  for (let pass = 0; pass < MAX_REPAIR_PASSES; pass++) {
    const failures = tsxTargets.filter(f => !validateTsxFile(f.name, f.content).valid);
    if (failures.length === 0) {
      console.log(`[RepairLoop] All files valid after pass ${pass}. Done.`);
      break;
    }
    if (pass === MAX_REPAIR_PASSES - 1) {
      console.warn(`[RepairLoop] Pass ${pass + 1}: ${failures.length} file(s) still failing after max passes.`);
      break;
    }
    console.log(`[RepairLoop] Pass ${pass + 1}: Repairing ${failures.length} file(s)...`);

    await Promise.all(failures.map(async (file) => {
      const validation = validateTsxFile(file.name, file.content);
      console.warn(`[RepairLoop:pass${pass + 1}] ${file.name}: ${validation.issues.join('; ')}`);
      totalRepairAttempts++;
      try {
        const fixed = await callGroq(groqKey, REPAIR_MODEL,
          [
            { role: 'system', content: REPAIR_SYSTEM },
            { role: 'user', content: `File: ${file.name}\nIssues:\n${validation.issues.map(i => `- ${i}`).join('\n')}\n\nFull file:\n${file.content}` },
          ],
          false, 1500
        );
        if (fixed && fixed.length > 80) {
          const cleaned = fixed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
          if (cleaned.length > file.content.length * 0.5) {
            (file as { content: string }).content = cleaned;
            totalFilesRepaired++;
            console.log(`[RepairLoop] ✓ ${file.name} repaired (${cleaned.length} chars)`);
          }
        }
      } catch (e) { console.error(`[RepairLoop] ✗ ${file.name} repair failed:`, e); }
    }));
  }

  const finalTsxFiles = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');
  const passedTsxFiles = finalTsxFiles.filter(f => validateTsxFile(f.name, f.content).valid);
  const validationScore = finalTsxFiles.length > 0
    ? Math.round((passedTsxFiles.length / finalTsxFiles.length) * 100)
    : 100;

  const runtimeResult = runRuntimeValidator(projectFiles);
  if (runtimeResult.issues.length > 0) {
    console.log(`[RuntimeValidator] ${runtimeResult.runtimeErrors} errors across ${runtimeResult.filesValidated} files`);
  }

  const routeValidation = validateRoutes(projectFiles);
  if (!routeValidation.valid) {
    console.warn(`[RouteValidator] ${routeValidation.issues.length} route issue(s): ${routeValidation.issues.join('; ')}`);
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

  console.log(`[BuildHealth] compile=${validationScore}% runtime=${runtimeResult.runtimeScore}% routes=${routeValidation.valid ? 'ok' : 'broken'} repairs=${totalRepairAttempts}`);
  sse(res, { type: "build_health", ...buildHealthMetrics });
  if (runtimeResult.issues.length > 0) {
    sse(res, { type: "runtime_validate", issues: runtimeResult.issues, runtimeScore: runtimeResult.runtimeScore, routeIssues: routeValidation.issues });
  }

  if (Object.keys(registrySelection).length > 0) {
    const regHealth = computeRegistryHealthServer(registrySelection, blueprint.sectionOrder);
    console.log(`[Registry V5.4] Health: coverage=${regHealth.coverageScore}% mapped=${regHealth.mappedSections}/${regHealth.totalSections}`);
    sse(res, { type: "registry_health", ...regHealth });
  }

  return { ...frontend, buildHealthMetrics };
}
