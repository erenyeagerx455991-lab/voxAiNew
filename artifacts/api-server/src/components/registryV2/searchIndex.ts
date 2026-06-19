import { getAllComponentMetadata } from "./componentMetadata.js";
import type { ComponentMetadataV2 } from "./registryTypes.js";

interface InvertedIndex {
  byKeyword: Map<string, Set<string>>;
  byTag:     Map<string, Set<string>>;
  byIndustry: Map<string, Set<string>>;
  byCategory: Map<string, Set<string>>;
  byStyle:   Map<string, Set<string>>;
  byGoal:    Map<string, Set<string>>;
}

let _index: InvertedIndex | null = null;

function buildIndex(): InvertedIndex {
  const idx: InvertedIndex = {
    byKeyword:  new Map(),
    byTag:      new Map(),
    byIndustry: new Map(),
    byCategory: new Map(),
    byStyle:    new Map(),
    byGoal:     new Map(),
  };

  function add(map: Map<string, Set<string>>, key: string, id: string): void {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(id);
  }

  for (const meta of getAllComponentMetadata()) {
    for (const kw of meta.keywords)        add(idx.byKeyword,  kw.toLowerCase(),  meta.id);
    for (const tag of meta.tags)           add(idx.byTag,      tag.toLowerCase(), meta.id);
    for (const ind of meta.industry)       add(idx.byIndustry, ind,               meta.id);
    add(idx.byCategory, meta.category, meta.id);
    for (const sty of meta.style)          add(idx.byStyle,    sty,               meta.id);
    for (const goal of meta.conversionGoal) add(idx.byGoal,    goal,              meta.id);
  }

  return idx;
}

export function getSearchIndex(): InvertedIndex {
  if (!_index) _index = buildIndex();
  return _index;
}

export function findByIndustries(industries: string[]): Set<string> {
  const idx = getSearchIndex();
  const result = new Set<string>();
  for (const ind of industries) {
    const ids = idx.byIndustry.get(ind);
    if (ids) for (const id of ids) result.add(id);
  }
  return result;
}

export function findByKeywords(keywords: string[]): Map<string, number> {
  const idx = getSearchIndex();
  const scores = new Map<string, number>();
  for (const kw of keywords) {
    const ids = idx.byKeyword.get(kw.toLowerCase());
    if (ids) {
      for (const id of ids) scores.set(id, (scores.get(id) ?? 0) + 1);
    }
    const tagIds = idx.byTag.get(kw.toLowerCase());
    if (tagIds) {
      for (const id of tagIds) scores.set(id, (scores.get(id) ?? 0) + 2);
    }
  }
  return scores;
}

export function findByCategory(category: string): Set<string> {
  const idx = getSearchIndex();
  return idx.byCategory.get(category) ?? new Set();
}

export function getIndexStats(): Record<string, number> {
  const idx = getSearchIndex();
  return {
    totalComponents: getAllComponentMetadata().length,
    uniqueKeywords: idx.byKeyword.size,
    uniqueTags: idx.byTag.size,
    uniqueIndustries: idx.byIndustry.size,
    uniqueCategories: idx.byCategory.size,
    uniqueStyles: idx.byStyle.size,
    uniqueGoals: idx.byGoal.size,
  };
}
