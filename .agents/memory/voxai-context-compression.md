---
name: VoxAI Context Compression System
description: Prevents Groq TPM overflow errors; file in contextManager.ts; auto-compress in callGroq wrapper
---

# Context Compression System

## Problem
Groq free tier: 12,000 TPM limit. Full project context (15+ files × 3–5k chars) hits ~15,561 tokens → `rate_limit_exceeded`.

## Budget model
- GROQ_TOKEN_BUDGET = 11,000 (buffer below 12k)
- estimateTokenCount = chars / 3.5 (±15%)
- Available per request: budget - max_tokens (response) - system tokens

## Files
- `artifacts/api-server/src/contextManager.ts` — all utility functions
- `artifacts/api-server/src/routes/agents.ts` — callGroq() wrapper applies it universally

## Layer 1: callGroq() auto-compress (global safety net)
Every callGroq call automatically runs `truncateForGroq(system, user, maxTokens)` before sending.
If total tokens exceed budget, user message is trimmed at last newline. Warning logged.
Protects all call sites without per-site changes.

## Layer 2: buildMinimalEditContext() in edit pipeline Step 2
Priority: target files (full, capped at 3,800 chars) > TSX/TS others (summary) > rest (filename only).
File summary = imports + line count + export signatures (~640 chars = ~180 tokens).
Budget allocation: GROQ_TOKEN_BUDGET - response_tokens - system_tokens - 400 overhead.

## Layer 3: compressProjectMemory()
Strips editHistory, componentRegistry, dependencyGraph, referenceComposition before sending.
Only keeps: projectType, description (≤300 chars), pages, routes, entities, features, authProvider, generatedFiles (≤60).

## Layer 4: truncateForGroq() at specific call sites
Applied explicitly to: Intent Detector, Code Fix Agent.

## Key functions
- `estimateTokenCount(text)` — chars / 3.5
- `summarizeFile(file)` — imports + line count + export sigs
- `buildMinimalEditContext(allFiles, targetFiles, budget)` → {context, meta}
- `compressProjectMemory(memory)` → stripped memory
- `truncateForGroq(system, user, maxResponseTokens)` → {system, user, truncated}
- `logCompressionReport(agent, meta)` — console log for debugging

**Why:** Groq free tier 12k TPM is the binding constraint. The universal wrapper in callGroq is the primary defense; the edit-pipeline explicit compression is secondary.

**How to apply:** When adding new Groq call sites, they are auto-protected. For new file-heavy contexts (multi-agent edit chains), explicitly pass through `buildMinimalEditContext` before building the user message.
