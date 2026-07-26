/**
 * projectService — thin wrapper around the /api/projects REST endpoints.
 *
 * All functions are fire-and-forget friendly (they never throw; errors are
 * logged so callers don't need try/catch unless they care about the result).
 */

export interface ProjectMeta {
  id: string;
  chatId: string;
  userId: string;
  title: string;
  prompt: string;
  fileCount: number;
  healthScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFull extends ProjectMeta {
  files: Array<{ name: string; content: string; lang: string; path: string }>;
  previewHtml: string | null;
}

export interface SaveProjectParams {
  chatId: string;
  // NOTE: userId is intentionally omitted — the server derives it from the
  // request context (x-api-key or IP). Never send userId from the client.
  title: string;
  prompt: string;
  files: Array<{ name: string; content: string; lang: string; path: string }>;
  fileCount: number;
  previewHtml?: string | null;
  healthScore?: number | null;
}

// ── helpers ────────────────────────────────────────────────────────────────────

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = import.meta.env.VITE_API_KEY as string | undefined;
  if (key) headers["x-api-key"] = key;
  return headers;
}

// ── save / upsert ──────────────────────────────────────────────────────────────

export async function saveProject(params: SaveProjectParams): Promise<ProjectFull | null> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.project ?? null;
  } catch {
    return null;
  }
}

// ── list ───────────────────────────────────────────────────────────────────────

// userId param removed — the server derives identity from the request context.
export async function listProjects(): Promise<ProjectMeta[]> {
  try {
    const res = await fetch("/api/projects", {
      headers: apiHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects ?? [];
  } catch {
    return [];
  }
}

// ── get full project (with files) ─────────────────────────────────────────────

export async function getProject(chatId: string): Promise<ProjectFull | null> {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(chatId)}`, {
      headers: apiHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.project ?? null;
  } catch {
    return null;
  }
}

// ── rename ─────────────────────────────────────────────────────────────────────

export async function renameProject(chatId: string, title: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(chatId)}`, {
      method: "PATCH",
      headers: apiHeaders(),
      body: JSON.stringify({ title }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── delete ─────────────────────────────────────────────────────────────────────

export async function deleteProject(chatId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(chatId)}`, {
      method: "DELETE",
      headers: apiHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
