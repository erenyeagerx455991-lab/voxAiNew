import { describe, it, expect, beforeEach } from "vitest";
import {
  retrieveDesignReferences,
  buildRetrievalContext,
  extractRetrievalIntent,
  type RetrievalInput,
} from "../../src/design-rag/retriever.js";
import { resetComponentMetrics } from "../../src/quality/componentMetrics.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function baseInput(overrides: Partial<RetrievalInput> = {}): RetrievalInput {
  return {
    industry: ['saas', 'startup'],
    style: 'linear',
    keywords: ['analytics', 'dashboard', 'team'],
    categories: ['hero', 'features', 'pricing', 'cta'],
    dnaComposition: { linear: 70, stripe: 30 },
    ...overrides,
  };
}

describe("V7.1.8 Design RAG — Planner Integration", () => {
  beforeEach(() => {
    resetComponentMetrics();
  });

  // ── Context generation ────────────────────────────────────────────────────

  describe("buildRetrievalContext", () => {
    it("returns empty string when no references provided", () => {
      const emptyResult = { references: [], totalScanned: 0, topStyle: null, topCategories: [], averageQuality: 0 };
      expect(buildRetrievalContext(emptyResult)).toBe('');
    });

    it("returns non-empty context when references are present", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      expect(ctx.length).toBeGreaterThan(50);
    });

    it("context contains RETRIEVED DESIGN REFERENCES header", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      expect(ctx).toContain('RETRIEVED DESIGN REFERENCES');
    });

    it("context contains reference IDs", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      for (const ref of result.references) {
        expect(ctx).toContain(ref.id);
      }
    });

    it("context contains category labels in uppercase", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      for (const ref of result.references) {
        expect(ctx).toContain(ref.category.toUpperCase());
      }
    });

    it("context contains layout information", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      for (const ref of result.references) {
        expect(ctx).toContain(ref.layout);
      }
    });

    it("context contains pattern descriptions", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      // At least one description keyword should appear
      const hasDescription = result.references.some(r =>
        ctx.includes(r.description.slice(0, 20))
      );
      expect(hasDescription).toBe(true);
    });

    it("context ends with a guidance instruction", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      expect(ctx).toContain('Apply these patterns');
    });
  });

  // ── Reference bounds ──────────────────────────────────────────────────────

  describe("Reference bounds", () => {
    it("planner receives at most 5 references", () => {
      const result = retrieveDesignReferences(baseInput());
      expect(result.references.length).toBeLessThanOrEqual(5);
    });

    it("planner receives references for multiple categories when available", () => {
      const result = retrieveDesignReferences(baseInput({
        categories: ['hero', 'features', 'pricing', 'cta', 'navbar'],
        keywords: ['hero', 'pricing', 'features', 'cta', 'navbar'],
      }));
      const cats = new Set(result.references.map(r => r.category));
      expect(cats.size).toBeGreaterThanOrEqual(2);
    });

    it("references do not include duplicate (category, layout) pairs", () => {
      const result = retrieveDesignReferences(baseInput());
      const seen = new Set<string>();
      for (const ref of result.references) {
        const key = `${ref.category}:${ref.layout}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });

  // ── Planner prompt content ────────────────────────────────────────────────

  describe("Planner prompt contents", () => {
    it("generated context does not instruct to copy content verbatim", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      // The context should explicitly say NOT to copy content
      expect(ctx.toLowerCase()).toContain('do not copy');
    });

    it("context marks patterns as inspiration only", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      expect(ctx.toLowerCase()).toMatch(/inspiration|structural|pattern/);
    });

    it("context is bounded in size (< 5000 chars for prompt budget)", () => {
      const result = retrieveDesignReferences(baseInput());
      const ctx = buildRetrievalContext(result);
      expect(ctx.length).toBeLessThan(5000);
    });
  });

  // ── DNA-awareness ─────────────────────────────────────────────────────────

  describe("DNA-aware retrieval", () => {
    it("linear DNA biases toward linear-style references", () => {
      const result = retrieveDesignReferences(baseInput({
        style: 'linear',
        dnaComposition: { linear: 100 },
        keywords: ['minimal', 'clean', 'dark'],
      }));
      const topRef = result.references[0];
      expect(topRef.style).toContain('linear');
    });

    it("stripe DNA biases toward stripe-style references", () => {
      const result = retrieveDesignReferences(baseInput({
        style: 'stripe',
        dnaComposition: { stripe: 100 },
        keywords: ['gradient', 'premium', 'pricing'],
        industry: ['enterprise', 'fintech'],
      }));
      const hasStripe = result.references.some(r => r.style.includes('stripe'));
      expect(hasStripe).toBe(true);
    });

    it("framer DNA biases toward animated references", () => {
      const result = retrieveDesignReferences(baseInput({
        style: 'framer',
        dnaComposition: { framer: 90, linear: 10 },
        keywords: ['animated', 'motion', 'bento'],
      }));
      const hasFramer = result.references.some(r => r.style.includes('framer'));
      expect(hasFramer).toBe(true);
    });
  });

  // ── Intent extraction → retrieval pipeline ────────────────────────────────

  describe("Full intent → retrieval pipeline", () => {
    it("extractRetrievalIntent + retrieve returns results", () => {
      const intent = extractRetrievalIntent(
        'Build a SaaS product analytics platform for developer teams',
        ['hero', 'features', 'dashboard', 'pricing', 'cta'],
        'minimal-flat',
        { linear: 60, vercel: 40 }
      );
      const result = retrieveDesignReferences(intent);
      expect(result.references.length).toBeGreaterThan(0);
    });

    it("full pipeline produces non-empty context", () => {
      const intent = extractRetrievalIntent(
        'AI writing assistant with real-time collaboration',
        ['hero', 'features', 'testimonials', 'pricing'],
        'bold-motion',
        { framer: 70, linear: 30 }
      );
      const result = retrieveDesignReferences(intent);
      const ctx = buildRetrievalContext(result);
      expect(ctx).toContain('RETRIEVED DESIGN REFERENCES');
      expect(result.references.length).toBeGreaterThanOrEqual(1);
    });

    it("health product intent retrieves health-relevant references", () => {
      const intent = extractRetrievalIntent(
        'Mental health and wellness tracking app for individuals',
        ['hero', 'features', 'cta'],
        'premium-light',
        { notion: 50, apple: 50 }
      );
      const result = retrieveDesignReferences(intent);
      const hasHealthRef = result.references.some(r => r.industry.includes('health'));
      expect(hasHealthRef).toBe(true);
    });
  });
});
