import { globalMetrics } from "./metricsProvider.js";
import { MAX_DURATION_SAMPLES } from "./constants.js";

interface QualityRecord {
  buildId: string;
  designScore: number;
  accessibilityScore: number;
  shadcnUsage: number;
  componentReuse: number;
  heroVariantUsed: string;
  designDNAUsed: string;
  recordedAt: number;
}

const records: QualityRecord[] = [];
let totalRecorded = 0;
let sumDesign = 0;
let sumAccessibility = 0;
let sumShadcn = 0;
let sumReuse = 0;
const heroUsageCounts = new Map<string, number>();
const dnaUsageCounts = new Map<string, number>();

function cappedPush<T>(arr: T[], value: T): void {
  arr.push(value);
  if (arr.length > MAX_DURATION_SAMPLES) arr.shift();
}

export interface QualityScoreInput {
  buildId: string;
  designScore?: number;
  accessibilityScore?: number;
  shadcnUsage?: number;
  componentReuse?: number;
  heroVariantUsed?: string;
  designDNAUsed?: string;
}

export function recordQualityScore(input: QualityScoreInput): void {
  const record: QualityRecord = {
    buildId: input.buildId,
    designScore: input.designScore ?? 0,
    accessibilityScore: input.accessibilityScore ?? 0,
    shadcnUsage: input.shadcnUsage ?? 0,
    componentReuse: input.componentReuse ?? 0,
    heroVariantUsed: input.heroVariantUsed ?? "unknown",
    designDNAUsed: input.designDNAUsed ?? "none",
    recordedAt: Date.now(),
  };

  cappedPush(records, record);
  totalRecorded++;

  sumDesign += record.designScore;
  sumAccessibility += record.accessibilityScore;
  sumShadcn += record.shadcnUsage;
  sumReuse += record.componentReuse;

  if (record.heroVariantUsed !== "unknown") {
    heroUsageCounts.set(record.heroVariantUsed, (heroUsageCounts.get(record.heroVariantUsed) ?? 0) + 1);
  }
  if (record.designDNAUsed !== "none") {
    dnaUsageCounts.set(record.designDNAUsed, (dnaUsageCounts.get(record.designDNAUsed) ?? 0) + 1);
  }

  globalMetrics.increment("quality.recorded");
  if (record.designScore >= 8) globalMetrics.increment("quality.design.high");
  if (record.accessibilityScore >= 8) globalMetrics.increment("quality.accessibility.high");
  if (record.shadcnUsage >= 0.7) globalMetrics.increment("quality.shadcn.high");
}

export function getQualityMetrics() {
  const n = totalRecorded;
  const avg = (sum: number) => (n > 0 ? Math.round((sum / n) * 100) / 100 : 0);

  const heroRanking = [...heroUsageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([variant, count]) => ({ variant, count }));

  const dnaRanking = [...dnaUsageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([dna, count]) => ({ dna, count }));

  const recent = records.slice(-20).map(r => ({
    buildId: r.buildId,
    designScore: r.designScore,
    accessibilityScore: r.accessibilityScore,
    shadcnUsage: r.shadcnUsage,
    heroVariantUsed: r.heroVariantUsed,
    designDNAUsed: r.designDNAUsed,
  }));

  return {
    totalRecorded: n,
    averages: {
      designScore: avg(sumDesign),
      accessibilityScore: avg(sumAccessibility),
      shadcnUsage: avg(sumShadcn),
      componentReuse: avg(sumReuse),
    },
    heroUsage: heroRanking,
    dnaUsage: dnaRanking,
    recent,
  };
}

// ── V7.1.8 Design RAG retrieval telemetry ────────────────────────────────────

export interface DesignRetrievalInput {
  count: number;
  style: string;
  categories: string[];
  averageQuality: number;
}

let retrievalCount = 0;
let retrievalHitCount = 0;
let totalReferencesUsed = 0;
let sumRetrievalQuality = 0;
const retrievalStyleUsage = new Map<string, number>();
const retrievalCategoryUsage = new Map<string, number>();

export function recordDesignRetrieval(input: DesignRetrievalInput): void {
  retrievalCount++;
  if (input.count > 0) retrievalHitCount++;
  totalReferencesUsed += input.count;
  sumRetrievalQuality += input.averageQuality;
  retrievalStyleUsage.set(input.style, (retrievalStyleUsage.get(input.style) ?? 0) + 1);
  for (const cat of input.categories) {
    retrievalCategoryUsage.set(cat, (retrievalCategoryUsage.get(cat) ?? 0) + 1);
  }
  globalMetrics.increment("rag.retrievalCount");
  if (input.count > 0) globalMetrics.increment("rag.retrievalHit");
}

export function getRetrievalMetrics() {
  return {
    retrievalCount,
    retrievalHitCount,
    retrievalHitRate: retrievalCount > 0
      ? ((retrievalHitCount / retrievalCount) * 100).toFixed(1) + '%'
      : 'n/a',
    referencesUsed: totalReferencesUsed,
    retrievalQualityAverage: retrievalCount > 0
      ? Math.round((sumRetrievalQuality / retrievalCount) * 100) / 100
      : 0,
    topStyles: [...retrievalStyleUsage.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([style, count]) => ({ style, count })),
    topCategories: [...retrievalCategoryUsage.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([category, count]) => ({ category, count })),
  };
}

export function resetQualityMetrics(): void {
  records.length = 0;
  totalRecorded = 0;
  sumDesign = 0;
  sumAccessibility = 0;
  sumShadcn = 0;
  sumReuse = 0;
  heroUsageCounts.clear();
  dnaUsageCounts.clear();
  retrievalCount = 0;
  retrievalHitCount = 0;
  totalReferencesUsed = 0;
  sumRetrievalQuality = 0;
  retrievalStyleUsage.clear();
  retrievalCategoryUsage.clear();
}
