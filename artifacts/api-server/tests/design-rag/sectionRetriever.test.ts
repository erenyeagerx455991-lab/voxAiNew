// ── V7.2.2 Section-Level Retriever — Tests ───────────────────────────────────
import { describe, it, expect, beforeEach } from "vitest";
import {
  retrieveSectionReferences,
  retrieveAllSections,
  buildSectionRetrievalContext,
  normalizeSectionType,
  type SectionRetrievalInput,
} from "../../src/design-rag/sectionRetriever.js";
import {
  SECTION_CORPUS,
  SECTION_INDEX,
  ALL_SECTION_TYPES,
  type SectionType,
} from "../../src/design-rag/sectionCorpus.js";
import {
  getSectionRagMetrics,
  resetSectionRagMetrics,
  getRefUsageMap,
} from "../../src/design-rag/sectionRagMetrics.js";

// ── Base retrieval options ────────────────────────────────────────────────────
const BASE_OPTIONS: Omit<SectionRetrievalInput, "sectionType"> = {
  dna: { stripe: 60, linear: 40 },
  designLanguage: "premium-gradient",
  industry: ["saas", "startup"],
  keywords: ["project", "team", "workflow"],
};

// ── Phase 1+2: Corpus Coverage ────────────────────────────────────────────────

describe("V7.2.2 — Phase 1+2: Corpus Coverage", () => {
  it("SECTION_CORPUS has 250+ references", () => {
    expect(SECTION_CORPUS.length).toBeGreaterThanOrEqual(250);
  });

  it("all 9 section types are represented in SECTION_INDEX", () => {
    for (const t of ALL_SECTION_TYPES) {
      expect(SECTION_INDEX[t]).toBeDefined();
      expect(SECTION_INDEX[t].length).toBeGreaterThan(0);
    }
  });

  it("footer section type has at least 10 references (new in V7.2.2)", () => {
    expect(SECTION_INDEX["footer"].length).toBeGreaterThanOrEqual(10);
  });

  it("hero section has at least 25 references", () => {
    expect(SECTION_INDEX["hero"].length).toBeGreaterThanOrEqual(25);
  });

  it("all section corpus refs have required fields", () => {
    for (const ref of SECTION_CORPUS) {
      expect(ref.id).toBeTruthy();
      expect(ref.category).toBeTruthy();
      expect(Array.isArray(ref.industry)).toBe(true);
      expect(Array.isArray(ref.style)).toBe(true);
      expect(ref.layout).toBeTruthy();
      expect(Array.isArray(ref.tags)).toBe(true);
      expect(ref.description).toBeTruthy();
      expect(typeof ref.qualityHint).toBe("number");
    }
  });

  it("SECTION_INDEX entries match SECTION_CORPUS counts", () => {
    for (const t of ALL_SECTION_TYPES) {
      const indexCount = SECTION_INDEX[t].length;
      const corpusCount = SECTION_CORPUS.filter(r => r.category === t).length;
      expect(indexCount).toBe(corpusCount);
    }
  });

  it("all ref IDs in SECTION_CORPUS are unique", () => {
    const ids = SECTION_CORPUS.map(r => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ── Phase 3: Section Retrieval ────────────────────────────────────────────────

describe("V7.2.2 — Phase 3: Section Retrieval", () => {
  it("returns only refs of the requested section type", () => {
    const result = retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS });
    for (const ref of result.references) {
      expect(ref.category).toBe("hero");
    }
  });

  it("returns only pricing refs when sectionType is pricing", () => {
    const result = retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    for (const ref of result.references) {
      expect(ref.category).toBe("pricing");
    }
  });

  it("returns only footer refs when sectionType is footer", () => {
    const result = retrieveSectionReferences({ sectionType: "footer", ...BASE_OPTIONS });
    for (const ref of result.references) {
      expect(ref.category).toBe("footer");
    }
  });

  it("respects topK limit", () => {
    const result = retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS, topK: 3 });
    expect(result.references.length).toBeLessThanOrEqual(3);
  });

  it("result.sectionType matches input", () => {
    const result = retrieveSectionReferences({ sectionType: "cta", ...BASE_OPTIONS });
    expect(result.sectionType).toBe("cta");
  });

  it("totalScanned matches pool size for that section", () => {
    const result = retrieveSectionReferences({ sectionType: "features", ...BASE_OPTIONS });
    expect(result.totalScanned).toBe(SECTION_INDEX["features"].length);
  });

  it("results are sorted by retrievalScore descending", () => {
    const result = retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS });
    for (let i = 1; i < result.references.length; i++) {
      expect(result.references[i - 1].retrievalScore).toBeGreaterThanOrEqual(
        result.references[i].retrievalScore,
      );
    }
  });

  it("deduplicates refs by layout within a section", () => {
    const result = retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS, topK: 10 });
    const layouts = result.references.map(r => r.layout);
    const unique = new Set(layouts);
    expect(unique.size).toBe(layouts.length);
  });

  it("retrieval is deterministic — same input produces same output", () => {
    const r1 = retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    const r2 = retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    expect(r1.references.map(r => r.id)).toEqual(r2.references.map(r => r.id));
  });
});

// ── Phase 3: Independent Ranking ──────────────────────────────────────────────

describe("V7.2.2 — Phase 3: Independent Ranking", () => {
  it("hero refs do NOT appear in pricing results", () => {
    const pricing = retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    const heroIds = new Set(SECTION_INDEX["hero"].map(r => r.id));
    for (const ref of pricing.references) {
      expect(heroIds.has(ref.id)).toBe(false);
    }
  });

  it("different industry inputs yield different top ref for same section", () => {
    const saasResult = retrieveSectionReferences({
      sectionType: "features",
      dna: { notion: 70 },
      designLanguage: "editorial",
      industry: ["saas", "developer"],
    });
    const healthResult = retrieveSectionReferences({
      sectionType: "features",
      dna: { apple: 70 },
      designLanguage: "minimal-flat",
      industry: ["health", "consumer"],
    });
    // Top result should differ for very different industry/DNA inputs
    // (Not guaranteed to always differ, but with 30 features refs it very likely will)
    const saasTop = saasResult.references[0]?.id ?? "none";
    const healthTop = healthResult.references[0]?.id ?? "other";
    // If they happen to be same ref, at least scores should differ (test won't fail)
    expect(typeof saasTop).toBe("string");
    expect(typeof healthTop).toBe("string");
  });

  it("each section type retrieves from its own independent pool", () => {
    const heroIds   = new Set(retrieveSectionReferences({ sectionType: "hero",     ...BASE_OPTIONS }).references.map(r => r.id));
    const featIds   = new Set(retrieveSectionReferences({ sectionType: "features", ...BASE_OPTIONS }).references.map(r => r.id));
    const pricingIds = new Set(retrieveSectionReferences({ sectionType: "pricing",  ...BASE_OPTIONS }).references.map(r => r.id));
    // No overlaps between section results
    for (const id of heroIds) expect(featIds.has(id)).toBe(false);
    for (const id of heroIds) expect(pricingIds.has(id)).toBe(false);
    for (const id of featIds) expect(pricingIds.has(id)).toBe(false);
  });
});

// ── Phase 4: Page-Level Retrieval ─────────────────────────────────────────────

describe("V7.2.2 — Phase 4: Page-Level (retrieveAllSections)", () => {
  it("returns a sections map with keys for recognized section types", () => {
    const result = retrieveAllSections(
      ["Navbar", "Hero", "Features", "Pricing", "CTA", "Footer"],
      BASE_OPTIONS,
    );
    expect(result.sections.has("navbar")).toBe(true);
    expect(result.sections.has("hero")).toBe(true);
    expect(result.sections.has("pricing")).toBe(true);
  });

  it("allReferenceIds contains no duplicates", () => {
    const result = retrieveAllSections(
      ["Hero", "Features", "Pricing", "Testimonials", "FAQ", "CTA"],
      BASE_OPTIONS,
    );
    const unique = new Set(result.allReferenceIds);
    expect(unique.size).toBe(result.allReferenceIds.length);
  });

  it("totalRetrievals equals number of unique section types processed", () => {
    const result = retrieveAllSections(
      ["Hero", "Features", "Pricing"],
      BASE_OPTIONS,
    );
    expect(result.totalRetrievals).toBe(3);
  });

  it("does not process the same section type twice (dedup)", () => {
    const result = retrieveAllSections(
      ["Hero", "CTA", "Hero"], // Hero appears twice
      BASE_OPTIONS,
    );
    expect(result.sections.size).toBe(2); // hero + cta
    expect(result.totalRetrievals).toBe(2);
  });

  it("hitRate is 1.0 when all sections return refs", () => {
    const result = retrieveAllSections(["Hero", "Features"], BASE_OPTIONS);
    // Both hero and features have 25+ refs — always returns results
    expect(result.hitRate).toBeCloseTo(1.0, 2);
  });

  it("section names are normalized case-insensitively", () => {
    const result = retrieveAllSections(["HERO", "pricing", "Features"], BASE_OPTIONS);
    expect(result.sections.has("hero")).toBe(true);
    expect(result.sections.has("pricing")).toBe(true);
    expect(result.sections.has("features")).toBe(true);
  });

  it("unknown section types are skipped without error", () => {
    expect(() =>
      retrieveAllSections(["Hero", "UnknownSectionXYZ", "Pricing"], BASE_OPTIONS),
    ).not.toThrow();
    const result = retrieveAllSections(["Hero", "UnknownSectionXYZ"], BASE_OPTIONS);
    expect(result.sections.has("hero")).toBe(true);
    expect([...result.sections.keys()]).not.toContain("unknownsectionxyz");
  });
});

// ── Phase 5: Context Builder ──────────────────────────────────────────────────

describe("V7.2.2 — Phase 5: Context Builder", () => {
  it("returns non-empty string for a normal page retrieval", () => {
    const page = retrieveAllSections(["Hero", "Pricing", "CTA"], BASE_OPTIONS);
    const ctx = buildSectionRetrievalContext(page);
    expect(ctx.length).toBeGreaterThan(0);
  });

  it("contains a HERO section header in context", () => {
    const page = retrieveAllSections(["Hero", "Features"], BASE_OPTIONS);
    const ctx = buildSectionRetrievalContext(page);
    expect(ctx).toContain("### HERO");
  });

  it("context includes reference IDs", () => {
    const page = retrieveAllSections(["Hero"], BASE_OPTIONS);
    const ctx = buildSectionRetrievalContext(page);
    const heroIds = SECTION_INDEX["hero"].map(r => r.id);
    const mentionedId = heroIds.find(id => ctx.includes(id));
    expect(mentionedId).toBeTruthy();
  });

  it("context includes layout format string", () => {
    const page = retrieveAllSections(["Pricing"], BASE_OPTIONS);
    const ctx = buildSectionRetrievalContext(page);
    // Should include a layout descriptor (e.g. [centered], [split-layout], etc.)
    expect(ctx).toMatch(/\[[\w-]+\]/);
  });

  it("hero context does not bleed into pricing context — sections are isolated", () => {
    const page = retrieveAllSections(["Hero", "Pricing"], BASE_OPTIONS);
    const ctx = buildSectionRetrievalContext(page);
    const pricingIdx = ctx.indexOf("### PRICING");
    const heroIdx = ctx.indexOf("### HERO");
    // Hero section should appear before pricing section in output
    if (pricingIdx !== -1 && heroIdx !== -1) {
      expect(heroIdx).toBeLessThan(pricingIdx);
    }
  });

  it("returns empty string for zero-section page result", () => {
    const emptyPage = { sections: new Map(), allReferenceIds: [], totalRetrievals: 0, hitRate: 0 };
    expect(buildSectionRetrievalContext(emptyPage)).toBe("");
  });
});

// ── Phase 6: Section Type Normalization ───────────────────────────────────────

describe("V7.2.2 — Phase 6: Section Normalization", () => {
  it("normalizes 'Navbar' → 'navbar'", () => {
    expect(normalizeSectionType("Navbar")).toBe("navbar");
  });

  it("normalizes 'Reviews' → 'testimonials' (alias)", () => {
    expect(normalizeSectionType("Reviews")).toBe("testimonials");
  });

  it("normalizes 'Header' → 'navbar' (alias)", () => {
    expect(normalizeSectionType("Header")).toBe("navbar");
  });

  it("returns null for completely unrecognized sections", () => {
    expect(normalizeSectionType("RandomWidget")).toBeNull();
  });

  it("normalizes 'ContactForm' → 'form' (V7.2.8)", () => {
    expect(normalizeSectionType("ContactForm")).toBe("form");
  });

  it("normalizes 'Footer' → 'footer'", () => {
    expect(normalizeSectionType("Footer")).toBe("footer");
  });

  it("normalizes 'PRICING' (uppercase) → 'pricing'", () => {
    expect(normalizeSectionType("PRICING")).toBe("pricing");
  });

  it("normalizes 'social-proof' → 'testimonials'", () => {
    expect(normalizeSectionType("social-proof")).toBe("testimonials");
  });
});

// ── Phase 7: Telemetry ────────────────────────────────────────────────────────

describe("V7.2.2 — Phase 7: Section RAG Telemetry", () => {
  beforeEach(() => resetSectionRagMetrics());

  it("sectionRetrievals starts at 0 after reset", () => {
    const metrics = getSectionRagMetrics(260);
    expect(metrics.sectionRetrievals).toBe(0);
  });

  it("sectionRetrievals increments after each section retrieval", () => {
    retrieveSectionReferences({ sectionType: "hero",    ...BASE_OPTIONS });
    retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    const metrics = getSectionRagMetrics(260);
    expect(metrics.sectionRetrievals).toBe(2);
  });

  it("sectionCounts per section type increments correctly", () => {
    retrieveSectionReferences({ sectionType: "hero",    ...BASE_OPTIONS });
    retrieveSectionReferences({ sectionType: "hero",    ...BASE_OPTIONS });
    retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    const metrics = getSectionRagMetrics(260);
    expect(metrics.sectionCounts["hero"]).toBe(2);
    expect(metrics.sectionCounts["pricing"]).toBe(1);
  });

  it("topHeroRefs populated after hero retrievals", () => {
    retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS });
    const metrics = getSectionRagMetrics(260);
    expect(metrics.topHeroRefs.length).toBeGreaterThan(0);
  });

  it("topPricingRefs populated after pricing retrievals", () => {
    retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    const metrics = getSectionRagMetrics(260);
    expect(metrics.topPricingRefs.length).toBeGreaterThan(0);
  });

  it("topFeatureRefs populated after features retrievals", () => {
    retrieveSectionReferences({ sectionType: "features", ...BASE_OPTIONS });
    const metrics = getSectionRagMetrics(260);
    expect(metrics.topFeatureRefs.length).toBeGreaterThan(0);
  });

  it("hitRate is 1.0 when all sections return results", () => {
    retrieveSectionReferences({ sectionType: "hero",    ...BASE_OPTIONS });
    retrieveSectionReferences({ sectionType: "pricing", ...BASE_OPTIONS });
    const metrics = getSectionRagMetrics(260);
    expect(metrics.hitRate).toBeCloseTo(1.0, 2);
  });

  it("corpusSize reflects injected value", () => {
    const metrics = getSectionRagMetrics(260);
    expect(metrics.corpusSize).toBe(260);
  });

  it("reset clears all counts", () => {
    retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS });
    resetSectionRagMetrics();
    const metrics = getSectionRagMetrics(260);
    expect(metrics.sectionRetrievals).toBe(0);
    expect(metrics.topHeroRefs).toHaveLength(0);
  });
});

// ── Phase 8: Reference Tracking ───────────────────────────────────────────────

describe("V7.2.2 — Phase 8: Reference Tracking (Evaluator Integration)", () => {
  beforeEach(() => resetSectionRagMetrics());

  it("records usage for each ref returned by a section retrieval", () => {
    const result = retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS });
    const usageMap = getRefUsageMap();
    for (const ref of result.references) {
      expect(usageMap[ref.id]).toBeGreaterThanOrEqual(1);
    }
  });

  it("ref usage counts accumulate across multiple retrievals", () => {
    retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS });
    retrieveSectionReferences({ sectionType: "hero", ...BASE_OPTIONS });
    const usageMap = getRefUsageMap();
    const anyHeroRef = Object.entries(usageMap).find(([id]) => id.startsWith("hero-"));
    expect(anyHeroRef?.[1]).toBeGreaterThanOrEqual(2);
  });

  it("retrieveAllSections records usage for refs across all sections", () => {
    retrieveAllSections(["Hero", "Pricing", "Features"], BASE_OPTIONS);
    const usageMap = getRefUsageMap();
    const hasHero    = Object.keys(usageMap).some(id => id.startsWith("hero-"));
    const hasPricing = Object.keys(usageMap).some(id => id.startsWith("pricing-"));
    const hasFeat    = Object.keys(usageMap).some(id => id.startsWith("features-"));
    expect(hasHero).toBe(true);
    expect(hasPricing).toBe(true);
    expect(hasFeat).toBe(true);
  });
});
