import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callAI } from "../llm/aiService.js";
import { resolveDependencies } from "../../runtime/dependencyResolver.js";
import * as runtimeManager from "../../runtime/runtimeManager.js";
import { setupWorkspace, rebuildWorkspace, teardownWorkspace, buildRepairTargets } from "../../runtime/buildExecutor.js";
import type { RealBuildError } from "../../runtime/buildExecutor.js";
import type { ProjectFileSSE, ProjectBlueprint, ServerKnowledgeGraph } from "../types.js";
import { createLogger } from "../../lib/structuredLogger.js";
import { recordRuntimeCheck, recordViteBuildDuration, recordRepairLoopDuration } from "../../telemetry/runtimeMetrics.js";
import { recordRepairAttempt, recordRepairSuccess, recordRepairFailure } from "../../telemetry/repairMetrics.js";

const log = createLogger("RuntimeValidationStep");
const REAL_REPAIR_SYSTEM = 'You are a React/TypeScript build repair agent. Fix ONLY the reported build errors. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';

export interface RuntimeStepInput {
  allFiles: ProjectFileSSE[];
  projectBlueprint: ProjectBlueprint;
  knowledgeGraph: ServerKnowledgeGraph;
  chatId: string;
  buildId?: string;
}

export async function runRuntimeValidationStep(
  input: RuntimeStepInput,
  keys: { openrouterKey: string },
  res: Response
): Promise<{ allFiles: ProjectFileSSE[]; finalRuntimeState: Record<string, unknown> }> {
  const { allFiles, projectBlueprint, chatId } = input;
  const buildId = input.buildId ?? chatId;
  const { openrouterKey } = keys;

  sse(res, { type: "step", step: 9, agent: "Runtime Agent", status: "active" });
  sse(res, { type: "runtime_install_start" });

  const resolvedDeps = resolveDependencies(
    projectBlueprint.features ?? [],
    { projectType: projectBlueprint.projectType, authNeeded: projectBlueprint.authNeeded, apis: projectBlueprint.apis }
  );
  log.info("RUNTIME_DEPS_RESOLVED", { packageCount: resolvedDeps.packages.length });

  const runtimeLogs: Array<{ timestamp: number; type: string; message: string }> = [];
  const rtLog = (type: 'info' | 'error' | 'warn' | 'success', message: string) => {
    const entry = { timestamp: Date.now(), type, message };
    runtimeLogs.push(entry);
    runtimeManager.addLog(chatId, type, message);
    sse(res, { type: "runtime_log", logType: type, message });
  };

  rtLog('info', `Starting real build for ${allFiles.length} files...`);
  rtLog('info', `Packages: ${resolvedDeps.packages.slice(0, 5).join(', ')}${resolvedDeps.packages.length > 5 ? '…' : ''}`);

  runtimeManager.setState(chatId, { status: 'installing', startedAt: Date.now(), dependencies: resolvedDeps });

  const MAX_REAL_PASSES = 5;
  let realBuildPassed = false;
  let realBuildErrors: RealBuildError[] = [];
  let totalRealRepairAttempts = 0;
  let workspaceDir = '';
  const realBuildStart = Date.now();

  try {
    rtLog('info', 'Creating isolated workspace...');
    const setup = await setupWorkspace(
      allFiles as Array<{ name: string; path?: string; content: string; lang: string }>,
      resolvedDeps.packages,
      rtLog
    );
    workspaceDir = setup.workspaceDir;

    sse(res, {
      type: "runtime_install_done",
      dependencies: resolvedDeps.packages,
      devDependencies: resolvedDeps.devPackages,
      packageJson: resolvedDeps.packageJson,
      warnings: resolvedDeps.warnings,
      installDurationMs: setup.installDurationMs,
      installSuccess: setup.installSuccess,
    });

    if (!setup.installSuccess) {
      realBuildErrors = setup.errors;
      sse(res, { type: "runtime_failed", errors: setup.errors, phase: 'install' });
      rtLog('error', `npm install failed after ${(setup.installDurationMs / 1000).toFixed(1)}s`);
    } else {
      rtLog('info', `npm install succeeded in ${(setup.installDurationMs / 1000).toFixed(1)}s`);
      sse(res, { type: "runtime_start" });
      sse(res, { type: "runtime_build_start" });
      runtimeManager.setState(chatId, { status: 'running' });

      for (let pass = 0; pass < MAX_REAL_PASSES; pass++) {
        const viteBuildStart = Date.now();
        const buildResult = await rebuildWorkspace(
          workspaceDir,
          allFiles as Array<{ name: string; path?: string; content: string; lang: string }>,
          rtLog
        );
        recordViteBuildDuration(Date.now() - viteBuildStart);

        if (buildResult.success) {
          realBuildPassed = true;
          realBuildErrors = [];
          sse(res, { type: "runtime_build_done", pass: pass + 1, success: true, durationMs: buildResult.durationMs });
          sse(res, { type: "runtime_passed", pass: pass + 1, totalDurationMs: Date.now() - realBuildStart });
          rtLog('success', `Real build passed on pass ${pass + 1} (${((Date.now() - realBuildStart) / 1000).toFixed(1)}s total)`);
          break;
        }

        realBuildErrors = buildResult.errors;
        sse(res, { type: "runtime_error", pass: pass + 1, errors: buildResult.errors.slice(0, 10) });
        rtLog('warn', `Pass ${pass + 1}: ${buildResult.errors.length} build error(s)`);

        if (pass === MAX_REAL_PASSES - 1) {
          sse(res, { type: "runtime_build_done", pass: pass + 1, success: false, durationMs: buildResult.durationMs });
          sse(res, { type: "runtime_failed", errors: buildResult.errors.slice(0, 10), passes: MAX_REAL_PASSES, phase: 'build' });
          rtLog('error', `Build failed after ${MAX_REAL_PASSES} repair passes`);
          break;
        }

        const repairStart = Date.now();
        const repairTargets = buildRepairTargets(buildResult.errors, allFiles as never[]);
        sse(res, { type: "runtime_repair_start", pass: pass + 1, targets: repairTargets.length, errors: buildResult.errors.length });
        rtLog('info', `Repair pass ${pass + 1}: targeting ${repairTargets.length} file(s)...`);
        runtimeManager.setState(chatId, { status: 'repaired' });

        if (repairTargets.length === 0) {
          rtLog('warn', 'No specific files targeted — stopping repair loop');
          sse(res, { type: "runtime_failed", errors: buildResult.errors, phase: 'no-targets' });
          break;
        }

        await Promise.all(repairTargets.map(async (target) => {
          totalRealRepairAttempts++;
          const fileName = target.file.name;
          recordRepairAttempt(buildId, fileName);
          try {
            const fixed = await callAI(
              openrouterKey,
              [{ role: 'system', content: REAL_REPAIR_SYSTEM }, { role: 'user', content: target.context }],
              { label: `runtime-repair:${target.file.name}`, maxTokens: 2000 }
            );
            if (fixed && fixed.length > 80) {
              const cleaned = fixed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
              target.file.content = cleaned;
              recordRepairSuccess(buildId, fileName, pass + 1);
              rtLog('success', `Repaired ${fileName} (${cleaned.length} chars)`);
            } else {
              recordRepairFailure(buildId, fileName);
            }
          } catch (repairErr: unknown) {
            const err = repairErr as Error;
            recordRepairFailure(buildId, fileName);
            rtLog('warn', `Repair skip ${fileName}: ${err?.message ?? repairErr}`);
          }
        }));

        recordRepairLoopDuration(Date.now() - repairStart);
        sse(res, { type: "runtime_repair_done", pass: pass + 1, repaired: repairTargets.length });
      }
    }
  } catch (execErr: unknown) {
    const err = execErr as Error;
    rtLog('error', `Runtime executor error: ${err?.message ?? execErr}`);
    realBuildErrors = [{ category: 'build', message: err?.message ?? 'Executor error', confidence: 'low' }];
  } finally {
    if (workspaceDir) await teardownWorkspace(workspaceDir).catch(() => {});
  }

  const totalRealDurationMs = Date.now() - realBuildStart;
  recordRuntimeCheck(realBuildPassed);

  const healthScore = realBuildPassed
    ? 95
    : Math.max(20, 70 - Math.min(50, realBuildErrors.length * 8));

  const finalRuntimeState = runtimeManager.setState(chatId, {
    status: realBuildPassed ? 'running' : 'failed',
    buildPassed: realBuildPassed,
    runtimePassed: realBuildPassed,
    buildErrors: realBuildErrors.map(e => ({ file: e.file ?? 'unknown', type: 'error' as const, message: e.message, rule: e.category })),
    healthScore,
    finishedAt: Date.now(),
    repairedFiles: totalRealRepairAttempts,
  });

  sse(res, {
    type: "runtime_health",
    chatId,
    health: healthScore,
    status: finalRuntimeState.status,
    buildPassed: realBuildPassed,
    runtimePassed: realBuildPassed,
    attempts: finalRuntimeState.attempts,
    dependencies: resolvedDeps.packages,
    devDependencies: resolvedDeps.devPackages,
    packageJson: resolvedDeps.packageJson,
    logs: runtimeLogs,
    buildErrors: finalRuntimeState.buildErrors,
    warnings: [],
    missingImports: [],
    filesValidated: allFiles.length,
    filesTotal: allFiles.length,
    realBuild: true,
    totalDurationMs: totalRealDurationMs,
    repairAttempts: totalRealRepairAttempts,
  });

  sse(res, { type: "runtime_complete", chatId, state: finalRuntimeState });
  sse(res, { type: "step", step: 9, agent: "Runtime Agent", status: realBuildPassed ? "done" : "warn" });
  log.info("RUNTIME_COMPLETE", {
    buildPassed: realBuildPassed,
    healthScore,
    repairAttempts: totalRealRepairAttempts,
    durationMs: totalRealDurationMs,
  });

  return { allFiles, finalRuntimeState: finalRuntimeState as Record<string, unknown> };
}
