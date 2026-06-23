import { describe, it, expect, beforeEach } from "vitest";
import {
  retrieveDesignReferences,
  buildRetrievalContext,
  extractRetrievalIntent,
  detectIndustries,
  extractKeywords,
  dnaLangToStyle,
  type RetrievalInput,
} from "../../src/design-rag/retriever.js";
import { DESIGN_CORPUS, getCategoryCount } from "../../src/design-rag/designCorpus.js";
import { resetComponentMetrics } from "../../src/quality/componentMetrics.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<RetrievalInput> = {}): RetrievalInput {
  return {
    industry: ['saas'],
    style: 'linear',
    keywords: ['dashboard', 'analytics', 'metrics'],
    categories: ['hero', 'features', 'pricing'],
    dnaComposition: { linear: 60, stripe: 40 },
    ...overrides,
  };
}

describe("V7.1.8 Design RAG — Retriever", () => {
  beforeEach(() => {
    resetComponentMetrics();
  });

  // ── Corpus integrity ──────────────────────────────────────────────────────

  describe("Design Corpus", () => {
    it("contains at least 100 references", () => {
      expect(DESIGN_CORPUS.length).toBeGreaterThanOrEqual(100);
    });

    it("covers all 8 required categories", () => {
      const counts = getCategoryCount();
      const required = ['hero','features','pricing','testimonials','dashboard','faq','cta','navbar'];
      for (const cat of required) {
        expect(counts[cat]).toBeDefined();
        expect(counts[cat]).toBeGreaterThan(0);
      }
    });

    it("has at least 20 hero references", () => {
      const counts = getCategoryCount();
      expect(counts.hero).toBeGreaterThanOrEqual(20);
    });

    it("every reference has required fields", () => {
      for (const ref of DESIGN_CORPUS) {
        expect(ref.id).toBeTruthy();
        expect(ref.category).toBeTruthy();
        expect(ref.industry.length).toBeGreaterThan(0);
        expect(ref.style.length).toBeGreaterThan(0);
        expect(ref.layout).toBeTruthy();
        expect(ref.tags.length).toBeGreaterThan(0);
        expect(ref.description).toBeTruthy();
        expect(ref.componentIds.length).toBeGreaterThan(0);
        expect(ref.qualityHint).toBeGreaterThanOrEqual(8);
      }
    });

    it("all reference ids are unique", () => {
      const ids = DESIGN_CORPUS.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ── DNA → Style mapping ───────────────────────────────────────────────────

  describe("DNA Style Mapping", () => {
    it("maps minimal-flat to linear", () => {
      expect(dnaLangToStyle('minimal-flat')).toBe('linear');
    });
    it("maps premium-gradient to stripe", () => {
      expect(dnaLangToStyle('premium-gradient')).toBe('stripe');
    });
    it("maps monochrome to vercel", () => {
      expect(dnaLangToStyle('monochrome')).toBe('vercel');
    });
    it("maps bold-motion to framer", () => {
      expect(dnaLangToStyle('bold-motion')).toBe('framer');
    });
    it("maps editorial to notion", () => {
      expect(dnaLangToStyle('editorial')).toBe('notion');
    });
    it("maps premium-light to apple", () => {
      expect(dnaLangToStyle('premium-light')).toBe('apple');
    });
    it("returns null for unknown designLanguage", () => {
      expect(dnaLangToStyle('unknown-style')).toBeNull();
    });
  });

  // ── Industry detection ────────────────────────────────────────────────────

  describe("Industry Detection", () => {
    it("detects saas from text", () => {
      expect(detectIndustries('a saas platform for teams')).toContain('saas');
    });
    it("detects fintech from payment keywords", () => {
      expect(detectIndustries('payment processing and invoicing app')).toContain('fintech');
    });
    it("detects health from wellness keywords", () => {
      expect(detectIndustries('wellness and fitness tracker')).toContain('health');
    });
    it("detects ai from machine learning keywords", () => {
      expect(detectIndustries('AI-powered machine learning platform')).toContain('ai');
    });
    it("detects developer from api keywords", () => {
      expect(detectIndustries('API and SDK for developers')).toContain('developer');
    });
    it("returns fallback industries for unrecognized text", () => {
      const result = detectIndustries('xyz blah blah');
      expect(result.length).toBeGreaterThan(0);
    });
    it("can detect multiple industries", () => {
      const result = detectIndustries('AI health app for patients with analytics dashboard');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Keyword extraction ────────────────────────────────────────────────────

  describe("Keyword Extraction", () => {
    it("removes stopwords", () => {
      const kw = extractKeywords('the quick brown fox and the lazy dog');
      expect(kw).not.toContain('the');
      expect(kw).not.toContain('and');
    });
    it("keeps meaningful words", () => {
      const kw = extractKeywords('analytics dashboard for marketing campaigns');
      expect(kw).toContain('analytics');
      expect(kw).toContain('dashboard');
      expect(kw).toContain('marketing');
    });
    it("returns no more than 30 keywords", () => {
      const longText = Array(50).fill('uniqueword').map((w, i) => `${w}${i}`).join(' ');
      expect(extractKeywords(longText).length).toBeLessThanOrEqual(30);
    });
  });

  // ── Style matching ────────────────────────────────────────────────────────

  describe("Style Matching", () => {
    it("linear style retrieves linear-tagged references", () => {
      const result = retrieveDesignReferences(makeInput({ style: 'linear' }));
      const hasLinear = result.references.some(r => r.style.includes('linear'));
      expect(hasLinear).toBe(true);
    });

    it("stripe style retrieves stripe-tagged references", () => {
      const result = retrieveDesignReferences(makeInput({
        style: 'stripe',
        keywords: ['pricing', 'enterprise'],
        industry: ['enterprise', 'saas'],
      }));
      const hasStripe = result.references.some(r => r.style.includes('stripe'));
      expect(hasStripe).toBe(true);
    });

    it("framer style retrieves animation-heavy references", () => {
      const result = retrieveDesignReferences(makeInput({
        style: 'framer',
        keywords: ['animated', 'motion', 'bento'],
      }));
      const hasFramer = result.references.some(r => r.style.includes('framer'));
      expect(hasFramer).toBe(true);
    });
  });

  // ── Industry matching ─────────────────────────────────────────────────────

  describe("Industry Matching", () => {
    it("fintech industry retrieves fintech-relevant references", () => {
      const result = retrieveDesignReferences(makeInput({
        industry: ['fintech', 'payments'],
        keywords: ['payment', 'banking'],
      }));
      const hasFintech = result.references.some(r => r.industry.includes('fintech'));
      expect(hasFintech).toBe(true);
    });

    it("health industry retrieves health-relevant references", () => {
      const result = retrieveDesignReferences(makeInput({
        industry: ['health', 'wellness'],
        keywords: ['health', 'wellness'],
      }));
      const hasHealth = result.references.some(r => r.industry.includes('health'));
      expect(hasHealth).toBe(true);
    });
  });

  // ── Category matching ─────────────────────────────────────────────────────

  describe("Category Matching", () => {
    it("requested categories appear in top results", () => {
      const result = retrieveDesignReferences(makeInput({
        categories: ['pricing', 'testimonials'],
        keywords: ['pricing', 'testimonials'],
      }));
      const cats = result.references.map(r => r.category);
      expect(cats.some(c => c === 'pricing' || c === 'testimonials')).toBe(true);
    });

    it("hero category requested returns hero references", () => {
      const result = retrieveDesignReferences(makeInput({
        categories: ['hero'],
        keywords: ['hero', 'header', 'launch'],
      }));
      expect(result.references.some(r => r.category === 'hero')).toBe(true);
    });
  });

  // ── Top-K and bounds ─────────────────────────────────────────────────────

  describe("Top-K Retrieval", () => {
    it("returns at most 5 references", () => {
      const result = retrieveDesignReferences(makeInput());
      expect(result.references.length).toBeLessThanOrEqual(5);
    });

    it("returns at least 1 reference for any valid input", () => {
      const result = retrieveDesignReferences(makeInput());
      expect(result.references.length).toBeGreaterThanOrEqual(1);
    });

    it("totalScanned equals corpus size", () => {
      const result = retrieveDesignReferences(makeInput());
      expect(result.totalScanned).toBe(DESIGN_CORPUS.length);
    });

    it("averageQuality is within 0–10", () => {
      const result = retrieveDesignReferences(makeInput());
      expect(result.averageQuality).toBeGreaterThanOrEqual(0);
      expect(result.averageQuality).toBeLessThanOrEqual(10);
    });
  });

  // ── Deterministic ordering ────────────────────────────────────────────────

  describe("Deterministic Ordering", () => {
    it("same input returns same order on repeated calls", () => {
      const input = makeInput();
      const r1 = retrieveDesignReferences(input);
      const r2 = retrieveDesignReferences(input);
      const ids1 = r1.references.map(r => r.id);
      const ids2 = r2.references.map(r => r.id);
      expect(ids1).toEqual(ids2);
    });

    it("references are ordered by retrievalScore descending", () => {
      const result = retrieveDesignReferences(makeInput());
      for (let i = 1; i < result.references.length; i++) {
        expect(result.references[i - 1].retrievalScore).toBeGreaterThanOrEqual(
          result.references[i].retrievalScore
        );
      }
    });
  });

  // ── No duplicate layouts ──────────────────────────────────────────────────

  describe("Deduplication", () => {
    it("no two results have the same category+layout combination", () => {
      const result = retrieveDesignReferences(makeInput());
      const keys = result.references.map(r => `${r.category}:${r.layout}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  // ── Quality ranking (Phase 3) ─────────────────────────────────────────────

  describe("Quality Ranking (Phase 3 integration)", () => {
    it("scoreBreakdown has expected keys", () => {
      const result = retrieveDesignReferences(makeInput());
      for (const ref of result.references) {
        expect(ref.scoreBreakdown).toHaveProperty('industryMatch');
        expect(ref.scoreBreakdown).toHaveProperty('styleMatch');
        expect(ref.scoreBreakdown).toHaveProperty('dnaMatch');
        expect(ref.scoreBreakdown).toHaveProperty('keywordMatch');
        expect(ref.scoreBreakdown).toHaveProperty('qualityBoost');
        expect(ref.scoreBreakdown).toHaveProperty('deprecationPenalty');
        expect(ref.scoreBreakdown).toHaveProperty('baseQuality');
      }
    });

    it("baseQuality is positive for all references", () => {
      const result = retrieveDesignReferences(makeInput());
      for (const ref of result.references) {
        expect(ref.scoreBreakdown.baseQuality).toBeGreaterThan(0);
      }
    });
  });

  // ── Intent extraction ─────────────────────────────────────────────────────

  describe("Intent Extraction", () => {
    it("extractRetrievalIntent detects industries from prompt", () => {
      const intent = extractRetrievalIntent(
        'Build a SaaS analytics platform for enterprise teams',
        ['hero', 'features', 'pricing'],
        'minimal-flat',
        { linear: 80, stripe: 20 }
      );
      expect(intent.industry).toContain('saas');
      expect(intent.style).toBe('linear');
    });

    it("extractRetrievalIntent maps valid categories only", () => {
      const intent = extractRetrievalIntent(
        'website',
        ['hero', 'features', 'unknown-section', 'pricing'],
        'monochrome',
      );
      expect(intent.categories).toContain('hero');
      expect(intent.categories).toContain('features');
      expect(intent.categories).toContain('pricing');
      expect(intent.categories).not.toContain('unknown-section');
    });

    it("returns null style for unknown designLanguage", () => {
      const intent = extractRetrievalIntent('test prompt', [], 'custom-unknown');
      expect(intent.style).toBeNull();
    });
  });
});
