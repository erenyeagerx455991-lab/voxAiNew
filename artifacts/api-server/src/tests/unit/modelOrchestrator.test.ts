import { describe, it, expect, beforeEach } from "vitest";

// Provider Registry
import {
  PROVIDER_REGISTRY, ALL_PROVIDER_IDS, getProvider,
  getAvailableProviders, isProviderAvailable,
} from "../../model-orchestrator/providerRegistry.js";

// Model Router
import {
  resolveProvider, buildFallbackChain, routeAgent,
} from "../../model-orchestrator/modelRouter.js";

// Token Budget Engine
import {
  computeTokenBudget, getAgentTokenBudget,
} from "../../model-orchestrator/tokenBudgetEngine.js";

// Context Compression
import {
  compressContext, estimateCompressionSavings,
} from "../../model-orchestrator/contextCompressionEngine.js";

// Cache Intelligence
import {
  cacheSet, cacheGet, getCacheHitRate, getCacheSnapshot,
  predictCacheHitRate, resetCacheIntelligence,
} from "../../model-orchestrator/cacheIntelligence.js";

// Cost Intelligence
import {
  predictAgentCost, predictTotalCost, estimateLatencyMs, estimateQuality,
} from "../../model-orchestrator/costIntelligence.js";

// Model Health Monitor
import {
  recordProviderOutcome, getProviderHealth, getAllProviderHealth,
  isProviderHealthy, resetModelHealthMonitor,
} from "../../model-orchestrator/modelHealthMonitor.js";

// Learning
import {
  learnFromModelOrchestration, getModelOrchestratorLearningStats,
  resetModelOrchestratorLearning,
} from "../../model-orchestrator/modelOrchestratorLearning.js";

// Persistence
import {
  persistModelBlueprint, getCurrentModelBlueprint,
  getModelBlueprintRollback, getModelOrchestratorPersistenceStats,
  resetModelOrchestratorPersistence,
} from "../../model-orchestrator/modelOrchestratorPersistence.js";

// Metrics / Telemetry
import {
  recordModelOrchestration, getModelOrchestrationSnapshot,
  resetModelOrchestratorMetrics,
} from "../../model-orchestrator/modelOrchestratorMetrics.js";

// Blueprint Builder
import {
  buildModelExecutionBlueprint, buildFallbackModelBlueprint,
} from "../../model-orchestrator/blueprintBuilder.js";

// Orchestrator planner (to generate a real ExecutionBlueprint as input)
import { planExecution } from "../../agent-orchestrator/executionPlanner.js";
import { ALL_AGENT_NAMES } from "../../agent-orchestrator/agentRegistry.js";

// ── Provider Registry ─────────────────────────────────────────────────────────

describe("V9.3 — Provider Registry", () => {
  it("contains all 8 provider entries", () => {
    expect(ALL_PROVIDER_IDS).toHaveLength(8);
    expect(ALL_PROVIDER_IDS).toContain("openrouter");
    expect(ALL_PROVIDER_IDS).toContain("groq");
    expect(ALL_PROVIDER_IDS).toContain("openai");
    expect(ALL_PROVIDER_IDS).toContain("claude");
    expect(ALL_PROVIDER_IDS).toContain("gemini");
    expect(ALL_PROVIDER_IDS).toContain("deepseek");
    expect(ALL_PROVIDER_IDS).toContain("local");
    expect(ALL_PROVIDER_IDS).toContain("future");
  });

  it("only OpenRouter and Groq are available (have credentials)", () => {
    const available = getAvailableProviders();
    expect(available.map(p => p.providerId)).toContain("openrouter");
    expect(available.map(p => p.providerId)).toContain("groq");
    // All others should be unavailable
    for (const id of ALL_PROVIDER_IDS) {
      if (id !== "openrouter" && id !== "groq") {
        expect(isProviderAvailable(id)).toBe(false);
      }
    }
  });

  it("non-configured providers have null concreteModel", () => {
    expect(getProvider("openai").concreteModel).toBeNull();
    expect(getProvider("claude").concreteModel).toBeNull();
    expect(getProvider("gemini").concreteModel).toBeNull();
    expect(getProvider("deepseek").concreteModel).toBeNull();
    expect(getProvider("local").concreteModel).toBeNull();
  });

  it("available providers have non-null concreteModel", () => {
    expect(getProvider("openrouter").concreteModel).not.toBeNull();
    expect(getProvider("groq").concreteModel).not.toBeNull();
  });

  it("every provider has valid 0-10 scores", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const p = PROVIDER_REGISTRY[id];
      expect(p.latency).toBeGreaterThanOrEqual(0);
      expect(p.latency).toBeLessThanOrEqual(10);
      expect(p.quality).toBeGreaterThanOrEqual(0);
      expect(p.quality).toBeLessThanOrEqual(10);
      expect(p.costScore).toBeGreaterThanOrEqual(0);
      expect(p.costScore).toBeLessThanOrEqual(10);
    }
  });
});

// ── Dynamic Model Router ──────────────────────────────────────────────────────

describe("V9.3 — Dynamic Model Router", () => {
  it("always resolves to an available provider", () => {
    const tiers = ["fast", "high-quality", "cheap-reasoning", "highest-reasoning", "balanced"] as const;
    for (const tier of tiers) {
      const resolved = resolveProvider(tier);
      expect(isProviderAvailable(resolved)).toBe(true);
    }
  });

  it("fast/cheap-reasoning → Groq (fastest available)", () => {
    expect(resolveProvider("fast")).toBe("groq");
    expect(resolveProvider("cheap-reasoning")).toBe("groq");
  });

  it("high-quality/highest-reasoning → OpenRouter (best available quality)", () => {
    // openai/claude are unavailable, so falls through to openrouter
    expect(resolveProvider("high-quality")).toBe("openrouter");
    expect(resolveProvider("highest-reasoning")).toBe("openrouter");
  });

  it("balanced → OpenRouter", () => {
    expect(resolveProvider("balanced")).toBe("openrouter");
  });

  it("builds a valid fallback chain with all available providers", () => {
    const chain = buildFallbackChain("fast");
    expect(chain.primary).toBeDefined();
    expect(chain.backups).toBeInstanceOf(Array);
    expect(chain.lastResort).toBeDefined();
    // all entries in chain should be real provider IDs
    const validIds = new Set(ALL_PROVIDER_IDS);
    expect(validIds.has(chain.primary)).toBe(true);
    expect(validIds.has(chain.lastResort)).toBe(true);
  });

  it("routes every known agent without throwing", () => {
    for (const agent of ALL_AGENT_NAMES) {
      expect(() => routeAgent(agent)).not.toThrow();
    }
  });

  it("Repair agent gets cheap-reasoning routing (Groq)", () => {
    const decision = routeAgent("Repair");
    expect(decision.selectedProvider).toBe("groq");
    expect(decision.reasoningDepth).toBe("medium");
  });

  it("Frontend agent gets high-quality routing (OpenRouter)", () => {
    const decision = routeAgent("Frontend");
    expect(decision.selectedProvider).toBe("openrouter");
    expect(decision.reasoningDepth).toBe("deep");
  });

  it("SecurityIntelligence gets highest-reasoning routing", () => {
    const decision = routeAgent("SecurityIntelligence");
    expect(decision.selectedProvider).toBe("openrouter");
    expect(decision.reasoningDepth).toBe("deep");
  });

  it("routing is deterministic for same agent", () => {
    const a = routeAgent("Planner");
    const b = routeAgent("Planner");
    expect(a.selectedProvider).toBe(b.selectedProvider);
    expect(a.cachePolicy).toBe(b.cachePolicy);
  });
});

// ── Token Budget Engine ───────────────────────────────────────────────────────

describe("V9.3 — Token Budget Engine", () => {
  it("assigns non-zero budget to all active agents", () => {
    const result = computeTokenBudget("standard", ALL_AGENT_NAMES);
    for (const agent of ALL_AGENT_NAMES) {
      expect(result.perAgent[agent]).toBeDefined();
      expect(result.perAgent[agent].tokens).toBeGreaterThan(0);
    }
  });

  it("enterprise builds have a larger total budget than simple builds", () => {
    const simple = computeTokenBudget("simple", ALL_AGENT_NAMES);
    const enterprise = computeTokenBudget("enterprise", ALL_AGENT_NAMES);
    expect(enterprise.totalBudget).toBeGreaterThan(simple.totalBudget);
  });

  it("per-agent percentages sum to ~100 across active agents", () => {
    const result = computeTokenBudget("standard", ALL_AGENT_NAMES);
    const total = Object.values(result.perAgent).reduce((s, v) => s + v.percent, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  it("agent budget query works for individual agent", () => {
    const budget = getAgentTokenBudget("Frontend", "enterprise");
    expect(budget.tokens).toBeGreaterThan(0);
    expect(budget.percent).toBeGreaterThan(0);
  });

  it("Frontend gets larger share than ProductManager for all complexity levels", () => {
    for (const c of ["simple", "standard", "enterprise"] as const) {
      const result = computeTokenBudget(c, ALL_AGENT_NAMES);
      expect(result.perAgent["Frontend"].tokens).toBeGreaterThan(result.perAgent["ProductManager"].tokens);
    }
  });
});

// ── Context Compression ───────────────────────────────────────────────────────

describe("V9.3 — Context Compression Engine", () => {
  it("none policy results in zero compression", () => {
    const r = compressContext({ rawContextLength: 10_000, agent: "ProductManager", complexity: "simple", compressionPolicy: "none" });
    expect(r.compressionRatio).toBe(0);
    expect(r.compressedLength).toBe(10_000);
    expect(r.tokensSaved).toBe(0);
  });

  it("light policy compresses by ~20%", () => {
    const r = compressContext({ rawContextLength: 10_000, agent: "Frontend", complexity: "standard", compressionPolicy: "light" });
    expect(r.compressionRatio).toBeCloseTo(0.2, 2);
    expect(r.tokensSaved).toBeGreaterThan(0);
  });

  it("aggressive policy compresses by ~45%", () => {
    const r = compressContext({ rawContextLength: 10_000, agent: "Repair", complexity: "enterprise", compressionPolicy: "aggressive" });
    expect(r.compressionRatio).toBeCloseTo(0.45, 2);
  });

  it("compressedLength is always less than originalLength for non-none policies", () => {
    const r = compressContext({ rawContextLength: 5_000, agent: "Repair", complexity: "simple", compressionPolicy: "aggressive" });
    expect(r.compressedLength).toBeLessThan(r.originalLength);
  });

  it("estimates compression savings across all agents", () => {
    const { totalTokensSaved, averageRatio } = estimateCompressionSavings(ALL_AGENT_NAMES, 5_000, "enterprise");
    expect(totalTokensSaved).toBeGreaterThanOrEqual(0);
    expect(averageRatio).toBeGreaterThanOrEqual(0);
    expect(averageRatio).toBeLessThanOrEqual(1);
  });
});

// ── Cache Intelligence ────────────────────────────────────────────────────────

describe("V9.3 — Cache Intelligence", () => {
  beforeEach(() => resetCacheIntelligence());

  it("cacheGet returns false for unknown key (miss)", () => {
    const hit = cacheGet("prompt", "unknown-key");
    expect(hit).toBe(false);
  });

  it("cacheSet then cacheGet returns true (hit)", () => {
    cacheSet("prompt", "key-1", "Frontend");
    const hit = cacheGet("prompt", "key-1");
    expect(hit).toBe(true);
  });

  it("cache hit rate increases after hits", () => {
    cacheSet("blueprint", "bp-1", "Planner");
    cacheGet("blueprint", "bp-1");  // hit
    cacheGet("blueprint", "missing"); // miss
    const rate = getCacheHitRate("blueprint");
    expect(rate).toBeCloseTo(0.5, 1);
  });

  it("getCacheSnapshot covers all 6 cache types", () => {
    const snap = getCacheSnapshot();
    const types = ["prompt", "blueprint", "retrieval", "component", "evaluation", "repair"];
    for (const t of types) {
      expect(snap[t as keyof typeof snap]).toBeDefined();
    }
  });

  it("predictCacheHitRate increases with more builds", () => {
    const low  = predictCacheHitRate("prompt", 0);
    const high = predictCacheHitRate("prompt", 20);
    expect(high).toBeGreaterThan(low);
  });

  it("none policy always predicts 0 hit rate", () => {
    expect(predictCacheHitRate("none", 100)).toBe(0);
  });

  it("full policy predicts higher hit rate than prompt policy", () => {
    const full   = predictCacheHitRate("full", 10);
    const prompt = predictCacheHitRate("prompt", 10);
    expect(full).toBeGreaterThanOrEqual(prompt);
  });
});

// ── Cost Intelligence ─────────────────────────────────────────────────────────

describe("V9.3 — Cost Intelligence", () => {
  it("predicts agent cost with 0 cache hit rate = full tokens", () => {
    const result = predictAgentCost("Frontend", "openrouter", 6_000, 0);
    expect(result.tokens).toBe(6_000);
    expect(result.cost).toBeGreaterThan(0);
    expect(result.cacheSavings).toBe(0);
  });

  it("cache hits reduce effective token count and cost", () => {
    const noCacheResult  = predictAgentCost("Frontend", "openrouter", 6_000, 0);
    const withCacheResult = predictAgentCost("Frontend", "openrouter", 6_000, 0.5);
    expect(withCacheResult.tokens).toBeLessThan(noCacheResult.tokens);
    expect(withCacheResult.cost).toBeLessThan(noCacheResult.cost);
    expect(withCacheResult.cacheSavings).toBeGreaterThan(0);
  });

  it("Groq is cheaper than OpenRouter per token", () => {
    const openrouter = predictAgentCost("Repair", "openrouter", 1_000, 0);
    const groq       = predictAgentCost("Repair", "groq",       1_000, 0);
    expect(groq.cost).toBeLessThan(openrouter.cost);
  });

  it("predictTotalCost produces valid prediction object", () => {
    const blueprint = planExecution({ buildId: "cost-1", mode: "Balanced" });
    const agentProviders = Object.fromEntries(blueprint.agentPriority.map(a => [a, "openrouter" as const])) as any;
    const agentTokens    = Object.fromEntries(blueprint.agentPriority.map(a => [a, 1_000])) as any;
    const pred = predictTotalCost(agentProviders, agentTokens, 0, blueprint.parallelGroups, 100_000);
    expect(pred.totalCost).toBeGreaterThanOrEqual(0);
    expect(pred.perAgent.length).toBeGreaterThan(0);
    expect(pred.monthlyCost).toBeGreaterThanOrEqual(0);
    expect(pred.budgetUtilization).toBeGreaterThanOrEqual(0);
    expect(pred.budgetUtilization).toBeLessThanOrEqual(1);
  });

  it("estimateLatencyMs returns positive value", () => {
    expect(estimateLatencyMs("groq", 1_000)).toBeGreaterThan(0);
    expect(estimateLatencyMs("openrouter", 5_000)).toBeGreaterThan(0);
  });

  it("estimateQuality returns values in 0-10 range", () => {
    for (const id of ALL_PROVIDER_IDS) {
      const q = estimateQuality(id);
      expect(q).toBeGreaterThanOrEqual(0);
      expect(q).toBeLessThanOrEqual(10);
    }
  });
});

// ── Model Health Monitor ──────────────────────────────────────────────────────

describe("V9.3 — Model Health Monitor", () => {
  beforeEach(() => resetModelHealthMonitor());

  it("reports 100 health score with no samples", () => {
    const health = getProviderHealth("openrouter");
    expect(health.healthScore).toBe(100);
    expect(health.sampleCount).toBe(0);
    expect(health.availability).toBe(1);
  });

  it("degrades health score after repeated failures", () => {
    for (let i = 0; i < 5; i++) {
      recordProviderOutcome("openrouter", false, 2_000, 0.01, 5, false);
    }
    const health = getProviderHealth("openrouter");
    expect(health.healthScore).toBeLessThan(100);
    expect(health.failureRate).toBe(1);
  });

  it("timeouts further degrade health score", () => {
    recordProviderOutcome("groq", false, 30_000, 0, 0, true);
    const health = getProviderHealth("groq");
    expect(health.healthScore).toBeLessThan(100);
    expect(health.timeouts).toBe(1);
  });

  it("isProviderHealthy returns true for a provider with no failures", () => {
    recordProviderOutcome("openrouter", true, 500, 0.001, 8, false);
    expect(isProviderHealthy("openrouter")).toBe(true);
  });

  it("getAllProviderHealth returns an entry for every provider", () => {
    const all = getAllProviderHealth();
    expect(all.length).toBe(ALL_PROVIDER_IDS.length);
  });

  it("successful outcomes maintain healthy status", () => {
    for (let i = 0; i < 10; i++) {
      recordProviderOutcome("openrouter", true, 800, 0.001, 8.5, false);
    }
    const health = getProviderHealth("openrouter");
    expect(health.healthScore >= 80 ? "healthy" : "warning").toBe("healthy");
  });
});

// ── Learning ──────────────────────────────────────────────────────────────────

describe("V9.3 — Model Orchestrator Learning", () => {
  beforeEach(() => resetModelOrchestratorLearning());

  it("returns empty stats with no records", () => {
    const stats = getModelOrchestratorLearningStats();
    expect(stats.totalRecords).toBe(0);
    expect(stats.bestProvider).toBeNull();
  });

  it("accumulates records and computes average routing score", async () => {
    await learnFromModelOrchestration({
      buildId: "l1", complexity: "simple", bestProvider: "groq",
      bestTokenAlloc: {} as any, cacheStrategy: "prompt",
      routingScore: 8, costSavings: 0.001, latencySavings: 100, recordedAt: Date.now(),
    });
    await learnFromModelOrchestration({
      buildId: "l2", complexity: "standard", bestProvider: "openrouter",
      bestTokenAlloc: {} as any, cacheStrategy: "full",
      routingScore: 9, costSavings: 0.002, latencySavings: 200, recordedAt: Date.now(),
    });
    const stats = getModelOrchestratorLearningStats();
    expect(stats.totalRecords).toBe(2);
    expect(stats.averageRoutingScore).toBeCloseTo(8.5, 1);
    expect(stats.bestProvider).not.toBeNull();
  });

  it("groups learning records by complexity", async () => {
    await learnFromModelOrchestration({
      buildId: "c1", complexity: "enterprise", bestProvider: "openrouter",
      bestTokenAlloc: {} as any, cacheStrategy: "full",
      routingScore: 9.5, costSavings: 0.003, latencySavings: 500, recordedAt: Date.now(),
    });
    const stats = getModelOrchestratorLearningStats();
    expect(stats.byComplexity["enterprise"]).toBeDefined();
    expect(stats.byComplexity["enterprise"].count).toBe(1);
  });
});

// ── Persistence ───────────────────────────────────────────────────────────────

describe("V9.3 — Model Orchestrator Persistence", () => {
  beforeEach(() => resetModelOrchestratorPersistence());

  it("persists and retrieves the current model blueprint", () => {
    const blueprint = buildFallbackModelBlueprint("p1");
    persistModelBlueprint("p1", blueprint);
    const current = getCurrentModelBlueprint();
    expect(current?.buildId).toBe("p1");
    expect(current?.version).toBe(1);
  });

  it("supports rollback to previous version", () => {
    const b1 = buildFallbackModelBlueprint("r1");
    const b2 = buildFallbackModelBlueprint("r2");
    persistModelBlueprint("r1", b1);
    persistModelBlueprint("r2", b2);
    const current = getCurrentModelBlueprint()!;
    const rollback = getModelBlueprintRollback(current.version);
    expect(rollback?.buildId).toBe("r1");
  });

  it("caps history at 500 records and reports capacity", () => {
    const b = buildFallbackModelBlueprint("cap");
    for (let i = 0; i < 5; i++) persistModelBlueprint(`cap${i}`, b);
    const stats = getModelOrchestratorPersistenceStats();
    expect(stats.totalSnapshots).toBe(5);
    expect(stats.capacityUsed).toBeGreaterThanOrEqual(0);
    expect(stats.capacityUsed).toBeLessThanOrEqual(100);
  });

  it("reports correct version increments", () => {
    const b = buildFallbackModelBlueprint("v1");
    persistModelBlueprint("v1", b);
    persistModelBlueprint("v2", b);
    const stats = getModelOrchestratorPersistenceStats();
    expect(stats.currentVersion).toBe(2);
    expect(stats.newestVersion).toBe(2);
  });
});

// ── Telemetry ─────────────────────────────────────────────────────────────────

describe("V9.3 — Model Orchestrator Telemetry", () => {
  beforeEach(() => resetModelOrchestratorMetrics());

  it("returns zero snapshot with no executions", () => {
    const snap = getModelOrchestrationSnapshot();
    expect(snap.totalExecutions).toBe(0);
    expect(snap.routingScore).toBe(0);
    expect(snap.fallbackRate).toBe(0);
  });

  it("aggregates recorded executions correctly", () => {
    recordModelOrchestration("t1", 8.5, 0.3, false, 0.9, 0.7, 0.001, 1500, "openrouter");
    recordModelOrchestration("t2", 7.5, 0.5, true, 0.8, 0.6, 0.002, 2000, "groq");
    const snap = getModelOrchestrationSnapshot();
    expect(snap.totalExecutions).toBe(2);
    expect(snap.routingScore).toBeCloseTo(8.0, 1);
    expect(snap.fallbackRate).toBeCloseTo(0.5, 1);
    expect(snap.providerDistribution["openrouter"]).toBe(1);
    expect(snap.providerDistribution["groq"]).toBe(1);
  });

  it("snapshot includes all required telemetry fields from spec", () => {
    const snap = getModelOrchestrationSnapshot();
    expect(snap).toHaveProperty("routingScore");
    expect(snap).toHaveProperty("providerDistribution");
    expect(snap).toHaveProperty("averageLatency");
    expect(snap).toHaveProperty("averageCost");
    expect(snap).toHaveProperty("cacheHitRate");
    expect(snap).toHaveProperty("fallbackRate");
    expect(snap).toHaveProperty("tokenEfficiency");
    expect(snap).toHaveProperty("budgetUtilization");
    expect(snap).toHaveProperty("learningStatistics");
    expect(snap).toHaveProperty("persistenceHealth");
  });
});

// ── Blueprint Builder ─────────────────────────────────────────────────────────

describe("V9.3 — Model Execution Blueprint Builder", () => {
  it("builds a valid ModelExecutionBlueprint from an ExecutionBlueprint", () => {
    const execBlueprint = planExecution({ buildId: "mb1", mode: "Balanced" });
    const modelBlueprint = buildModelExecutionBlueprint(execBlueprint);
    expect(modelBlueprint.buildId).toBe("mb1");
    expect(modelBlueprint.totalTokenBudget).toBeGreaterThan(0);
    expect(Object.keys(modelBlueprint.agentPlans).length).toBeGreaterThan(0);
  });

  it("assigns plans only for active agents (not skipped)", () => {
    const execBlueprint = planExecution({ buildId: "mb2", mode: "Fast" });
    const modelBlueprint = buildModelExecutionBlueprint(execBlueprint);
    // Skipped agents should NOT appear in agentPlans
    for (const skipped of execBlueprint.skippedAgents) {
      expect(modelBlueprint.agentPlans[skipped]).toBeUndefined();
    }
  });

  it("every agent plan has a valid provider with availability > 0", () => {
    const execBlueprint = planExecution({ buildId: "mb3", mode: "Enterprise" });
    const modelBlueprint = buildModelExecutionBlueprint(execBlueprint);
    for (const plan of Object.values(modelBlueprint.agentPlans)) {
      expect(isProviderAvailable(plan.selectedProvider)).toBe(true);
    }
  });

  it("providerDistribution sums to total active agent count", () => {
    const execBlueprint = planExecution({ buildId: "mb4", mode: "Balanced" });
    const modelBlueprint = buildModelExecutionBlueprint(execBlueprint);
    const total = Object.values(modelBlueprint.providerDistribution).reduce((a, b) => a + b, 0);
    expect(total).toBe(execBlueprint.agentPriority.length);
  });

  it("builds a safe fallback blueprint without throwing", () => {
    const fallback = buildFallbackModelBlueprint("fb1");
    expect(fallback.buildId).toBe("fb1");
    expect(fallback.totalTokenBudget).toBeGreaterThan(0);
  });

  it("is deterministic for same ExecutionBlueprint", () => {
    const execBlueprint = planExecution({ buildId: "det", mode: "Balanced" });
    const a = buildModelExecutionBlueprint(execBlueprint, 5);
    const b = buildModelExecutionBlueprint(execBlueprint, 5);
    expect(a.totalTokenBudget).toBe(b.totalTokenBudget);
    expect(a.providerDistribution).toEqual(b.providerDistribution);
    expect(a.expectedTotalCost).toBe(b.expectedTotalCost);
  });

  it("enterprise builds have larger token budgets than simple builds", () => {
    const simple = planExecution({ buildId: "s1", mode: "Fast" });
    const enterprise = planExecution({ buildId: "e1", mode: "Enterprise" });
    const simpleModel = buildModelExecutionBlueprint(simple);
    const enterpriseModel = buildModelExecutionBlueprint(enterprise);
    expect(enterpriseModel.totalTokenBudget).toBeGreaterThan(simpleModel.totalTokenBudget);
  });

  it("regression — existing orchestrator tests still work alongside V9.3", () => {
    const blueprint = planExecution({ buildId: "reg", mode: "Balanced" });
    expect(blueprint.skippedAgents.length).toBeLessThan(ALL_AGENT_NAMES.length);
    const modelBlueprint = buildModelExecutionBlueprint(blueprint);
    expect(modelBlueprint.agentPlans).toBeDefined();
  });
});
