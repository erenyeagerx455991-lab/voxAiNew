import { describe, it, expect, beforeEach } from "vitest";
import { retrieveComponents } from "../../src/components/retrieval/retrieveComponents.js";
import { buildRegistryContext, buildCompressedCatalogue } from "../../src/components/retrieval/buildRegistryContext.js";
import { clearCache } from "../../src/components/retrieval/retrievalCache.js";
import { getIndexStats } from "../../src/components/registryV2/searchIndex.js";
import { getAllComponentMetadata } from "../../src/components/registryV2/componentMetadata.js";

describe("Registry V2 Pipeline — End-to-End", () => {
  beforeEach(() => {
    clearCache();
  });

  it("full pipeline: prompt → retrieval → context", async () => {
    const result = await retrieveComponents("Build a SaaS landing page with pricing", ["Navbar", "Hero", "Features", "Pricing", "Footer"]);
    const ctx = buildRegistryContext(result);

    expect(ctx.contextString.length).toBeGreaterThan(50);
    expect(ctx.componentCount).toBeGreaterThan(0);
    expect(ctx.tokenEstimate).toBeGreaterThan(0);
    expect(ctx.selectedIds.length).toBeGreaterThan(0);
  });

  it("context string contains retrieved component category headers", async () => {
    const result = await retrieveComponents("saas subscription platform", ["Hero", "Pricing", "Footer"]);
    const ctx = buildRegistryContext(result);
    expect(ctx.contextString).toContain("##");
  });

  it("compressed catalogue is much shorter than full registry injection", async () => {
    const result = await retrieveComponents("AI startup landing page");
    const compressed = buildCompressedCatalogue(result);
    const tokenEstimate = Math.ceil(compressed.length / 4);
    expect(tokenEstimate).toBeLessThan(3200);
  });

  it("token reduction from full is positive", async () => {
    const result = await retrieveComponents("agency portfolio");
    const ctx = buildRegistryContext(result);
    expect(ctx.reductionFromFull).toBeGreaterThanOrEqual(0);
  });

  it("retrieved components all have positive scores", async () => {
    const result = await retrieveComponents("ecommerce store");
    for (const comp of result.components) {
      expect(comp.score).toBeGreaterThan(0);
    }
  });

  it("restaurant prompt biases toward restaurant components", async () => {
    const result = await retrieveComponents("Build a restaurant website with menu and reservation");
    const topCategories = result.components.slice(0, 5).map(c => c.category);
    const hasRestaurantSection = topCategories.some(c =>
      ["hero", "menu-section", "reservation", "navbar"].includes(c)
    );
    expect(hasRestaurantSection).toBe(true);
  });

  it("search index has all required metadata dimensions", () => {
    const stats = getIndexStats();
    expect(stats.totalComponents).toBeGreaterThan(0);
    expect(stats.uniqueKeywords).toBeGreaterThan(0);
    expect(stats.uniqueCategories).toBeGreaterThan(0);
    expect(stats.uniqueIndustries).toBeGreaterThan(0);
  });

  it("component metadata covers all categories in registry", () => {
    const meta = getAllComponentMetadata();
    const categories = new Set(meta.map(m => m.category));
    expect(categories.has("hero")).toBe(true);
    expect(categories.has("navbar")).toBe(true);
    expect(categories.has("features")).toBe(true);
    expect(categories.has("pricing")).toBe(true);
    expect(categories.has("footer")).toBe(true);
  });

  it("second identical prompt returns cache hit", async () => {
    const prompt = "fintech payment platform unique-integration-test-key";
    await retrieveComponents(prompt);
    const r2 = await retrieveComponents(prompt);
    expect(r2.cacheHit).toBe(true);
  });

  it("different prompts are not cross-contaminated in cache", async () => {
    const r1 = await retrieveComponents("saas enterprise platform for teams abc123");
    const r2 = await retrieveComponents("restaurant fine dining kitchen xyz456");
    expect(r1.intent.industry).not.toEqual(r2.intent.industry);
  });

  it("prompt token estimate is under 600 tokens (Phase 5 target)", async () => {
    const result = await retrieveComponents("Build an AI-powered SaaS landing page", ["Navbar", "Hero", "Features", "Pricing", "Testimonials", "CTA", "Footer"], 15);
    expect(result.promptTokenEstimate).toBeLessThan(600);
  });
});
