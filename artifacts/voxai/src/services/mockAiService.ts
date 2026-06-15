import type { ProjectBlueprint, ProjectFile, ProjectMemory } from './builderService';

const API_BASE = "/api";

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
  onStep?: (step: number) => void
): Promise<void> {
  onStep?.(0);

  try {
    const res = await fetch(`${API_BASE}/agents/build`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
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

          if (json.type === "done") {
            finalCode = json.code ?? "";
            finalProjectBlueprint = json.projectBlueprint;
            finalSectionOrder = json.sectionOrder;
            finalFiles = Array.isArray(json.files) ? json.files : undefined;
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

// ── EDIT (Phase 3 — file-level editing) ──────────────────────────────────────
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
    files?: ProjectFile[]
  ) => void,
  onError: (err: string) => void,
  onStep?: (step: number) => void
): Promise<void> {
  onStep?.(0);

  try {
    const res = await fetch(`${API_BASE}/agents/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, projectFiles, projectMemory }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      return onError(errText || "Failed to reach Edit Agent");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalFiles: ProjectFile[] | undefined;
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

          if (json.type === "edit_identified") {
            const count = json.modifiedCount ?? 0;
            const names = (json.files ?? []).join(", ");
            editSummary = `✏️ Modified ${count} file${count !== 1 ? "s" : ""}${names ? `: ${names}` : ""}`;
            onToken(editSummary);
          }

          if (json.type === "edit_done") {
            finalFiles = Array.isArray(json.files) ? json.files : undefined;
            onStep?.(9); // "Preparing Preview"
            await new Promise((r) => setTimeout(r, 300));
            onDone(editSummary || "Edit complete", "", undefined, undefined, finalFiles);
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
