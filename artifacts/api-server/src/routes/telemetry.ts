import { Router } from "express";
import { authMiddleware } from "../security/authMiddleware.js";
import { globalMetrics } from "../telemetry/metricsProvider.js";
import { getRegistryMetrics } from "../telemetry/registryMetrics.js";
import { getCacheStats } from "../components/retrieval/retrievalCache.js";
import { getIndexStats } from "../components/registryV2/searchIndex.js";
import { getQueueMetrics } from "../queue/queueMetrics.js";
import { getBudgetMetrics } from "../cost/budgetMetrics.js";
import { getBudgetUsage } from "../cost/tokenBudget.js";
import { getAllUserStats } from "../limits/userLimits.js";
import { getQualityMetrics, getRetrievalMetrics } from "../telemetry/qualityMetrics.js";
import { getComponentQualityMetrics } from "../quality/componentMetrics.js";
import { getRagLeaderboardMetrics } from "../design-rag/referenceMetrics.js";
import { getMultiCandidateMetrics } from "../telemetry/multiCandidateMetrics.js";
import { getBenchmarkMetrics } from "../benchmarks/benchmarkMetrics.js";
import { getSectionRagMetrics } from "../design-rag/sectionRagMetrics.js";
import { getSectionLearningMetrics } from "../design-rag/sectionReferenceMetrics.js";
import { SECTION_CORPUS } from "../design-rag/sectionCorpus.js";
import { getComponentCoverageMetrics, recommendBestComponents } from "../quality/componentRecommendations.js";
import { getNavigationQualityMetrics } from "../telemetry/navigationMetrics.js";
import { getAuthRoutingMetrics } from "../auth/authRoutingMetrics.js";
import { getDashboardQualityMetrics } from "../telemetry/dashboardMetrics.js";
import { getFormQualityMetrics } from "../telemetry/formMetrics.js";
import { getMotionQualityMetrics } from "../telemetry/motionMetrics.js";
import { getCriticQualityMetrics } from "../telemetry/criticMetrics.js";
import { getCriticLearningMetrics } from "../agents/designCritic/criticLearning.js";
import { getConversionQualityMetrics } from "../telemetry/conversionMetrics.js";
import { getConversionLearningMetrics } from "../agents/conversion/conversionLearning.js";
import { getPremiumRegistryQuality } from "../quality/registryLeaderboard.js";
import { getComponentTreeMetrics } from "../telemetry/componentTreeMetrics.js";
import { getDesignTokenMetrics } from "../telemetry/designTokenMetrics.js";
import { getVisualMetrics } from "../telemetry/visualMetrics.js";
import { getDNAEvolutionMetrics } from "../design-dna/dnaEvolution.js";
import { getDNAManagerMetrics } from "../design-dna/designDNA.js";
import { getTokenLearningMetrics } from "../design-tokens/tokenLearning.js";
import { getAllSectionLeaderboards } from "../design-rag/sectionReferenceMetrics.js";

const router: Router = Router();

router.get("/telemetry/metrics", authMiddleware, (_req, res) => {
  const snap = globalMetrics.snapshot();
  res.json({
    builds:   snap.builds,
    agents:   snap.agents,
    tokens:   snap.tokens,
    repairs:  snap.repairs,
    runtime:  snap.runtime,
    counters: snap.counters,
    gauges:   snap.gauges,
    histograms: Object.fromEntries(
      Object.entries(snap.histograms).map(([k, v]) => [
        k,
        { count: v.count, avg: v.sum > 0 ? Math.round(v.sum / v.count) : 0, p50: v.p50, p95: v.p95, p99: v.p99, min: v.min, max: v.max },
      ])
    ),
    generatedAt: new Date().toISOString(),
  });
});

router.get("/telemetry/registry", authMiddleware, (_req, res) => {
  const metrics = getRegistryMetrics();
  const cache   = getCacheStats();
  const index   = getIndexStats();
  res.json({
    retrieval: metrics,
    cache,
    index,
    generatedAt: new Date().toISOString(),
  });
});

router.get("/telemetry/queue", authMiddleware, (_req, res) => {
  res.json({
    queue:   getQueueMetrics(),
    budget:  getBudgetMetrics(),
    usage:   getBudgetUsage(),
    users:   getAllUserStats(),
    generatedAt: new Date().toISOString(),
  });
});

router.get("/telemetry/quality", authMiddleware, (_req, res) => {
  const coverageMetrics = getComponentCoverageMetrics();
  const sampleRecommendations = {
    'saas-dashboard':   recommendBestComponents({ industry: ['saas'], sectionType: 'dashboard', dna: {} }),
    'fintech-pricing':  recommendBestComponents({ industry: ['fintech'], sectionType: 'pricing', dna: {} }),
    'ai-features':      recommendBestComponents({ industry: ['ai'], sectionType: 'features', dna: {} }),
    'generic-faq':      recommendBestComponents({ industry: [], sectionType: 'faq', dna: {} }),
  };
  res.json({
    quality: getQualityMetrics(),
    componentQuality: getComponentQualityMetrics(),
    retrieval: getRetrievalMetrics(),
    designRag: getRagLeaderboardMetrics(),
    multiCandidate: getMultiCandidateMetrics(),
    benchmark: getBenchmarkMetrics(),
    sectionRag:      getSectionRagMetrics(SECTION_CORPUS.length),
    sectionLearning: getSectionLearningMetrics(),
    componentCoverage: {
      ...coverageMetrics,
      recommendations: sampleRecommendations,
    },
    navigationQuality: getNavigationQualityMetrics(),
    authRouting: getAuthRoutingMetrics(),
    dashboardQuality: getDashboardQualityMetrics(),
    formQuality: getFormQualityMetrics(),
    motionQuality: getMotionQualityMetrics(),
    criticQuality: getCriticQualityMetrics(),
    criticLearning: getCriticLearningMetrics(),
    conversionQuality: getConversionQualityMetrics(),
    conversionLearning: getConversionLearningMetrics(),
    premiumRegistryQuality: getPremiumRegistryQuality(),
    componentTree: getComponentTreeMetrics(),
    designTokens: getDesignTokenMetrics(),
    visualQuality: getVisualMetrics(),
    designDNA: (() => {
      const evolution = getDNAEvolutionMetrics();
      // V8.1 — additional manager metrics (additive only)
      const v81 = (() => {
        try { return getDNAManagerMetrics(); } catch { return null; }
      })();
      return {
        // V7.3.5 Phase 15 — flat spec-required fields at top level
        trackedDNAs:      evolution.trackedDNAs,
        averageDNAQuality: evolution.averageDNAQuality,
        topDNAs:          evolution.topDNAs,
        worstDNAs:        evolution.worstDNAs,
        promotedCount:    v81?.promotionCount ?? evolution.promotedCount,
        demotedCount:     v81?.demotionCount  ?? evolution.demotedCount,
        topHeroPatterns:  evolution.topHeroPatterns,
        topCTAPatterns:   evolution.topCTAPatterns,
        topLayoutPatterns: evolution.topLayoutPatterns,
        // V8.1 Phase 12 — new required fields (additively appended)
        currentVersion:   v81?.currentVersion   ?? "v8.1",
        evolutionCount:   v81?.evolutionCount   ?? 0,
        averageQuality:   v81?.averageQuality   ?? evolution.averageDNAQuality,
        topLayouts:       v81?.topLayouts       ?? [],
        topComponents:    v81?.topComponents    ?? [],
        topSections:      v81?.topSections      ?? [],
        topThemes:        v81?.topThemes        ?? [],
        topMotions:       v81?.topMotions       ?? [],
        topTokens:        v81?.topTokens        ?? [],
        learningRate:     v81?.learningRate     ?? 0,
        confidence:       v81?.confidence       ?? 0,
        lastEvolution:    v81?.lastEvolution    ?? null,
        // Backward-compatible nested shapes for existing consumers
        evolution,
        tokenLearning:     getTokenLearningMetrics(),
        sectionLeaderboards: getAllSectionLeaderboards(),
        // V8.1 extended detail (opt-in)
        v81Registry:      v81?.registry       ?? null,
        v81Versioning:    v81?.versioning      ?? null,
        v81Ranking:       v81?.ranking         ?? null,
        v81Persistence:   v81?.persistence     ?? null,
        v81TopDnaRecords: v81?.topDnaRecords   ?? [],
      };
    })(),
    generatedAt: new Date().toISOString(),
  });
});

export default router;
