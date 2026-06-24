import { getAllComponentMetadata } from "../registryV2/componentMetadata.js";
import { findByKeywords } from "../registryV2/searchIndex.js";
import { parseIntent } from "./intentParser.js";
import { rankComponents } from "./scoreComponents.js";
import { getCached, setCached } from "./retrievalCache.js";
import { recordRetrieval, recordComponentUsage } from "../../telemetry/registryMetrics.js";
import type { RetrievalResult, ComponentCategory } from "../registryV2/registryTypes.js";

const DEFAULT_TOP_K = 15;

export async function retrieveComponents(
  prompt: string,
  sectionOrder?: string[],
  topK: number = DEFAULT_TOP_K,
): Promise<RetrievalResult> {
  const start = Date.now();

  const cacheKey = `${prompt}|${(sectionOrder ?? []).join(",")}|${topK}`;
  const cached = getCached(cacheKey);
  if (cached) {
    const ms = Date.now() - start;
    recordRetrieval(ms, true);
    return { ...cached, retrievalMs: ms, cacheHit: true };
  }

  const intent = parseIntent(prompt, sectionOrder);
  const allMeta = getAllComponentMetadata();
  const keywordScores = findByKeywords(intent.keywords);
  const sorted = rankComponents(allMeta, intent, keywordScores);
  const selected = sorted.slice(0, topK);

  for (const comp of selected) {
    if (intent.sections.includes(comp.category)) {
      recordComponentUsage(comp.id);
    }
  }

  const tokenEstimate = selected.reduce((acc, c) => acc + Math.ceil(c.description.length / 4) + 7, 0);

  const ms = Date.now() - start;
  const result: RetrievalResult = {
    components: selected,
    intent,
    retrievalMs: ms,
    cacheHit: false,
    promptTokenEstimate: tokenEstimate,
  };

  setCached(cacheKey, result);
  recordRetrieval(ms, false);

  return result;
}

export function retrieveByCategory(
  category: ComponentCategory,
  prompt: string,
  top: number = 3,
): RetrievalResult {
  const start = Date.now();
  const intent = parseIntent(prompt);
  const meta = getAllComponentMetadata().filter(m => m.category === category);
  const keywordScores = findByKeywords(intent.keywords);
  const ranked = rankComponents(meta, intent, keywordScores).slice(0, top);
  return {
    components: ranked,
    intent,
    retrievalMs: Date.now() - start,
    cacheHit: false,
    promptTokenEstimate: ranked.reduce((a, c) => a + Math.ceil(c.description.length / 4) + 10, 0),
  };
}
