// ── V10.2 Workspace Step — Pipeline Integration ────────────────────────────────
//
// Runs as step 0.99995 — after MetaIntelligence (0.9995), before Planner (1).
// Analyzes the workspace state and injects manual-development context into the
// build pipeline. Static/deterministic — zero LLM calls.
// Failures MUST NEVER stop a build; always falls back to a safe default.

import type { Response } from 'express';
import { withAgentMetrics } from '../telemetry/agentMetrics.js';
import {
  getOrCreateWorkspace, buildWorkspaceBlueprint, wsValidate,
} from './workspaceFacade.js';
import type { WorkspaceBlueprint } from './manualWorkspaceTypes.js';
import { getWorkspaceMetricsSnapshot } from './workspaceMetrics.js';

export interface WorkspaceStepOutput {
  buildId:         string;
  blueprint:       WorkspaceBlueprint;
  contextString:   string;
  hasManualEdits:  boolean;
  conflictCount:   number;
  healthScore:     number;
}

const FALLBACK_BLUEPRINT: WorkspaceBlueprint = {
  projectId:       'fallback',
  mode:            'vibe',
  fileCount:       0,
  editCount:       0,
  conflictCount:   0,
  snapshotCount:   0,
  healthScore:     10,
  syncStatus:      'synced',
  mergeStrategy:   'merge-both',
  learningApplied: false,
  validationScore: 10,
  contextString:   'Workspace not initialized — pure AI generation mode',
};

function buildFallbackOutput(buildId: string): WorkspaceStepOutput {
  return {
    buildId,
    blueprint:      FALLBACK_BLUEPRINT,
    contextString:  FALLBACK_BLUEPRINT.contextString,
    hasManualEdits: false,
    conflictCount:  0,
    healthScore:    10,
  };
}

export async function runWorkspaceStep(
  buildId:   string,
  projectId: string,
  res:       Response,
): Promise<WorkspaceStepOutput> {
  return withAgentMetrics('ManualDevelopment', async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* never throw */ }
    };

    sendEvent({ type: 'workspace_start', buildId, projectId });

    let result: WorkspaceStepOutput;
    try {
      const blueprint = buildWorkspaceBlueprint(projectId);
      const validation = wsValidate(projectId);

      const state = getOrCreateWorkspace(projectId);
      const hasManualEdits = [...state.files.values()].some(f => f.editSource === 'manual');

      result = {
        buildId,
        blueprint,
        contextString: blueprint.contextString,
        hasManualEdits,
        conflictCount: blueprint.conflictCount,
        healthScore:   validation.healthScore,
      };

      sendEvent({
        type:           'workspace_progress',
        buildId,
        mode:           blueprint.mode,
        fileCount:      blueprint.fileCount,
        healthScore:    validation.healthScore,
        conflictCount:  blueprint.conflictCount,
        hasManualEdits,
        syncStatus:     blueprint.syncStatus,
      });

    } catch {
      result = buildFallbackOutput(buildId);
    }

    sendEvent({
      type:        'workspace_complete',
      buildId,
      healthScore: result.healthScore,
      mode:        result.blueprint.mode,
      valid:       result.conflictCount === 0,
    });

    return result;
  });
}

/** Called after build — records workspace learning. Never throws. */
export function finalizeWorkspaceStep(
  res:          Response,
  buildId:      string,
  blueprint:    WorkspaceBlueprint,
  buildSuccess: boolean,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* never throw */ }
    };

    const metrics = getWorkspaceMetricsSnapshot();
    sendEvent({
      type:        'workspace_learning',
      buildId,
      mode:        blueprint.mode,
      editRatio:   metrics.editRatio,
      healthScore: blueprint.healthScore,
      buildSuccess,
    });
  } catch { /* learning must never stop a build */ }
}
