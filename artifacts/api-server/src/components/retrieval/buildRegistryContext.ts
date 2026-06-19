import type { RetrievalResult, ScoredComponent, ComponentCategory } from "../registryV2/registryTypes.js";
import { recordComponentSelection } from "../../telemetry/registryMetrics.js";

const FULL_REGISTRY_TOKEN_ESTIMATE = 3200;

function formatComponent(comp: ScoredComponent): string {
  return `• ${comp.name} [${comp.id}] — ${comp.description}`;
}

function groupByCategory(components: ScoredComponent[]): Map<ComponentCategory, ScoredComponent[]> {
  const groups = new Map<ComponentCategory, ScoredComponent[]>();
  for (const c of components) {
    if (!groups.has(c.category)) groups.set(c.category, []);
    groups.get(c.category)!.push(c);
  }
  return groups;
}

export interface RegistryContextResult {
  contextString: string;
  tokenEstimate: number;
  componentCount: number;
  reductionFromFull: number;
  selectedIds: string[];
}

export function buildRegistryContext(retrieval: RetrievalResult): RegistryContextResult {
  const { components } = retrieval;

  if (components.length === 0) {
    return {
      contextString: "## Component Registry\nNo specific components matched. Generate original design.",
      tokenEstimate: 15,
      componentCount: 0,
      reductionFromFull: FULL_REGISTRY_TOKEN_ESTIMATE,
      selectedIds: [],
    };
  }

  const groups = groupByCategory(components);
  const lines: string[] = [
    "## Retrieved Component Registry (RAG-selected — most relevant to your prompt)",
    `Intent: ${retrieval.intent.industry.join(",")} | ${retrieval.intent.style.join(",")} | goal:${retrieval.intent.conversionGoal.join(",")}`,
    "",
  ];

  for (const [category, comps] of groups) {
    lines.push(`### ${category.toUpperCase()}`);
    for (const comp of comps) {
      lines.push(formatComponent(comp));
      recordComponentSelection(comp.id);
    }
    lines.push("");
  }

  lines.push("Use these components as structural reference. Adapt content, colors, and copy for this specific site.");

  const contextString = lines.join("\n");
  const tokenEstimate = Math.ceil(contextString.length / 4);
  const reductionFromFull = FULL_REGISTRY_TOKEN_ESTIMATE - tokenEstimate;

  return {
    contextString,
    tokenEstimate,
    componentCount: components.length,
    reductionFromFull: Math.max(0, reductionFromFull),
    selectedIds: components.map(c => c.id),
  };
}

export function buildCompressedCatalogue(retrieval: RetrievalResult): string {
  const { components, intent } = retrieval;
  const topPerCategory = new Map<ComponentCategory, ScoredComponent>();

  for (const comp of components) {
    if (!topPerCategory.has(comp.category)) {
      topPerCategory.set(comp.category, comp);
    }
  }

  const lines = [
    "## Available Component Registry (RAG-retrieved — relevant to this prompt)",
  ];
  for (const [, comp] of topPerCategory) {
    lines.push(formatComponent(comp));
  }
  lines.push(`\nMatched intent: industry=${intent.industry.join(",")}, style=${intent.style.join(",")}`);

  return lines.join("\n");
}
