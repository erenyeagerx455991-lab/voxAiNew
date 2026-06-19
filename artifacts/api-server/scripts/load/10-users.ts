#!/usr/bin/env node
/**
 * Load Test — 10 Concurrent Users
 * Simulates 10 users hitting lightweight endpoints for 10 seconds.
 * Run: node scripts/load/10-users.cjs  (after esbuild compile)
 */
import autocannon from "autocannon";

const BASE_URL = process.env["LOAD_TARGET"] ?? "http://localhost:" + (process.env["PORT"] ?? "3001");

async function run(): Promise<void> {
  console.log(`\n Load Test — 10 Users @ ${BASE_URL}\n`);

  const result = await autocannon({
    url: `${BASE_URL}/api/healthz`,
    connections: 10,
    duration: 10,
    pipelining: 1,
    headers: { "content-type": "application/json" },
  });

  const report = {
    concurrency: 10,
    durationSeconds: 10,
    requestsTotal: result.requests.total,
    throughputRps: result.requests.average,
    latencyAvgMs: result.latency.average,
    latencyP50Ms: result.latency.p50,
    latencyP95Ms: result.latency.p99,
    latencyMaxMs: result.latency.max,
    errors: result.errors,
    non2xx: result.non2xx,
    bytesPerSec: result.throughput.average,
    generatedAt: new Date().toISOString(),
  };

  console.log("Results:");
  console.log(`  Requests:      ${report.requestsTotal} total`);
  console.log(`  Throughput:    ${report.throughputRps.toFixed(0)} req/s`);
  console.log(`  Latency avg:   ${report.latencyAvgMs} ms`);
  console.log(`  Latency p95:   ${report.latencyP95Ms} ms`);
  console.log(`  Latency max:   ${report.latencyMaxMs} ms`);
  console.log(`  Errors:        ${report.errors}`);
  console.log(`  Non-2xx:       ${report.non2xx}`);
  console.log(`  Bytes/sec:     ${(report.bytesPerSec / 1024).toFixed(1)} KB/s`);
  console.log("");

  const fs = await import("fs");
  const outFile = "scripts/load/results-10-users.json";
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Report written to ${outFile}`);
}

run().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});
