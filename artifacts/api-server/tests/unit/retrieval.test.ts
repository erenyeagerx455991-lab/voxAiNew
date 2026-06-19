import { describe, it, expect } from "vitest";
import { parseIntent } from "../../src/components/retrieval/intentParser.js";
import { retrieveComponents } from "../../src/components/retrieval/retrieveComponents.js";

describe("Retrieval Engine — Intent Parsing", () => {
  it("detects saas industry from prompt", () => {
    const intent = parseIntent("Build a SaaS landing page for my platform");
    expect(intent.industry).toContain("saas");
  });

  it("detects restaurant industry from prompt", () => {
    const intent = parseIntent("Create a website for my restaurant and cafe");
    expect(intent.industry).toContain("restaurant");
  });

  it("detects ai industry from prompt", () => {
    const intent = parseIntent("Build an AI chatbot landing page with LLM features");
    expect(intent.industry).toContain("ai");
  });

  it("falls back to generic when no industry matched", () => {
    const intent = parseIntent("Build me something");
    expect(intent.industry).toContain("generic");
  });

  it("detects minimal style from prompt", () => {
    const intent = parseIntent("minimal and clean portfolio website");
    expect(intent.style).toContain("minimal");
  });

  it("detects signup conversion goal", () => {
    const intent = parseIntent("Get users to sign up for a free trial");
    expect(intent.conversionGoal).toContain("signup");
  });

  it("detects purchase conversion goal", () => {
    const intent = parseIntent("ecommerce store with buy and checkout");
    expect(intent.conversionGoal).toContain("purchase");
  });

  it("infers sections from sectionOrder", () => {
    const intent = parseIntent("saas app", ["Navbar", "Hero", "Features", "Pricing", "Footer"]);
    expect(intent.sections).toContain("navbar");
    expect(intent.sections).toContain("hero");
    expect(intent.sections).toContain("features");
  });

  it("extracts keywords from prompt", () => {
    const intent = parseIntent("Build an analytics dashboard for startup founders");
    expect(intent.keywords.length).toBeGreaterThan(0);
    expect(intent.keywords).toContain("analytics");
  });

  it("deduplicates sections", () => {
    const intent = parseIntent("saas", ["Hero", "Hero", "Features"]);
    const heroCount = intent.sections.filter(s => s === "hero").length;
    expect(heroCount).toBe(1);
  });
});

describe("Retrieval Engine — Top-K Retrieval", () => {
  it("returns at most topK components", async () => {
    const result = await retrieveComponents("saas landing page", undefined, 10);
    expect(result.components.length).toBeLessThanOrEqual(10);
  });

  it("returns components object with required fields", async () => {
    const result = await retrieveComponents("restaurant website with menu");
    expect(result).toHaveProperty("components");
    expect(result).toHaveProperty("intent");
    expect(result).toHaveProperty("retrievalMs");
    expect(result).toHaveProperty("cacheHit");
    expect(result).toHaveProperty("promptTokenEstimate");
  });

  it("components have required shape", async () => {
    const result = await retrieveComponents("Build an AI SaaS app");
    expect(result.components.length).toBeGreaterThan(0);
    const comp = result.components[0];
    expect(comp).toHaveProperty("id");
    expect(comp).toHaveProperty("score");
    expect(comp).toHaveProperty("category");
    expect(comp).toHaveProperty("description");
    expect(comp).toHaveProperty("name");
    expect(comp).toHaveProperty("matchReasons");
  });

  it("second call for same prompt is a cache hit", async () => {
    const prompt = "fintech platform for payments unique-key-xyz";
    await retrieveComponents(prompt);
    const result2 = await retrieveComponents(prompt);
    expect(result2.cacheHit).toBe(true);
  });

  it("prompt token estimate is positive", async () => {
    const result = await retrieveComponents("Build a portfolio website");
    expect(result.promptTokenEstimate).toBeGreaterThan(0);
  });

  it("retrieves fewer tokens than full registry (3200)", async () => {
    const result = await retrieveComponents("Build an agency landing page", ["Navbar", "Hero", "Features", "CTA", "Footer"], 15);
    expect(result.promptTokenEstimate).toBeLessThan(3200);
  });

  it("components are sorted by score descending", async () => {
    const result = await retrieveComponents("saas subscription platform");
    const scores = result.components.map(c => c.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});
