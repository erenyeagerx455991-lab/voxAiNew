export interface MetricsSnapshot {
  builds: Record<string, unknown>;
  agents: Record<string, unknown>;
  tokens: Record<string, unknown>;
  repairs: Record<string, unknown>;
  runtime: Record<string, unknown>;
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, HistogramData>;
}

export interface HistogramData {
  count: number;
  sum: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  values: number[];
}

export interface MetricsProvider {
  increment(key: string, by?: number): void;
  setGauge(key: string, value: number): void;
  recordDuration(key: string, durationMs: number): void;
  snapshot(): MetricsSnapshot;
  reset(): void;
}

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export class MemoryMetricsProvider implements MetricsProvider {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  private _buildMetrics: Record<string, unknown> = {};
  private _agentMetrics: Record<string, unknown> = {};
  private _tokenMetrics: Record<string, unknown> = {};
  private _repairMetrics: Record<string, unknown> = {};
  private _runtimeMetrics: Record<string, unknown> = {};

  increment(key: string, by = 1): void {
    this.counters.set(key, (this.counters.get(key) ?? 0) + by);
  }

  setGauge(key: string, value: number): void {
    this.gauges.set(key, value);
  }

  recordDuration(key: string, durationMs: number): void {
    const existing = this.histograms.get(key) ?? [];
    existing.push(durationMs);
    this.histograms.set(key, existing);
  }

  setSection(section: 'builds' | 'agents' | 'tokens' | 'repairs' | 'runtime', data: Record<string, unknown>): void {
    switch (section) {
      case 'builds':  this._buildMetrics   = { ...this._buildMetrics,   ...data }; break;
      case 'agents':  this._agentMetrics   = { ...this._agentMetrics,   ...data }; break;
      case 'tokens':  this._tokenMetrics   = { ...this._tokenMetrics,   ...data }; break;
      case 'repairs': this._repairMetrics  = { ...this._repairMetrics,  ...data }; break;
      case 'runtime': this._runtimeMetrics = { ...this._runtimeMetrics, ...data }; break;
    }
  }

  snapshot(): MetricsSnapshot {
    const counters: Record<string, number> = {};
    for (const [k, v] of this.counters) counters[k] = v;

    const gauges: Record<string, number> = {};
    for (const [k, v] of this.gauges) gauges[k] = v;

    const histograms: Record<string, HistogramData> = {};
    for (const [k, values] of this.histograms) {
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      histograms[k] = {
        count: sorted.length,
        sum,
        min: sorted[0] ?? 0,
        max: sorted[sorted.length - 1] ?? 0,
        p50: computePercentile(sorted, 50),
        p95: computePercentile(sorted, 95),
        p99: computePercentile(sorted, 99),
        values: sorted.slice(-100),
      };
    }

    return {
      builds:  this._buildMetrics,
      agents:  this._agentMetrics,
      tokens:  this._tokenMetrics,
      repairs: this._repairMetrics,
      runtime: this._runtimeMetrics,
      counters,
      gauges,
      histograms,
    };
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this._buildMetrics = {};
    this._agentMetrics = {};
    this._tokenMetrics = {};
    this._repairMetrics = {};
    this._runtimeMetrics = {};
  }
}

export const globalMetrics = new MemoryMetricsProvider();
