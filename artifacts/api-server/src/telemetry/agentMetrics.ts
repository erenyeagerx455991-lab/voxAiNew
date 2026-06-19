import { globalMetrics } from "./metricsProvider.js";

export type AgentName =
  | "Planner"
  | "Architecture"
  | "Design"
  | "Frontend"
  | "CodeFix"
  | "Repair"
  | "Backend"
  | "Database"
  | "Auth"
  | "Scaffold"
  | "RuntimeValidation";

interface AgentRecord {
  calls: number;
  successes: number;
  failures: number;
  retries: number;
  latencies: number[];
}

const agentRecords = new Map<string, AgentRecord>();

function getOrCreate(name: string): AgentRecord {
  if (!agentRecords.has(name)) {
    agentRecords.set(name, { calls: 0, successes: 0, failures: 0, retries: 0, latencies: [] });
  }
  return agentRecords.get(name)!;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export async function withAgentMetrics<T>(
  agentName: AgentName,
  fn: () => Promise<T>
): Promise<T> {
  const rec = getOrCreate(agentName);
  rec.calls++;
  const start = Date.now();
  try {
    const result = await fn();
    const dur = Date.now() - start;
    rec.successes++;
    rec.latencies.push(dur);
    globalMetrics.increment(`agents.${agentName}.calls`);
    globalMetrics.increment(`agents.${agentName}.successes`);
    globalMetrics.recordDuration(`agents.${agentName}.latency`, dur);
    syncSnapshot();
    return result;
  } catch (err) {
    rec.failures++;
    globalMetrics.increment(`agents.${agentName}.failures`);
    syncSnapshot();
    throw err;
  }
}

export function recordAgentRetry(agentName: AgentName): void {
  const rec = getOrCreate(agentName);
  rec.retries++;
  globalMetrics.increment(`agents.${agentName}.retries`);
}

function syncSnapshot(): void {
  const snap: Record<string, unknown> = {};
  for (const [name, rec] of agentRecords) {
    const sorted = [...rec.latencies].sort((a, b) => a - b);
    const avg = sorted.length > 0 ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
    snap[name] = {
      calls: rec.calls,
      successes: rec.successes,
      failures: rec.failures,
      retries: rec.retries,
      avgLatencyMs: Math.round(avg),
      p95LatencyMs: percentile(sorted, 95),
      p99LatencyMs: percentile(sorted, 99),
      successRate: rec.calls > 0 ? ((rec.successes / rec.calls) * 100).toFixed(1) + "%" : "n/a",
    };
  }
  globalMetrics.setSection("agents", snap);
}

export function getAgentSnapshot() {
  syncSnapshot();
  return globalMetrics.snapshot().agents;
}
