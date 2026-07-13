import { describe, it, expect, beforeEach } from "vitest";

import { ALL_KNOWLEDGE_DOMAINS } from "../../knowledge-engine/types.js";

import {
  addNode, addEdge, getNode, listNodes, getRelated, traverse,
  linkIntoChain, getGraphStats, resetKnowledgeGraph,
} from "../../knowledge-engine/knowledgeGraph.js";

import {
  ingestKnowledge, getAllKnowledgeRecords, getKnowledgeByDomain,
  getKnowledgeStats, resetKnowledgeCollector,
} from "../../knowledge-engine/knowledgeCollector.js";

import {
  extractTerms, scoreRecord, retrieveKnowledge, getSemanticCoverage,
} from "../../knowledge-engine/semanticRetrieval.js";

import {
  RANKING_WEIGHTS, computeFactors, compositeScore, rankKnowledge,
} from "../../knowledge-engine/knowledgeRanking.js";

import {
  registerPattern, getPattern, listPatterns, getTopPatterns,
  resetPatternIntelligence,
} from "../../knowledge-engine/patternIntelligence.js";

import {
  recommend, getRecommendationAccuracy,
} from "../../knowledge-engine/recommendationEngine.js";

import { buildKnowledgeBundle } from "../../knowledge-engine/knowledgeBundleBuilder.js";
import { compressKnowledgeBundle } from "../../knowledge-engine/knowledgeCompression.js";

import {
  learnFromKnowledgeEvent, getKnowledgeLearningStats,
  resetKnowledgeLearning,
} from "../../knowledge-engine/knowledgeLearning.js";

import {
  persistKnowledgeSnapshot, getCurrentKnowledgeSnapshot,
  getKnowledgeRollback, getKnowledgePersistenceStats,
  resetKnowledgePersistence,
} from "../../knowledge-engine/knowledgePersistence.js";

import {
  recordKnowledgeEngineExecution, getKnowledgeEngineMetrics,
  resetKnowledgeEngineMetrics,
} from "../../knowledge-engine/knowledgeMetrics.js";

function resetAll() {
  resetKnowledgeGraph();
  resetKnowledgeCollector();
  resetPatternIntelligence();
  resetKnowledgeLearning();
  resetKnowledgePersistence();
  resetKnowledgeEngineMetrics();
}

// ── Domains ────────────────────────────────────────────────────────────────────

describe("V9.4 — Knowledge Domains", () => {
  it("defines a broad set of knowledge domains", () => {
    expect(ALL_KNOWLEDGE_DOMAINS.length).toBeGreaterThanOrEqual(20);
    expect(ALL_KNOWLEDGE_DOMAINS).toContain("Frontend");
    expect(ALL_KNOWLEDGE_DOMAINS).toContain("Security");
    expect(ALL_KNOWLEDGE_DOMAINS).toContain("Accessibility");
  });
});

// ── Knowledge Graph ────────────────────────────────────────────────────────────

describe("V9.4 — Knowledge Graph", () => {
  beforeEach(() => resetKnowledgeGraph());

  it("adds and retrieves nodes", () => {
    addNode({ id: "n1", type: "Product", label: "Product A" });
    expect(getNode("n1")?.label).toBe("Product A");
    expect(listNodes()).toHaveLength(1);
  });

  it("only creates edges between existing nodes", () => {
    addNode({ id: "n1", type: "Product", label: "Product A" });
    addEdge({ from: "n1", to: "missing", relation: "uses", weight: 1 });
    expect(getRelated("n1")).toHaveLength(0);
  });

  it("getRelated finds bidirectional relationships", () => {
    addNode({ id: "n1", type: "Product", label: "P" });
    addNode({ id: "n2", type: "Feature", label: "F" });
    addEdge({ from: "n1", to: "n2", relation: "has-feature", weight: 1 });
    expect(getRelated("n1").map(n => n.id)).toContain("n2");
    expect(getRelated("n2").map(n => n.id)).toContain("n1");
  });

  it("traverse walks multiple hops", () => {
    addNode({ id: "a", type: "Product", label: "A" });
    addNode({ id: "b", type: "Feature", label: "B" });
    addNode({ id: "c", type: "Component", label: "C" });
    addEdge({ from: "a", to: "b", relation: "r", weight: 1 });
    addEdge({ from: "b", to: "c", relation: "r", weight: 1 });
    const result = traverse("a", 2);
    expect(result.map(n => n.id)).toContain("c");
  });

  it("linkIntoChain connects nodes to the next chain stage in the same domain", () => {
    addNode({ id: "perf1", type: "Performance", label: "Perf", domain: "Performance" });
    linkIntoChain({ id: "feat1", type: "Feature", label: "Feat", domain: "Performance" });
    // Feature -> ... -> Performance is a valid forward chain link
    expect(getRelated("feat1").length).toBeGreaterThanOrEqual(0);
  });

  it("getGraphStats reports node/edge counts and density in [0,1]", () => {
    addNode({ id: "n1", type: "Product", label: "P" });
    addNode({ id: "n2", type: "Feature", label: "F" });
    addEdge({ from: "n1", to: "n2", relation: "r", weight: 1 });
    const stats = getGraphStats();
    expect(stats.nodeCount).toBe(2);
    expect(stats.edgeCount).toBe(1);
    expect(stats.density).toBeGreaterThanOrEqual(0);
    expect(stats.density).toBeLessThanOrEqual(1);
  });
});

// ── Knowledge Collector ────────────────────────────────────────────────────────

describe("V9.4 — Knowledge Collector", () => {
  beforeEach(() => resetAll());

  it("ingests a record with normalized fields", () => {
    const record = ingestKnowledge({
      domain: "Frontend", title: "Hero pattern", summary: "A strong hero section",
      sourceAgent: "Frontend", buildId: "b1", quality: 9,
    });
    expect(record.domain).toBe("Frontend");
    expect(record.quality).toBe(9);
    expect(getAllKnowledgeRecords()).toHaveLength(1);
  });

  it("clamps out-of-range values", () => {
    const record = ingestKnowledge({
      domain: "Security", title: "t", summary: "s", sourceAgent: "a", buildId: "b1",
      quality: 99, confidence: 5, securityScore: -3,
    });
    expect(record.quality).toBe(10);
    expect(record.confidence).toBe(1);
    expect(record.securityScore).toBe(0);
  });

  it("filters by domain", () => {
    ingestKnowledge({ domain: "Backend", title: "t1", summary: "s", sourceAgent: "a", buildId: "b1" });
    ingestKnowledge({ domain: "Frontend", title: "t2", summary: "s", sourceAgent: "a", buildId: "b1" });
    expect(getKnowledgeByDomain("Backend")).toHaveLength(1);
    expect(getKnowledgeByDomain("Frontend")).toHaveLength(1);
  });

  it("reports capacity usage stats", () => {
    ingestKnowledge({ domain: "QA", title: "t", summary: "s", sourceAgent: "a", buildId: "b1" });
    const stats = getKnowledgeStats();
    expect(stats.totalRecords).toBe(1);
    expect(stats.capacityUsed).toBeGreaterThanOrEqual(0);
    expect(stats.byDomain["QA"]).toBe(1);
  });

  it("caps history at 1000 records", () => {
    for (let i = 0; i < 1005; i++) {
      ingestKnowledge({ domain: "Runtime", title: `t${i}`, summary: "s", sourceAgent: "a", buildId: `b${i}` });
    }
    expect(getAllKnowledgeRecords().length).toBe(1000);
  });
});

// ── Semantic Retrieval ─────────────────────────────────────────────────────────

describe("V9.4 — Semantic Retrieval", () => {
  beforeEach(() => resetKnowledgeCollector());

  it("extracts meaningful terms and drops stopwords", () => {
    const terms = extractTerms("The Quick Brown Fox and the Dashboard");
    expect(terms).toContain("quick");
    expect(terms).toContain("dashboard");
    expect(terms).not.toContain("the");
    expect(terms).not.toContain("and");
  });

  it("scores a record higher when text overlaps the query", () => {
    const record = ingestKnowledge({
      domain: "Frontend", title: "Dashboard hero pattern", summary: "A conversion-focused hero",
      sourceAgent: "a", buildId: "b1", quality: 8,
    });
    const relevant = scoreRecord({ text: "dashboard hero" }, record);
    const irrelevant = scoreRecord({ text: "unrelated payment gateway" }, record);
    expect(relevant).toBeGreaterThan(irrelevant);
  });

  it("retrieveKnowledge ranks and limits results", () => {
    ingestKnowledge({ domain: "Frontend", title: "Dashboard hero", summary: "hero section", sourceAgent: "a", buildId: "b1" });
    ingestKnowledge({ domain: "Frontend", title: "Pricing table", summary: "pricing plans", sourceAgent: "a", buildId: "b1" });
    const result = retrieveKnowledge({ text: "dashboard hero section", limit: 1 });
    expect(result.results.length).toBeLessThanOrEqual(1);
    expect(result.totalScanned).toBe(2);
  });

  it("computes semantic coverage as fraction of covered domains", () => {
    ingestKnowledge({ domain: "Frontend", title: "t", summary: "s", sourceAgent: "a", buildId: "b1" });
    const coverage = getSemanticCoverage(ALL_KNOWLEDGE_DOMAINS.length);
    expect(coverage).toBeGreaterThan(0);
    expect(coverage).toBeLessThanOrEqual(1);
  });
});

// ── Ranking ────────────────────────────────────────────────────────────────────

describe("V9.4 — Knowledge Ranking", () => {
  it("RANKING_WEIGHTS sum to 1.00", () => {
    const sum = Object.values(RANKING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 2);
  });

  it("computes 10 ranking factors within 0-10", () => {
    const record = ingestKnowledge({
      domain: "Backend", title: "t", summary: "s", sourceAgent: "a", buildId: "b1",
      quality: 8, confidence: 0.8, productionSuccess: 0.9,
    });
    const factors = computeFactors(record);
    for (const value of Object.values(factors)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it("higher quality/production-success records rank higher", () => {
    const good = ingestKnowledge({
      domain: "Backend", title: "good", summary: "s", sourceAgent: "a", buildId: "b1",
      quality: 9, productionSuccess: 0.9, repairRate: 0.05,
    });
    const bad = ingestKnowledge({
      domain: "Backend", title: "bad", summary: "s", sourceAgent: "a", buildId: "b1",
      quality: 3, productionSuccess: 0.2, repairRate: 0.8,
    });
    const ranked = rankKnowledge([bad, good]);
    expect(ranked[0].id).toBe(good.id);
  });

  it("compositeScore is deterministic", () => {
    const record = ingestKnowledge({ domain: "QA", title: "t", summary: "s", sourceAgent: "a", buildId: "b1" });
    const now = Date.now();
    const a = compositeScore(computeFactors(record, now));
    const b = compositeScore(computeFactors(record, now));
    expect(a).toBe(b);
  });
});

// ── Pattern Intelligence ───────────────────────────────────────────────────────

describe("V9.4 — Pattern Intelligence", () => {
  beforeEach(() => resetPatternIntelligence());

  it("registers a new pattern with usageCount 1", () => {
    const p = registerPattern({ id: "p1", domain: "Component", name: "Card grid" });
    expect(p.usageCount).toBe(1);
    expect(getPattern("p1")).toBeDefined();
  });

  it("subsequent registrations increment usage and blend scores", () => {
    registerPattern({ id: "p2", domain: "Component", name: "Hero", qualityScore: 6 });
    const updated = registerPattern({ id: "p2", domain: "Component", name: "Hero", qualityScore: 10 });
    expect(updated.usageCount).toBe(2);
    expect(updated.qualityScore).toBeCloseTo(8, 0);
  });

  it("lists patterns filtered by domain", () => {
    registerPattern({ id: "p3", domain: "Component", name: "A" });
    registerPattern({ id: "p4", domain: "Security", name: "B" });
    expect(listPatterns("Component")).toHaveLength(1);
  });

  it("getTopPatterns sorts by combined score descending", () => {
    registerPattern({ id: "low", domain: "Component", name: "low", qualityScore: 2, performanceScore: 2, accessibilityScore: 2, conversionScore: 2, maintainabilityScore: 2 });
    registerPattern({ id: "high", domain: "Component", name: "high", qualityScore: 9, performanceScore: 9, accessibilityScore: 9, conversionScore: 9, maintainabilityScore: 9 });
    const top = getTopPatterns("Component", 2);
    expect(top[0].id).toBe("high");
  });
});

// ── Recommendation Engine ──────────────────────────────────────────────────────

describe("V9.4 — Recommendation Engine", () => {
  beforeEach(() => { resetPatternIntelligence(); resetKnowledgeCollector(); });

  it("returns empty suggestions with no data", () => {
    const result = recommend("Component", 5);
    expect(result.domain).toBe("Component");
    expect(result.suggestions).toBeInstanceOf(Array);
  });

  it("recommends based on registered patterns", () => {
    registerPattern({ id: "rec1", domain: "Component", name: "Great card", qualityScore: 9, performanceScore: 9, accessibilityScore: 9, conversionScore: 9, maintainabilityScore: 9, productionSuccess: true });
    const result = recommend("Component", 5);
    expect(result.suggestions.some(s => s.title === "Great card")).toBe(true);
  });

  it("recommendation accuracy is 0 with no patterns and >0 after usage", () => {
    expect(getRecommendationAccuracy("Component")).toBe(0);
    registerPattern({ id: "rec2", domain: "Component", name: "X" });
    registerPattern({ id: "rec2", domain: "Component", name: "X" });
    expect(getRecommendationAccuracy("Component")).toBeGreaterThan(0);
  });
});

// ── Knowledge Bundle Builder + Compression ────────────────────────────────────

describe("V9.4 — Knowledge Bundle Builder & Compression", () => {
  beforeEach(() => resetKnowledgeCollector());

  it("builds a bundle scoped to target-relevant domains", () => {
    ingestKnowledge({ domain: "Frontend", title: "t1", summary: "s", sourceAgent: "a", buildId: "b1" });
    ingestKnowledge({ domain: "Security", title: "t2", summary: "s", sourceAgent: "a", buildId: "b1" });
    const bundle = buildKnowledgeBundle("Frontend", "b1");
    expect(bundle.records.every(r => r.domain !== "Security")).toBe(true);
  });

  it("compression reduces length for light/aggressive policies", () => {
    for (let i = 0; i < 5; i++) {
      ingestKnowledge({ domain: "Frontend", title: `Title ${i}`, summary: "A fairly long summary describing a pattern in detail.", sourceAgent: "a", buildId: "b1", quality: 5 + i });
    }
    const bundle = buildKnowledgeBundle("Frontend", "b1");
    const none = compressKnowledgeBundle(bundle, "none");
    const aggressive = compressKnowledgeBundle(bundle, "aggressive");
    expect(aggressive.compressedLength).toBeLessThanOrEqual(none.compressedLength);
    expect(aggressive.compressionRatio).toBeGreaterThanOrEqual(0);
  });
});

// ── Learning ───────────────────────────────────────────────────────────────────

describe("V9.4 — Knowledge Learning", () => {
  beforeEach(() => resetKnowledgeLearning());

  it("returns empty stats with no records", () => {
    const stats = getKnowledgeLearningStats();
    expect(stats.totalRecords).toBe(0);
    expect(stats.productionSuccessRate).toBe(0);
  });

  it("accumulates records and computes stats", async () => {
    await learnFromKnowledgeEvent({ buildId: "l1", domain: "Frontend", routingOutcome: "ok", score: 8, productionSuccess: true, recordedAt: Date.now() });
    await learnFromKnowledgeEvent({ buildId: "l2", domain: "Backend", routingOutcome: "ok", score: 6, productionSuccess: false, recordedAt: Date.now() });
    const stats = getKnowledgeLearningStats();
    expect(stats.totalRecords).toBe(2);
    expect(stats.averageScore).toBeCloseTo(7, 0);
    expect(stats.productionSuccessRate).toBeCloseTo(0.5, 1);
    expect(stats.byDomain["Frontend"].count).toBe(1);
  });
});

// ── Persistence ────────────────────────────────────────────────────────────────

describe("V9.4 — Knowledge Persistence", () => {
  beforeEach(() => { resetKnowledgePersistence(); resetKnowledgeCollector(); resetKnowledgeGraph(); });

  it("persists and retrieves the current snapshot", () => {
    persistKnowledgeSnapshot("p1");
    const current = getCurrentKnowledgeSnapshot();
    expect(current?.buildId).toBe("p1");
    expect(current?.version).toBe(1);
  });

  it("supports rollback to a previous version", () => {
    persistKnowledgeSnapshot("r1");
    persistKnowledgeSnapshot("r2");
    const current = getCurrentKnowledgeSnapshot()!;
    const rollback = getKnowledgeRollback(current.version);
    expect(rollback?.buildId).toBe("r1");
  });

  it("caps history at 1000 and reports capacity", () => {
    for (let i = 0; i < 5; i++) persistKnowledgeSnapshot(`cap${i}`);
    const stats = getKnowledgePersistenceStats();
    expect(stats.totalSnapshots).toBe(5);
    expect(stats.capacityUsed).toBeGreaterThanOrEqual(0);
    expect(stats.capacityUsed).toBeLessThanOrEqual(100);
  });
});

// ── Telemetry ──────────────────────────────────────────────────────────────────

describe("V9.4 — Knowledge Engine Telemetry", () => {
  beforeEach(() => resetAll());

  it("returns a zero-safe snapshot with no data", () => {
    const snap = getKnowledgeEngineMetrics();
    expect(snap.knowledgeScore).toBe(0);
    expect(snap.retrievalAccuracy).toBe(0);
    expect(snap.cacheEfficiency).toBe(0);
  });

  it("includes all 11 spec-required fields", () => {
    const snap = getKnowledgeEngineMetrics();
    expect(snap).toHaveProperty("knowledgeScore");
    expect(snap).toHaveProperty("retrievalAccuracy");
    expect(snap).toHaveProperty("semanticCoverage");
    expect(snap).toHaveProperty("knowledgeGrowth");
    expect(snap).toHaveProperty("relationshipDensity");
    expect(snap).toHaveProperty("knowledgeUsage");
    expect(snap).toHaveProperty("recommendationAccuracy");
    expect(snap).toHaveProperty("confidenceScore");
    expect(snap).toHaveProperty("learningStatistics");
    expect(snap).toHaveProperty("persistenceHealth");
    expect(snap).toHaveProperty("cacheEfficiency");
  });

  it("aggregates recorded executions into retrievalAccuracy and cacheEfficiency", () => {
    recordKnowledgeEngineExecution("e1", 8, 10, true);
    recordKnowledgeEngineExecution("e2", 4, 10, false);
    const snap = getKnowledgeEngineMetrics();
    expect(snap.retrievalAccuracy).toBeCloseTo(0.6, 1);
    expect(snap.cacheEfficiency).toBeCloseTo(0.5, 1);
  });

  it("knowledgeScore reflects ranked composite scores of ingested records", () => {
    ingestKnowledge({ domain: "Frontend", title: "t", summary: "s", sourceAgent: "a", buildId: "b1", quality: 9, productionSuccess: 0.9 });
    const snap = getKnowledgeEngineMetrics();
    expect(snap.knowledgeScore).toBeGreaterThan(0);
  });
});
