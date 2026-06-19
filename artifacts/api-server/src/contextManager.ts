/**
 * Context Compression System — NexoGen V5
 *
 * Keeps every Groq prompt under the 12,000 TPM rate-limit window.
 * Strategy: full content for target files, summaries for context files,
 * file-list only for everything else.
 *
 * Budget model (single request):
 *   GROQ_SAFE_TOTAL      = 11 000 tokens  (buffer below 12k TPM limit)
 *   max_tokens (response)= 4 000 – 6 000
 *   → available for prompts ≈ 5 000 – 7 000 tokens
 *   1 token ≈ 3.5 chars for mixed code/English
 */

export interface ProjectFileSSE {
  path: string;
  name: string;
  lang: string;
  content: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Hard ceiling for any single Groq request (prompt + completion). */
export const GROQ_TOKEN_BUDGET = 11_000;

/** Per-file char cap when included at full content. ~1 100 tokens. */
export const FULL_FILE_CHAR_CAP = 3_800;

/** Per-file char cap when included as compressed summary. ~180 tokens. */
export const SUMMARY_CHAR_CAP = 640;

// ── Core utilities ───────────────────────────────────────────────────────────

/**
 * Cheap O(n) token estimator — no tokenizer needed.
 * Accurate within ±15 % for mixed code+prose.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 3.5);
}

/**
 * Produce a compact signature block for a file that does NOT need
 * full content but whose shape should be visible to the edit agent.
 *
 * Format:
 *   // === SUMMARY: src/components/Foo.tsx (420 tok) ===
 *   import { useState } from 'react'
 *   // 68 lines
 *   export default function Foo({ bar }: FooProps) { … }
 *   export { helperFn }
 */
export function summarizeFile(file: ProjectFileSSE): string {
  const lines = file.content.split("\n");
  const tokEst = estimateTokenCount(file.content);

  const imports = lines
    .filter((l) => l.trimStart().startsWith("import "))
    .slice(0, 4)
    .join("\n");

  const exports = lines
    .filter(
      (l) =>
        /^export\s/.test(l.trimStart()) &&
        !/^export\s*\{/.test(l.trimStart()) // skip re-export blocks
    )
    .slice(0, 6)
    .map((l) => l.trimStart().replace(/\{[^}]{30,}\}/, "{ … }"))
    .join("\n");

  const typeLines = lines
    .filter((l) => /^(interface|type)\s+\w/.test(l.trimStart()))
    .slice(0, 4)
    .map((l) => l.trimStart())
    .join("\n");

  return [
    `// === SUMMARY: ${file.path}${file.name} (${tokEst} tok) ===`,
    imports || "// (no top-level imports)",
    `// … ${lines.length} lines total`,
    typeLines,
    exports || "// (no named exports detected)",
  ]
    .filter(Boolean)
    .join("\n");
}

// ── Main public APIs ─────────────────────────────────────────────────────────

export interface CompressedContext {
  /** Files sent at full content (possibly capped at FULL_FILE_CHAR_CAP). */
  fullFiles: ProjectFileSSE[];
  /** File names that were compressed to signature summaries. */
  summarizedNames: string[];
  /** File names omitted entirely (listed in a short comment block). */
  skippedNames: string[];
  /** Total estimated tokens consumed by the context string. */
  totalTokens: number;
  compressionApplied: boolean;
}

/**
 * Build the minimal file context string for the edit patch generator.
 *
 * Priority order:
 *   1. Target files  → full content (capped at FULL_FILE_CHAR_CAP)
 *   2. Related TSX/TS files within budget → summary block
 *   3. Everything else → just a filename comment
 *
 * @param allFiles     Full project file list
 * @param targetFiles  Paths/names of files that MUST appear at full content
 * @param tokenBudget  Max tokens to spend on the context block
 */
export function buildMinimalEditContext(
  allFiles: ProjectFileSSE[],
  targetFiles: string[],
  tokenBudget: number
): { context: string; meta: CompressedContext } {
  const fullFiles: ProjectFileSSE[] = [];
  const summarizedNames: string[] = [];
  const skippedNames: string[] = [];
  let usedTokens = 0;

  const isTarget = (f: ProjectFileSSE) =>
    targetFiles.some(
      (t) =>
        f.path + f.name === t ||
        f.name === t.split("/").pop() ||
        t.endsWith(f.name)
    );

  // Priority 1 — target files at full content
  for (const f of allFiles) {
    if (!isTarget(f)) continue;
    const body =
      f.content.length > FULL_FILE_CHAR_CAP
        ? f.content.slice(0, FULL_FILE_CHAR_CAP) + "\n// … [truncated to fit]"
        : f.content;
    const header = `// === CURRENT FILE: ${f.path}${f.name} ===`;
    usedTokens += estimateTokenCount(`${header}\n${body}`);
    fullFiles.push({ ...f, content: body });
  }

  // Priority 2 — remaining files: try full → summary → skip
  const FULL_BUDGET_RATIO = 0.80;   // don't spend more than 80 % of budget on full files
  const SUMMARY_BUDGET_RATIO = 0.95; // summaries can fill up to 95 %

  // Sort: tsx > ts > css > others (more useful to edit agent first)
  const langScore = (f: ProjectFileSSE) =>
    f.lang === "tsx" ? 4 : f.lang === "ts" ? 3 : f.lang === "css" ? 2 : 1;
  const others = allFiles
    .filter((f) => !isTarget(f))
    .sort((a, b) => langScore(b) - langScore(a));

  for (const f of others) {
    if (f.name.endsWith(".min.js") || f.name.endsWith(".lock")) {
      skippedNames.push(f.path + f.name);
      continue;
    }

    const body =
      f.content.length > FULL_FILE_CHAR_CAP
        ? f.content.slice(0, FULL_FILE_CHAR_CAP) + "\n// … [truncated]"
        : f.content;
    const fullTokens = estimateTokenCount(
      `// === CURRENT FILE: ${f.path}${f.name} ===\n${body}`
    );

    if (usedTokens + fullTokens <= tokenBudget * FULL_BUDGET_RATIO) {
      fullFiles.push({ ...f, content: body });
      usedTokens += fullTokens;
      continue;
    }

    // Try summary
    const sumText = summarizeFile(f);
    const sumTokens = estimateTokenCount(sumText);
    if (usedTokens + sumTokens <= tokenBudget * SUMMARY_BUDGET_RATIO) {
      summarizedNames.push(f.path + f.name);
      usedTokens += sumTokens;
      continue;
    }

    skippedNames.push(f.path + f.name);
  }

  // Build the context string
  const parts: string[] = [];

  for (const f of fullFiles) {
    parts.push(`// === CURRENT FILE: ${f.path}${f.name} ===\n${f.content}`);
  }

  if (summarizedNames.length > 0) {
    parts.push("\n// === CONTEXT SUMMARIES (read-only reference) ===");
    for (const name of summarizedNames) {
      const f = allFiles.find((x) => x.path + x.name === name);
      if (f) parts.push(summarizeFile(f));
    }
  }

  if (skippedNames.length > 0) {
    parts.push(
      `\n// === OTHER PROJECT FILES (unchanged, not shown) ===\n${skippedNames.map((n) => `//   ${n}`).join("\n")}`
    );
  }

  const context = parts.join("\n\n");

  return {
    context,
    meta: {
      fullFiles,
      summarizedNames,
      skippedNames,
      totalTokens: usedTokens,
      compressionApplied: summarizedNames.length > 0 || skippedNames.length > 0,
    },
  };
}

/**
 * Strip heavy fields from ProjectMemory before sending to any agent.
 * editHistory, componentRegistry, dependencyGraph, and referenceComposition
 * can all be very large and are not needed by the LLM.
 */
export function compressProjectMemory(
  memory: Record<string, unknown>
): Record<string, unknown> {
  return {
    projectType: memory["projectType"],
    description: String(memory["description"] ?? "").slice(0, 300),
    pages: ((memory["pages"] as string[]) ?? []).slice(0, 20),
    routes: ((memory["routes"] as string[]) ?? []).slice(0, 20),
    entities: ((memory["entities"] as string[]) ?? []).slice(0, 20),
    features: ((memory["features"] as string[]) ?? []).slice(0, 20),
    authProvider: memory["authProvider"],
    generatedFiles: ((memory["generatedFiles"] as string[]) ?? []).slice(0, 60),
    // intentionally omit: editHistory, componentRegistry, dependencyGraph, referenceComposition
  };
}

/**
 * Hard safety net: ensure a (system, user) pair fits within the Groq TPM window.
 *
 * If the combined prompt exceeds the budget, the user message is trimmed
 * at a sensible boundary (newline) so the file context block is cut, not
 * the request header.
 *
 * @param systemPrompt  System message text
 * @param userMessage   User message text
 * @param maxResponseTokens  max_tokens we'll request for the completion
 * @returns Possibly-trimmed messages + a flag indicating trimming occurred
 */
export function truncateForGroq(
  systemPrompt: string,
  userMessage: string,
  maxResponseTokens = 4_000
): { system: string; user: string; truncated: boolean } {
  const available = GROQ_TOKEN_BUDGET - maxResponseTokens;
  const sysTokens = estimateTokenCount(systemPrompt);
  const userTokens = estimateTokenCount(userMessage);

  if (sysTokens + userTokens <= available) {
    return { system: systemPrompt, user: userMessage, truncated: false };
  }

  const availableForUser = available - sysTokens;
  if (availableForUser <= 0) {
    // System prompt alone is too large — this shouldn't happen in practice
    process.stderr.write(JSON.stringify({ level: "warn", component: "ContextManager", event: "SYSTEM_PROMPT_OVER_BUDGET" }) + "\n");
    return { system: systemPrompt, user: "", truncated: true };
  }

  const maxUserChars = Math.floor(availableForUser * 3.5);
  let cut = userMessage.slice(0, maxUserChars);
  // Trim to last newline for cleaner cut
  const lastNewline = cut.lastIndexOf("\n");
  if (lastNewline > maxUserChars * 0.7) cut = cut.slice(0, lastNewline);
  cut += "\n\n// [context compressed — token budget reached]";

  process.stderr.write(JSON.stringify({ level: "warn", component: "ContextManager", event: "PROMPT_TRUNCATED", from: userTokens, to: estimateTokenCount(cut) }) + "\n");

  return { system: systemPrompt, user: cut, truncated: true };
}

/**
 * Convenience: log a compression report to the console.
 */
export function logCompressionReport(
  agent: string,
  meta: CompressedContext
): void {
  process.stdout.write(JSON.stringify({ level: "info", component: "ContextManager", event: "COMPRESSION_REPORT", agent, tokens: meta.totalTokens, full: meta.fullFiles.length, summaries: meta.summarizedNames.length, skipped: meta.skippedNames.length, compressed: meta.compressionApplied }) + "\n");
}
