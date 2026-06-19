import { describe, it, expect } from "vitest";
import { scoreComponent, rankComponents } from "../../src/components/retrieval/scoreComponents.js";
import { getAllComponentMetadata } from "../../src/components/registryV2/componentMetadata.js";
import type { ComponentMetadataV2, RetrievalIntent } from "../../src/components/registryV2/registryTypes.js";

const makeIntent = (overrides: Partial<RetrievalIntent> = {}): RetrievalIntent => ({
  industry: ["saas"],
  style: ["modern"],
  pageType: "saas",
  keywords: ["startup", "platform"],
  sections: ["hero", "features", "pricing"],
  conversionGoal: ["signup"],
  ...overrides,
});

const makeMeta = (overrides: Partial<ComponentMetadataV2> = {}): ComponentMetadataV2 => ({
  id: "test-comp-01",
  name: "Test Component",
  category: "hero",
  tags: ["dark", "gradient"],
  industry: ["saas"],
  style: ["modern"],
  complexity: "medium",
  conversionGoal: ["signup"],
  keywords: ["hero", "gradient"],
  description: "A test hero component",
  priority: 8,
  ...overrides,
});

describe("Component Scoring Formula", () => {
  it("industry match increases score", () => {
    const matched = scoreComponent(makeMeta({ industry: ["saas"] }), makeIntent({ industry: ["saas"] }));
    const unmatched = scoreComponent(makeMeta({ industry: ["restaurant"] }), makeIntent({ industry: ["saas"] }));
    expect(matched.score).toBeGreaterThan(unmatched.score);
  });

  it("style match increases score", () => {
    const matched = scoreComponent(makeMeta({ style: ["modern"] }), makeIntent({ style: ["modern"] }));
    const unmatched = scoreComponent(makeMeta({ style: ["brutalist"] }), makeIntent({ style: ["modern"] }));
    expect(matched.score).toBeGreaterThan(unmatched.score);
  });

  it("section match increases score", () => {
    const inSection = scoreComponent(makeMeta({ category: "hero" }), makeIntent({ sections: ["hero"] }));
    const notInSection = scoreComponent(makeMeta({ category: "gallery" }), makeIntent({ sections: ["hero"] }));
    expect(inSection.score).toBeGreaterThan(notInSection.score);
  });

  it("conversion goal match increases score", () => {
    const matched = scoreComponent(makeMeta({ conversionGoal: ["signup"] }), makeIntent({ conversionGoal: ["signup"] }));
    const unmatched = scoreComponent(makeMeta({ conversionGoal: ["download"] }), makeIntent({ conversionGoal: ["signup"] }));
    expect(matched.score).toBeGreaterThan(unmatched.score);
  });

  it("keyword hits increase score", () => {
    const withHits = scoreComponent(makeMeta(), makeIntent(), 5);
    const noHits   = scoreComponent(makeMeta(), makeIntent(), 0);
    expect(withHits.score).toBeGreaterThan(noHits.score);
  });

  it("higher priority component scores higher (all else equal)", () => {
    const high = scoreComponent(makeMeta({ priority: 10, industry: ["generic"] }), makeIntent({ industry: ["generic"] }));
    const low  = scoreComponent(makeMeta({ priority: 1,  industry: ["generic"] }), makeIntent({ industry: ["generic"] }));
    expect(high.score).toBeGreaterThan(low.score);
  });

  it("matchReasons is non-empty when something matches", () => {
    const result = scoreComponent(makeMeta(), makeIntent());
    expect(result.matchReasons.length).toBeGreaterThan(0);
  });

  it("scored component has all required fields", () => {
    const result = scoreComponent(makeMeta(), makeIntent());
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("matchReasons");
  });

  it("rankComponents returns sorted descending", () => {
    const metas = getAllComponentMetadata().slice(0, 20);
    const intent = makeIntent({ industry: ["saas"], sections: ["hero", "features"] });
    const ranked = rankComponents(metas, intent, new Map());
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].score).toBeLessThanOrEqual(ranked[i - 1].score);
    }
  });

  it("rankComponents returns all components passed in", () => {
    const metas = getAllComponentMetadata().slice(0, 5);
    const ranked = rankComponents(metas, makeIntent(), new Map());
    expect(ranked.length).toBe(5);
  });
});
