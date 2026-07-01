/**
 * V8.2 — UX Pattern Ranking Engine
 *
 * Maintains ranked lists for UX patterns observed across builds.
 * Continuously updated after each build.
 */

import type { ConversionLevel } from "./uxTypes.js";
import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("UxRanking");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UXPatternEntry {
  readonly id:        string;
  readonly label:     string;
  readonly category:  string;
  score:              number;  // running average 0–10
  usageCount:         number;
  successRate:        number;  // 0–1
  conversionLevel:    ConversionLevel;
  lastUpdated:        string;
  trend:              "rising" | "stable" | "falling";
}

interface PatternRecord {
  id:          string;
  label:       string;
  category:    string;
  scoreSum:    number;
  scoreCount:  number;
  successCount: number;
  useCount:    number;
  prevScore:   number;
  lastUpdated: string;
  conversionLevelCounts: Record<ConversionLevel, number>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

const _patterns = new Map<string, PatternRecord>();
const MAX_PATTERNS = 200;

// ── Record a UX pattern outcome ───────────────────────────────────────────────

export function recordUXPattern(
  category: string,
  id: string,
  label: string,
  score: number,
  conversionLevel: ConversionLevel,
  success: boolean,
): void {
  const key = `${category}:${id}`;

  if (!_patterns.has(key)) {
    if (_patterns.size >= MAX_PATTERNS) {
      // Evict least-used pattern
      const sorted = [..._patterns.values()].sort((a, b) => a.useCount - b.useCount);
      if (sorted[0]) _patterns.delete(`${sorted[0].category}:${sorted[0].id}`);
    }
    _patterns.set(key, {
      id, label, category,
      scoreSum: 0, scoreCount: 0, successCount: 0, useCount: 0,
      prevScore: 5.0,
      lastUpdated: new Date().toISOString(),
      conversionLevelCounts: { very_low: 0, low: 0, medium: 0, high: 0, very_high: 0 },
    });
  }

  const r = _patterns.get(key)!;
  r.prevScore    = r.scoreCount > 0 ? r.scoreSum / r.scoreCount : 5.0;
  r.scoreSum    += score;
  r.scoreCount  += 1;
  r.useCount    += 1;
  if (success) r.successCount++;
  r.conversionLevelCounts[conversionLevel]++;
  r.lastUpdated  = new Date().toISOString();

  log.info("UX_PATTERN_RECORDED", { key, score, conversionLevel });
}

// ── Query ─────────────────────────────────────────────────────────────────────

function toEntry(r: PatternRecord): UXPatternEntry {
  const score       = r.scoreCount > 0 ? Math.round(r.scoreSum / r.scoreCount * 100) / 100 : 5.0;
  const successRate = r.useCount > 0 ? r.successCount / r.useCount : 0;

  // Determine dominant conversion level
  const topLevel = (Object.entries(r.conversionLevelCounts) as [ConversionLevel, number][])
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? "medium";

  const trend: UXPatternEntry["trend"] =
    score > r.prevScore + 0.3 ? "rising" :
    score < r.prevScore - 0.3 ? "falling" :
    "stable";

  return {
    id:              r.id,
    label:           r.label,
    category:        r.category,
    score,
    usageCount:      r.useCount,
    successRate:     Math.round(successRate * 1000) / 1000,
    conversionLevel: topLevel,
    lastUpdated:     r.lastUpdated,
    trend,
  };
}

export function getTopPatterns(limit = 10): UXPatternEntry[] {
  return [..._patterns.values()]
    .map(toEntry)
    .sort((a, b) => b.score - a.score || b.usageCount - a.usageCount)
    .slice(0, limit);
}

export function getLowestPatterns(limit = 10): UXPatternEntry[] {
  return [..._patterns.values()]
    .filter(r => r.useCount > 0)
    .map(toEntry)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export function getPatternsByCategory(category: string, limit = 10): UXPatternEntry[] {
  return [..._patterns.values()]
    .filter(r => r.category === category)
    .map(toEntry)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getRankingMetrics() {
  const all     = [..._patterns.values()].map(toEntry);
  const rising  = all.filter(e => e.trend === "rising").length;
  const falling = all.filter(e => e.trend === "falling").length;
  return {
    totalPatterns: _patterns.size,
    risingPatterns: rising,
    fallingPatterns: falling,
    topPatterns:    getTopPatterns(5),
    lowestPatterns: getLowestPatterns(5),
  };
}

// ── Serialise / deserialise ───────────────────────────────────────────────────

export function exportRankings(): UXPatternEntry[] {
  return [..._patterns.values()].map(toEntry);
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetUXRankings(): void {
  _patterns.clear();
}
