---
name: VoxAI Unified AI Service
description: All LLM calls now route through aiService.ts (OpenRouter only); 3-model fallback chain; Groq removed from pipeline.
---

# VoxAI Unified AI Service (centralized)

## Rule
All AI generation calls must use `callAI()` from `src/agents/llm/aiService.ts`. Never add new `callGroq()` or `callOpenRouter()` calls to pipeline/edit/repair code.

**Why:** User required single centralized service with fallback chain and streaming. Groq was multi-provider, now everything is OpenRouter-only.

## How to apply
- Import: `import { callAI } from "../llm/aiService.js"`
- Signature: `callAI(openrouterKey, messages, { label, maxTokens, stream, onToken, timeoutMs })`
- Always pass a descriptive `label` (e.g. `"planner"`, `"repair:App.tsx"`) — it appears in telemetry logs.

## Model chain (in order)
1. `openai/gpt-oss-120b:free` (PRIMARY_MODEL)
2. `deepseek/deepseek-chat-v3` (FALLBACK_1_MODEL)
3. `google/gemini-2.5-flash-lite` (FALLBACK_2_MODEL)

Fallback triggers on: rate_limit (429), api_error, network failure, timeout (120s default).

## Files changed
- `src/agents/llm/aiService.ts` — NEW centralized service
- `src/agents/pipeline/plannerStep.ts` — uses callAI (streaming)
- `src/agents/pipeline/architectureStep.ts` — uses callAI
- `src/agents/pipeline/frontendStep.ts` — uses callAI (design + codegen streaming + codefix)
- `src/agents/pipeline/repairStep.ts` — uses callAI
- `src/agents/pipeline/backendStep.ts` — passes openrouterKey
- `src/agents/pipeline/runtimeValidationStep.ts` — uses callAI; keys type changed to `{ openrouterKey }` not `{ groqKey }`
- `src/agents/backend/backendAgent.ts` — parameter renamed to openrouterKey
- `src/agents/dna/dnaAgent.ts` — uses callAI
- `src/routes/agents.ts` — edit/repair/autonomous-build routes use callAI

## Backward compat
`callGroq()` and `callOpenRouter()` still exist in `llmClient.ts` (for tests). Do NOT remove them — tests may depend on them.
