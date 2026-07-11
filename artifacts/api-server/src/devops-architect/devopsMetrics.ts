// ── V8.7 DevOps Architect — Metrics & Telemetry ───────────────────────────────
import type {
  DevOpsDimension, InfrastructureType, CloudProvider,
} from './devopsTypes.js';
import { ALL_DEVOPS_DIMENSIONS } from './devopsTypes.js';

interface BuildRecord {
  infrastructureType: InfrastructureType;
  cloudProvider:      CloudProvider;
  overallScore:       number;
  scores:             Partial<Record<DevOpsDimension, number>>;
}

interface MetricsState {
  records:    BuildRecord[];
  learnCount: number;
}

const state: MetricsState = { records: [], learnCount: 0 };

const MAX_RECORDS = 500;

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function recordDevOpsBuild(
  infra: InfrastructureType,
  provider: CloudProvider,
  overallScore: number,
  scores: Partial<Record<DevOpsDimension, number>>,
): void {
  state.records.push({ infrastructureType: infra, cloudProvider: provider, overallScore, scores });
  if (state.records.length > MAX_RECORDS) {
    state.records.splice(0, state.records.length - MAX_RECORDS);
  }
  state.learnCount++;
}

export interface DevOpsMetricsSnapshot {
  totalBuilds:              number;
  averageScore:             number;
  averageInfraScore:        number;
  averageSecurityScore:     number;
  averageMonitoringScore:   number;
  averageScalingScore:      number;
  averageRecoveryScore:     number;
  averageCostScore:         number;
  scoreByDimension:         Record<DevOpsDimension, number>;
  topInfraTypes:            Array<{ type: InfrastructureType; count: number }>;
  topCloudProviders:        Array<{ provider: CloudProvider; count: number }>;
  learningRecordCount:      number;
  lastUpdated:              number;
}

export function getDevOpsMetrics(): DevOpsMetricsSnapshot {
  const { records } = state;
  const n = records.length;

  const emptyDims = Object.fromEntries(
    ALL_DEVOPS_DIMENSIONS.map(d => [d, 0])
  ) as Record<DevOpsDimension, number>;

  if (n === 0) {
    return {
      totalBuilds: 0,
      averageScore: 0,
      averageInfraScore: 0,
      averageSecurityScore: 0,
      averageMonitoringScore: 0,
      averageScalingScore: 0,
      averageRecoveryScore: 0,
      averageCostScore: 0,
      scoreByDimension: emptyDims,
      topInfraTypes: [],
      topCloudProviders: [],
      learningRecordCount: state.learnCount,
      lastUpdated: Date.now(),
    };
  }

  const scoreByDimension = Object.fromEntries(
    ALL_DEVOPS_DIMENSIONS.map(d => [
      d,
      parseFloat(avg(records.map(r => r.scores[d] ?? 0)).toFixed(2)),
    ])
  ) as Record<DevOpsDimension, number>;

  // Top infrastructure types
  const infraCounts = new Map<InfrastructureType, number>();
  const providerCounts = new Map<CloudProvider, number>();
  for (const r of records) {
    infraCounts.set(r.infrastructureType, (infraCounts.get(r.infrastructureType) ?? 0) + 1);
    providerCounts.set(r.cloudProvider, (providerCounts.get(r.cloudProvider) ?? 0) + 1);
  }
  const topInfraTypes = [...infraCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
  const topCloudProviders = [...providerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([provider, count]) => ({ provider, count }));

  return {
    totalBuilds:           n,
    averageScore:          parseFloat(avg(records.map(r => r.overallScore)).toFixed(2)),
    averageInfraScore:     scoreByDimension.infrastructure,
    averageSecurityScore:  scoreByDimension.security,
    averageMonitoringScore:scoreByDimension.monitoring,
    averageScalingScore:   scoreByDimension.scalability,
    averageRecoveryScore:  scoreByDimension.recovery,
    averageCostScore:      scoreByDimension.cost,
    scoreByDimension,
    topInfraTypes,
    topCloudProviders,
    learningRecordCount:   state.learnCount,
    lastUpdated:           Date.now(),
  };
}

export function resetDevOpsMetrics(): void {
  state.records.length = 0;
  state.learnCount = 0;
}
