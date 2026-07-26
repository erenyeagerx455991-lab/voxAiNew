// ── V10.2 Workspace Learning — Deterministic ──────────────────────────────────
//
// Learns coding preferences from manual edits and adjusts AI generation.
// Zero LLM calls. Never throws.

import type {
  WorkspaceLearningRecord, CodingStylePrefs, FrameworkPrefs, FolderConventions,
  WorkspaceEdit, WorkspaceFile,
} from './manualWorkspaceTypes.js';
import { detectCodingStyle } from './formatterPlanner.js';
import { detectFolderConventions, detectFrameworkPrefs } from './projectStructurePlanner.js';
import { saveLearningRecord, getLearningForProject } from './workspacePersistence.js';

// ── Learning from edits ────────────────────────────────────────────────────────

export function learnFromEdit(
  projectId:    string,
  edit:         WorkspaceEdit,
  currentRecord?: WorkspaceLearningRecord,
): WorkspaceLearningRecord {
  const base = currentRecord ?? createDefaultLearning(projectId);

  // Update edit frequency
  const editFrequency = { ...base.editFrequency };
  editFrequency[edit.filePath] = (editFrequency[edit.filePath] ?? 0) + 1;

  // Update AI acceptance rate
  const accepted = edit.source === 'ai' ? 1 : 0;
  const total    = Object.values(editFrequency).reduce((s, n) => s + n, 0);
  const aiEdits  = Math.max(1, total * base.aiAcceptanceRate);
  const aiAcceptanceRate = Math.round(((aiEdits + accepted) / (total + 1)) * 100) / 100;

  // Update manual ratio
  const manualEdits = edit.source === 'manual' ? 1 : 0;
  const manualEditRatio = Math.round(
    ((base.manualEditRatio * (total - 1) + manualEdits) / total) * 100,
  ) / 100;

  // Update coding style from edit content
  const codingStyle = learnCodingStyleFromEdit(base.codingStyle, edit.newContent);

  return {
    ...base,
    codingStyle,
    editFrequency,
    aiAcceptanceRate,
    manualEditRatio,
    observedAt: Date.now(),
  };
}

function learnCodingStyleFromEdit(
  current: CodingStylePrefs,
  newContent: string,
): CodingStylePrefs {
  if (!newContent || newContent.length < 50) return current;
  try {
    const detected = detectCodingStyle([newContent]);
    // Blend: trust detected style 30%, current 70%
    return {
      indentation:    detected.indentation,
      indentSize:     detected.indentSize,
      quotes:         detected.quotes,
      semicolons:     detected.semicolons,
      trailingCommas: detected.trailingCommas,
      lineEnding:     detected.lineEnding,
      maxLineLength:  Math.round(current.maxLineLength * 0.7 + detected.maxLineLength * 0.3),
    };
  } catch { return current; }
}

// ── Learning from workspace files ─────────────────────────────────────────────

export function learnFromWorkspace(
  projectId:         string,
  files:             WorkspaceFile[],
  packageJsonContent?: string,
): WorkspaceLearningRecord {
  const existing = getLearningForProject(projectId);
  const base     = existing ?? createDefaultLearning(projectId);

  const contents      = files.map(f => f.content);
  const codingStyle   = contents.length > 0 ? detectCodingStyle(contents) : base.codingStyle;
  const paths         = files.map(f => f.path);
  const conventions   = detectFolderConventions(paths);
  const frameworkPrefs = detectFrameworkPrefs(packageJsonContent);

  const aiEdits   = files.filter(f => f.editSource === 'ai').length;
  const totalFiles = files.length;
  const aiRatio   = totalFiles > 0 ? aiEdits / totalFiles : 0;
  const manualEditRatio = 1 - aiRatio;

  const record: WorkspaceLearningRecord = {
    projectId,
    codingStyle,
    frameworkPrefs,
    folderConventions: conventions,
    editFrequency:     base.editFrequency,
    aiAcceptanceRate:  base.aiAcceptanceRate,
    conflictRate:      base.conflictRate,
    manualEditRatio,
    observedAt:        Date.now(),
  };

  saveLearningRecord(record);
  return record;
}

// ── Conflict learning ──────────────────────────────────────────────────────────

export function learnFromConflict(
  record:        WorkspaceLearningRecord,
  wasConflict:   boolean,
): WorkspaceLearningRecord {
  // Exponential moving average for conflict rate
  const alpha       = 0.2;
  const conflictRate = record.conflictRate * (1 - alpha) + (wasConflict ? 1 : 0) * alpha;
  return { ...record, conflictRate: Math.round(conflictRate * 1000) / 1000 };
}

// ── Context string for AI ─────────────────────────────────────────────────────

export function buildLearningContextString(record: WorkspaceLearningRecord): string {
  const { codingStyle, frameworkPrefs, folderConventions } = record;
  return [
    `Coding style: ${codingStyle.indentation} ${codingStyle.indentSize}, ${codingStyle.quotes} quotes, ${codingStyle.semicolons ? 'semicolons' : 'no semicolons'}`,
    `State management: ${frameworkPrefs.stateManagement.join(', ') || 'not detected'}`,
    `CSS: ${frameworkPrefs.cssApproach.join(', ') || 'not detected'}`,
    `Testing: ${frameworkPrefs.testingLibs.join(', ') || 'not detected'}`,
    `Components: ${folderConventions.componentDir}`,
    `Hooks: ${folderConventions.hooksDir}`,
    `Utils: ${folderConventions.utilsDir}`,
    `AI acceptance rate: ${Math.round(record.aiAcceptanceRate * 100)}%`,
    `Manual edit ratio: ${Math.round(record.manualEditRatio * 100)}%`,
    `Conflict rate: ${Math.round(record.conflictRate * 100)}%`,
  ].join('\n');
}

// ── Default factory ────────────────────────────────────────────────────────────

function createDefaultLearning(projectId: string): WorkspaceLearningRecord {
  return {
    projectId,
    codingStyle: {
      indentation: 'spaces', indentSize: 2, quotes: 'single',
      semicolons: true, trailingCommas: true, lineEnding: 'lf', maxLineLength: 100,
    },
    frameworkPrefs:    { stateManagement: [], cssApproach: [], testingLibs: [], preferredLibs: [] },
    folderConventions: {
      componentDir: 'src/components', hooksDir: 'src/hooks', utilsDir: 'src/utils',
      typesDir: 'src/types', servicesDir: 'src/services', testDir: 'src/__tests__',
    },
    editFrequency:    {},
    aiAcceptanceRate: 0.8,
    conflictRate:     0.1,
    manualEditRatio:  0.3,
    observedAt:       Date.now(),
  };
}
