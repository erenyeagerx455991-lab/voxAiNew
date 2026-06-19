import { Router } from "express";
import { authMiddleware } from "../security/authMiddleware.js";
import { globalMetrics } from "../telemetry/metricsProvider.js";

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

export default router;
