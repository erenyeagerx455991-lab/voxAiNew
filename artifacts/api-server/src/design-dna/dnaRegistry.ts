/**
 * V8.1 — Design DNA Registry
 *
 * In-memory store for DesignDNARecord objects. Supports full CRUD,
 * filtering by brand/industry, and serialisation for persistence.
 *
 * Does NOT talk to dnaMetrics.ts (per-dimension store) — the two
 * stores serve different purposes and must remain independent.
 */

import type { DesignDNARecord } from "./dnaTypes.js";
import { computeConfidence } from "./dnaTypes.js";
import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("DnaRegistry");

// ── In-memory store ───────────────────────────────────────────────────────────

const _registry = new Map<string, DesignDNARecord>();
let _evolutionCount = 0;

/** Cap prevents unbounded growth in long-lived processes with high brand churn */
const MAX_DNA_RECORDS = 500;

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateDnaId(brand: string, industry: string): string {
  const slug = `${brand}-${industry}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `dna-${slug}-${Date.now().toString(36)}`;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createDnaRecord(
  partial: Partial<DesignDNARecord> & { brand: string; industry: string; name: string },
): DesignDNARecord {
  const now = new Date().toISOString();
  const id = partial.id ?? generateDnaId(partial.brand, partial.industry);

  const record: DesignDNARecord = {
    id,
    name:    partial.name,
    industry: partial.industry,
    brand:   partial.brand,
    theme:   partial.theme   ?? "default",
    motionProfile: partial.motionProfile ?? {
      personality: "subtle",
      hasReducedMotion: true,
      transitionDuration: 200,
      preferredLibrary: "framer-motion",
    },
    spacingProfile: partial.spacingProfile ?? {
      sectionPadding: "py-24",
      contentGap: "gap-8",
      density: "normal",
      gridBase: 8,
    },
    typographyProfile: partial.typographyProfile ?? {
      headingWeight: "700",
      scale: "large",
      fontFamily: "inter",
      lineHeightStyle: "tight",
    },
    layoutProfile: partial.layoutProfile ?? {
      style: "centered",
      maxWidth: "max-w-7xl",
      columnStrategy: "12-col-grid",
      sectionDiversity: 0.5,
    },
    componentPreferences: partial.componentPreferences ?? {},
    sectionPreferences:   partial.sectionPreferences   ?? {},
    colorPreferences: partial.colorPreferences ?? {
      background: "#09090b",
      surface: "#18181b",
      primary: "#6366f1",
      accent: "#a855f7",
      textMuted: "#71717a",
      border: "#27272a",
      isDark: true,
      saturation: "vibrant",
    },
    interactionPreferences: partial.interactionPreferences ?? {
      hoverStyle: "scale",
      focusStyle: "ring",
      buttonRadius: "rounded-lg",
      cardShadow: "shadow-sm",
    },
    evaluatorScore:    partial.evaluatorScore    ?? 5.0,
    conversionScore:   partial.conversionScore   ?? 5.0,
    accessibilityScore: partial.accessibilityScore ?? 5.0,
    performanceScore:  partial.performanceScore  ?? 5.0,
    criticScore:       partial.criticScore       ?? 5.0,
    visualScore:       partial.visualScore       ?? 5.0,
    overallScore:      partial.overallScore      ?? 5.0,
    rankingScore:      partial.rankingScore      ?? 5.0,
    usageCount:        partial.usageCount        ?? 0,
    successCount:      partial.successCount      ?? 0,
    repairCount:       partial.repairCount       ?? 0,
    failureCount:      partial.failureCount      ?? 0,
    averageRepairLoops: partial.averageRepairLoops ?? 0,
    lastUpdated: now,
    createdAt:   partial.createdAt ?? now,
    version:     partial.version   ?? 1,
    confidence:  partial.confidence ?? 0,
    status:      partial.status    ?? "active",
  };

  return record;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function registerDna(record: DesignDNARecord): void {
  // Evict the least-used record if the cap is reached (prevents unbounded growth)
  if (_registry.size >= MAX_DNA_RECORDS && !_registry.has(record.id)) {
    const leastUsed = [..._registry.values()]
      .sort((a, b) => a.usageCount - b.usageCount)[0];
    if (leastUsed) {
      _registry.delete(leastUsed.id);
      log.info("DNA_EVICTED", { id: leastUsed.id, usageCount: leastUsed.usageCount });
    }
  }
  _registry.set(record.id, { ...record });
  log.info("DNA_REGISTERED", { id: record.id, brand: record.brand });
}

export function getDna(id: string): DesignDNARecord | undefined {
  const r = _registry.get(id);
  return r ? { ...r } : undefined;
}

export function updateDna(id: string, patch: Partial<DesignDNARecord>): DesignDNARecord | null {
  const existing = _registry.get(id);
  if (!existing) return null;

  const updated: DesignDNARecord = {
    ...existing,
    ...patch,
    id,                              // id is immutable
    lastUpdated: new Date().toISOString(),
    version: existing.version + 1,
  };

  // Recompute confidence
  updated.confidence = computeConfidence(updated.usageCount, updated.successCount);

  _registry.set(id, updated);
  _evolutionCount++;
  return { ...updated };
}

export function deleteDna(id: string): boolean {
  return _registry.delete(id);
}

export function listDnas(): DesignDNARecord[] {
  return [..._registry.values()].map(r => ({ ...r }));
}

export function getDnasByBrand(brand: string): DesignDNARecord[] {
  return [..._registry.values()]
    .filter(r => r.brand.toLowerCase() === brand.toLowerCase())
    .map(r => ({ ...r }));
}

export function getDnasByIndustry(industry: string): DesignDNARecord[] {
  return [..._registry.values()]
    .filter(r => r.industry.toLowerCase() === industry.toLowerCase())
    .map(r => ({ ...r }));
}

export function getTopDnaRecords(limit = 10): DesignDNARecord[] {
  return [..._registry.values()]
    .filter(r => r.usageCount > 0)
    .sort((a, b) => b.rankingScore - a.rankingScore)
    .slice(0, limit)
    .map(r => ({ ...r }));
}

export function getDemotedDnas(): DesignDNARecord[] {
  return [..._registry.values()]
    .filter(r => r.status === "demoted")
    .map(r => ({ ...r }));
}

export function getPromotedDnas(): DesignDNARecord[] {
  return [..._registry.values()]
    .filter(r => r.status === "promoted")
    .map(r => ({ ...r }));
}

// ── Aggregate stats ───────────────────────────────────────────────────────────

export function getRegistryStats() {
  const all = [..._registry.values()];
  const used = all.filter(r => r.usageCount > 0);
  return {
    totalDnas:      all.length,
    usedDnas:       used.length,
    promotedDnas:   all.filter(r => r.status === "promoted").length,
    demotedDnas:    all.filter(r => r.status === "demoted").length,
    evolutionCount: _evolutionCount,
    averageRankingScore: used.length > 0
      ? Math.round(used.reduce((s, r) => s + r.rankingScore, 0) / used.length * 100) / 100
      : 0,
    topBrands: getTopBrands(5),
    topIndustries: getTopIndustries(5),
  };
}

function getTopBrands(limit: number): Array<{ brand: string; count: number; avgScore: number }> {
  const byBrand = new Map<string, { count: number; scoreSum: number }>();
  for (const r of _registry.values()) {
    if (!byBrand.has(r.brand)) byBrand.set(r.brand, { count: 0, scoreSum: 0 });
    const e = byBrand.get(r.brand)!;
    e.count++;
    e.scoreSum += r.rankingScore;
  }
  return [...byBrand.entries()]
    .map(([brand, { count, scoreSum }]) => ({ brand, count, avgScore: Math.round(scoreSum / count * 100) / 100 }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);
}

function getTopIndustries(limit: number): Array<{ industry: string; count: number; avgScore: number }> {
  const byIndustry = new Map<string, { count: number; scoreSum: number }>();
  for (const r of _registry.values()) {
    if (!byIndustry.has(r.industry)) byIndustry.set(r.industry, { count: 0, scoreSum: 0 });
    const e = byIndustry.get(r.industry)!;
    e.count++;
    e.scoreSum += r.rankingScore;
  }
  return [...byIndustry.entries()]
    .map(([industry, { count, scoreSum }]) => ({ industry, count, avgScore: Math.round(scoreSum / count * 100) / 100 }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);
}

// ── Serialise / deserialise (for persistence layer) ───────────────────────────

export function exportRegistry(): DesignDNARecord[] {
  return [..._registry.values()].map(r => ({ ...r }));
}

export function importRegistry(records: DesignDNARecord[]): void {
  for (const r of records) {
    _registry.set(r.id, { ...r });
  }
  log.info("DNA_REGISTRY_IMPORTED", { count: records.length });
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetRegistry(): void {
  _registry.clear();
  _evolutionCount = 0;
}

export function getEvolutionCount(): number {
  return _evolutionCount;
}
