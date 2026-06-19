import type { ProjectFileSSE } from "../types.js";

export function resolveAffectedFilesFromGraph(
  error: { file: string; message: string },
  files: ProjectFileSSE[],
  knowledgeGraph?: {
    components?: Array<{ name: string; file: string; usedBy?: string[] }>;
  }
): string[] {
  const result: string[] = [];

  const directFile = files.find(f =>
    f.name === error.file ||
    (f.path + f.name).includes(error.file) ||
    (error.file && error.file.includes(f.name))
  );
  if (directFile) result.push(directFile.path + directFile.name);

  if (knowledgeGraph && directFile) {
    const baseName = directFile.name.replace(/\.(tsx?|jsx?)$/, '');
    const usedBy = (knowledgeGraph.components ?? [])
      .filter(c => c.name === baseName || (c.usedBy ?? []).includes(baseName))
      .flatMap(c => [c.file, ...(c.usedBy ?? [])]);
    for (const fp of usedBy) {
      const f = files.find(fi => fi.path + fi.name === fp || fi.name === fp);
      if (f && !result.includes(f.path + f.name)) result.push(f.path + f.name);
    }
  }

  if (result.length === 0) {
    const appFile = files.find(f => f.name === 'App.tsx');
    if (appFile) result.push(appFile.path + appFile.name);
  }

  return result;
}
