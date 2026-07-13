---
name: VoxAI V9.4 Autonomous Knowledge Intelligence Engine
description: Static/deterministic knowledge graph + semantic retrieval + pattern intelligence layer added at pipeline step 0.97, between ModelOrchestrator (0.95) and Planner (1).
---

Implemented as `src/knowledge-engine/` (12 modules + index) in the api-server: knowledge graph (nodes/edges, canonical chain Product→Feature→Component→Pattern→BusinessGoal→Performance→Security→Accessibility→Conversion→ProductionOutcome), a capped collector, semantic retrieval (keyword/tag overlap scoring — NOT real embeddings, no vector DB), a 10-factor ranking engine (weights sum to 1.00), pattern intelligence, a recommendation engine, per-agent knowledge bundles (Frontend/Backend/Security/QA/DevOps/Generic) with a compression step, async learning, and versioned persistence.

**Why:** Same constraint as V9.3 (model-orchestrator) — no real LLM/embedding calls should be added, so "semantic" retrieval must stay a deterministic heuristic. Reused that module's file-layout and fail-safe (try/catch, additive SSE, additive telemetry key) conventions for consistency.

**How to apply:** When extending this system, note the persistence cap here is **1000** records (not 500, unlike model-orchestrator/most other V8.x-V9.x engines — the V9.4 spec explicitly asked for 1000). Telemetry key `knowledgeEngine` lives in `/api/telemetry/quality` with 11 fields (knowledgeScore, retrievalAccuracy, semanticCoverage, knowledgeGrowth, relationshipDensity, knowledgeUsage, recommendationAccuracy, confidenceScore, learningStatistics, persistenceHealth, cacheEfficiency). SSE events: `knowledge_start/progress/complete/learning`. `AgentName` union in `telemetry/agentMetrics.ts` needed `"KnowledgeEngine"` added (and `"ModelOrchestrator"` was retroactively missing from V9.3 — added both together). The pre-existing unrelated `backend.knowledgeGraph` field is a file/dependency graph, not this module — don't conflate them when searching the codebase.
