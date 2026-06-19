import type { ComponentIndustry, ComponentStyle, ConversionGoal } from "./registryTypes.js";

export const INDUSTRY_KEYWORDS: Record<ComponentIndustry, string[]> = {
  saas:       ["saas", "software", "platform", "tool", "app", "subscription", "cloud", "b2b", "workflow"],
  ai:         ["ai", "artificial intelligence", "machine learning", "chatbot", "neural", "gpt", "llm", "model"],
  startup:    ["startup", "launch", "mvp", "product", "founder", "early access", "beta"],
  ecommerce:  ["shop", "store", "ecommerce", "sell", "buy", "cart", "product", "merch", "checkout"],
  restaurant: ["restaurant", "food", "cafe", "menu", "dining", "eat", "bistro", "kitchen", "chef"],
  portfolio:  ["portfolio", "personal", "freelance", "showcase", "work", "designer", "developer", "creative"],
  agency:     ["agency", "studio", "creative", "design", "marketing", "branding", "consulting"],
  fintech:    ["fintech", "finance", "bank", "payment", "crypto", "trading", "invest", "wealth"],
  healthcare: ["health", "medical", "clinic", "doctor", "wellness", "therapy", "dental", "hospital"],
  education:  ["education", "course", "learning", "school", "teach", "tutor", "academy", "bootcamp"],
  fitness:    ["fitness", "gym", "workout", "yoga", "sport", "training", "coach", "health"],
  generic:    [],
};

export const STYLE_KEYWORDS: Record<ComponentStyle, string[]> = {
  modern:         ["modern", "sleek", "contemporary", "clean"],
  minimal:        ["minimal", "simple", "clean", "whitespace", "understated"],
  editorial:      ["editorial", "magazine", "typographic", "bold type", "linear", "framer"],
  bold:           ["bold", "strong", "impactful", "heavy", "dramatic"],
  elegant:        ["elegant", "luxury", "premium", "refined", "sophisticated"],
  glassmorphism:  ["glass", "blur", "frosted", "translucent"],
  gradient:       ["gradient", "colorful", "vibrant", "colorful"],
  flat:           ["flat", "material", "solid", "no-shadow"],
  neumorphic:     ["neumorphic", "soft ui", "shadow"],
  brutalist:      ["brutalist", "raw", "no-style", "geometric"],
};

export const CONVERSION_KEYWORDS: Record<ConversionGoal, string[]> = {
  signup:    ["signup", "register", "join", "create account", "free trial", "get started"],
  purchase:  ["buy", "purchase", "order", "shop", "pricing", "checkout", "pay"],
  contact:   ["contact", "reach out", "get in touch", "inquire", "book"],
  demo:      ["demo", "see it in action", "watch", "try", "preview"],
  download:  ["download", "install", "get the app", "mobile"],
  awareness: ["learn more", "discover", "explore", "about"],
};

export const SECTION_KEYWORDS: Record<string, string[]> = {
  navbar:           ["nav", "navigation", "header", "menu"],
  hero:             ["hero", "above the fold", "banner", "landing"],
  features:         ["features", "benefits", "capabilities", "what we offer"],
  pricing:          ["pricing", "plans", "tiers", "subscription", "cost"],
  testimonials:     ["testimonials", "reviews", "social proof", "customers say"],
  cta:              ["cta", "call to action", "banner", "get started"],
  footer:           ["footer", "links", "sitemap"],
  gallery:          ["gallery", "portfolio", "images", "photos", "work"],
  faq:              ["faq", "questions", "help", "support"],
  contact:          ["contact", "form", "reach out", "email"],
  "logo-cloud":     ["logos", "trusted by", "brands", "partners"],
  bento:            ["bento", "grid", "showcase", "features grid"],
  "dashboard-preview": ["dashboard", "product preview", "screenshot", "ui preview"],
  "menu-section":   ["menu", "food items", "dishes", "drinks"],
  "chef-story":     ["chef", "about", "story", "team"],
  reservation:      ["reservation", "booking", "reserve", "book a table"],
  projects:         ["projects", "work", "case", "portfolio"],
  "case-studies":   ["case study", "results", "success", "client work"],
};
