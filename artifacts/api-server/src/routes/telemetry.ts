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
import { getUXQualityMetrics } from "../ux-intelligence/uxMetrics.js";
import { getDirectorMetrics } from "../design-director/directorMetrics.js";
import { getProductMetrics } from "../product-manager/productMetrics.js";
import { getArchitectureMetrics } from "../frontend-architect/architectureMetrics.js";
import { getBackendMetrics }           from "../backend-architect/backendMetrics.js";
import { getBackendLearningStats }     from "../backend-architect/backendLearning.js";
import { getPersistenceStats }         from "../backend-architect/backendPersistence.js";
import { getDevOpsMetrics }            from "../devops-architect/devopsMetrics.js";
import { getDevOpsLearningStats }      from "../devops-architect/devopsLearning.js";
import { getDevOpsPersistenceStats }   from "../devops-architect/devopsPersistence.js";
import { getQAMetrics }               from "../qa-architect/qaMetrics.js";
import { getQALearningStats }         from "../qa-architect/qaLearning.js";
import { getQAPersistenceStats }      from "../qa-architect/qaPersistence.js";
import { getSecurityArchitectMetrics }        from "../security-architect/securityMetrics.js";
import { getSecurityLearningStats }           from "../security-architect/securityLearning.js";
import { getSecurityArchitectPersistenceStats } from "../security-architect/securityPersistence.js";
// V9.0: Runtime Intelligence telemetry
import { getRuntimeMetrics }          from "../runtime-intelligence/runtimeMetrics.js";
import { getRuntimeLearningStats }    from "../runtime-intelligence/runtimeLearning.js";
import { getRuntimePersistenceStats } from "../runtime-intelligence/runtimePersistence.js";

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
    // V8.2: UX Intelligence & Conversion Prediction telemetry (additive)
    uxQuality: getUXQualityMetrics(),
    // V8.3: Autonomous AI Design Director telemetry (additive)
    designDirector: getDirectorMetrics(),
    // V8.4: Autonomous AI Product Manager telemetry (additive)
    productManager: getProductMetrics(),
    // V8.5: Autonomous Frontend Architect telemetry (additive)
    frontendArchitecture: getArchitectureMetrics(),
    // V8.6: Autonomous Backend Architect telemetry (additive)
    backendArchitecture: (() => {
      const m   = getBackendMetrics();
      const l   = getBackendLearningStats();
      const p   = getPersistenceStats();
      return {
        ...m,
        // Spec-required named fields
        architectureScore:  m.averageArchitectureScore,
        databaseScore:      m.averageDatabaseScore,
        apiScore:           m.averageAPIScore,
        securityScore:      m.averageSecurityScore,
        deploymentScore:    m.averageDeploymentScore,
        testingScore:       m.averageTestingScore,
        scalabilityScore:   m.averageScalabilityScore,
        learningStatistics: {
          totalRecords:  l.totalRecords,
          improvedCount: l.improvedCount,
          averageScore:  l.averageScore,
          byType:        l.byType,
        },
        plannerDistribution: m.topBackendTypes,
        persistenceHealth:   {
          totalSnapshots: p.totalSnapshots,
          currentVersion: p.currentVersion,
          capacityUsed:   p.capacityUsed,
          oldestVersion:  p.oldestVersion,
          newestVersion:  p.newestVersion,
        },
      };
    })(),
    // V8.7: Autonomous DevOps Architect telemetry (additive)
    devopsArchitecture: (() => {
      const dm = getDevOpsMetrics();
      const dl = getDevOpsLearningStats();
      const dp = getDevOpsPersistenceStats();
      return {
        ...dm,
        deploymentScore:     dm.scoreByDimension.deployment   ?? 0,
        infrastructureScore: dm.averageInfraScore,
        monitoringScore:     dm.averageMonitoringScore,
        scalingScore:        dm.averageScalingScore,
        recoveryScore:       dm.averageRecoveryScore,
        costScore:           dm.averageCostScore,
        learningStatistics: {
          totalRecords:  dl.totalRecords,
          improvedCount: dl.improvedCount,
          averageScore:  dl.averageScore,
          byInfra:       dl.byInfra,
          byProvider:    dl.byProvider,
        },
        plannerDistribution: dm.topInfraTypes,
        cloudDistribution:   dm.topCloudProviders,
        persistenceHealth: {
          totalSnapshots: dp.totalSnapshots,
          currentVersion: dp.currentVersion,
          capacityUsed:   dp.capacityUsed,
          oldestVersion:  dp.oldestVersion,
          newestVersion:  dp.newestVersion,
        },
      };
    })(),
    // V8.8: Autonomous QA Architect telemetry (additive)
    qaArchitecture: (() => {
      const qm = getQAMetrics();
      const ql = getQALearningStats();
      const qp = getQAPersistenceStats();
      return {
        ...qm,
        qaScore:            qm.averageScore,
        coverageScore:      qm.averageCoverageScore,
        performanceScore:   qm.averagePerfScore,
        securityScore:      qm.averageSecurityScore,
        accessibilityScore: qm.averageA11yScore,
        compatibilityScore: qm.scoreByDimension.compatibility ?? 0,
        riskScore:          qm.averageRiskScore,
        reliabilityScore:   qm.averageReliabilityScore,
        learningStatistics: {
          totalRecords:  ql.totalRecords,
          improvedCount: ql.improvedCount,
          averageScore:  ql.averageScore,
          byStrategy:    ql.byStrategy,
        },
        plannerDistribution: qm.topStrategies,
        persistenceHealth: {
          totalSnapshots: qp.totalSnapshots,
          currentVersion: qp.currentVersion,
          capacityUsed:   qp.capacityUsed,
          oldestVersion:  qp.oldestVersion,
          newestVersion:  qp.newestVersion,
        },
      };
    })(),
    // V8.9: Security Architecture Integration telemetry (additive)
    securityArchitecture: (() => {
      const sm = getSecurityArchitectMetrics();
      const sl = getSecurityLearningStats();
      const sp = getSecurityArchitectPersistenceStats();
      return {
        ...sm,
        overallSecurityScore:  sm.averageScore,
        privacyScore:          sm.scoreByDimension.privacy ?? 0,
        complianceScore:       sm.scoreByDimension.compliance ?? 0,
        threatScore:           sm.scoreByDimension.threatModel ?? 0,
        encryptionScore:       sm.scoreByDimension.encryption ?? 0,
        secretManagementScore: sm.scoreByDimension.secrets ?? 0,
        owaspScore:            sm.scoreByDimension.owasp ?? 0,
        learningStatistics: {
          totalRecords:  sl.totalRecords,
          improvedCount: sl.improvedCount,
          averageScore:  sl.averageScore,
          byType:        sl.byType,
        },
        plannerDistribution: sm.topBackendTypes,
        persistenceHealth: {
          totalSnapshots: sp.totalSnapshots,
          currentVersion: sp.currentVersion,
          capacityUsed:   sp.capacityUsed,
          oldestVersion:  sp.oldestVersion,
          newestVersion:  sp.newestVersion,
        },
      };
    })(),
    // V9.0: Runtime Intelligence telemetry (additive)
    runtimeIntelligence: (() => {
      const rm = getRuntimeMetrics();
      const rl = getRuntimeLearningStats();
      const rp = getRuntimePersistenceStats();
      return {
        ...rm,
        runtimeScore:            rm.averageScore,
        strategyDistribution:    rm.strategyDistribution,
        averageGenerationTime:   rm.averageGenerationTime,
        repairEfficiency:        rm.repairEfficiency,
        evaluationEfficiency:    rm.evaluationEfficiency,
        optimizationEfficiency:  rm.optimizationEfficiency,
        tokenEfficiency:         rm.tokenEfficiency,
        candidateEfficiency:     rm.candidateEfficiency,
        cacheHitRate:            rm.cacheHitRate,
        learningStatistics: {
          totalRecords:       rl.totalRecords,
          improvedCount:      rl.improvedCount,
          averageScore:       rl.averageScore,
          averageBuildTimeMs: rl.averageBuildTimeMs,
          timeAccuracy:       rl.timeAccuracy,
          repairAccuracy:     rl.repairAccuracy,
          byMode:             rl.byMode,
        },
        persistenceHealth: {
          totalSnapshots: rp.totalSnapshots,
          currentVersion: rp.currentVersion,
          capacityUsed:   rp.capacityUsed,
          oldestVersion:  rp.oldestVersion,
          newestVersion:  rp.newestVersion,
        },
      };
    })(),
    generatedAt: new Date().toISOString(),
  });
});

export default router;
