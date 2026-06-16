import type { ProjectBlueprint, ProjectFile, ProjectMemory, DNABuildData, EditDiff, BuildHealth, ProjectKnowledgeGraph, RegistrySelection, RegistryHealth, RegistryFileMap } from './builderService';
import type { ProjectTemplate } from './templateMarketplace';

export type { RegistrySelection, RegistryHealth, RegistryFileMap };

export type { EditDiff, BuildHealth, ProjectKnowledgeGraph };

export interface RegistryHealthV2 {
  registryCoverage: number;
  lockedComponents: number;
  preservedComponents: number;
  replacedComponents: number;
  editSafetyScore: number;
  preservedList: string[];
  replacedList: string[];
  modifiedSections: string[];
}

export interface EditImpact {
  affectedSections: string[];
  affectedFiles: string[];
  lockedConflicts: string[];
  replacementMode: string | null;
}

const API_BASE = "/api";

// ── Template Marketplace API ──────────────────────────────────────────────────
export async function fetchTemplates(): Promise<ProjectTemplate[]> {
  try {
    const r = await fetch(`${API_BASE}/agents/templates`);
    if (!r.ok) return [];
    const { templates } = await r.json();
    return templates ?? [];
  } catch { return []; }
}

export async function matchTemplateApi(prompt: string): Promise<{ templateId: string; confidence: number } | null> {
  try {
    const r = await fetch(`${API_BASE}/agents/templates/match`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!r.ok) return null;
    const { best } = await r.json();
    return { templateId: best.templateId, confidence: best.confidence };
  } catch { return null; }
}

// ── BUILD (Phase 0 — full generation) ────────────────────────────────────────
export async function mockStreamResponse(
  prompt: string,
  onToken: (token: string) => void,
  onDone: (
    fullText: string,
    code: string,
    projectBlueprint?: ProjectBlueprint,
    sectionOrder?: string[],
    files?: ProjectFile[]
  ) => void,
  onError: (err: string) => void,
  onStep?: (step: number) => void,
  onDnaComposition?: (data: DNABuildData) => void,
  onBuildHealth?: (health: BuildHealth) => void,
  onKnowledgeGraph?: (graph: ProjectKnowledgeGraph) => void,
  onRegistrySelection?: (selection: RegistrySelection) => void,
  onRegistryHealth?: (health: RegistryHealth) => void,
  onTemplateSelected?: (templateId: string, templateName: string, confidence: number, pages: string[], apis: string[], databaseTables: string[], features: string[]) => void,
  selectedTemplateId?: string
): Promise<void> {
  onStep?.(0);

  try {
    const res = await fetch(`${API_BASE}/agents/build`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, selectedTemplateId }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      return onError(errText || "Failed to reach AI service");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let planText = "";
    let finalCode = "";
    let finalProjectBlueprint: ProjectBlueprint | undefined;
    let finalSectionOrder: string[] | undefined;
    let finalFiles: ProjectFile[] | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        try {
          const json = JSON.parse(payload);

          if (json.type === "error") return onError(json.error);
          if (json.type === "step") onStep?.(json.step);
          if (json.type === "token") { planText += json.token; onToken(json.token); }
          if (json.type === "dna_composition" && json.composition) {
            onDnaComposition?.({
              composition:      json.composition,
              sectionOwnership: json.sectionOwnership ?? {},
              themeTokens:      json.themeTokens ?? {},
              motionProfile:    json.motionProfile ?? {},
            } as DNABuildData);
          }

          if (json.type === "build_health") {
            onBuildHealth?.({
              validationScore:       json.validationScore       ?? 100,
              compileSuccessRate:    json.compileSuccessRate    ?? 100,
              repairAttempts:        json.repairAttempts        ?? 0,
              filesRepaired:         json.filesRepaired         ?? 0,
              totalFiles:            json.totalFiles            ?? 0,
              passedFiles:           json.passedFiles           ?? 0,
              failedFiles:           json.failedFiles           ?? 0,
              tokenEstimate:         json.tokenEstimate         ?? 0,
              // V5.2 Runtime fields
              runtimeScore:          json.runtimeScore          ?? 100,
              runtimeErrors:         json.runtimeErrors         ?? 0,
              filesValidated:        json.filesValidated        ?? 0,
              runtimeRepairAttempts: json.runtimeRepairAttempts ?? 0,
              routesValid:           json.routesValid           ?? true,
            });
          }

          if (json.type === "graph_build_done" && json.graph) {
            onKnowledgeGraph?.(json.graph as ProjectKnowledgeGraph);
          }

          if (json.type === "registry_selection" && json.selection) {
            onRegistrySelection?.(json.selection as RegistrySelection);
          }

          if (json.type === "template_selected") {
            onTemplateSelected?.(
              json.templateId ?? '',
              json.templateName ?? '',
              json.confidence ?? 50,
              json.pages ?? [],
              json.apis ?? [],
              json.databaseTables ?? [],
              json.features ?? [],
            );
          }

          if (json.type === "registry_health") {
            onRegistryHealth?.({
              coverageScore:    json.coverageScore    ?? 0,
              reusedComponents: json.reusedComponents ?? 0,
              customComponents: json.customComponents ?? 0,
              lockedComponents: json.lockedComponents ?? 0,
              editCompatibility: json.editCompatibility ?? 0,
              totalSections:    json.totalSections    ?? 0,
              mappedSections:   json.mappedSections   ?? 0,
            });
          }

          if (json.type === "done") {
            finalCode = json.code ?? "";
            finalProjectBlueprint = json.projectBlueprint;
            finalSectionOrder = json.sectionOrder;
            finalFiles = Array.isArray(json.files) ? json.files : undefined;
            // If graph wasn't emitted separately, check done payload
            if (json.knowledgeGraph && onKnowledgeGraph) onKnowledgeGraph(json.knowledgeGraph);
            onStep?.(9); // index 9 = "Preparing Preview"
            await new Promise((r) => setTimeout(r, 300));
            onDone(planText || json.plan || "", finalCode, finalProjectBlueprint, finalSectionOrder, finalFiles);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (err) {
    return onError(err instanceof Error ? err.message : "Multi-agent pipeline failed");
  }
}

// ── EDIT (V5.5 — Registry-Aware Surgical Editing) ────────────────────────────
export async function mockEditResponse(
  prompt: string,
  projectFiles: ProjectFile[],
  projectMemory: ProjectMemory | null,
  onToken: (token: string) => void,
  onDone: (
    fullText: string,
    code: string,
    projectBlueprint?: ProjectBlueprint,
    sectionOrder?: string[],
    files?: ProjectFile[],
    diff?: EditDiff
  ) => void,
  onError: (err: string) => void,
  onStep?: (step: number) => void,
  onIntentDetected?: (editType: string, targetFiles: string[], reason: string) => void,
  onFileTargets?: (files: string[]) => void,
  onQualityCheck?: (score: number, passed: boolean, issues: string[]) => void,
  componentRegistry?: Record<string, string>,
  themeTokens?: Record<string, unknown> | null,
  knowledgeGraph?: ProjectKnowledgeGraph | null,
  onGraphContext?: (ctx: { filesLoaded: number; filesSkipped: number; tokensSaved: number; resolvedNodes: string[] }) => void,
  lockedComponents?: string[],
  registryFileMap?: RegistryFileMap,
  onRegistryHealthV2?: (health: RegistryHealthV2) => void,
  onEditImpact?: (impact: EditImpact) => void,
  onLockedProtection?: (retryAttempt: number, violations: string[]) => void
): Promise<void> {
  onStep?.(0);

  try {
    const res = await fetch(`${API_BASE}/agents/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, projectFiles, projectMemory, componentRegistry, themeTokens, knowledgeGraph, lockedComponents: lockedComponents ?? [], registryFileMap: registryFileMap ?? {} }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      return onError(errText || "Failed to reach Edit Agent");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalFiles: ProjectFile[] | undefined;
    let finalDiff: EditDiff | undefined;
    let editSummary = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        try {
          const json = JSON.parse(payload);

          if (json.type === "error") return onError(json.error);
          if (json.type === "step") onStep?.(json.step ?? 0);

          if (json.type === "intent_detected") {
            onIntentDetected?.(json.editType, json.targetFiles ?? [], json.reason ?? "");
          }

          if (json.type === "edit_impact") {
            onEditImpact?.({ affectedSections: json.affectedSections ?? [], affectedFiles: json.affectedFiles ?? [], lockedConflicts: json.lockedConflicts ?? [], replacementMode: json.replacementMode ?? null });
          }

          if (json.type === "file_targets") {
            onFileTargets?.(json.files ?? []);
          }

          if (json.type === "locked_excluded") {
            console.log(`[V5.5] Locked excluded: ${(json.excluded ?? []).join(', ')}`);
          }

          if (json.type === "locked_protection") {
            onLockedProtection?.(json.retryAttempt ?? 1, json.violations ?? []);
          }

          if (json.type === "graph_context") {
            onGraphContext?.({ filesLoaded: json.filesLoaded ?? 0, filesSkipped: json.filesSkipped ?? 0, tokensSaved: json.tokensSaved ?? 0, resolvedNodes: json.resolvedNodes ?? [] });
          }

          if (json.type === "quality_check") {
            onQualityCheck?.(json.score ?? 100, json.passed ?? true, json.issues ?? []);
          }

          if (json.type === "registry_health_v2") {
            onRegistryHealthV2?.({
              registryCoverage:    json.registryCoverage    ?? 0,
              lockedComponents:    json.lockedComponents    ?? 0,
              preservedComponents: json.preservedComponents ?? 0,
              replacedComponents:  json.replacedComponents  ?? 0,
              editSafetyScore:     json.editSafetyScore     ?? 100,
              preservedList:       json.preservedList       ?? [],
              replacedList:        json.replacedList        ?? [],
              modifiedSections:    json.modifiedSections    ?? [],
            });
          }

          if (json.type === "edit_identified") {
            const count = json.modifiedCount ?? 0;
            const names = (json.files ?? []).map((fp: string) => fp.split('/').pop()).join(", ");
            editSummary = `✏️ ${count} file${count !== 1 ? "s" : ""} updated${names ? `: ${names}` : ""}`;
            onToken(editSummary);
          }

          if (json.type === "edit_done") {
            finalFiles = Array.isArray(json.files) ? json.files : undefined;
            finalDiff = json.diff as EditDiff | undefined;
            onStep?.(9);
            await new Promise((r) => setTimeout(r, 300));
            onDone(editSummary || "Edit complete", "", undefined, undefined, finalFiles, finalDiff);
          }
        } catch {
          // skip
        }
      }
    }
  } catch (err) {
    return onError(err instanceof Error ? err.message : "Edit Agent failed");
  }
}

// ── V5.2: RUNTIME REPAIR ─────────────────────────────────────────────────────
// Called when the iframe reports a runtime_error via postMessage.
// Streams SSE from /agents/runtime-repair and returns the repaired files.

export async function runtimeRepair(
  files: ProjectFile[],
  error: { file: string; message: string; stack?: string; component?: string },
  repairAttempt: number,
  onRepaired: (repairedFiles: ProjectFile[], repairedFile: string) => void,
  onFailed: (reason: string) => void
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/agents/runtime-repair`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, error, repairAttempt }),
    });

    if (!res.ok || !res.body) {
      onFailed(`Runtime repair request failed: ${res.status}`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        try {
          const json = JSON.parse(trimmed.slice(5).trim());
          if (json.type === 'runtime_repair_done') {
            if (json.repaired && Array.isArray(json.files)) {
              onRepaired(json.files as ProjectFile[], json.repairedFile ?? '');
            } else {
              onFailed(json.message ?? 'Repair returned no changes');
            }
          }
          if (json.type === 'error') {
            onFailed(json.error ?? 'Runtime repair failed');
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (err) {
    onFailed(err instanceof Error ? err.message : 'Runtime repair network error');
  }
}

// ── ZIP EXPORT (Phase 6) ──────────────────────────────────────────────────────
export async function exportProjectZip(
  files: ProjectFile[],
  projectName = "nexogen-project"
): Promise<void> {
  const res = await fetch(`${API_BASE}/agents/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files, projectName }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Export failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
