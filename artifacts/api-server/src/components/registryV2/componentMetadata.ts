import { COMPONENT_TEMPLATES } from "../registry.js";
import type { ComponentMetadataV2, ComponentIndustry, ComponentStyle, ConversionGoal, ComponentCategory, ComplexityLevel } from "./registryTypes.js";

function deriveStyle(tags: string[]): ComponentStyle[] {
  const styles: ComponentStyle[] = [];
  const t = tags.join(" ").toLowerCase();
  if (t.includes("gradient") || t.includes("glassmorphism") || t.includes("blur")) styles.push("glassmorphism");
  if (t.includes("gradient")) styles.push("gradient");
  if (t.includes("minimal") || t.includes("clean")) styles.push("minimal");
  if (t.includes("editorial") || t.includes("bold") || t.includes("oversized")) styles.push("editorial");
  if (t.includes("elegant") || t.includes("luxury") || t.includes("premium")) styles.push("elegant");
  if (t.includes("modern") || t.includes("dark") || t.includes("sticky")) styles.push("modern");
  if (t.includes("flat") || t.includes("solid")) styles.push("flat");
  if (styles.length === 0) styles.push("modern");
  return [...new Set(styles)];
}

function deriveConversionGoal(tags: string[], category: string): ConversionGoal[] {
  const goals: ConversionGoal[] = [];
  const t = (tags.join(" ") + " " + category).toLowerCase();
  if (t.includes("cta") || t.includes("signup") || t.includes("get started")) goals.push("signup");
  if (t.includes("pricing") || t.includes("buy") || t.includes("purchase")) goals.push("purchase");
  if (t.includes("contact") || t.includes("form")) goals.push("contact");
  if (t.includes("demo") || t.includes("dashboard") || t.includes("preview")) goals.push("demo");
  if (goals.length === 0) goals.push("awareness");
  return [...new Set(goals)];
}

function deriveComplexity(standaloneCode: string): ComplexityLevel {
  const len = standaloneCode.length;
  if (len < 800) return "low";
  if (len < 2000) return "medium";
  return "high";
}

function deriveKeywords(name: string, description: string, tags: string[]): string[] {
  return [
    ...name.toLowerCase().split(/\W+/).filter(w => w.length > 2),
    ...description.toLowerCase().split(/\W+/).filter(w => w.length > 3),
    ...tags.map(t => t.toLowerCase()),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);
}

let _cache: ComponentMetadataV2[] | null = null;

export function getAllComponentMetadata(): ComponentMetadataV2[] {
  if (_cache) return _cache;
  _cache = COMPONENT_TEMPLATES.map(t => ({
    id: t.id,
    name: t.name,
    category: t.category as ComponentCategory,
    tags: t.tags,
    industry: t.industries as ComponentIndustry[],
    style: deriveStyle(t.tags),
    complexity: deriveComplexity(t.standaloneCode),
    conversionGoal: deriveConversionGoal(t.tags, t.category),
    keywords: deriveKeywords(t.name, t.description, t.tags),
    description: t.description,
    priority: t.priority,
  }));
  return _cache;
}

export function getMetadataById(id: string): ComponentMetadataV2 | null {
  return getAllComponentMetadata().find(m => m.id === id) ?? null;
}

export function getMetadataByCategory(category: ComponentCategory): ComponentMetadataV2[] {
  return getAllComponentMetadata().filter(m => m.category === category);
}
