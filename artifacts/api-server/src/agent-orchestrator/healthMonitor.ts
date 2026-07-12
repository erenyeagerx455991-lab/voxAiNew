// ── V9.2 Orchestrator — Agent Health Monitor ─────────────────────────────────
//
// Tracks per-agent execution outcomes (failure rate, duration, quality, cost,
// retries, timeouts) and computes a 0-100 health score + status. In-memory,
// capped per agent, never throws into the pipeline.
import type { AgentExecutionOutcome, AgentHealthSnapshot, AgentHealthStatus, AgentName } from './types.js';
import { ALL_AGENT_NAMES } from './agentRegistry.js';

const MAX_SAMPLES_PER_AGENT = 200;

interface AgentSampleStore {
  outcomes: AgentExecutionOutcome[];
}

const store = new Map<AgentName, AgentSampleStore>();

function getStore(agent: AgentName): AgentSampleStore {
  let s = store.get(agent);
  if (!s) { s = { outcomes: [] }; store.set(agent, s); }
  return s;
}

export function recordAgentOutcome(outcome: AgentExecutionOutcome): void {
  try {
    const s = getStore(outcome.agent);
    s.outcomes.push(outcome);
    if (s.outcomes.length > MAX_SAMPLES_PER_AGENT) s.outcomes.shift();
  } catch { /* health tracking must never break a build */ }
}

function statusFromScore(score: number): AgentHealthStatus {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
}

export function getAgentHealth(agent: AgentName): AgentHealthSnapshot {
  const outcomes = store.get(agent)?.outcomes ?? [];
  const n = outcomes.length;
  if (n === 0) {
    return {
      agent, failureRate: 0, averageDurationMs: 0, averageQuality: 10,
      averageCost: 0, retryCount: 0, timeoutRate: 0, healthScore: 100,
      status: 'healthy', sampleCount: 0,
    };
  }

  const failures = outcomes.filter(o => !o.success).length;
  const timeouts = outcomes.filter(o => o.timedOut).length;
  const totalDuration = outcomes.reduce((s, o) => s + o.durationMs, 0);
  const totalRetries = outcomes.reduce((s, o) => s + o.retries, 0);
  const qualities = outcomes.filter(o => o.qualityScore !== undefined).map(o => o.qualityScore as number);
  const costs = outcomes.filter(o => o.costTokens !== undefined).map(o => o.costTokens as number);

  const failureRate = failures / n;
  const timeoutRate = timeouts / n;
  const averageDurationMs = Math.round(totalDuration / n);
  const averageQuality = qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 10;
  const averageCost = costs.length > 0 ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : 0;

  // Health score: penalize failures/timeouts heavily, reward quality.
  const healthScore = Math.max(0, Math.min(100, Math.round(
    100 - failureRate * 60 - timeoutRate * 30 + (averageQuality - 5) * 4,
  )));

  return {
    agent, failureRate: parseFloat(failureRate.toFixed(3)), averageDurationMs,
    averageQuality: parseFloat(averageQuality.toFixed(2)), averageCost,
    retryCount: totalRetries, timeoutRate: parseFloat(timeoutRate.toFixed(3)),
    healthScore, status: statusFromScore(healthScore), sampleCount: n,
  };
}

export function getAllAgentHealth(): AgentHealthSnapshot[] {
  return ALL_AGENT_NAMES.map(getAgentHealth);
}

export function resetAgentHealth(): void {
  store.clear();
}
