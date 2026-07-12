---
name: VoxAI V9.3 Model & Resource Orchestration Engine
description: Descriptive/decision-metadata layer for per-agent LLM provider routing, token budgets, caching, and cost prediction — not a real multi-provider integration.
---

Implements the spec's Provider Registry / Dynamic Model Router / Token Budget Engine / Context Compression / Cache Intelligence / Cost Intelligence / Model Health Monitor / Learning / Persistence / Telemetry as static decision-metadata (`src/model-orchestrator/`), wired as pipeline step 0.95 (after Orchestrator V9.2, before Planner).

**Why:** only `OPENROUTER_API_KEY` and `GROQ_API_KEY` are configured — no OpenAI/Claude/Gemini-direct/DeepSeek credentials exist. Real per-provider integration would require adding outbound calls to unconfigured services. Instead the Provider Registry lists all 8 conceptual providers but marks only OpenRouter/Groq as "available" (non-null `concreteModel`), so routing always resolves to a real, working provider while still satisfying the spec's structure (blueprint shape, telemetry fields, SSE events).

**How to apply:** if a future spec assumes a provider that isn't in the two configured API keys, follow this same pattern — model the decision layer fully, but gate "availability" on actual configured credentials rather than adding new real integrations without being asked. `model_router_*` SSE events and the `modelOrchestration` telemetry key are additive; don't rename them without checking `buildPipeline.ts` step 0.95 wiring and `routes/telemetry.ts`.
