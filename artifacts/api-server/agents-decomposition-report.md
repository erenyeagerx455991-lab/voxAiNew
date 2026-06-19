# V6.4.8 — Agents Monolith Decomposition Report

## Phase 1: Architecture Audit

**File**: `src/routes/agents.ts`
**Original LOC**: 4,748
**Language**: TypeScript ESM (strict)

---

## Module Map

### 1. Planner Agent (inline in /agents/build)
- **Lines**: 2559–2623 (route body)
- **Responsibility**: Streaming plan generation, design brief extraction, page blueprint parsing
- **Key prompts**: `PLANNER_SYSTEM` (L268), `SECTION_MENU` (L207)
- **LLM**: `callGroq` + `PLANNER_MODEL` (llama-3.3-70b-versatile)
- **SSE events**: `step (0)`, `token`

### 2. Architecture Agent (inline in /agents/build)
- **Lines**: 2670–2730+ (route body)
- **Responsibility**: JSON project blueprint generation, retry logic, blueprint validation
- **Key prompts**: `ARCHITECTURE_SYSTEM` (L230)
- **LLM**: `callOpenRouter` + `DESIGN_MODEL` (gemini-2.5-flash-lite)
- **SSE events**: `step (1)`, `architecture`

### 3. Design Agent (inline in /agents/build)
- **Lines**: ~2730–2800 (route body)
- **Responsibility**: DesignDNA extraction, reference site mapping
- **Key prompts**: `DESIGN_SYSTEM` (L332)
- **LLM**: `callOpenRouter` + `DESIGN_MODEL`
- **SSE events**: `step (2)`, `design`

### 4. DNA Mixer / Composition Engine
- **Lines**: 2218–2542
- **Responsibility**: Brand DNA extraction, section ownership resolution, theme tokens, motion profile
- **Key functions**: `normalizeDNAServer`, `resolveSectionOwnershipServer`, `pickOwnerServer`, `generateThemeTokensServer`, `generateMotionProfileServer`, `extractDNAComposition`
- **Constants**: `DNA_BRAND_KEYS`, `EMPTY_DNA`, `BRAND_STRENGTHS_V45`, `BRAND_TOKENS_V45`, `DNA_MIXER_SYSTEM`, `COMPOSITION_SECTIONS`
- **LLM**: optional fallback via `callGroq` (llama-3.1-8b-instant)
- **SSE events**: `dna_composition`

### 5. Component Registry Engine
- **Lines**: 2328–2470
- **Responsibility**: DNA-driven component variant selection, registry health scoring
- **Key functions**: `getDominantBrandServer`, `selectRegistryComponentsServer`, `computeRegistryHealthServer`, `buildDNAContextString`
- **Constants**: `REGISTRY_STYLE_HINTS_SERVER`

### 6. Frontend Code Generator
- **Lines**: 421–698 (`buildCodeSystem`), 1528–1698 (extraction/validation helpers)
- **Responsibility**: Code generation system prompt construction, TSX file extraction/sanitization, per-file validation
- **Key functions**: `buildCodeSystem`, `sseExtractFunctions`, `sanitizeFunctionBody`, `sseToTsxFile`, `validateTsxFile`, `runRuntimeValidator`, `validateRoutes`
- **Constants**: `CODEFIX_SYSTEM`, `SSE_LUCIDE_ICONS`, `DEFAULT_DESIGN`
- **LLM**: `callOpenRouter` + `CODEGEN_MODEL` (deepseek/deepseek-chat) for code gen; `callGroq` + `CODEFIX_MODEL` for fix pass

### 7. Backend Agent
- **Lines**: 700–817 (prompts), 1044–1093 (extractBackendFiles), 1096–1237 (generators)
- **Responsibility**: Express.js route generation, PostgreSQL/Prisma schema generation, Auth file generation
- **Key functions**: `extractBackendFiles`, `generateBackendFiles`, `generateDatabaseFiles`, `generateAuthFiles`
- **Prompts**: `BACKEND_SYSTEM` (L720), `DATABASE_SYSTEM` (L748), `AUTH_SYSTEM` (L781)
- **LLM**: `callGroq` + `BACKEND_MODEL` (llama-3.3-70b-versatile)

### 8. Project File Builder (Frontend Agent)
- **Lines**: 1968–2212
- **Responsibility**: Transforms generated code blob into multi-file project structure (App.tsx, main.tsx, package.json, tsconfig, vite.config, etc.)
- **Key function**: `buildServerProjectFiles`
- **Depends on**: `sseExtractFunctions`, `sseToTsxFile`, `validateTsxFile`, `resolveProjectDependencies`

### 9. Config Generators
- **Lines**: 1044–1484
- **Responsibility**: Blueprint validation, dependency resolution, static config file generation
- **Key functions**: `validateProjectBlueprint`, `computeQualityScore`, `resolveDependencies` (local), `validateProject`, `generateReplitConfig`, `generateReplitNix`, `generateEnvExample`, `generateReadme`

### 10. Knowledge Graph
- **Lines**: 1834–1966
- **Responsibility**: Server-side project graph construction, edit target resolution
- **Key functions**: `buildKnowledgeGraphServer`, `resolveEditTargetsServer`
- **Interfaces**: `KGComponent`, `KGPage`, `KGApi`, `KGDbTable`, `ServerKnowledgeGraph`, `ServerEditTargetResult`

### 11. Edit Agent Helpers
- **Lines**: 818–998
- **Responsibility**: Edit intent prompts, file resolution, file extraction/deletion/merge
- **Key functions**: `resolveAffectedFiles`, `validateEditFiles`, `extractEditFiles`, `extractDeletedPaths`, `mergeProjectFiles`
- **Prompts**: `EDIT_SYSTEM` (L819), `INTENT_SYSTEM` (L848)

### 12. SSE Streaming
- **Lines**: 104–107
- **Responsibility**: Write SSE events to Express response
- **Key function**: `sse(res, data)`

### 13. LLM Client
- **Lines**: 108–204
- **Responsibility**: Groq API calls (streaming + non-streaming), OpenRouter API calls
- **Key functions**: `callGroq`, `callOpenRouter`
- **Constants**: `GROQ_URL`, `OPENROUTER_URL`, model name constants

### 14. Template Marketplace
- **Lines**: 4377–4492
- **Responsibility**: Template library, keyword matching, context building, merge
- **Key functions**: `serverMatchTemplate`, `buildTemplateContextServer`
- **Data**: `TEMPLATE_LIBRARY_SERVER` (10 templates), `TEMPLATE_MATCH_KEYWORDS`

### 15. Repair Engine (Runtime Repair)
- **Lines**: 4072–4112 (`resolveAffectedFilesFromGraph`), 4113–4366 (route handler body)
- **Responsibility**: KG-targeted file resolution for repair, self-healing loop
- **Key function**: `resolveAffectedFilesFromGraph`

---

## Route Handlers (stay in agents.ts as thin orchestrators)

| Route | Lines | LOC |
|---|---|---|
| `POST /agents/build` | 2544–3457 | ~913 |
| `POST /agents/audit` | 3458–3733 | ~275 |
| `POST /agents/export` | 3733–3828 | ~95 |
| `POST /agents/edit` | 3829–4112 | ~283 |
| `POST /agents/runtime-repair` | 4113–4366 | ~253 |
| `GET /agents/repair-history/:chatId` | 4369–4375 | ~6 |
| `GET /agents/templates` | 4432–4492 | ~60 |
| `POST /agents/autonomous-build` | 4499–4748 | ~249 |

---

## Inline Types (all defined in agents.ts)

| Interface | Line |
|---|---|
| `PageBlueprint` | 32 |
| `ProjectBlueprint` | 37 |
| `DesignDNA` | 60 |
| `OpenRouterError` | 175 |
| `QualityGateResult` | 922 |
| `BlueprintValidation` | 1046 |
| `ExtractedFile` | 1068 |
| `ProjectFileSSE` | 1490 |
| `TsxValidation` | 1622 |
| `RuntimeValidationIssue` | 1705 |
| `RuntimeValidationResult` | 1712 |
| `KGComponent/Page/Api/DbTable` | 1836–1839 |
| `ServerKnowledgeGraph` | 1841 |
| `ServerEditTargetResult` | 1925 |
| `DNAComposition` | 2218 |

---

## External Imports (preserved as-is)

```typescript
import { Router } from "express";
import { selectTemplatesForPrompt, buildContextFromTemplates, getTemplatesByCategory, getRegistryCatalogue } from "../components/registry";
import { strToU8, zipSync } from "fflate";
import { buildMinimalEditContext, compressProjectMemory, truncateForGroq, estimateTokenCount, logCompressionReport, GROQ_TOKEN_BUDGET } from "../contextManager";
import { resolveDependencies } from "../runtime/dependencyResolver.js";  // NOTE: shadowed by local function
import { validateFiles, computeHealthScore, detectMissingImports, parseStaticValidatorScore, computeRepairQuality } from "../runtime/runtimeValidator.js";
import * as runtimeManager from "../runtime/runtimeManager.js";
import { classifyRuntimeError, REPAIR_PROMPTS } from "../runtime/repairStrategies.js";
import { buildRuntimeDependencyGraph, resolveImports, resolveComponents, resolveRoutes, resolvePackages } from "../runtime/dependencyResolverV2.js";
import { setupWorkspace, rebuildWorkspace, teardownWorkspace, buildRepairTargets } from "../runtime/buildExecutor.js";
import type { RealBuildError } from "../runtime/buildExecutor.js";
```

---

## Decomposition Plan

| Phase | Module | Target File | LOC |
|---|---|---|---|
| 2 | Shared Types | `src/agents/types.ts` | ~80 |
| 3 | LLM Client | `src/agents/llm/llmClient.ts` | ~110 |
| 4 | System Prompts | `src/agents/llm/prompts.ts` | ~400 |
| 5 | SSE Manager | `src/agents/streaming/sseManager.ts` | ~10 |
| 6 | DNA Engine | `src/agents/dna/dnaAgent.ts` | ~330 |
| 7 | Code System | `src/agents/frontend/codeSystem.ts` | ~420 |
| 8 | Backend Agent | `src/agents/backend/backendAgent.ts` | ~220 |
| 9 | Config Generators | `src/agents/config/configGenerators.ts` | ~310 |
| 10 | Knowledge Graph | `src/agents/knowledge/knowledgeGraph.ts` | ~160 |
| 11 | Edit Helpers | `src/agents/context/editHelpers.ts` | ~120 |
| 12 | Frontend Agent | `src/agents/frontend/frontendAgent.ts` | ~260 |
| 13 | Template Agent | `src/agents/templates/templateAgent.ts` | ~130 |
| 14 | Repair Helper | `src/agents/repair/repairAgent.ts` | ~50 |

**Estimated agents.ts post-extraction**: ~650–850 LOC (route handlers + imports only)
