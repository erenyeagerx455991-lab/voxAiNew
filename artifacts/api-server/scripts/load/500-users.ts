#!/usr/bin/env tsx
/**
 * Load Test — 500 Concurrent Users
 * High-concurrency test for stress/soak scenarios.
 * Run: pnpm exec tsx scripts/load/500-users.ts
 * Note: Run against a deployed instance — Replit dev env has limited fd capacity.
 */
import autocannon from "autocannon";

const BASE_URL = process.env["LOAD_TARGET"] ?? "http://localhost:" + (process.env["PORT"] ?? "3001");

async function run(): Promise<void> {
  console.log(`\n🚀 Load Test — 500 Users @ ${BASE_URL}\n`);
  console.log("WARNING: Requires a production/deployed environment with higher fd limits.\n");

  const result = await autocannon({
    url: `${BASE_URL}/api/healthz`,
    connections: 500,
    duration: 60,
    pipelining: 1,
    headers: { "content-type": "application/json" },
    overallRate: 1000,
  } as autocannon.Options);

  const report = {
    concurrency: 500,
    durationSeconds: 60,
    requestsTotal:  result.requests.total,
    throughputRps:  result.requests.average,
    latencyAvgMs:   result.latency.average,
    latencyP50Ms:   result.latency.p50,
    latencyP95Ms:   result.latency.p99,
    latencyMaxMs:   result.latency.max,
    errors:         result.errors,
    non2xx:         result.non2xx,
    bytesPerSec:    result.throughput.average,
    generatedAt:    new Date().toISOString(),
  };

  console.log("Results:");
  console.log(`  Requests:      ${report.requestsTotal} total`);
  console.log(`  Throughput:    ${report.throughputRps.toFixed(0)} req/s`);
  console.log(`  Latency avg:   ${report.latencyAvgMs} ms`);
  console.log(`  Latency p95:   ${report.latencyP95Ms} ms`);
  console.log(`  Errors:        ${report.errors}`);
  console.log(`  Non-2xx:       ${report.non2xx}`);

  const fs = await import("fs");
  const outFile = "scripts/load/results-500-users.json";
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Report written to ${outFile}`);
}

run().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});
