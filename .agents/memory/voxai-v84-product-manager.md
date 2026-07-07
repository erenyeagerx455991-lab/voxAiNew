---
name: VoxAI V8.4 Autonomous AI Product Manager
description: 9-phase static product strategy engine at pipeline step 0 (before Architecture Planner). No LLM, pure keyword heuristics. Key gotchas and decisions.
---

# VoxAI V8.4 — Autonomous AI Product Manager

## Architecture
- **10 modules** in `src/product-manager/`: productTypes, productPlanner, businessPlanner, featurePlanner, journeyPlanner, productManager, productMetrics, productLearning, productPersistence, productFacade
- **1 pipeline step**: `src/agents/pipeline/productManagerStep.ts`
- **Pipeline position**: step 0 — before `runPlannerStep`
- Step output variable: `productManagerOutput` → `enrichedPromptWithProductContext` (flows to Planner)
- `done` SSE event gains additive fields: `productPlan` + `productScore`

## Key Gotchas

**QUALITY_WEIGHTS must sum to exactly 1.00** — covers 11 dimensions; test uses `toBeCloseTo(1.0, 2)`.

**hasPricing regex must NOT include bare "subscription"** — "subscription" is a business model word, not a pricing signal. The prompt "Build a subscription app" would falsely satisfy hasPricing. Use `/pricing|price|plan.*free|plan.*pro|tier|\$\d+|per.*month|monthly.*plan|annual.*plan/i`.

**Support objective regex must NOT include "documentation"** — plain "documentation" in the Support signal caused it to match Documentation-related prompts with equal weight, producing wrong objective. Use `/help.*center|support.*ticket|\bfaq\b|ticket.*system|live.*chat.*support/i` for Support.

**Product Manager failure is non-fatal** — `productManagerStep.ts` catches all errors and returns fallback `ProductManagerOutput` (score=7.0, empty plan, empty contextString). Pipeline continues with original prompt.

**Fallback sends NO progress/complete SSE** — only `product_manager_start` fires before the try block. If the engine throws, the stream continues silently.

## 9 Planning Phases
1. (Type System) 
2. Goal Detection — 22 goals, weighted keyword match, returns `{ goal, confidence }`
3. Business Objective — 20 objectives, keyword match then goal fallback
4. Persona Detection — 18 personas, up to 4 per build
5. Feature Planning — goal base + objective additions + keyword match + persona additions; dedup; marketing goals strip app features
6. Information Architecture — pages, sections, nav, sidebar, footer, settings, content hierarchy, feature relationships, dependencies
7. User Journey — 10 stages (entry → exit)
8. Monetization — strategy enum + free/pro/enterprise plans + gates + limits
9. Product Roadmap — MVP / Phase 2 / Phase 3 / Future / Nice-to-have / Tech priorities / Biz priorities
10. Risk Detection — 13 risk types, keyword-based
11. Quality Scoring — 11 dimensions × QUALITY_WEIGHTS

## QUALITY_WEIGHTS (must sum to 1.00)
businessValue: 0.15, userValue: 0.15, featureCompleteness: 0.12, navigation: 0.10, scalability: 0.08, productSimplicity: 0.10, monetization: 0.10, retention: 0.07, activation: 0.07, growthPotential: 0.04, enterpriseReadiness: 0.02

## SSE Events (4 new)
- `product_manager_start` → `{ type, agent }`
- `product_manager_progress` → goal, objective, personas, features, risks, confidence
- `product_manager_complete` → overallScore, featureCount, riskCount, monetizationStrategy, topRecommendations
- `product_manager_learning` → buildId, productGoal, overallScore, improved

## Wiring Checklist
- `"ProductManager"` added to AgentName union in `agentMetrics.ts`
- `productManager: getProductMetrics()` added to `/api/telemetry/quality` in `routes/telemetry.ts`
- `initProductPersistence` + `hydrateProductLearning` in `index.ts` (lazy dynamic imports)

## Persistence
- File: `/tmp/voxai-product-manager/product-history.json`
- Max 500 records, 30s debounced save
- Version tag: `v8.4`

**Why:** The Product Manager must be pure static analysis to stay <5ms and never block the pipeline. Every downstream engine (Planner, Code Generator, Critic, Evaluator, Director) benefits from structured product context. Running it before the Planner means the LLM gets better structured input rather than raw user text.
