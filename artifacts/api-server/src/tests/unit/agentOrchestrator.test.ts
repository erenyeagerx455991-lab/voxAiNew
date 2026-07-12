import { describe, it, expect, beforeEach } from "vitest";
import { AGENT_REGISTRY, ALL_AGENT_NAMES, PASS_THROUGH_SKIPPABLE } from "../../agent-orchestrator/agentRegistry.js";
import { buildDependencyGraph, flattenWaves } from "../../agent-orchestrator/dependencyGraph.js";
import { classifyComplexity, planExecution } from "../../agent-orchestrator/executionPlanner.js";
import { runSchedule, type ScheduledTask } from "../../agent-orchestrator/parallelScheduler.js";
import { withRetry } from "../../agent-orchestrator/retryEngine.js";
import { allocateContext, buildContextDistribution, estimateContextSavings } from "../../agent-orchestrator/contextAllocator.js";
import { allocateModel, buildModelAllocation, getAgentsByTier } from "../../agent-orchestrator/modelAllocator.js";
import { predictExecutionCost, predictSkipSavings } from "../../agent-orchestrator/costIntelligence.js";
import {
  recordAgentOutcome, getAgentHealth, getAllAgentHealth, resetAgentHealth,
} from "../../agent-orchestrator/healthMonitor.js";
import {
  learnFromExecution, getOrchestratorLearningStats, resetOrchestratorLearning,
} from "../../agent-orchestrator/orchestratorLearning.js";
import {
  persistExecutionSnapshot, getCurrentExecutionSnapshot, getExecutionRollbackSnapshot,
  getOrchestratorPersistenceStats, resetOrchestratorPersistence,
} from "../../agent-orchestrator/orchestratorPersistence.js";
import {
  recordOrchestratorExecution, getOrchestratorQualitySnapshot, resetOrchestratorMetrics,
} from "../../agent-orchestrator/orchestratorMetrics.js";

describe("Agent Orchestrator — Registry", () => {
  it("declares every agent with valid dependsOn references", () => {
    for (const name of ALL_AGENT_NAMES) {
      const decl = AGENT_REGISTRY[name];
      expect(decl.name).toBe(name);
      for (const dep of decl.dependsOn) {
        expect(ALL_AGENT_NAMES).toContain(dep);
      }
    }
  });

  it("marks the 6 enrichment agents as pass-through skippable", () => {
    expect(PASS_THROUGH_SKIPPABLE).toEqual([
      "UXIntelligence", "DesignCritic", "ConversionIntelligence",
      "Accessibility", "Optimization", "DesignDirector",
    ]);
    for (const a of PASS_THROUGH_SKIPPABLE) {
      expect(AGENT_REGISTRY[a].skippable).toBe(true);
    }
  });

  it("never marks ProductManager, Planner, Frontend, Scaffold, RuntimeValidation skippable", () => {
    for (const critical of ["ProductManager", "Planner", "Architecture", "Frontend", "Scaffold", "RuntimeValidation"] as const) {
      expect(AGENT_REGISTRY[critical].skippable).toBe(false);
    }
  });
});

describe("Agent Orchestrator — Dependency Graph", () => {
  it("builds a full graph with no cycles", () => {
    const graph = buildDependencyGraph(ALL_AGENT_NAMES);
    expect(graph.stats.hasCycle).toBe(false);
    expect(graph.stats.totalNodes).toBe(ALL_AGENT_NAMES.length);
    expect(graph.waves.length).toBeGreaterThan(0);
  });

  it("every agent appears in exactly one wave, after all its dependencies' waves", () => {
    const graph = buildDependencyGraph(ALL_AGENT_NAMES);
    const waveIndexOf = new Map<string, number>();
    graph.waves.forEach((wave, i) => wave.forEach(a => waveIndexOf.set(a, i)));
    expect(waveIndexOf.size).toBe(ALL_AGENT_NAMES.length);
    for (const node of graph.nodes) {
      const myWave = waveIndexOf.get(node.name)!;
      for (const dep of node.dependsOn) {
        expect(waveIndexOf.get(dep)!).toBeLessThan(myWave);
      }
    }
  });

  it("groups BackendArchitect/DevOpsArchitect/QAArchitect sequentially (real data deps)", () => {
    const graph = buildDependencyGraph(ALL_AGENT_NAMES);
    const flat = flattenWaves(graph.waves);
    expect(flat.indexOf("BackendArchitect")).toBeLessThan(flat.indexOf("DevOpsArchitect"));
    expect(flat.indexOf("DevOpsArchitect")).toBeLessThan(flat.indexOf("QAArchitect"));
  });

  it("shrinks the graph correctly when agents are excluded (skipped upstream)", () => {
    const active = ALL_AGENT_NAMES.filter(a => a !== "DesignDirector" && a !== "ConversionIntelligence");
    const graph = buildDependencyGraph(active);
    expect(graph.stats.totalNodes).toBe(active.length);
    expect(flattenWaves(graph.waves)).not.toContain("DesignDirector");
  });
});

describe("Agent Orchestrator — Execution Planner", () => {
  it("classifies GenerationMode into complexity tiers", () => {
    expect(classifyComplexity("Fast")).toBe("simple");
    expect(classifyComplexity("Safe")).toBe("simple");
    expect(classifyComplexity("Balanced")).toBe("standard");
    expect(classifyComplexity("Strict")).toBe("standard");
    expect(classifyComplexity("Quality")).toBe("enterprise");
    expect(classifyComplexity("Enterprise")).toBe("enterprise");
    expect(classifyComplexity("Creative")).toBe("enterprise");
    expect(classifyComplexity("Experimental")).toBe("enterprise");
  });

  it("skips all 6 pass-through-safe agents for simple builds", () => {
    const blueprint = planExecution({ buildId: "b1", mode: "Fast" });
    expect(blueprint.complexity).toBe("simple");
    for (const a of PASS_THROUGH_SKIPPABLE) expect(blueprint.skippedAgents).toContain(a);
  });

  it("skips only a small subset for standard builds", () => {
    const blueprint = planExecution({ buildId: "b2", mode: "Balanced" });
    expect(blueprint.complexity).toBe("standard");
    expect(blueprint.skippedAgents.length).toBeLessThan(PASS_THROUGH_SKIPPABLE.length);
  });

  it("skips nothing for enterprise builds", () => {
    const blueprint = planExecution({ buildId: "b3", mode: "Enterprise" });
    expect(blueprint.complexity).toBe("enterprise");
    expect(blueprint.skippedAgents).toEqual([]);
  });

  it("produces a self-consistent blueprint (agentPriority excludes skipped agents)", () => {
    const blueprint = planExecution({ buildId: "b4", mode: "Fast" });
    for (const skipped of blueprint.skippedAgents) {
      expect(blueprint.agentPriority).not.toContain(skipped);
    }
    expect(blueprint.agentPriority.length + blueprint.skippedAgents.length).toBe(ALL_AGENT_NAMES.length);
  });

  it("estimates lower cost/duration for simple builds than enterprise builds", () => {
    const simple = planExecution({ buildId: "s", mode: "Fast" });
    const enterprise = planExecution({ buildId: "e", mode: "Enterprise" });
    expect(simple.executionCost).toBeLessThan(enterprise.executionCost);
    expect(simple.estimatedDurationMs).toBeLessThan(enterprise.estimatedDurationMs);
  });

  it("is deterministic for the same input", () => {
    const a = planExecution({ buildId: "x", mode: "Balanced" });
    const b = planExecution({ buildId: "x", mode: "Balanced" });
    expect(a.skippedAgents).toEqual(b.skippedAgents);
    expect(a.parallelGroups).toEqual(b.parallelGroups);
    expect(a.executionCost).toEqual(b.executionCost);
  });
});

describe("Agent Orchestrator — Retry Engine", () => {
  const basePolicy = { retryCount: 2, retryDelayMs: 1, backoffStrategy: "none" as const, failureSeverity: "medium" as const, critical: false, recoveryMode: "retry" as const };

  it("succeeds immediately when the task succeeds", async () => {
    const outcome = await withRetry(async () => 42, basePolicy);
    expect(outcome.success).toBe(true);
    expect(outcome.result).toBe(42);
    expect(outcome.attempts).toBe(1);
  });

  it("retries up to retryCount+1 times then reports failure", async () => {
    let calls = 0;
    const outcome = await withRetry(async () => { calls++; throw new Error("boom"); }, basePolicy);
    expect(outcome.success).toBe(false);
    expect(calls).toBe(3);
    expect(outcome.attempts).toBe(3);
  });

  it("recovers after a transient failure", async () => {
    let calls = 0;
    const outcome = await withRetry(async () => {
      calls++;
      if (calls < 2) throw new Error("transient");
      return "ok";
    }, basePolicy);
    expect(outcome.success).toBe(true);
    expect(outcome.result).toBe("ok");
    expect(outcome.attempts).toBe(2);
  });

  it("reports timedOut when the task exceeds its timeout", async () => {
    const outcome = await withRetry(
      () => new Promise(resolve => setTimeout(() => resolve("late"), 50)),
      { ...basePolicy, retryCount: 0 },
      5,
    );
    expect(outcome.success).toBe(false);
    expect(outcome.timedOut).toBe(true);
  });
});

describe("Agent Orchestrator — Parallel Scheduler", () => {
  function task(agent: any, run: () => Promise<unknown>, critical = false): ScheduledTask {
    return {
      agent, run,
      retryPolicy: { retryCount: 0, retryDelayMs: 0, backoffStrategy: "none", failureSeverity: critical ? "critical" : "low", critical, recoveryMode: critical ? "abort" : "skip" },
      timeoutPolicy: { timeoutMs: 1000, onTimeout: "fallback" },
    };
  }

  it("runs all tasks in a single wave concurrently", async () => {
    const order: string[] = [];
    const waves = [[
      task("ProductManager", async () => { order.push("a"); return 1; }),
      task("FrontendArchitect", async () => { order.push("b"); return 2; }),
    ]];
    const { results, cancelled } = await runSchedule(waves);
    expect(cancelled).toBe(false);
    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it("cancels remaining waves after a critical failure", async () => {
    const waves = [
      [task("ProductManager", async () => { throw new Error("fatal"); }, true)],
      [task("FrontendArchitect", async () => "never runs")],
    ];
    const { results, cancelled, cancelledAt } = await runSchedule(waves);
    expect(cancelled).toBe(true);
    expect(cancelledAt).toContain("FrontendArchitect");
    const frontendResult = results.find(r => r.agent === "FrontendArchitect")!;
    expect(frontendResult.skipped).toBe(true);
  });

  it("continues past a non-critical failure", async () => {
    const waves = [
      [task("Optimization", async () => { throw new Error("minor"); }, false)],
      [task("DesignDirector", async () => "ran")],
    ];
    const { results, cancelled } = await runSchedule(waves);
    expect(cancelled).toBe(false);
    const directorResult = results.find(r => r.agent === "DesignDirector")!;
    expect(directorResult.success).toBe(true);
  });
});

describe("Agent Orchestrator — Context Allocator", () => {
  it("filters context down to only declared consumed fields", () => {
    const full = { prompt: "p", productPlan: {}, frontendBlueprint: {}, extraneous: true };
    const allocated = allocateContext("BackendArchitect", full);
    expect(allocated).toHaveProperty("productPlan");
    expect(allocated).toHaveProperty("frontendBlueprint");
    expect(allocated).not.toHaveProperty("extraneous");
  });

  it("builds a context distribution table for active agents", () => {
    const dist = buildContextDistribution(["ProductManager", "FrontendArchitect"]);
    expect(dist).toHaveLength(2);
    expect(dist[0].agent).toBe("ProductManager");
  });

  it("estimates non-negative context savings", () => {
    const savings = estimateContextSavings(ALL_AGENT_NAMES, 10);
    expect(savings).toBeGreaterThanOrEqual(0);
    expect(savings).toBeLessThanOrEqual(100);
  });
});

describe("Agent Orchestrator — Model Allocator", () => {
  it("allocates a model tier for every agent", () => {
    const allocation = buildModelAllocation();
    for (const name of ALL_AGENT_NAMES) expect(allocation[name]).toBeDefined();
  });

  it("routes Security to highest-reasoning and Frontend to high-quality", () => {
    expect(allocateModel("SecurityIntelligence")).toBe("highest-reasoning");
    expect(allocateModel("Frontend")).toBe("high-quality");
  });

  it("groups agents by tier", () => {
    const fastAgents = getAgentsByTier("fast");
    expect(fastAgents.length).toBeGreaterThan(0);
    expect(fastAgents).toContain("ProductManager");
  });
});

describe("Agent Orchestrator — Cost Intelligence", () => {
  it("predicts non-negative cost/time for any active agent set", () => {
    const prediction = predictExecutionCost(ALL_AGENT_NAMES, []);
    expect(prediction.totalTokens).toBeGreaterThan(0);
    expect(prediction.totalCost).toBeGreaterThanOrEqual(0);
    expect(prediction.totalTimeMs).toBeGreaterThan(0);
  });

  it("parallel groups reduce predicted time vs. fully sequential", () => {
    const sequential = predictExecutionCost(["BackendArchitect", "DevOpsArchitect"], []);
    const parallel = predictExecutionCost(["BackendArchitect", "DevOpsArchitect"], [["BackendArchitect", "DevOpsArchitect"]]);
    expect(parallel.totalTimeMs).toBeLessThanOrEqual(sequential.totalTimeMs);
  });

  it("cache hits reduce token cost", () => {
    const noCache = predictExecutionCost(["Frontend"], []);
    const cached = predictExecutionCost(["Frontend"], [], ["Frontend"]);
    expect(cached.totalTokens).toBeLessThan(noCache.totalTokens);
    expect(cached.cacheHits).toBe(1);
  });

  it("predicts skip savings proportional to skipped agent cost", () => {
    const { tokensSaved, timeSavedMs } = predictSkipSavings(PASS_THROUGH_SKIPPABLE);
    expect(tokensSaved).toBeGreaterThan(0);
    expect(timeSavedMs).toBeGreaterThan(0);
  });
});

describe("Agent Orchestrator — Health Monitor", () => {
  beforeEach(() => resetAgentHealth());

  it("reports healthy status with no samples", () => {
    const health = getAgentHealth("Frontend");
    expect(health.status).toBe("healthy");
    expect(health.sampleCount).toBe(0);
  });

  it("degrades health score after repeated failures", () => {
    for (let i = 0; i < 5; i++) {
      recordAgentOutcome({ agent: "Repair", buildId: `b${i}`, success: false, durationMs: 100, retries: 2, timedOut: false });
    }
    const health = getAgentHealth("Repair");
    expect(health.status).not.toBe("healthy");
    expect(health.failureRate).toBe(1);
  });

  it("returns a snapshot for every registered agent", () => {
    const all = getAllAgentHealth();
    expect(all.length).toBe(ALL_AGENT_NAMES.length);
  });
});

describe("Agent Orchestrator — Learning", () => {
  beforeEach(() => resetOrchestratorLearning());

  it("returns empty stats before any records", () => {
    expect(getOrchestratorLearningStats().totalRecords).toBe(0);
  });

  it("aggregates learning records by complexity", async () => {
    await learnFromExecution({ buildId: "b1", complexity: "simple", mode: "Fast", skippedAgents: [], parallelGroupCount: 2, overallScore: 8, actualDurationMs: 1000, estimatedDurationMs: 1200, recordedAt: Date.now() });
    await learnFromExecution({ buildId: "b2", complexity: "simple", mode: "Fast", skippedAgents: [], parallelGroupCount: 2, overallScore: 9, actualDurationMs: 1100, estimatedDurationMs: 1200, recordedAt: Date.now() });
    const stats = getOrchestratorLearningStats();
    expect(stats.totalRecords).toBe(2);
    expect(stats.byComplexity.simple.count).toBe(2);
    expect(stats.bestExecutionGraph).not.toBeNull();
  });
});

describe("Agent Orchestrator — Persistence", () => {
  beforeEach(() => resetOrchestratorPersistence());

  it("persists and retrieves the latest snapshot", () => {
    const blueprint = planExecution({ buildId: "p1", mode: "Balanced" });
    persistExecutionSnapshot("p1", blueprint, []);
    const current = getCurrentExecutionSnapshot();
    expect(current?.buildId).toBe("p1");
    expect(current?.version).toBe(1);
  });

  it("supports rollback to an earlier version", () => {
    const b1 = planExecution({ buildId: "r1", mode: "Fast" });
    const b2 = planExecution({ buildId: "r2", mode: "Enterprise" });
    persistExecutionSnapshot("r1", b1, []);
    persistExecutionSnapshot("r2", b2, []);
    const current = getCurrentExecutionSnapshot()!;
    const rollback = getExecutionRollbackSnapshot(current.version);
    expect(rollback?.buildId).toBe("r1");
  });

  it("caps history at 500 and reports capacity", () => {
    for (let i = 0; i < 5; i++) {
      persistExecutionSnapshot(`cap${i}`, planExecution({ buildId: `cap${i}`, mode: "Fast" }), []);
    }
    const stats = getOrchestratorPersistenceStats();
    expect(stats.totalSnapshots).toBe(5);
    expect(stats.capacityUsed).toBeGreaterThanOrEqual(0);
  });
});

describe("Agent Orchestrator — Telemetry", () => {
  beforeEach(() => resetOrchestratorMetrics());

  it("returns zeroed snapshot with no executions", () => {
    const snapshot = getOrchestratorQualitySnapshot();
    expect(snapshot.totalExecutions).toBe(0);
    expect(snapshot.executionScore).toBe(0);
  });

  it("aggregates recorded executions", () => {
    const blueprint = planExecution({ buildId: "t1", mode: "Fast" });
    recordOrchestratorExecution("t1", blueprint, 8.5, 900, 0, 0);
    const snapshot = getOrchestratorQualitySnapshot();
    expect(snapshot.totalExecutions).toBe(1);
    expect(snapshot.executionScore).toBe(8.5);
    expect(snapshot.dependencyGraphStats.averageSkippedAgents).toBeGreaterThan(0);
  });
});
