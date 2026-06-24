// ── V7.3.1 Conversion Quality Metrics ────────────────────────────────────────
// Tracks conversion score, trust, CTA, pricing, funnel per build.
// Feeds into GET /api/telemetry/quality → conversionQuality.

export interface ConversionRunRecord {
  buildId:          string;
  conversionScore:  number;
  trustScore:       number;
  ctaScore:         number;
  pricingScore:     number;
  funnelScore:      number;
  offerClarityScore: number;
  repairTriggered:  boolean;
  repairImproved:   boolean;
  issuesDetected:   number;
  recordedAt:       number;
}

const _history: ConversionRunRecord[] = [];

export function recordConversionRun(record: Omit<ConversionRunRecord, 'recordedAt'>): void {
  _history.push({ ...record, recordedAt: Date.now() });
  if (_history.length > 100) _history.shift();
}

export function getConversionQualityMetrics() {
  const recent = _history.slice(-20);
  const total  = recent.length;
  if (total === 0) {
    return { runsTracked: 0, averageConversionScore: 0, averageTrustScore: 0, averageCtaScore: 0, averagePricingScore: 0, repairRate: '0%', recentScores: [] };
  }

  const avg = (key: keyof ConversionRunRecord) =>
    Math.round(recent.reduce((s, r) => s + (r[key] as number), 0) / total * 10) / 10;

  const repairCount = recent.filter(r => r.repairTriggered).length;
  const improved    = recent.filter(r => r.repairImproved).length;

  return {
    runsTracked:            total,
    averageConversionScore: avg('conversionScore'),
    averageTrustScore:      avg('trustScore'),
    averageCtaScore:        avg('ctaScore'),
    averagePricingScore:    avg('pricingScore'),
    averageFunnelScore:     avg('funnelScore'),
    averageOfferClarityScore: avg('offerClarityScore'),
    repairRate:             `${Math.round(repairCount / total * 100)}%`,
    repairSuccessRate:      repairCount > 0 ? `${Math.round(improved / repairCount * 100)}%` : 'N/A',
    recentScores: recent.slice(-5).map(r => ({
      conversionScore:  r.conversionScore,
      trustScore:       r.trustScore,
      ctaScore:         r.ctaScore,
      pricingScore:     r.pricingScore,
      repairTriggered:  r.repairTriggered,
    })),
  };
}

export function resetConversionMetrics(): void {
  _history.length = 0;
}
