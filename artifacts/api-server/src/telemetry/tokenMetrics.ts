import { globalMetrics } from "./metricsProvider.js";
import { MAX_TOKEN_SAMPLES } from "./constants.js";

export type LLMProvider = "groq" | "openrouter";

interface ProviderRecord {
  requests: number;
  failures: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencies: number[];
  modelCalls: Record<string, number>;
}

const providerRecords: Record<LLMProvider, ProviderRecord> = {
  groq:       { requests: 0, failures: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, latencies: [], modelCalls: {} },
  openrouter: { requests: 0, failures: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, latencies: [], modelCalls: {} },
};

let lifetimeTotalTokens = 0;

function cappedPush(arr: number[], value: number): void {
  arr.push(value);
  if (arr.length > MAX_TOKEN_SAMPLES) arr.shift();
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export function recordLLMCall(opts: {
  provider: LLMProvider;
  model: string;
  latencyMs: number;
  success: boolean;
  promptTokens?: number;
  completionTokens?: number;
}): void {
  const rec = providerRecords[opts.provider];
  rec.requests++;
  if (!opts.success) {
    rec.failures++;
    globalMetrics.increment(`tokens.${opts.provider}.failures`);
  } else {
    const pt = opts.promptTokens ?? 0;
    const ct = opts.completionTokens ?? 0;
    const tt = pt + ct;
    rec.promptTokens += pt;
    rec.completionTokens += ct;
    rec.totalTokens += tt;
    lifetimeTotalTokens += tt;
    cappedPush(rec.latencies, opts.latencyMs);
    rec.modelCalls[opts.model] = (rec.modelCalls[opts.model] ?? 0) + 1;
    globalMetrics.increment(`tokens.${opts.provider}.requests`);
    globalMetrics.increment(`tokens.${opts.provider}.total`, tt);
    globalMetrics.recordDuration(`tokens.${opts.provider}.latency`, opts.latencyMs);
  }
  syncSnapshot();
}

function summarizeProvider(rec: ProviderRecord) {
  const sorted = [...rec.latencies].sort((a, b) => a - b);
  const avg = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  return {
    requests: rec.requests,
    failures: rec.failures,
    successRate: rec.requests > 0 ? (((rec.requests - rec.failures) / rec.requests) * 100).toFixed(1) + "%" : "n/a",
    promptTokens: rec.promptTokens,
    completionTokens: rec.completionTokens,
    totalTokens: rec.totalTokens,
    avgLatencyMs: Math.round(avg),
    p95LatencyMs: percentile(sorted, 95),
    modelBreakdown: rec.modelCalls,
  };
}

function syncSnapshot(): void {
  globalMetrics.setSection("tokens", {
    groq: summarizeProvider(providerRecords.groq),
    openrouter: summarizeProvider(providerRecords.openrouter),
    lifetimeTotalTokens,
  });
}

export function getTokenSnapshot() {
  syncSnapshot();
  return globalMetrics.snapshot().tokens;
}
