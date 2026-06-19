import type { ComponentMetadataV2, RetrievalIntent, ScoredComponent } from "../registryV2/registryTypes.js";

const WEIGHTS = {
  industryMatch:    5,
  styleMatch:       4,
  sectionMatch:     6,
  conversionMatch:  3,
  keywordMatch:     2,
  priorityBase:     1,
};

export function scoreComponent(
  meta: ComponentMetadataV2,
  intent: RetrievalIntent,
  keywordHits: number = 0,
): ScoredComponent {
  let score = 0;
  const matchReasons: string[] = [];

  const industryOverlap = meta.industry.filter(i => intent.industry.includes(i));
  if (industryOverlap.length > 0) {
    const pts = industryOverlap.length * WEIGHTS.industryMatch;
    score += pts;
    matchReasons.push(`industry:${industryOverlap.join(",")}(+${pts})`);
  }

  const styleOverlap = meta.style.filter(s => intent.style.includes(s));
  if (styleOverlap.length > 0) {
    const pts = styleOverlap.length * WEIGHTS.styleMatch;
    score += pts;
    matchReasons.push(`style:${styleOverlap.join(",")}(+${pts})`);
  }

  if (intent.sections.includes(meta.category)) {
    score += WEIGHTS.sectionMatch;
    matchReasons.push(`section:${meta.category}(+${WEIGHTS.sectionMatch})`);
  }

  const goalOverlap = meta.conversionGoal.filter(g => intent.conversionGoal.includes(g));
  if (goalOverlap.length > 0) {
    const pts = goalOverlap.length * WEIGHTS.conversionMatch;
    score += pts;
    matchReasons.push(`goal:${goalOverlap.join(",")}(+${pts})`);
  }

  if (keywordHits > 0) {
    const pts = Math.min(keywordHits, 5) * WEIGHTS.keywordMatch;
    score += pts;
    matchReasons.push(`keywords(+${pts})`);
  }

  score += meta.priority * WEIGHTS.priorityBase;

  return {
    id: meta.id,
    category: meta.category,
    score,
    description: meta.description,
    name: meta.name,
    matchReasons,
  };
}

export function rankComponents(
  components: ComponentMetadataV2[],
  intent: RetrievalIntent,
  keywordScores: Map<string, number>,
): ScoredComponent[] {
  return components
    .map(meta => scoreComponent(meta, intent, keywordScores.get(meta.id) ?? 0))
    .sort((a, b) => b.score - a.score);
}
