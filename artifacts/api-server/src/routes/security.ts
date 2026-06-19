import { Router, type IRouter } from "express";
import { getSecurityMetrics } from "../security/securityMetrics.js";
import { generateBaselineReport } from "../security/securityBaseline.js";
import { getSecurityMetrics as getRuntimeSecurityMetrics } from "../runtime/security/packageScanner.js";

const router: IRouter = Router();

// Public — no auth required (Phase 3 spec: /metrics not protected)
router.get("/security/metrics", (_req, res) => {
  const appMetrics = getSecurityMetrics();
  const runtimeMetrics = getRuntimeSecurityMetrics();
  const baseline = generateBaselineReport();

  res.json({
    app: appMetrics,
    runtime: runtimeMetrics,
    baseline: {
      totalRequests: baseline.totalRequests,
      uptimeMs: baseline.uptimeMs,
      recommendedLimits: baseline.recommendedLimits,
    },
  });
});

export default router;
