#!/usr/bin/env tsx
/**
 * Load Test — 100 Concurrent Users
 * Simulates 100 users hitting the health endpoint for 30 seconds.
 * Run: pnpm exec tsx scripts/load/100-users.ts
 */
import autocannon from "autocannon";

const BASE_URL = process.env["LOAD_TARGET"] ?? "http://localhost:" + (process.env["PORT"] ?? "3001");

async function run(): Promise<void> {
  console.log(`\n🚀 Load Test — 100 Users @ ${BASE_URL}\n`);

  const result = await autocannon({
    url: `${BASE_URL}/api/healthz`,
    connections: 100,
    duration: 30,
    pipelining: 1,
    headers: { "content-type": "application/json" },
  } as autocannon.Options);

  const report = {
    concurrency: 100,
    durationSeconds: 30,
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
  console.log(`  Latency max:   ${report.latencyMaxMs} ms`);
  console.log(`  Errors:        ${report.errors}`);

  const fs = await import("fs");
  const outFile = "scripts/load/results-100-users.json";
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Report written to ${outFile}`);
}

run().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});
