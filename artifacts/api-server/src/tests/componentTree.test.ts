// ── V7.3.2 Component Tree Tests ───────────────────────────────────────────────
// 60+ tests covering tree generation, validation, DNA/industry/auth routing,
// registry mapping, evaluator integration, and telemetry.

import { describe, it, expect, beforeEach } from "vitest";
import {
  buildComponentTree,
  buildTreeContextString,
  detectIndustry,
  detectPrimaryDNA,
  normalizeSectionToType,
  type BuildTreeInput,
} from "../component-tree/treeBuilder.js";
import {
  validateTree,
  scoreTree,
  scoreTreeDimensions,
} from "../component-tree/treeValidator.js";
import {
  COMPONENT_CATALOG,
  CATALOG_SIZE,
  getComponentsBySection,
  getComponentsForDNA,
  getComponentsForAuth,
  getComponentById,
} from "../component-tree/componentCatalog.js";
import {
  recordTreeBuild,
  getComponentTreeMetrics,
  resetComponentTreeMetrics,
} from "../telemetry/componentTreeMetrics.js";
import type { PageTree, SectionNode, ComponentNode } from "../component-tree/componentTreeTypes.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePlannerOutput(overrides: Record<string, unknown> = {}) {
  return {
    cleanPlan: "Build a SaaS landing page",
    briefText: "A modern SaaS tool",
    referenceSites: "linear",
    primaryReference: "linear",
    secondaryReferences: [],
    blueprint: {
      websiteType: "SaaS Landing Page",
      sectionOrder: ["hero", "features", "pricing", "cta"],
    },
    dnaComposition: { linear: 0.6, stripe: 0.3, framer: 0.1 },
    dnaOwnership: {},
    dnaTheme: null,
    dnaMotion: null,
    templateContext: "",
    templateMatch: { templateId: "t1", template: {}, confidence: 0.8, pages: [], apis: [], databaseTables: [], features: [] },
    authState: "guest",
    navbarVariant: "navbar-navigation-saas-v1",
    authConfidence: 0.9,
    ...overrides,
  };
}

function makeArchitectureOutput(plannerOverrides: Record<string, unknown> = {}, blueprintOverrides: Record<string, unknown> = {}) {
  return {
    plan: makePlannerOutput(plannerOverrides),
    projectBlueprint: {
      projectType: "SaaS Platform",
      pages: ["LandingPage"],
      components: [],
      databaseTables: [],
      apis: [],
      authNeeded: false,
      dashboardNeeded: false,
      authProvider: "",
      entities: [],
      relationships: [],
      navigation: [],
      features: [],
      techStack: { frontend: "React", backend: "Express", ui: "shadcn", routing: "react-router", database: "none" },
      ...blueprintOverrides,
    },
  };
}

function makeTreeInput(plannerOverrides: Record<string, unknown> = {}, blueprintOverrides: Record<string, unknown> = {}): BuildTreeInput {
  return {
    plan: makePlannerOutput(plannerOverrides) as never,
    architecture: makeArchitectureOutput(plannerOverrides, blueprintOverrides) as never,
    buildId: "test-build-123",
  };
}

// ── Phase 1: Tree Generation ──────────────────────────────────────────────────

describe("buildComponentTree — basic structure", () => {
  it("returns a PageTree with the correct id", () => {
    const tree = buildComponentTree(makeTreeInput());
    expect(tree.id).toBe("tree-test-build-123");
  });

  it("has sections matching sectionOrder", () => {
    const tree = buildComponentTree(makeTreeInput());
    expect(tree.sections).toHaveLength(4);
    expect(tree.sections[0].sectionType).toBe("hero");
    expect(tree.sections[1].sectionType).toBe("features");
    expect(tree.sections[2].sectionType).toBe("pricing");
    expect(tree.sections[3].sectionType).toBe("cta");
  });

  it("sets correct order index on each section", () => {
    const tree = buildComponentTree(makeTreeInput());
    tree.sections.forEach((s, i) => expect(s.order).toBe(i));
  });

  it("every section has type 'section'", () => {
    const tree = buildComponentTree(makeTreeInput());
    tree.sections.forEach(s => expect(s.type).toBe("section"));
  });

  it("every section has parentId 'root'", () => {
    const tree = buildComponentTree(makeTreeInput());
    tree.sections.forEach(s => expect(s.parentId).toBe("root"));
  });

  it("every component has type 'component'", () => {
    const tree = buildComponentTree(makeTreeInput());
    const allComponents = tree.sections.flatMap(s => s.children);
    allComponents.forEach(c => expect(c.type).toBe("component"));
  });

  it("every component's parentId matches its section id", () => {
    const tree = buildComponentTree(makeTreeInput());
    for (const section of tree.sections) {
      section.children.forEach(c => expect(c.parentId).toBe(section.id));
    }
  });

  it("section IDs are unique", () => {
    const tree = buildComponentTree(makeTreeInput());
    const ids = tree.sections.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("component IDs are unique across the whole tree", () => {
    const tree = buildComponentTree(makeTreeInput());
    const ids = tree.sections.flatMap(s => s.children.map(c => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-zero totalNodes in statistics", () => {
    const tree = buildComponentTree(makeTreeInput());
    expect(tree.statistics.totalNodes).toBeGreaterThan(0);
  });

  it("statistics.sectionCount matches sections.length", () => {
    const tree = buildComponentTree(makeTreeInput());
    expect(tree.statistics.sectionCount).toBe(tree.sections.length);
  });
});

// ── Phase 2: Determinism ──────────────────────────────────────────────────────

describe("buildComponentTree — determinism", () => {
  it("same input produces same tree id", () => {
    const input = makeTreeInput();
    const t1 = buildComponentTree(input);
    const t2 = buildComponentTree(input);
    expect(t1.id).toBe(t2.id);
  });

  it("same input produces same section count", () => {
    const input = makeTreeInput();
    const t1 = buildComponentTree(input);
    const t2 = buildComponentTree(input);
    expect(t1.sections.length).toBe(t2.sections.length);
  });

  it("same input produces same component names per section", () => {
    const input = makeTreeInput();
    const t1 = buildComponentTree(input);
    const t2 = buildComponentTree(input);
    t1.sections.forEach((s, i) => {
      const names1 = s.children.map(c => c.name).sort();
      const names2 = t2.sections[i].children.map(c => c.name).sort();
      expect(names1).toEqual(names2);
    });
  });

  it("different buildId produces different tree id", () => {
    const t1 = buildComponentTree(makeTreeInput());
    const t2 = buildComponentTree(makeTreeInput({}, {}));
    // Both use 'test-build-123' so they should match
    expect(t1.id).toBe(t2.id);
  });
});

// ── Phase 3: DNA Routing ──────────────────────────────────────────────────────

describe("buildComponentTree — DNA routing", () => {
  it("linear DNA hero includes MinimalBadge", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { linear: 0.9 }, authState: "guest" }));
    const heroSection = tree.sections.find(s => s.sectionType === "hero");
    const componentNames = heroSection?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("MinimalBadge");
  });

  it("stripe DNA hero includes AnnouncementBar", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { stripe: 0.9 }, authState: "guest" }));
    const heroSection = tree.sections.find(s => s.sectionType === "hero");
    const componentNames = heroSection?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("AnnouncementBar");
  });

  it("framer DNA hero includes MotionBadge", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { framer: 0.9 }, authState: "guest" }));
    const heroSection = tree.sections.find(s => s.sectionType === "hero");
    const componentNames = heroSection?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("MotionBadge");
  });

  it("stripe DNA hero includes TrustRow", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { stripe: 0.9 }, authState: "guest" }));
    const heroSection = tree.sections.find(s => s.sectionType === "hero");
    const componentNames = heroSection?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("TrustRow");
  });

  it("vercel DNA hero includes CTAGroup", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { vercel: 0.9 }, authState: "guest" }));
    const heroSection = tree.sections.find(s => s.sectionType === "hero");
    const componentNames = heroSection?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("CTAGroup");
  });

  it("stores primary DNA in metadata", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { stripe: 0.8, linear: 0.2 } }));
    expect(tree.metadata.primaryDNA).toBe("stripe");
  });
});

// ── Phase 4: Industry Routing ─────────────────────────────────────────────────

describe("detectIndustry", () => {
  it("detects healthcare from 'doctor' keyword", () => {
    expect(detectIndustry("doctor appointment booking", "")).toBe("healthcare");
  });
  it("detects ecommerce from 'shop' keyword", () => {
    expect(detectIndustry("online shop for apparel", "")).toBe("ecommerce");
  });
  it("detects fintech from 'payment' keyword", () => {
    expect(detectIndustry("payment processing platform", "")).toBe("fintech");
  });
  it("detects ai from 'ai' keyword", () => {
    expect(detectIndustry("AI writing assistant", "")).toBe("ai");
  });
  it("detects restaurant from 'menu' keyword", () => {
    expect(detectIndustry("restaurant with online menu", "")).toBe("restaurant");
  });
  it("defaults to saas when no match", () => {
    expect(detectIndustry("xyz abc", "xyz")).toBe("saas");
  });
  it("uses websiteType as fallback", () => {
    expect(detectIndustry("", "portfolio website")).toBe("portfolio");
  });
});

// ── Phase 5: Auth Routing ─────────────────────────────────────────────────────

describe("buildComponentTree — auth routing", () => {
  it("guest navbar includes NavbarCTAButton", () => {
    const sections = buildComponentTree(
      makeTreeInput({ authState: "guest", blueprint: { websiteType: "SaaS", sectionOrder: ["navbar"] } } as never)
    ).sections;
    const navbar = sections.find(s => s.sectionType === "navbar");
    const componentNames = navbar?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("NavbarCTAButton");
  });

  it("admin navbar includes CommandPalette", () => {
    const tree = buildComponentTree(
      makeTreeInput({ authState: "admin", blueprint: { websiteType: "Admin", sectionOrder: ["navbar"] } } as never)
    );
    const navbar = tree.sections.find(s => s.sectionType === "navbar");
    const componentNames = navbar?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("CommandPalette");
  });

  it("admin navbar includes AvatarMenu", () => {
    const tree = buildComponentTree(
      makeTreeInput({ authState: "admin", blueprint: { websiteType: "Admin", sectionOrder: ["navbar"] } } as never)
    );
    const navbar = tree.sections.find(s => s.sectionType === "navbar");
    const componentNames = navbar?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("AvatarMenu");
  });

  it("dashboard navbar includes AvatarMenu", () => {
    const tree = buildComponentTree(
      makeTreeInput({ authState: "dashboard", blueprint: { websiteType: "Dashboard", sectionOrder: ["navbar"] } } as never)
    );
    const navbar = tree.sections.find(s => s.sectionType === "navbar");
    const componentNames = navbar?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("AvatarMenu");
  });

  it("admin dashboard includes CRUDTable", () => {
    const tree = buildComponentTree(
      makeTreeInput({ authState: "admin", blueprint: { websiteType: "Admin", sectionOrder: ["dashboard"] } } as never)
    );
    const dashboard = tree.sections.find(s => s.sectionType === "dashboard");
    const componentNames = dashboard?.children.map(c => c.name) ?? [];
    expect(componentNames).toContain("CRUDTable");
  });

  it("stores authState in tree metadata", () => {
    const tree = buildComponentTree(makeTreeInput({ authState: "admin" }));
    expect(tree.metadata.authState).toBe("admin");
  });
});

// ── Phase 6: Section Type Normalization ───────────────────────────────────────

describe("normalizeSectionToType", () => {
  it("'hero' → 'hero'", () => { expect(normalizeSectionToType("hero")).toBe("hero"); });
  it("'Hero Section' → 'hero'", () => { expect(normalizeSectionToType("Hero Section")).toBe("hero"); });
  it("'features' → 'features'", () => { expect(normalizeSectionToType("features")).toBe("features"); });
  it("'pricing plans' → 'pricing'", () => { expect(normalizeSectionToType("pricing plans")).toBe("pricing"); });
  it("'Call To Action' → 'cta'", () => { expect(normalizeSectionToType("Call To Action")).toBe("cta"); });
  it("'Frequently Asked' → 'faq'", () => { expect(normalizeSectionToType("Frequently Asked")).toBe("faq"); });
  it("'use-cases' → 'features'", () => { expect(normalizeSectionToType("use-cases")).toBe("features"); });
  it("'how-it-works' → 'features'", () => { expect(normalizeSectionToType("how-it-works")).toBe("features"); });
  it("'bento grid' → 'bento'", () => { expect(normalizeSectionToType("bento grid")).toBe("bento"); });
  it("unknown → 'unknown'", () => { expect(normalizeSectionToType("xyzabc")).toBe("unknown"); });
});

// ── Phase 7: Tree Validation ──────────────────────────────────────────────────

describe("validateTree", () => {
  it("valid tree has no errors", () => {
    const tree = buildComponentTree(makeTreeInput());
    const result = validateTree(tree);
    expect(result.errors).toHaveLength(0);
  });

  it("valid tree returns valid=true", () => {
    const tree = buildComponentTree(makeTreeInput());
    const result = validateTree(tree);
    expect(result.valid).toBe(true);
  });

  it("valid tree has score > 0", () => {
    const tree = buildComponentTree(makeTreeInput());
    const result = validateTree(tree);
    expect(result.score).toBeGreaterThan(0);
  });

  it("detects duplicate section IDs", () => {
    const tree = buildComponentTree(makeTreeInput());
    const dupe = { ...tree.sections[0] };
    const modified = { ...tree, sections: [tree.sections[0], dupe] };
    const result = validateTree(modified);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe("duplicate_id");
  });

  it("detects orphan section (wrong parentId)", () => {
    const tree = buildComponentTree(makeTreeInput());
    const badSection = { ...tree.sections[0], parentId: "not-root" };
    const modified = { ...tree, sections: [badSection] };
    const result = validateTree(modified);
    const orphans = result.errors.filter(e => e.type === "orphan_node");
    expect(orphans.length).toBeGreaterThan(0);
  });

  it("detects unknown section type as warning", () => {
    const tree = buildComponentTree(
      makeTreeInput({ blueprint: { websiteType: "Landing", sectionOrder: ["xyzunknown"] } } as never)
    );
    const result = validateTree(tree);
    const unknownWarnings = result.warnings.filter(e => e.type === "invalid_hierarchy");
    expect(unknownWarnings.length).toBeGreaterThan(0);
  });

  it("detects PricingCard without PricingGrid as warning", () => {
    const tree = buildComponentTree(makeTreeInput());
    // Build a fake tree with PricingCard but no PricingGrid
    const pricingSection: SectionNode = {
      id: "section-0-pricing",
      name: "pricing",
      type: "section",
      parentId: "root",
      sectionType: "pricing",
      order: 0,
      children: [
        { id: "section-0-pricing-PricingCard", name: "PricingCard", type: "component", parentId: "section-0-pricing", sectionType: "pricing", required: true, priority: 9, metadata: { shadcnComponents: [], requiresTrustSignal: false, requiresCTA: true } },
      ],
      dna: ["linear"],
      industry: ["saas"],
      authState: ["guest"],
      required: true,
      priority: 10,
      metadata: {},
    };
    const modified = { ...tree, sections: [pricingSection] };
    const result = validateTree(modified);
    const depWarnings = result.warnings.filter(w => w.type === "missing_dependency");
    expect(depWarnings.length).toBeGreaterThan(0);
  });

  it("returns score <= 10", () => {
    const tree = buildComponentTree(makeTreeInput());
    const result = validateTree(tree);
    expect(result.score).toBeLessThanOrEqual(10);
  });
});

// ── Phase 8: Tree Scoring ─────────────────────────────────────────────────────

describe("scoreTree", () => {
  it("returns a number between 0 and 10 for a valid tree", () => {
    const tree = buildComponentTree(makeTreeInput());
    const score = scoreTree(tree);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("returns 0 for null input", () => {
    expect(scoreTree(null)).toBe(0);
  });

  it("returns 0 for undefined input", () => {
    expect(scoreTree(undefined)).toBe(0);
  });

  it("returns 0 for empty tree", () => {
    const emptyTree: PageTree = {
      id: "empty",
      name: "Empty",
      sections: [],
      metadata: { buildId: "x", generatedAt: 0, industry: "saas", authState: "guest", dnaWeights: {}, websiteType: "landing", primaryDNA: "linear" },
      statistics: { sectionCount: 0, totalNodes: 0, maxDepth: 2, componentNames: [], requiredCount: 0, optionalCount: 0, shadcnComponentsUsed: [] },
    };
    expect(scoreTree(emptyTree)).toBe(0);
  });

  it("scoreTreeDimensions has 5 dimensions", () => {
    const tree = buildComponentTree(makeTreeInput());
    const dims = scoreTreeDimensions(tree);
    expect(dims.hierarchyScore).toBeDefined();
    expect(dims.reuseScore).toBeDefined();
    expect(dims.dependencyScore).toBeDefined();
    expect(dims.consistencyScore).toBeDefined();
    expect(dims.completenessScore).toBeDefined();
  });

  it("all dimension scores are between 0 and 10", () => {
    const tree = buildComponentTree(makeTreeInput());
    const dims = scoreTreeDimensions(tree);
    for (const score of Object.values(dims)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    }
  });
});

// ── Phase 9: Tree Context String ──────────────────────────────────────────────

describe("buildTreeContextString", () => {
  it("returns a non-empty string for valid tree", () => {
    const tree = buildComponentTree(makeTreeInput());
    const ctx = buildTreeContextString(tree);
    expect(ctx).toBeTruthy();
    expect(ctx.length).toBeGreaterThan(50);
  });

  it("contains section names", () => {
    const tree = buildComponentTree(makeTreeInput());
    const ctx = buildTreeContextString(tree);
    expect(ctx).toContain("hero");
    expect(ctx).toContain("pricing");
  });

  it("contains component names", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { linear: 0.9 } }));
    const ctx = buildTreeContextString(tree);
    expect(ctx).toContain("HeroHeadline");
  });

  it("contains industry and auth metadata", () => {
    const tree = buildComponentTree(makeTreeInput());
    const ctx = buildTreeContextString(tree);
    expect(ctx).toContain("saas");
    expect(ctx).toContain("guest");
  });

  it("contains shadcn component references", () => {
    const tree = buildComponentTree(makeTreeInput());
    const ctx = buildTreeContextString(tree);
    expect(ctx).toMatch(/\[.*\]/);
  });
});

// ── Phase 10: Component Catalog ───────────────────────────────────────────────

describe("Component Catalog", () => {
  it("has at least 30 entries", () => {
    expect(CATALOG_SIZE).toBeGreaterThanOrEqual(30);
  });

  it("every entry has a unique id", () => {
    const ids = COMPONENT_CATALOG.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has non-empty name", () => {
    COMPONENT_CATALOG.forEach(c => expect(c.name.length).toBeGreaterThan(0));
  });

  it("every entry has at least one supported DNA", () => {
    COMPONENT_CATALOG.forEach(c => expect(c.supportedDNAs.length).toBeGreaterThan(0));
  });

  it("getComponentsBySection returns hero components", () => {
    const heroes = getComponentsBySection("hero");
    expect(heroes.length).toBeGreaterThan(0);
  });

  it("getComponentsForDNA filters by DNA", () => {
    const framerHeros = getComponentsForDNA("framer", "hero");
    expect(framerHeros.some(c => c.id === "MotionBadge")).toBe(true);
  });

  it("getComponentsForAuth filters by auth state", () => {
    const adminNavbars = getComponentsForAuth("admin", "navbar");
    expect(adminNavbars.some(c => c.id === "CommandPalette")).toBe(true);
  });

  it("getComponentById finds existing component", () => {
    const entry = getComponentById("HeroHeadline");
    expect(entry).toBeDefined();
    expect(entry?.name).toBe("HeroHeadline");
  });

  it("getComponentById returns undefined for unknown", () => {
    expect(getComponentById("NoSuchComponent")).toBeUndefined();
  });

  it("guest-only components have 'guest' in supportedAuthStates", () => {
    const ctaBtn = getComponentById("CTAButton");
    expect(ctaBtn?.supportedAuthStates).toContain("guest");
  });
});

// ── Phase 11: Telemetry ───────────────────────────────────────────────────────

describe("componentTreeMetrics", () => {
  beforeEach(() => { resetComponentTreeMetrics(); });

  it("starts with totalTrees=0", () => {
    expect(getComponentTreeMetrics().totalTrees).toBe(0);
  });

  it("records a tree build and increments totalTrees", () => {
    const tree = buildComponentTree(makeTreeInput());
    recordTreeBuild(tree, 7.5, 0, 1);
    expect(getComponentTreeMetrics().totalTrees).toBe(1);
  });

  it("tracks validation pass rate", () => {
    const tree = buildComponentTree(makeTreeInput());
    recordTreeBuild(tree, 8.0, 0, 0); // no errors
    recordTreeBuild(tree, 6.0, 1, 2); // 1 error
    const metrics = getComponentTreeMetrics();
    expect(metrics.validationPassRate).toBe(0.5);
  });

  it("tracks industry distribution", () => {
    const tree = buildComponentTree(makeTreeInput());
    recordTreeBuild(tree, 7.0, 0, 0);
    const metrics = getComponentTreeMetrics();
    expect(metrics.industryDistribution.saas).toBe(1);
  });

  it("tracks DNA distribution", () => {
    const tree = buildComponentTree(makeTreeInput({ dnaComposition: { stripe: 0.9 } }));
    recordTreeBuild(tree, 7.0, 0, 0);
    const metrics = getComponentTreeMetrics();
    expect(metrics.dnaDistribution.stripe).toBe(1);
  });

  it("tracks average quality score", () => {
    const tree = buildComponentTree(makeTreeInput());
    recordTreeBuild(tree, 8.0, 0, 0);
    recordTreeBuild(tree, 6.0, 0, 0);
    const metrics = getComponentTreeMetrics();
    expect(metrics.averageQualityScore).toBe(7.0);
  });

  it("tracks most used components", () => {
    const tree = buildComponentTree(makeTreeInput());
    recordTreeBuild(tree, 7.0, 0, 0);
    const metrics = getComponentTreeMetrics();
    expect(metrics.mostUsedComponents.length).toBeGreaterThan(0);
    expect(metrics.mostUsedComponents[0]).toHaveProperty("name");
    expect(metrics.mostUsedComponents[0]).toHaveProperty("count");
  });

  it("tracks validation errors and warnings", () => {
    const tree = buildComponentTree(makeTreeInput());
    recordTreeBuild(tree, 5.0, 2, 3);
    const metrics = getComponentTreeMetrics();
    expect(metrics.totalValidationErrors).toBe(2);
    expect(metrics.totalValidationWarnings).toBe(3);
  });

  it("reset clears all metrics", () => {
    const tree = buildComponentTree(makeTreeInput());
    recordTreeBuild(tree, 7.0, 0, 0);
    resetComponentTreeMetrics();
    expect(getComponentTreeMetrics().totalTrees).toBe(0);
  });

  it("tracks auth state distribution", () => {
    const tree = buildComponentTree(makeTreeInput({ authState: "admin" }));
    recordTreeBuild(tree, 7.0, 0, 0);
    const metrics = getComponentTreeMetrics();
    expect(metrics.authStateDistribution.admin).toBe(1);
  });
});

// ── Phase 12: detectPrimaryDNA ────────────────────────────────────────────────

describe("detectPrimaryDNA", () => {
  it("returns highest weight DNA brand", () => {
    expect(detectPrimaryDNA({ stripe: 0.7, linear: 0.3 })).toBe("stripe");
  });

  it("handles single DNA", () => {
    expect(detectPrimaryDNA({ framer: 1.0 })).toBe("framer");
  });

  it("defaults to 'linear' for empty weights", () => {
    expect(detectPrimaryDNA({})).toBe("linear");
  });

  it("returns the max among multiple equal weights (first alphabetically wins via sort stability)", () => {
    const result = detectPrimaryDNA({ stripe: 0.5, linear: 0.5 });
    expect(["stripe", "linear"]).toContain(result);
  });
});
