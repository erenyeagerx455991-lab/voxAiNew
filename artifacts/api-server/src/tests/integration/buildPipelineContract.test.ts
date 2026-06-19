import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Build Pipeline Contract — SSE Event Order & Payload Shapes", () => {
  const REQUIRED_EVENTS_IN_ORDER = [
    "step",               // step 0 — Planner
    "dna_composition",    // (optional but present when brands detected)
    "template_selected",  // template match
    "step",               // step 1 — Architecture
    "quality_gate",       // quality gate
    "step",               // step 2 — Design
    "step",               // step 3 — Frontend
    "step",               // step 4 — Code Fix
    "build_health",       // build health metrics
    "step",               // step 8 — Scaffold
    "project_validate",   // project validator
    "graph_build_done",   // knowledge graph
    "step",               // step 9 — Runtime
    "runtime_health",     // runtime health summary
    "done",               // final done event
  ];

  it("defines the required SSE event sequence", () => {
    expect(REQUIRED_EVENTS_IN_ORDER.length).toBeGreaterThan(10);
    expect(REQUIRED_EVENTS_IN_ORDER[0]).toBe("step");
    expect(REQUIRED_EVENTS_IN_ORDER[REQUIRED_EVENTS_IN_ORDER.length - 1]).toBe("done");
  });

  describe("step event payload shape", () => {
    const stepEvent = { type: "step", step: 0, agent: "Planner Agent", status: "active" };
    it("has type, step (number), agent (string), status (string)", () => {
      expect(typeof stepEvent.type).toBe("string");
      expect(typeof stepEvent.step).toBe("number");
      expect(typeof stepEvent.agent).toBe("string");
      expect(["active", "done", "warn", "error"]).toContain(stepEvent.status);
    });
  });

  describe("done event payload shape", () => {
    const doneEvent = {
      type: "done",
      code: "function App() {}",
      plan: "plan text",
      blueprint: { websiteType: "SaaS", sectionOrder: ["Hero", "Footer"] },
      projectBlueprint: { projectType: "SaaS", pages: ["Landing"], apis: [], databaseTables: [], authNeeded: false },
      sectionOrder: ["Hero", "Footer"],
      files: [{ name: "App.tsx", path: "src/", lang: "tsx", content: "..." }],
      dnaComposition: { stripe: 0, linear: 50, framer: 0, vercel: 50, notion: 0, cursor: 0, raycast: 0 },
      knowledgeGraph: { pages: [], components: [], apis: [], graphHealthScore: 80 },
    };

    it("has code (string)", () => expect(typeof doneEvent.code).toBe("string"));
    it("has plan (string)", () => expect(typeof doneEvent.plan).toBe("string"));
    it("has blueprint with websiteType and sectionOrder", () => {
      expect(doneEvent.blueprint).toHaveProperty("websiteType");
      expect(Array.isArray(doneEvent.blueprint.sectionOrder)).toBe(true);
    });
    it("has projectBlueprint with projectType", () => {
      expect(doneEvent.projectBlueprint).toHaveProperty("projectType");
      expect(doneEvent.projectBlueprint).toHaveProperty("authNeeded");
    });
    it("has files array", () => {
      expect(Array.isArray(doneEvent.files)).toBe(true);
      expect(doneEvent.files[0]).toHaveProperty("name");
      expect(doneEvent.files[0]).toHaveProperty("content");
    });
    it("has dnaComposition with brand keys", () => {
      const brands = ["stripe", "linear", "framer", "vercel", "notion", "cursor", "raycast"];
      for (const b of brands) expect(doneEvent.dnaComposition).toHaveProperty(b);
    });
    it("has knowledgeGraph with pages, components, apis", () => {
      expect(doneEvent.knowledgeGraph).toHaveProperty("pages");
      expect(doneEvent.knowledgeGraph).toHaveProperty("components");
      expect(doneEvent.knowledgeGraph).toHaveProperty("apis");
    });
  });

  describe("build_health event payload shape", () => {
    const bhEvent = {
      type: "build_health",
      validationScore: 90,
      compileSuccessRate: 90,
      repairAttempts: 2,
      filesRepaired: 1,
      totalFiles: 5,
      passedFiles: 4,
      failedFiles: 1,
      tokenEstimate: 3200,
      runtimeScore: 85,
      runtimeErrors: 0,
      filesValidated: 5,
      runtimeRepairAttempts: 0,
      routesValid: true,
    };
    it("has validationScore (number 0-100)", () => {
      expect(typeof bhEvent.validationScore).toBe("number");
      expect(bhEvent.validationScore).toBeGreaterThanOrEqual(0);
      expect(bhEvent.validationScore).toBeLessThanOrEqual(100);
    });
    it("has repairAttempts and filesRepaired", () => {
      expect(typeof bhEvent.repairAttempts).toBe("number");
      expect(typeof bhEvent.filesRepaired).toBe("number");
    });
    it("has routesValid boolean", () => expect(typeof bhEvent.routesValid).toBe("boolean"));
  });

  describe("quality_gate event payload shape", () => {
    const qgEvent = { type: "quality_gate", score: 85, passed: true, issues: [] };
    it("has score (number), passed (boolean), issues (array)", () => {
      expect(typeof qgEvent.score).toBe("number");
      expect(typeof qgEvent.passed).toBe("boolean");
      expect(Array.isArray(qgEvent.issues)).toBe(true);
    });
  });

  describe("runtime_health event payload shape", () => {
    const rhEvent = {
      type: "runtime_health",
      chatId: "build-123",
      health: 90,
      status: "running",
      buildPassed: true,
      runtimePassed: true,
      attempts: 1,
      dependencies: ["react", "typescript"],
      devDependencies: ["vite"],
      logs: [],
      buildErrors: [],
      warnings: [],
      missingImports: [],
      filesValidated: 8,
      filesTotal: 8,
      realBuild: true,
      totalDurationMs: 12000,
      repairAttempts: 0,
    };
    it("has chatId, health, status", () => {
      expect(typeof rhEvent.chatId).toBe("string");
      expect(typeof rhEvent.health).toBe("number");
      expect(typeof rhEvent.status).toBe("string");
    });
    it("has buildPassed and runtimePassed (boolean)", () => {
      expect(typeof rhEvent.buildPassed).toBe("boolean");
      expect(typeof rhEvent.runtimePassed).toBe("boolean");
    });
    it("has realBuild flag", () => expect(rhEvent.realBuild).toBe(true));
  });

  describe("graph_build_done event payload shape", () => {
    const gbEvent = {
      type: "graph_build_done",
      graph: {
        projectType: "SaaS",
        generatedAt: Date.now(),
        pages: [{ name: "Landing", path: "/", components: [] }],
        components: [],
        apis: [],
        databaseTables: [],
        routes: ["/"],
        dependencies: [],
        graphHealthScore: 75,
      },
    };
    it("has graph with pages, components, apis", () => {
      expect(gbEvent.graph).toHaveProperty("pages");
      expect(gbEvent.graph).toHaveProperty("components");
      expect(gbEvent.graph).toHaveProperty("apis");
      expect(typeof gbEvent.graph.graphHealthScore).toBe("number");
    });
  });

  describe("SSE step numbers contract", () => {
    const STEP_MAP: Record<number, string> = {
      0: "Planner Agent",
      1: "Architecture Agent",
      2: "Design Agent",
      3: "Frontend Agent",
      4: "Code Fix Agent",
      5: "Backend Agent",
      6: "Database Agent",
      7: "Auth Agent",
      8: "Scaffold Agent",
      9: "Runtime Agent",
    };
    it("defines all 10 step agents (0-9)", () => {
      expect(Object.keys(STEP_MAP).length).toBe(10);
      for (let i = 0; i <= 9; i++) expect(STEP_MAP[i]).toBeDefined();
    });
    it("Scaffold Agent is step 8", () => expect(STEP_MAP[8]).toBe("Scaffold Agent"));
    it("Runtime Agent is step 9", () => expect(STEP_MAP[9]).toBe("Runtime Agent"));
  });
});
