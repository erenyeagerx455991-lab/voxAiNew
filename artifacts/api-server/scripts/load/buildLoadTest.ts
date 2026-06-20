#!/usr/bin/env tsx
/**
 * V7.0.5 — Real Build Endpoint Load Test
 *
 * Targets POST /agents/build (SSE endpoint) — NOT /api/healthz.
 * Each "user" opens a real SSE connection, sends a real prompt, and waits
 * for a `done` or `error` event.  All LLM calls are real.
 *
 * Usage:
 *   pnpm exec tsx scripts/load/buildLoadTest.ts [concurrency] [prompt]
 *
 * Examples:
 *   pnpm exec tsx scripts/load/buildLoadTest.ts 1
 *   pnpm exec tsx scripts/load/buildLoadTest.ts 3 "SaaS landing page"
 *
 * Output: scripts/load/build-results-<concurrency>-users.json
 */

import { randomUUID } from "crypto";
import { writeFileSync } from "fs";

const BASE_URL =
  process.env["LOAD_TARGET"] ??
  "http://localhost:" + (process.env["PORT"] ?? "8080");

const CONCURRENCY = parseInt(process.argv[2] ?? "1", 10);
const DEFAULT_PROMPT =
  process.argv[3] ?? "Build a minimal SaaS landing page with hero and pricing sections";

// Per-build timeout — 5 minutes (matches server DEFAULT_JOB_TIMEOUT_MS)
const BUILD_TIMEOUT_MS = 5 * 60 * 1_000;

// Resource sampling interval
const SAMPLE_INTERVAL_MS = 5_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SSEEvent {
  type: string;
  step?: number;
  agent?: string;
  status?: string;
  error?: string;
  [key: string]: unknown;
}

interface BuildResult {
  buildId: string;
  userId: string;
  prompt: string;
  startedAt: number;
  firstEventAt: number | null;
  completedAt: number | null;
  queueWaitMs: number | null;
  buildMs: number | null;
  totalMs: number | null;
  success: boolean;
  failureReason: string | null;
  timedOut: boolean;
  sseEvents: SSEEvent[];
  sseEventCount: number;
  stepSequence: string[];
  duplicateEvents: string[];
  outOfOrderEvents: string[];
  droppedStream: boolean;
  httpStatus: number | null;
}

interface ResourceSample {
  ts: number;
  heapUsedMB: number;
  rssMB: number;
  activeJobs: number;
  queuedJobs: number;
  enqueuedTotal: number;
  completedTotal: number;
  failedTotal: number;
}

// ─── SSE Stream Reader ────────────────────────────────────────────────────────

async function runBuild(
  userId: string,
  prompt: string,
  idx: number
): Promise<BuildResult> {
  const buildId = randomUUID();
  const chatId = `load-test-${idx}-${Date.now()}`;
  const startedAt = Date.now();
  let firstEventAt: number | null = null;

  const result: BuildResult = {
    buildId,
    userId,
    prompt,
    startedAt,
    firstEventAt: null,
    completedAt: null,
    queueWaitMs: null,
    buildMs: null,
    totalMs: null,
    success: false,
    failureReason: null,
    timedOut: false,
    sseEvents: [],
    sseEventCount: 0,
    stepSequence: [],
    duplicateEvents: [],
    outOfOrderEvents: [],
    droppedStream: false,
    httpStatus: null,
  };

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    result.timedOut = true;
    result.droppedStream = true;
    result.failureReason = "Build timeout — no completion event within 5 minutes";
    controller.abort();
  }, BUILD_TIMEOUT_MS);

  try {
    const resp = await fetch(`${BASE_URL}/api/agents/build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
        "x-load-test": "true",
      },
      body: JSON.stringify({ prompt, chatId }),
      signal: controller.signal,
    });

    result.httpStatus = resp.status;

    if (!resp.ok) {
      const body = await resp.text().catch(() => "(unreadable)");
      result.failureReason = `HTTP ${resp.status}: ${body.slice(0, 200)}`;
      result.completedAt = Date.now();
      result.totalMs = result.completedAt - startedAt;
      return result;
    }

    // Read the SSE stream
    const reader = resp.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let lastEventType = "";
    const seenEventKeys = new Set<string>();
    let startedEventAt: number | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (!result.success && !result.failureReason) {
          result.droppedStream = true;
          result.failureReason = "SSE stream closed without done/error event";
        }
        break;
      }

      buf += dec.decode(value, { stream: true });

      // Parse SSE events (split on double-newline)
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";

      for (const part of parts) {
        const dataLine = part
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;

        const raw = dataLine.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;

        let event: SSEEvent;
        try {
          event = JSON.parse(raw) as SSEEvent;
        } catch {
          continue;
        }

        const now = Date.now();
        if (!firstEventAt) {
          firstEventAt = now;
          result.firstEventAt = now;
        }

        result.sseEvents.push(event);
        result.sseEventCount++;

        // Duplicate detection: type+step combo
        const key = `${event.type}:${event.step ?? "?"}:${event.agent ?? "?"}`;
        if (seenEventKeys.has(key)) {
          result.duplicateEvents.push(key);
        }
        seenEventKeys.add(key);

        // Out-of-order step detection
        if (event.type === "step" && typeof event.step === "number") {
          const lastStep = result.stepSequence.length > 0
            ? parseInt(result.stepSequence[result.stepSequence.length - 1].split(":")[0])
            : -1;
          if (event.step < lastStep) {
            result.outOfOrderEvents.push(
              `step ${event.step} after step ${lastStep}`
            );
          }
          result.stepSequence.push(`${event.step}:${event.agent ?? "?"}:${event.status ?? "?"}`);
        }

        // Track queue→run boundary (used to compute queueWaitMs)
        if (event.type === "step" && event.step === 0) {
          startedEventAt = now;
        }

        if (lastEventType === event.type && event.type !== "step") {
          // Allow multiple steps but flag repeated top-level events
        }
        lastEventType = event.type;

        // Terminal events
        if (event.type === "done") {
          result.success = true;
          result.completedAt = now;
          result.totalMs = now - startedAt;
          result.buildMs = startedEventAt ? now - startedEventAt : now - (firstEventAt ?? startedAt);
          result.queueWaitMs = firstEventAt ? firstEventAt - startedAt : 0;
          clearTimeout(timeoutHandle);
          reader.cancel().catch(() => {});
          break;
        }

        if (event.type === "error") {
          result.failureReason = event.error ?? "Unknown error from server";
          result.completedAt = now;
          result.totalMs = now - startedAt;
          result.buildMs = startedEventAt ? now - startedEventAt : null;
          result.queueWaitMs = firstEventAt ? firstEventAt - startedAt : 0;
          clearTimeout(timeoutHandle);
          reader.cancel().catch(() => {});
          break;
        }
      }

      // Break out if terminal event was found
      if (result.completedAt) break;
    }

    // Final queue wait if we never got a start event
    if (result.queueWaitMs === null && firstEventAt !== null) {
      result.queueWaitMs = firstEventAt - startedAt;
    }

    return result;
  } catch (err: unknown) {
    clearTimeout(timeoutHandle);
    if (!result.timedOut) {
      result.failureReason =
        err instanceof Error ? err.message : String(err);
    }
    result.completedAt = Date.now();
    result.totalMs = result.completedAt - startedAt;
    return result;
  }
}

// ─── Queue Metrics Snapshot ───────────────────────────────────────────────────

async function fetchQueueMetrics(): Promise<{ activeNow: number; queuedNow: number; enqueuedTotal: number; completedTotal: number; failedTotal: number; avgWaitMs: number } | null> {
  try {
    const r = await fetch(`${BASE_URL}/api/telemetry/queue`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return null;
    const d = await r.json() as { queue?: { activeNow?: number; queuedNow?: number; enqueuedTotal?: number; completedTotal?: number; failedTotal?: number; avgWaitMs?: number } };
    return {
      activeNow:     d.queue?.activeNow     ?? 0,
      queuedNow:     d.queue?.queuedNow     ?? 0,
      enqueuedTotal: d.queue?.enqueuedTotal ?? 0,
      completedTotal:d.queue?.completedTotal?? 0,
      failedTotal:   d.queue?.failedTotal   ?? 0,
      avgWaitMs:     d.queue?.avgWaitMs     ?? 0,
    };
  } catch { return null; }
}

// ─── Resource Sampler ─────────────────────────────────────────────────────────

async function sampleResources(samples: ResourceSample[]): Promise<void> {
  const metrics = await fetchQueueMetrics();
  const m = process.memoryUsage();
  samples.push({
    ts: Date.now(),
    heapUsedMB: +(m.heapUsed / 1024 / 1024).toFixed(2),
    rssMB:      +(m.rss      / 1024 / 1024).toFixed(2),
    activeJobs:    metrics?.activeNow     ?? -1,
    queuedJobs:    metrics?.queuedNow     ?? -1,
    enqueuedTotal: metrics?.enqueuedTotal ?? -1,
    completedTotal:metrics?.completedTotal?? -1,
    failedTotal:   metrics?.failedTotal   ?? -1,
  });
}

// ─── Failure Injection Helpers ────────────────────────────────────────────────

async function runInvalidPrompt(): Promise<{ status: number; body: string }> {
  const resp = await fetch(`${BASE_URL}/api/agents/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "" }),
    signal: AbortSignal.timeout(5_000),
  }).catch((e: unknown) => { throw e; });
  const body = await resp.text();
  return { status: resp.status, body: body.slice(0, 300) };
}

async function runMissingPrompt(): Promise<{ status: number; body: string }> {
  const resp = await fetch(`${BASE_URL}/api/agents/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(5_000),
  });
  const body = await resp.text();
  return { status: resp.status, body: body.slice(0, 300) };
}

async function runEarlyDisconnect(): Promise<{ disconnectedAfterMs: number; streamHadData: boolean }> {
  const controller = new AbortController();
  const startedAt = Date.now();
  let streamHadData = false;
  try {
    const resp = await fetch(`${BASE_URL}/api/agents/build`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Build a simple landing page",
        chatId: `disconnect-test-${Date.now()}`,
      }),
      signal: controller.signal,
    });
    if (resp.ok && resp.body) {
      const reader = resp.body.getReader();
      const { value } = await reader.read();
      if (value && value.length > 0) streamHadData = true;
      // Disconnect immediately after receiving first chunk
      controller.abort();
    }
  } catch { /* expected abort */ }
  return { disconnectedAfterMs: Date.now() - startedAt, streamHadData };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  V7.0.5 Build Endpoint Load Test                    ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);
  console.log(`  Target:      ${BASE_URL}/api/agents/build`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Prompt:      "${DEFAULT_PROMPT}"`);
  console.log(`  Timeout:     ${BUILD_TIMEOUT_MS / 1000}s per build\n`);

  // ── Pre-flight check ────────────────────────────────────────────────────
  const healthResp = await fetch(`${BASE_URL}/api/healthz`, { signal: AbortSignal.timeout(3000) }).catch(() => null);
  if (!healthResp?.ok) {
    console.error("ERROR: API server not reachable at", BASE_URL);
    process.exit(1);
  }

  const baselineMetrics = await fetchQueueMetrics();
  console.log(`  Baseline queue state:`, JSON.stringify(baselineMetrics));
  console.log();

  // ── Resource samples ─────────────────────────────────────────────────────
  const resourceSamples: ResourceSample[] = [];
  await sampleResources(resourceSamples);

  const sampler = setInterval(() => {
    sampleResources(resourceSamples).catch(() => {});
  }, SAMPLE_INTERVAL_MS);

  // ── Failure injection (run before real builds to not pollute metrics) ────
  console.log("── Failure Injection Tests ─────────────────────────────");

  let invalidPromptResult: { status: number; body: string } | null = null;
  let missingPromptResult: { status: number; body: string } | null = null;
  let disconnectResult: { disconnectedAfterMs: number; streamHadData: boolean } | null = null;

  try {
    invalidPromptResult = await runInvalidPrompt();
    console.log(`  [empty prompt]   HTTP ${invalidPromptResult.status} — ${invalidPromptResult.body.slice(0, 80)}`);
  } catch (e) {
    console.log(`  [empty prompt]   ERROR: ${e}`);
  }

  try {
    missingPromptResult = await runMissingPrompt();
    console.log(`  [missing prompt] HTTP ${missingPromptResult.status} — ${missingPromptResult.body.slice(0, 80)}`);
  } catch (e) {
    console.log(`  [missing prompt] ERROR: ${e}`);
  }

  try {
    disconnectResult = await runEarlyDisconnect();
    console.log(`  [early abort]    Disconnected after ${disconnectResult.disconnectedAfterMs}ms, hadData=${disconnectResult.streamHadData}`);
    // Give server 2s to clean up
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.log(`  [early abort]    ERROR: ${e}`);
  }

  console.log();

  // ── Real build tests ─────────────────────────────────────────────────────
  console.log(`── Real Build Test — ${CONCURRENCY} Concurrent User(s) ────────────────`);
  console.log(`  NOTE: Each build makes real LLM API calls (Groq + OpenRouter).`);
  console.log(`  Build durations are determined by AI response times.\n`);

  const buildStartedAt = Date.now();
  const userIds = Array.from({ length: CONCURRENCY }, (_, i) => `load-test-user-${i + 1}`);

  // Launch all builds concurrently
  const buildPromises = userIds.map((uid, i) => {
    console.log(`  → Launching build for ${uid}…`);
    return runBuild(uid, DEFAULT_PROMPT, i + 1);
  });

  // Progress reporting
  const progressTimer = setInterval(() => {
    const elapsed = ((Date.now() - buildStartedAt) / 1000).toFixed(0);
    process.stdout.write(`\r  ⏱  ${elapsed}s elapsed…`);
  }, 2000);

  const results = await Promise.all(buildPromises);
  clearInterval(progressTimer);
  console.log("\n");

  // Final resource sample
  await sampleResources(resourceSamples);
  clearInterval(sampler);

  const buildEndedAt = Date.now();
  const testDurationMs = buildEndedAt - buildStartedAt;

  // ── Compute summary stats ─────────────────────────────────────────────────
  const succeeded   = results.filter(r => r.success);
  const failed      = results.filter(r => !r.success && !r.timedOut);
  const timedOut    = results.filter(r => r.timedOut);

  const totalMsTimes   = results.filter(r => r.totalMs !== null).map(r => r.totalMs!);
  const buildMsTimes   = succeeded.map(r => r.buildMs!);
  const queueWaitTimes = results.filter(r => r.queueWaitMs !== null).map(r => r.queueWaitMs!);

  function percentile(arr: number[], p: number): number {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }
  function mean(arr: number[]): number {
    return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  }

  const heapSamples  = resourceSamples.map(s => s.heapUsedMB);
  const heapGrowthMB = heapSamples.length >= 2
    ? +(heapSamples[heapSamples.length - 1] - heapSamples[0]).toFixed(2)
    : null;

  const finalMetrics = await fetchQueueMetrics();

  // ── Print results ──────────────────────────────────────────────────────────
  console.log("── Results ──────────────────────────────────────────────");
  console.log(`  Concurrency:       ${CONCURRENCY}`);
  console.log(`  Succeeded:         ${succeeded.length} / ${CONCURRENCY}`);
  console.log(`  Failed:            ${failed.length}`);
  console.log(`  Timed out:         ${timedOut.length}`);
  console.log(`  Test duration:     ${(testDurationMs / 1000).toFixed(1)}s`);
  console.log();

  if (succeeded.length > 0) {
    const bpm = succeeded.length / (testDurationMs / 60_000);
    console.log(`  Builds/min:        ${bpm.toFixed(2)}`);
    console.log(`  Avg build time:    ${mean(buildMsTimes)}ms`);
    console.log(`  P50 build time:    ${percentile(buildMsTimes, 50)}ms`);
    console.log(`  P95 build time:    ${percentile(buildMsTimes, 95)}ms`);
    console.log(`  Max build time:    ${Math.max(...buildMsTimes)}ms`);
  }

  if (queueWaitTimes.length > 0) {
    console.log(`  Avg queue wait:    ${mean(queueWaitTimes)}ms`);
    console.log(`  P50 queue wait:    ${percentile(queueWaitTimes, 50)}ms`);
    console.log(`  P95 queue wait:    ${percentile(queueWaitTimes, 95)}ms`);
    console.log(`  Max queue wait:    ${Math.max(...queueWaitTimes)}ms`);
  }

  console.log();
  console.log("── SSE Validation ───────────────────────────────────────");
  for (const r of results) {
    const status = r.success ? "✅" : r.timedOut ? "⏱" : "❌";
    console.log(`  ${status} ${r.userId}: events=${r.sseEventCount}, dups=${r.duplicateEvents.length}, ooo=${r.outOfOrderEvents.length}, dropped=${r.droppedStream}`);
    if (!r.success) console.log(`     reason: ${r.failureReason}`);
  }

  console.log();
  console.log("── Failure Injection Results ─────────────────────────────");
  console.log(`  Empty prompt:   HTTP ${invalidPromptResult?.status ?? "N/A"} (expected 400)`);
  console.log(`  Missing prompt: HTTP ${missingPromptResult?.status ?? "N/A"} (expected 400)`);
  console.log(`  Early abort:    Stream received data=${disconnectResult?.streamHadData ?? "N/A"}`);

  console.log();
  console.log("── Resource Usage ────────────────────────────────────────");
  console.log(`  Samples:        ${resourceSamples.length}`);
  if (resourceSamples.length > 0) {
    console.log(`  Heap start:     ${resourceSamples[0].heapUsedMB} MB`);
    console.log(`  Heap end:       ${resourceSamples[resourceSamples.length - 1].heapUsedMB} MB`);
    console.log(`  Heap growth:    ${heapGrowthMB ?? "N/A"} MB`);
    console.log(`  RSS end:        ${resourceSamples[resourceSamples.length - 1].rssMB} MB`);
  }

  console.log();
  console.log("── Final Queue Metrics ───────────────────────────────────");
  console.log(JSON.stringify(finalMetrics, null, 2));

  // ── Write JSON results ────────────────────────────────────────────────────
  const output = {
    testConfig: {
      concurrency: CONCURRENCY,
      prompt: DEFAULT_PROMPT,
      buildTimeoutMs: BUILD_TIMEOUT_MS,
      target: `${BASE_URL}/api/agents/build`,
      runAt: new Date(buildStartedAt).toISOString(),
    },
    summary: {
      testDurationMs,
      succeeded:    succeeded.length,
      failed:       failed.length,
      timedOut:     timedOut.length,
      buildsPerMin: succeeded.length > 0
        ? +(succeeded.length / (testDurationMs / 60_000)).toFixed(4)
        : null,
    },
    buildTiming: succeeded.length > 0 ? {
      avgMs:  mean(buildMsTimes),
      p50Ms:  percentile(buildMsTimes, 50),
      p95Ms:  percentile(buildMsTimes, 95),
      maxMs:  Math.max(...buildMsTimes),
      minMs:  Math.min(...buildMsTimes),
    } : null,
    queueTiming: queueWaitTimes.length > 0 ? {
      avgMs:  mean(queueWaitTimes),
      p50Ms:  percentile(queueWaitTimes, 50),
      p95Ms:  percentile(queueWaitTimes, 95),
      maxMs:  Math.max(...queueWaitTimes),
    } : null,
    sseValidation: {
      allStreamsCompleted: results.every(r => r.completedAt !== null || r.timedOut),
      totalDuplicateEvents: results.reduce((a, r) => a + r.duplicateEvents.length, 0),
      totalOutOfOrderEvents: results.reduce((a, r) => a + r.outOfOrderEvents.length, 0),
      droppedStreams: results.filter(r => r.droppedStream).length,
      perBuild: results.map(r => ({
        userId: r.userId,
        success: r.success,
        timedOut: r.timedOut,
        sseEventCount: r.sseEventCount,
        duplicates: r.duplicateEvents,
        outOfOrder: r.outOfOrderEvents,
        droppedStream: r.droppedStream,
        stepSequence: r.stepSequence,
        failureReason: r.failureReason,
      })),
    },
    failureInjection: {
      emptyPrompt:   invalidPromptResult,
      missingPrompt: missingPromptResult,
      earlyDisconnect: disconnectResult,
    },
    resourceSamples,
    heapGrowthMB,
    finalQueueMetrics: finalMetrics,
    rawResults: results.map(r => ({
      ...r,
      sseEvents: r.sseEvents.slice(0, 20), // truncate for file size
    })),
  };

  const outFile = `scripts/load/build-results-${CONCURRENCY}-users.json`;
  writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`\n  Report written: ${outFile}\n`);
}

main().catch((err) => {
  console.error("Load test error:", err);
  process.exit(1);
});
