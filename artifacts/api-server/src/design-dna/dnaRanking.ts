/**
 * V8.1 — Design DNA Ranking Engine
 *
 * Maintains continuously-updating ranked lists for all design categories
 * specified in Phase 4. Every ranking updates after each build outcome.
 * Rankings influence retrieval: higher-ranked items are retrieved first.
 *
 * Categories tracked:
 *   layouts, components, sections, motions, tokens, themes, patterns,
 *   templates, forms, dashboards, navigation, heroStyles, ctaStyles,
 *   pricingLayouts, faqLayouts, footerLayouts, cards, badges, dialogs,
 *   tables, charts
 */

import type { RankingEntry } from "./dnaTypes.js";

// ── Per-category rank tables ──────────────────────────────────────────────────

type RankCategory =
  | "layouts" | "components" | "sections" | "motions" | "tokens"
  | "themes" | "patterns" | "templates" | "forms" | "dashboards"
  | "navigation" | "heroStyles" | "ctaStyles" | "pricingLayouts"
  | "faqLayouts" | "footerLayouts" | "cards" | "badges" | "dialogs"
  | "tables" | "charts";

const _ranks = new Map<RankCategory, Map<string, RankEntry>>();

interface RankEntry {
  id: string;
  label: string;
  category: RankCategory;
  scoreSum: number;
  scoreCount: number;
  successCount: number;
  useCount: number;
  prevScore: number;
  lastUpdated: string;
}

function getOrCreateEntry(category: RankCategory, id: string, label?: string): RankEntry {
  if (!_ranks.has(category)) _ranks.set(category, new Map());
  const table = _ranks.get(category)!;
  if (!table.has(id)) {
    table.set(id, {
      id,
      label: label ?? id,
      category,
      scoreSum: 0,
      scoreCount: 0,
      successCount: 0,
      useCount: 0,
      prevScore: 5.0,
      lastUpdated: new Date().toISOString(),
    });
  }
  return table.get(id)!;
}

// ── Core update function ──────────────────────────────────────────────────────

export interface RankUpdateInput {
  category: RankCategory;
  id: string;
  label?: string;
  score: number;           // 0–10
  success?: boolean;
}

export function updateRanking(input: RankUpdateInput): void {
  const entry = getOrCreateEntry(input.category, input.id, input.label);

  entry.prevScore = entry.scoreCount > 0
    ? entry.scoreSum / entry.scoreCount
    : 5.0;

  entry.scoreSum   += input.score;
  entry.scoreCount += 1;
  entry.useCount   += 1;
  if (input.success) entry.successCount++;
  entry.lastUpdated = new Date().toISOString();
}

export function batchUpdateRankings(inputs: RankUpdateInput[]): void {
  for (const input of inputs) updateRanking(input);
}

// ── Scoring and sorting ───────────────────────────────────────────────────────

function toRankingEntry(e: RankEntry): RankingEntry {
  const score = e.scoreCount > 0 ? Math.round(e.scoreSum / e.scoreCount * 100) / 100 : 5.0;
  const successRate = e.useCount > 0 ? e.successCount / e.useCount : 0;
  const trend: RankingEntry["trend"] =
    score > e.prevScore + 0.3 ? "rising" :
    score < e.prevScore - 0.3 ? "falling" :
    "stable";

  return {
    id: e.id,
    label: e.label,
    category: e.category,
    score,
    usageCount: e.useCount,
    successRate: Math.round(successRate * 1000) / 1000,
    lastUpdated: e.lastUpdated,
    trend,
  };
}

export function getTopRankings(category: RankCategory, limit = 20): RankingEntry[] {
  const table = _ranks.get(category);
  if (!table) return [];
  return [...table.values()]
    .map(toRankingEntry)
    .sort((a, b) => b.score - a.score || b.usageCount - a.usageCount)
    .slice(0, limit);
}

export function getAllRankings(): Record<string, RankingEntry[]> {
  const result: Record<string, RankingEntry[]> = {};
  for (const [category, table] of _ranks.entries()) {
    const entries = [...table.values()].map(toRankingEntry)
      .sort((a, b) => b.score - a.score);
    if (entries.length > 0) result[category] = entries.slice(0, 20);
  }
  return result;
}

// ── Convenience getters (used by retrieval integration, Phase 8) ──────────────

export const getTopLayouts       = (n = 10) => getTopRankings("layouts", n);
export const getTopComponents    = (n = 10) => getTopRankings("components", n);
export const getTopSections      = (n = 10) => getTopRankings("sections", n);
export const getTopMotions       = (n = 10) => getTopRankings("motions", n);
export const getTopTokens        = (n = 10) => getTopRankings("tokens", n);
export const getTopThemes        = (n = 10) => getTopRankings("themes", n);
export const getTopHeroStyles    = (n = 10) => getTopRankings("heroStyles", n);
export const getTopCtaStyles     = (n = 10) => getTopRankings("ctaStyles", n);
export const getTopForms         = (n = 10) => getTopRankings("forms", n);
export const getTopDashboards    = (n = 10) => getTopRankings("dashboards", n);
export const getTopNavigation    = (n = 10) => getTopRankings("navigation", n);
export const getTopPricingLayouts = (n = 10) => getTopRankings("pricingLayouts", n);
export const getTopTemplates     = (n = 10) => getTopRankings("templates", n);
export const getTopCards         = (n = 10) => getTopRankings("cards", n);
export const getTopCharts        = (n = 10) => getTopRankings("charts", n);

// ── Promotion / Demotion ──────────────────────────────────────────────────────

const PROMOTION_THRESHOLD = 9.0;
const DEMOTION_THRESHOLD  = 6.0;
const MIN_USES_FOR_STATUS = 5;

export interface RankStatus { id: string; category: string; status: "promoted" | "demoted" | "normal" }
const _statusOverrides = new Map<string, "promoted" | "demoted">();

export function applyRankingStatus(): RankStatus[] {
  const changed: RankStatus[] = [];
  for (const [category, table] of _ranks.entries()) {
    for (const entry of table.values()) {
      if (entry.useCount < MIN_USES_FOR_STATUS) continue;
      const score = entry.scoreCount > 0 ? entry.scoreSum / entry.scoreCount : 5.0;
      const key = `${category}:${entry.id}`;
      const was = _statusOverrides.get(key);
      if (score >= PROMOTION_THRESHOLD && was !== "promoted") {
        _statusOverrides.set(key, "promoted");
        changed.push({ id: entry.id, category, status: "promoted" });
      } else if (score < DEMOTION_THRESHOLD && was !== "demoted") {
        _statusOverrides.set(key, "demoted");
        changed.push({ id: entry.id, category, status: "demoted" });
      } else if (score >= DEMOTION_THRESHOLD && score < PROMOTION_THRESHOLD && was !== undefined) {
        _statusOverrides.delete(key);
        changed.push({ id: entry.id, category, status: "normal" });
      }
    }
  }
  return changed;
}

export function getRankingStatus(category: string, id: string): "promoted" | "demoted" | "normal" {
  return _statusOverrides.get(`${category}:${id}`) ?? "normal";
}

// ── Telemetry snapshot ────────────────────────────────────────────────────────

export function getRankingMetrics() {
  const all = getAllRankings();
  const totalEntries = Object.values(all).reduce((s, arr) => s + arr.length, 0);
  const promotedCount = [..._statusOverrides.values()].filter(v => v === "promoted").length;
  const demotedCount  = [..._statusOverrides.values()].filter(v => v === "demoted").length;
  return {
    categoriesTracked: _ranks.size,
    totalEntries,
    promotedCount,
    demotedCount,
    topLayouts:        getTopLayouts(5),
    topComponents:     getTopComponents(5),
    topSections:       getTopSections(5),
    topThemes:         getTopThemes(5),
    topMotions:        getTopMotions(5),
    topTokens:         getTopTokens(5),
    topHeroStyles:     getTopHeroStyles(5),
    topCtaStyles:      getTopCtaStyles(5),
    topTemplates:      getTopTemplates(5),
  };
}

// ── Serialise / deserialise (for persistence) ─────────────────────────────────

export function exportRankings(): RankingEntry[] {
  return Object.values(getAllRankings()).flat();
}

export function importRankings(entries: RankingEntry[]): void {
  for (const e of entries) {
    const cat = e.category as RankCategory;
    if (!_ranks.has(cat)) _ranks.set(cat, new Map());
    const table = _ranks.get(cat)!;
    if (!table.has(e.id)) {
      table.set(e.id, {
        id: e.id,
        label: e.label,
        category: cat,
        scoreSum:     e.score * e.usageCount,
        scoreCount:   e.usageCount,
        successCount: Math.round(e.successRate * e.usageCount),
        useCount:     e.usageCount,
        prevScore:    e.score,
        lastUpdated:  e.lastUpdated,
      });
    }
  }
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetRankings(): void {
  _ranks.clear();
  _statusOverrides.clear();
}
