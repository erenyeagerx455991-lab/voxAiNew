import type { RetrievalIntent, ComponentIndustry, ComponentStyle, ConversionGoal, ComponentCategory } from "../registryV2/registryTypes.js";
import { INDUSTRY_KEYWORDS, STYLE_KEYWORDS, CONVERSION_KEYWORDS, SECTION_KEYWORDS } from "../registryV2/componentTags.js";

function matchKeywords<T extends string>(
  text: string,
  map: Record<T, string[]>
): T[] {
  const lower = text.toLowerCase();
  const matches: T[] = [];
  for (const [key, kws] of Object.entries(map) as [T, string[]][]) {
    if (kws.some(kw => lower.includes(kw))) matches.push(key);
  }
  return matches;
}

function extractKeywords(prompt: string): string[] {
  const stopWords = new Set(["a","an","the","and","or","but","for","with","build","me","make","create","need","want","page","site","website","app"]);
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 30);
}

function inferSections(sectionOrder?: string[]): ComponentCategory[] {
  if (sectionOrder && sectionOrder.length > 0) {
    const SECTION_TO_CATEGORY: Record<string, ComponentCategory> = {
      navbar:           "navbar",
      hero:             "hero",
      logocloud:        "logo-cloud",
      logostrip:        "logo-cloud",
      featuresbento:    "bento",
      bento:            "bento",
      features:         "features",
      dashboardpreview: "dashboard-preview",
      productpreview:   "dashboard-preview",
      testimonials:     "testimonials",
      socialproof:      "testimonials",
      pricing:          "pricing",
      cta:              "cta",
      ctabanner:        "cta",
      footer:           "footer",
      gallery:          "gallery",
      menu:             "menu-section",
      menusection:      "menu-section",
      chefstory:        "chef-story",
      reservation:      "reservation",
      projects:         "projects",
      casestudies:      "case-studies",
      contact:          "contact",
      faq:              "faq",
    };
    const cats: ComponentCategory[] = [];
    const seen = new Set<string>();
    for (const s of sectionOrder) {
      const key = s.toLowerCase().replace(/[^a-z]/g, "");
      const cat = SECTION_TO_CATEGORY[key];
      if (cat && !seen.has(cat)) { cats.push(cat); seen.add(cat); }
    }
    return cats;
  }
  return ["navbar", "hero", "features", "testimonials", "cta", "footer"];
}

export function parseIntent(prompt: string, sectionOrder?: string[]): RetrievalIntent {
  const industries = matchKeywords<ComponentIndustry>(prompt, INDUSTRY_KEYWORDS);
  const styles     = matchKeywords<ComponentStyle>(prompt, STYLE_KEYWORDS);
  const goals      = matchKeywords<ConversionGoal>(prompt, CONVERSION_KEYWORDS);
  const keywords   = extractKeywords(prompt);

  const sectionKeywords: ComponentCategory[] = [];
  const lower = prompt.toLowerCase();
  for (const [cat, kws] of Object.entries(SECTION_KEYWORDS) as [ComponentCategory, string[]][]) {
    if (kws.some(kw => lower.includes(kw))) sectionKeywords.push(cat);
  }

  return {
    industry:      industries.length > 0 ? industries : ["generic"],
    style:         styles.length > 0 ? styles : ["modern"],
    pageType:      industries[0] ?? "generic",
    keywords,
    sections:      [...new Set([...inferSections(sectionOrder), ...sectionKeywords])],
    conversionGoal: goals.length > 0 ? goals : ["awareness"],
  };
}
