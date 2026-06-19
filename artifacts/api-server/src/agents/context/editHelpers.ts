import type { ProjectFileSSE } from "../types.js";

export function resolveAffectedFiles(
  targetFiles: string[],
  depGraph: Record<string, string[]>,
  allFiles: Array<{ path: string; name: string }>
): string[] {
  const resolved = new Set<string>(targetFiles);
  for (const [file, deps] of Object.entries(depGraph)) {
    for (const dep of deps) {
      const depBase = dep.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "") ?? "";
      if (targetFiles.some((t) => {
        const tBase = t.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "") ?? "";
        return tBase === depBase;
      })) {
        resolved.add(file);
      }
    }
  }
  const hasPageChange = targetFiles.some((f) => f.includes("/pages/") || f.includes("router"));
  if (hasPageChange) {
    const appFile = allFiles.find((f) => f.name === "App.tsx");
    if (appFile) resolved.add(appFile.path + appFile.name);
  }
  return Array.from(resolved);
}

export function validateEditFiles(
  modifiedFiles: Array<{ path: string; name: string; lang: string; content: string }>,
  existingFiles: Array<{ path: string; name: string }>,
  targetFiles: string[]
): { score: number; passed: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  if (modifiedFiles.length === 0) { issues.push("No files modified"); score -= 60; }
  for (const f of modifiedFiles) {
    if (!f.content || f.content.length < 20) { issues.push(`${f.name}: empty`); score -= 20; continue; }
    if ((f.lang === "tsx" || f.lang === "jsx") && !f.content.includes("export default")) {
      issues.push(`${f.name}: missing default export`); score -= 15;
    }
    if (f.content.includes("// ... rest stays same") || f.content.includes("// rest of")) {
      issues.push(`${f.name}: truncated — not a complete file`); score -= 30;
    }
  }
  const existingPaths = new Set(existingFiles.map((f) => f.path + f.name));
  for (const f of modifiedFiles) {
    const fp = f.path + f.name;
    if (existingPaths.has(fp) && !targetFiles.some((t) => fp.includes(t) || t.includes(fp.split("/").pop() ?? ""))) {
      warnings.push(`${f.name}: outside original target scope`);
    }
  }
  return { score: Math.max(0, Math.min(100, score)), passed: score >= 60, issues, warnings };
}

export function extractEditFiles(raw: string): ProjectFileSSE[] {
  const files: ProjectFileSSE[] = [];
  const delimPattern = /\/\/\s*===\s*FILE:\s*([^=\n]+?)\s*===/g;
  const positions: Array<{ fullPath: string; start: number; headerEnd: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = delimPattern.exec(raw)) !== null) {
    positions.push({ fullPath: m[1].trim(), start: m.index, headerEnd: m.index + m[0].length });
  }

  for (let i = 0; i < positions.length; i++) {
    const { fullPath, headerEnd } = positions[i];
    const rawContent = raw.slice(headerEnd, i + 1 < positions.length ? positions[i + 1].start : raw.length).trim();
    const content = rawContent
      .replace(/^```(?:tsx?|jsx?|typescript|javascript|json|sql|css|html)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    if (content.length === 0) continue;

    const lastSlash = fullPath.lastIndexOf('/');
    const path = lastSlash >= 0 ? fullPath.slice(0, lastSlash + 1) : '';
    const name = lastSlash >= 0 ? fullPath.slice(lastSlash + 1) : fullPath;
    const ext = name.split('.').pop() ?? 'ts';
    const lang = (ext === 'tsx' || ext === 'jsx') ? 'tsx' : ext === 'json' ? 'json' : ext === 'html' ? 'html' : ext === 'css' ? 'css' : 'ts';

    files.push({ path, name, lang, content });
  }

  return files;
}

export function extractDeletedPaths(raw: string): string[] {
  const paths: string[] = [];
  const deletePattern = /\/\/\s*===\s*DELETE:\s*([^=\n]+?)\s*===/g;
  let m: RegExpExecArray | null;
  while ((m = deletePattern.exec(raw)) !== null) paths.push(m[1].trim());
  return paths;
}

export function mergeProjectFiles(
  existing: ProjectFileSSE[],
  modified: ProjectFileSSE[],
  deleted: string[]
): ProjectFileSSE[] {
  let result = existing.filter(f => !deleted.includes(f.path + f.name));
  for (const mf of modified) {
    const idx = result.findIndex(f => f.path === mf.path && f.name === mf.name);
    if (idx >= 0) result[idx] = mf;
    else result.push(mf);
  }
  return result;
}
