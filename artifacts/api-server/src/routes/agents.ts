import { Router } from "express";
import { selectTemplatesForPrompt, buildContextFromTemplates, getTemplatesByCategory, getRegistryCatalogue } from "../components/registry";
import { strToU8, zipSync } from "fflate";
import {
  buildMinimalEditContext,
  compressProjectMemory,
  truncateForGroq,
  estimateTokenCount,
  logCompressionReport,
  GROQ_TOKEN_BUDGET,
} from "../contextManager";

const router: Router = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PLANNER_MODEL = "llama-3.3-70b-versatile";
const DESIGN_MODEL = "google/gemini-2.5-flash-lite";
const CODEGEN_MODEL = "deepseek/deepseek-chat";
const CODEFIX_MODEL = "llama-3.3-70b-versatile";
const BACKEND_MODEL = "llama-3.3-70b-versatile";

interface PageBlueprint {
  websiteType: string;
  sectionOrder: string[];
}

interface ProjectBlueprint {
  projectType: string;
  pages: string[];
  components: string[];
  databaseTables: string[];
  apis: string[];
  authNeeded: boolean;
  authProvider: string;
  dashboardNeeded: boolean;
  entities: string[];
  relationships: string[];
  navigation: string[];
  features: string[];
  techStack: {
    frontend: string;
    routing: string;
    ui: string;
    backend: string;
    database: string;
  };
  description: string;
}

interface DesignDNA {
  designLanguage: string;
  layoutStyle: string;
  typographySystem: {
    headingWeight: string;
    headingTracking: string;
    scale: string;
    fontFamily: string;
  };
  spacingSystem: {
    density: string;
    sectionPadding: string;
    componentGap: string;
  };
  colorSystem: {
    theme: string;
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
  };
  animationPersonality: string;
  decorationLevel: string;
  componentPreferences: string[];
  heroStyle: string;
  cardStyle: string;
  visualDensity: string;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  bgGradient: string;
  headingGradient: string;
  buttonStyle: string;
  buttonColors: string;
  cardStyleTokens: string;
  mood: string;
}

function sse(res: any, data: object) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function callGroq(apiKey: string, model: string, messages: any[], stream: false, maxTokens?: number): Promise<string>;
async function callGroq(apiKey: string, model: string, messages: any[], stream: true, maxTokens?: number, onToken?: (t: string) => void): Promise<string>;
async function callGroq(
  apiKey: string,
  model: string,
  messages: any[],
  stream: boolean,
  maxTokens = 4000,
  onToken?: (t: string) => void
): Promise<string> {
  // ── Context safety net ────────────────────────────────────────────────────
  // Auto-compress if the combined prompt would exceed the Groq TPM window.
  // This protects every call site without requiring individual truncation logic.
  if (messages.length >= 2) {
    const sysMsg  = messages.find((m: any) => m.role === "system");
    const userMsg = messages.find((m: any) => m.role === "user");
    if (sysMsg && userMsg && typeof sysMsg.content === "string" && typeof userMsg.content === "string") {
      const { system: compSys, user: compUser, truncated } =
        truncateForGroq(sysMsg.content, userMsg.content, maxTokens);
      if (truncated) {
        console.warn(`[callGroq:auto-compress] model=${model} truncated prompt to fit ${GROQ_TOKEN_BUDGET} tok budget`);
        messages = messages.map((m: any) => {
          if (m.role === "system") return { ...m, content: compSys };
          if (m.role === "user")   return { ...m, content: compUser };
          return m;
        });
      }
    }
  }

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream, max_tokens: maxTokens }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Groq error: ${txt}`);
  }
  if (!stream) {
    const data = await resp.json() as any;
    return data.choices?.[0]?.message?.content ?? "";
  }
  let full = "";
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const token: string = json.choices?.[0]?.delta?.content ?? "";
        if (token) { full += token; onToken?.(token); }
      } catch { }
    }
  }
  return full;
}

interface OpenRouterError extends Error {
  status: number;
  requestId: string;
  model: string;
  body: string;
}

async function callOpenRouter(apiKey: string, model: string, messages: any[], maxTokens = 4000): Promise<string> {
  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://voxai.replit.app",
      "X-Title": "VoxAI",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });
  const requestId = resp.headers.get("x-request-id") ?? resp.headers.get("cf-ray") ?? "unknown";
  if (!resp.ok) {
    const body = await resp.text();
    const err = new Error(`OpenRouter ${resp.status} for model "${model}" [req:${requestId}]: ${body}`) as OpenRouterError;
    err.status = resp.status;
    err.requestId = requestId;
    err.model = model;
    err.body = body;
    throw err;
  }
  const data = await resp.json() as any;
  return data.choices?.[0]?.message?.content ?? "";
}

const SECTION_MENU = `
Available sections (use only what fits the site type):
- Navbar          — sticky nav with logo + links
- Hero            — above-the-fold hero section
- LogoCloud       — trusted-by brand logo strip
- FeaturesBento   — asymmetric bento grid for features (modern/premium)
- Features        — classic 3-column feature cards grid
- DashboardPreview — product UI / dashboard screenshot mockup
- Testimonials    — customer testimonials cards
- SocialProof     — stats, metrics, trust indicators
- Pricing         — pricing tiers
- CTA             — call-to-action banner
- FAQ             — accordion FAQ
- Gallery         — photo/work gallery grid
- Menu            — restaurant menu with tabs
- ChefStory       — restaurant chef/about split section
- Reservation     — restaurant booking form
- Projects        — portfolio project grid
- CaseStudies     — agency case study results
- Contact         — contact form + info
- Footer          — site footer
`.trim();

const ARCHITECTURE_SYSTEM = `You are an Architecture Agent V2 for an AI software builder. Analyze the user's prompt and output a complete, precise project blueprint as JSON. Blueprint is the single source of truth — every field drives downstream code generation.

Output ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "projectType": "one of: Landing Page, SaaS, E-commerce, Portfolio, Restaurant, Agency, Blog, Dashboard App, AI Tool, Developer Tool, CRM, Project Management Tool",
  "pages": ["exact page names that will become files, e.g. Landing, Dashboard, Login, Signup, Settings, Pricing, Customers, Deals, Analytics, Profile"],
  "components": ["shared reusable component names, e.g. Navbar, Footer, Sidebar, PricingCard, FeatureGrid, StatsCard"],
  "databaseTables": ["snake_case table names, e.g. users, customers, deals, projects, subscriptions, posts — empty array for simple landing pages"],
  "apis": ["API route domains matching databaseTables, e.g. auth, users, customers, deals, projects, billing — empty array for simple landing pages"],
  "authNeeded": false,
  "authProvider": "JWT | Supabase | Clerk — only set when authNeeded is true, else empty string",
  "dashboardNeeded": false,
  "entities": ["PascalCase entity names matching tables, e.g. User, Customer, Deal, Project, Subscription"],
  "relationships": ["e.g. User has many Projects, Project belongs to User, Customer has many Deals"],
  "navigation": ["nav items the app needs, e.g. Dashboard, Customers, Deals, Settings, Profile"],
  "features": ["specific feature names, e.g. Customer List, Deal Pipeline, Revenue Analytics, CSV Export, Email Notifications"],
  "techStack": {
    "frontend": "React + TypeScript + Tailwind CSS",
    "routing": "React Router v6",
    "ui": "shadcn/ui + Lucide Icons",
    "backend": "Express.js + TypeScript",
    "database": "PostgreSQL + Prisma"
  },
  "description": "one sentence describing what this software does and who it is for"
}

Detection rules:
- Simple landing page/portfolio/restaurant: authNeeded false, pages ["Landing"], databaseTables [], apis [], entities [], relationships []
- SaaS / Dashboard App: authNeeded true, authProvider "JWT", dashboardNeeded true, pages include Login/Signup/Dashboard + domain pages, full databaseTables and apis
- CRM: pages [Landing, Dashboard, Customers, Deals, Settings], apis [auth, customers, deals], databaseTables [users, customers, deals], authNeeded true
- E-commerce: authNeeded true, pages include Landing/Products/Cart/Checkout/Orders, databaseTables [users, products, orders, cart_items]
- Blog: pages [Landing, Blog, Post, About], databaseTables [users, posts, categories], authNeeded true (for admin)
- Every api must correspond to a databaseTable. Every entity must correspond to a table.
- authProvider defaults to "JWT" when authNeeded is true and no specific provider is mentioned
- Be precise: relationships MUST be inferred from pages + tables (e.g. if users and projects exist: "User has many Projects")
- navigation MUST match the pages array entries that are primary nav destinations
- features MUST list concrete features visible in the UI (not generic descriptions)`;

const PLANNER_SYSTEM = `You are a Planner Agent for an AI website builder. Analyze the user's request and produce TWO things:

PART 1 — PLAN (visible to user):
Format with these exact emoji headers:
✅ Plan (Checklist)
Write 4-7 TECHNICAL BUILD STEPS. Each must name a real component, library, or UI feature.

📋 Project Summary
2-3 sentences about what's being built, who it targets, and visual direction.

📄 Pages
List 3-5 pages with 3-4 sections each, specific to this website type.
Format: [N]. [Page Name]
   • [specific section]

⚙️ Technical Details
• Tech Stack: React 18 + Tailwind CSS
• [2-3 specific technical notes for this site]
• Responsive: Mobile-first

PART 2 — DESIGN BRIEF (for internal use, append after plan):
---DESIGN_BRIEF---
businessName: [extracted business name or type]
websiteType: [e.g. SaaS, Restaurant, Portfolio, E-commerce, Agency]
targetAudience: [who this is for]
contentTone: [e.g. Professional, Playful, Luxury, Minimal, Bold]
keyFeatures: [comma-separated list of 3-4 key features]
colorMood: [e.g. Dark & Techy, Light & Clean, Vibrant & Bold, Elegant & Minimal]
referenceSites: [ONLY sites EXPLICITLY named by the user, comma-separated in user order — or "none". NEVER add inferred or competitor sites.]
primaryReference: [the single FIRST and most dominant reference explicitly mentioned by the user — or "none"]
secondaryReferences: [any additional explicitly mentioned references in user order — or "none"]
---END_BRIEF---

PART 3 — PAGE BLUEPRINT (for internal use, append after design brief):
---PAGE_BLUEPRINT---
{
  "websiteType": "[exact site type]",
  "sectionOrder": [list of section names from the available sections, in order, tailored to this specific site type]
}
---END_BLUEPRINT---

${SECTION_MENU}

Rules for sectionOrder:
- Navbar is always first, Footer is always last
- Hero is almost always second
- Choose sections that make sense for the specific site type — NOT a generic list
- A restaurant site needs: Gallery, Menu, ChefStory, Reservation — NOT Pricing or FeaturesBento
- A portfolio needs: Projects, CaseStudies, Contact — NOT Pricing or LogoCloud
- A SaaS/AI startup needs: LogoCloud, FeaturesBento or Features, DashboardPreview, Pricing, Testimonials
- An agency needs: Projects or CaseStudies, Testimonials, Contact
- Minimum 5 sections, maximum 9 sections
- Only use section names exactly as listed above

CRITICAL REFERENCE EXTRACTION RULES (apply strictly to referenceSites / primaryReference / secondaryReferences):
- Include ONLY sites the user explicitly named. Never infer, add competitors, or expand references.
- "similar to Linear" → referenceSites: "Linear", primaryReference: "Linear", secondaryReferences: "none"
- "similar to Vercel" → referenceSites: "Vercel", primaryReference: "Vercel", secondaryReferences: "none"
- "inspired by Stripe and Linear" → referenceSites: "Stripe, Linear", primaryReference: "Stripe", secondaryReferences: "Linear"
- Never add Stripe to a Linear prompt. Never add Vercel to a Stripe prompt. Never expand single references.
- User's word order = priority order. First mentioned = primaryReference.

Respond ONLY in this format. No preamble.`;

const DESIGN_SYSTEM = `You are a Design Agent. Your job is to detect the visual DNA from the website brief and reference sites, then output a precise design system as JSON.

REFERENCE SITE DNA LIBRARY — when a reference is detected, apply its design DNA exactly:

Linear → { designLanguage: "minimal-flat", theme: dark, bg: #0F0F0F, surface: #1A1A1A, primary: #5E6AD2, accent: #5E6AD2, text: #FFFFFF, textMuted: #8A8A8A, border: #2A2A2A, headingWeight: font-black, headingTracking: tracking-tight, scale: lg, cardStyle: flat-bordered, heroStyle: editorial-large, animationPersonality: subtle, decorationLevel: none, visualDensity: dense, buttonStyle: rounded-md, mood: Focused }

Stripe → { designLanguage: "premium-gradient", theme: dark, bg: #0A2540, surface: #0F3460, primary: #635BFF, accent: #00D4FF, text: #FFFFFF, textMuted: #A8B4C0, border: rgba(255,255,255,0.1), headingWeight: font-bold, headingTracking: tracking-tight, scale: xl, cardStyle: gradient-border, heroStyle: centered-gradient, animationPersonality: expressive, decorationLevel: rich, visualDensity: balanced, buttonStyle: rounded-full, mood: Premium }

Vercel → { designLanguage: "monochrome", theme: dark, bg: #000000, surface: #111111, primary: #FFFFFF, accent: #FFFFFF, text: #FFFFFF, textMuted: #888888, border: #333333, headingWeight: font-black, headingTracking: tracking-tighter, scale: xl, cardStyle: flat-bordered, heroStyle: split-layout, animationPersonality: subtle, decorationLevel: none, visualDensity: balanced, buttonStyle: rounded-lg, mood: Sharp }

Notion → { designLanguage: "editorial", theme: light, bg: #FFFFFF, surface: #F7F6F3, primary: #37352F, accent: #2F80ED, text: #37352F, textMuted: #9B9B9B, border: #E9E9E7, headingWeight: font-bold, headingTracking: tracking-normal, scale: md, cardStyle: outline-hover, heroStyle: editorial-large, animationPersonality: none, decorationLevel: minimal, visualDensity: comfortable, buttonStyle: rounded-md, mood: Editorial }

Framer → { designLanguage: "bold-motion", theme: dark, bg: #0B0B0B, surface: #141414, primary: #FF3D57, accent: #FF6B35, text: #FFFFFF, textMuted: #666666, border: #222222, headingWeight: font-black, headingTracking: tracking-tighter, scale: xl, cardStyle: flat-bordered, heroStyle: editorial-large, animationPersonality: expressive, decorationLevel: moderate, visualDensity: balanced, buttonStyle: rounded-none, mood: Dramatic }

Cursor → { designLanguage: "dev-minimal", theme: dark, bg: #0D0D0D, surface: #161616, primary: #00FF9D, accent: #00FF9D, text: #FFFFFF, textMuted: #555555, border: #252525, headingWeight: font-bold, headingTracking: tracking-tight, scale: lg, cardStyle: flat-bordered, heroStyle: centered-minimal, animationPersonality: subtle, decorationLevel: none, visualDensity: dense, buttonStyle: rounded-sm, mood: Terminal }

Perplexity → { designLanguage: "academic-clean", theme: dark, bg: #1C1C1E, surface: #2C2C2E, primary: #FF6600, accent: #FF6600, text: #FFFFFF, textMuted: #8E8E93, border: #3A3A3C, headingWeight: font-semibold, headingTracking: tracking-normal, scale: md, cardStyle: solid-surface, heroStyle: centered-minimal, animationPersonality: subtle, decorationLevel: none, visualDensity: dense, buttonStyle: rounded-lg, mood: Informative }

DOMINANCE RULES — When a primary reference is specified, you MUST output EXACTLY that reference's DNA. Do NOT blend with other design systems:
- Single reference: The entire DNA must match that reference. No exceptions. No mixing.
- Linear as primary: designLanguage MUST be "minimal-flat", heroStyle MUST be "editorial-large", decorationLevel MUST be "none"
- Stripe as primary: designLanguage MUST be "premium-gradient", heroStyle MUST be "centered-gradient", decorationLevel MUST be "rich"
- Vercel as primary: designLanguage MUST be "monochrome", heroStyle MUST be "split-layout", decorationLevel MUST be "none"
- Framer as primary: designLanguage MUST be "bold-motion", heroStyle MUST be "editorial-large", animationPersonality MUST be "expressive"
- Notion as primary: designLanguage MUST be "editorial", heroStyle MUST be "editorial-large", theme MUST be "light"
- Multiple references: primaryReference (first mentioned) controls the entire DNA. Secondary references are ignored for DNA selection.

INSTRUCTIONS:
1. Identify the primaryReference (first explicitly named reference site in the brief/prompt)
2. If a primaryReference is found, apply ONLY its DNA from the library above — do NOT blend with secondary references
3. If no reference is found, derive a unique design identity from the business type, industry, and tone
4. NEVER default to purple gradients. NEVER default to glassmorphism unless explicitly appropriate.
5. Every site must have a unique visual identity

Industry defaults when no reference is given:
- Fintech/Banking → dark navy, blue accent, premium, trust-focused
- Healthcare → light clean, green/teal accent, calm, editorial
- Food/Restaurant → warm dark, amber accent, textured, sensory
- Fashion/Luxury → black/cream, gold accent, serif, editorial
- Education → light, indigo accent, readable, comfortable
- Developer Tool → dark, green/cyan accent, monospace, dense
- Creative Agency → dark, bold accent color, dramatic typography
- E-commerce → light clean or dark based on brand, clear CTAs

Output ONLY this JSON (no markdown, no explanation, no code fences):
{
  "designLanguage": "minimal-flat | premium-gradient | monochrome | editorial | bold-motion | dev-minimal | academic-clean | warm-organic | luxury-editorial",
  "layoutStyle": "flat-ui | layered-depth | grid-strict | editorial-flow | asymmetric | dense-grid",
  "typographySystem": {
    "headingWeight": "font-black | font-bold | font-semibold",
    "headingTracking": "tracking-tighter | tracking-tight | tracking-normal | tracking-wide",
    "scale": "xl | lg | md",
    "fontFamily": "sans | serif | mono"
  },
  "spacingSystem": {
    "density": "tight | comfortable | spacious",
    "sectionPadding": "py-16 | py-20 | py-24 | py-32",
    "componentGap": "gap-3 | gap-4 | gap-6 | gap-8"
  },
  "colorSystem": {
    "theme": "dark | light",
    "background": "#hexcode",
    "surface": "#hexcode",
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "text": "#hexcode",
    "textMuted": "#hexcode",
    "border": "#hexcode or rgba(...)"
  },
  "animationPersonality": "none | subtle | moderate | expressive",
  "decorationLevel": "none | minimal | moderate | rich",
  "componentPreferences": ["flat-card", "gradient-card", "bordered-card", "pill-badge", "sharp-badge", "outline-button", "solid-button", "ghost-button"],
  "heroStyle": "centered-minimal | centered-gradient | split-layout | editorial-large | fullbleed-overlay",
  "cardStyle": "flat-bordered | glass-blur | solid-surface | gradient-border | outline-hover",
  "visualDensity": "sparse | balanced | dense",
  "theme": "dark | light",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode",
  "accentColor": "#hexcode",
  "bgColor": "#hexcode",
  "bgGradient": "tailwind from-[bg] to-[bg2] (subtle, matching theme)",
  "headingGradient": "tailwind gradient matching primary/accent colors",
  "buttonStyle": "rounded-full | rounded-lg | rounded-md | rounded-sm | rounded-none",
  "buttonColors": "tailwind bg and text classes",
  "cardStyleTokens": "tailwind classes for card bg, border, radius",
  "mood": "one word"
}`;

function buildCodeSystem(design: DesignDNA, blueprint: PageBlueprint, componentContext?: string, projectBlueprint?: ProjectBlueprint | null) {
  const sectionList = blueprint.sectionOrder.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const functionNames = blueprint.sectionOrder.map(s => `${s}()`).join(', ');
  const appReturn = blueprint.sectionOrder.map(s => `<${s}/>`).join('');
  const registryCatalogue = getRegistryCatalogue();
  const componentSection = componentContext
    ? `\n\n${registryCatalogue}\n\nCOMPONENT LIBRARY TEMPLATES (use as structural reference — adapt content, colors, and copy for this specific site):\n${componentContext}\n`
    : `\n\n${registryCatalogue}\n`;

  const cs = design.colorSystem ?? {};
  const ts = design.typographySystem ?? {};
  const ss = design.spacingSystem ?? {};

  const bg = cs.background ?? design.bgColor ?? '#0a0a0a';
  const surface = cs.surface ?? '#1a1a1a';
  const primary = cs.primary ?? design.primaryColor ?? '#ffffff';
  const accent = cs.accent ?? design.accentColor ?? primary;
  const textColor = cs.text ?? '#ffffff';
  const textMuted = cs.textMuted ?? '#888888';
  const borderColor = cs.border ?? '#333333';
  const isLight = (design.theme ?? cs.theme) === 'light';

  const headingWeight = ts.headingWeight ?? 'font-bold';
  const headingTracking = ts.headingTracking ?? 'tracking-tight';
  const headingScale = ts.scale === 'xl' ? 'text-6xl md:text-8xl' : ts.scale === 'lg' ? 'text-5xl md:text-7xl' : 'text-4xl md:text-5xl';
  const subHeadingScale = ts.scale === 'xl' ? 'text-4xl md:text-5xl' : ts.scale === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl';

  const sectionPad = ss.sectionPadding ?? 'py-24';
  const componentGap = ss.componentGap ?? 'gap-6';

  const cardStyleGuide = (() => {
    switch (design.cardStyle) {
      case 'flat-bordered': return `bg-[${surface}] border border-[${borderColor}] rounded-xl`;
      case 'glass-blur': return `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`;
      case 'solid-surface': return `bg-[${surface}] rounded-xl`;
      case 'gradient-border': return `bg-[${surface}] border border-[${accent}]/30 rounded-2xl hover:border-[${accent}]/60`;
      case 'outline-hover': return `bg-transparent border border-[${borderColor}] hover:border-[${primary}] rounded-lg`;
      default: return `bg-[${surface}] border border-[${borderColor}] rounded-xl`;
    }
  })();

  const buttonGuide = (() => {
    const radius = design.buttonStyle ?? 'rounded-lg';
    const comps = design.componentPreferences ?? [];
    if (comps.includes('ghost-button')) return `border border-[${primary}] text-[${primary}] hover:bg-[${primary}]/10 ${radius}`;
    if (comps.includes('outline-button')) return `border border-[${borderColor}] text-[${textColor}] hover:border-[${primary}] ${radius}`;
    return `bg-[${primary}] text-${isLight ? 'white' : 'white'} hover:opacity-90 ${radius}`;
  })();

  const heroGuide = (() => {
    switch (design.heroStyle) {
      case 'centered-minimal': return 'min-h-screen flex flex-col items-center justify-center text-center px-6 — clean, no heavy decoration, strong typography only';
      case 'centered-gradient': return 'min-h-screen flex flex-col items-center justify-center text-center px-6 — add radial gradient orbs and layered depth';
      case 'split-layout': return 'min-h-screen grid grid-cols-1 md:grid-cols-2 gap-0 — left: text content, right: visual/mockup';
      case 'editorial-large': return 'min-h-screen flex flex-col justify-end px-8 md:px-16 pb-24 — huge oversized text, minimal other content';
      case 'fullbleed-overlay': return 'min-h-screen relative — full background color/image with overlay, centered content';
      default: return 'min-h-screen flex flex-col items-center justify-center text-center px-6';
    }
  })();

  const animationGuide = (() => {
    switch (design.animationPersonality) {
      case 'none': return 'No hover animations. No transitions. Static elements only.';
      case 'subtle': return 'Subtle hover effects only: hover:opacity-80, hover:border-color transitions (duration-200). No scale transforms.';
      case 'moderate': return 'Moderate hover effects: hover:scale-[1.02], hover:-translate-y-1, color transitions (duration-300).';
      case 'expressive': return 'Rich animations: hover:scale-105, hover:-translate-y-2, gradient shimmer, group-hover transitions (duration-300 ease-out). Add animated gradient orbs in backgrounds.';
      default: return 'Subtle hover transitions only.';
    }
  })();

  const decorationGuide = (() => {
    switch (design.decorationLevel) {
      case 'none': return 'NO decorative elements. No gradient orbs, no background patterns, no decorative shapes. Let typography and spacing do the work.';
      case 'minimal': return 'Minimal decoration: single subtle accent line or dot. No orbs or blobs.';
      case 'moderate': return 'Moderate decoration: one subtle background gradient, geometric lines or grid pattern at low opacity.';
      case 'rich': return 'Rich decoration: gradient orbs (blur-3xl, low opacity), animated gradient backgrounds, depth layers, particle-like dots grid.';
      default: return 'Minimal decoration only.';
    }
  })();

  const headingGradient = design.headingGradient ?? `from-[${textColor}] to-[${textMuted}]`;

  // Phase 6 — Layout Style Engine: layoutStyle actively drives structural decisions
  const layoutStyleRules = (() => {
    switch (design.layoutStyle) {
      case 'editorial-flow': return `
═══ LAYOUT STYLE — Editorial Flow ═══
- Section headings MUST be oversized (text-5xl md:text-7xl or larger), LEFT-ALIGNED, never centered
- Avoid rigid card grids — prefer flowing rows, single-column lists, large pull-quotes
- Heavy whitespace — sections feel like editorial magazine spreads
- At least 2 sections must use left-aligned (NOT centered) layout
- Use thin horizontal rules (border-t border-white/10) to separate content blocks
- Typography does the visual work — minimize boxed cards`;
      case 'grid-strict': return `
═══ LAYOUT STYLE — Grid Strict ═══
- ALL content in explicit CSS grid — use grid-cols-2, grid-cols-3, or grid-cols-4 for every section
- Consistent card heights across all cards in each section
- Information-dense: prefer gap-4 over gap-6, compact py-16 padding
- Use precise col-span values to create visual hierarchy
- Tables and data lists are preferred over freeform layouts`;
      case 'asymmetric': return `
═══ LAYOUT STYLE — Asymmetric ═══
- Every content section ALTERNATES direction: text-left+visual-right, then visual-left+text-right
- Use unequal column splits: 7/5, 8/4, or 5/7 — NEVER equal 6/6 splits
- Nothing is centered except the hero — all other sections are left or right weighted
- Stagger cards: alternate heights or use -mt-8 offset on every other column`;
      case 'layered-depth': return `
═══ LAYOUT STYLE — Layered Depth ═══
- Elements must OVERLAP using negative margins (-mt-12) or relative/absolute positioning
- Cards use z-index stacking (z-10, z-20, z-30) to create visible depth
- Floating panels: use shadow-2xl + ring-1 to make elements appear to float
- Background cards peek behind foreground elements using translate-y or opacity layers
- At least 1 section must have visually overlapping elements`;
      case 'dense-grid': return `
═══ LAYOUT STYLE — Dense Grid ═══
- Section padding MAXIMUM py-16 — no py-24 or py-32 anywhere
- Use text-sm for body, text-xs for labels throughout — compact and information-rich
- Prefer grid-cols-4 over grid-cols-3, grid-cols-3 over grid-cols-2
- Tight gaps: gap-2 or gap-3 (not gap-6 or gap-8)
- Tables and data-heavy lists preferred over decorative card layouts`;
      default: return '';
    }
  })();

  // Phase 8 — Structure Randomization: deterministic variation per blueprint to break template cloning
  const variationSeed = blueprint.sectionOrder.join('').split('').reduce((a: number, c: string) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  const featureCount = 3 + (variationSeed % 3);       // 3, 4, or 5 features
  const statCount = 2 + (variationSeed % 2);            // 2 or 3 stats
  const accentVariant = ['side-border', 'number-prefix', 'horizontal-rule'][variationSeed % 3];
  const structureVariationRules = `
═══ STRUCTURE VARIATION (apply exactly — do NOT replicate template DOM verbatim) ═══
- Feature items for this site: use exactly ${featureCount} (not 3, not 6 — exactly ${featureCount})
- Stats/metrics: show exactly ${statCount} key metrics in hero or social proof sections
- Card accent style: use "${accentVariant}" as a visual accent on at least one section's cards
- One section MUST use a horizontal flex-row layout (not a vertical stack or grid)
- At least one section MUST NOT use cards — use a numbered list, table row, or pure text layout instead
- VARY the grid column count across sections — never use the same grid-cols-N in every section`;

  return `You are a Code Generation Agent. Generate a COMPLETE, PRODUCTION-READY React + Tailwind website with a UNIQUE visual identity.${componentSection}

═══ DESIGN DNA ═══
Design Language: ${design.designLanguage}
Layout Style: ${design.layoutStyle}
Theme: ${isLight ? 'LIGHT' : 'DARK'}
Mood: ${design.mood}
Visual Density: ${design.visualDensity}

═══ COLOR SYSTEM ═══
Background: ${bg}
Surface (cards/panels): ${surface}
Primary: ${primary}
Accent: ${accent}
Text: ${textColor}
Text Muted: ${textMuted}
Border: ${borderColor}
Heading Gradient: ${headingGradient}

═══ TYPOGRAPHY ═══
Heading weight: ${headingWeight}
Heading tracking: ${headingTracking}
Hero heading size: ${headingScale}
Section heading size: ${subHeadingScale}
Font family: ${ts.fontFamily ?? 'sans'} (use font-${ts.fontFamily ?? 'sans'} class)

═══ SPACING ═══
Section padding: ${sectionPad}
Component gap: ${componentGap}
Density: ${ss.density ?? 'comfortable'}

═══ COMPONENT STYLES ═══
Card style — use exactly: ${cardStyleGuide}
Button (primary): ${buttonGuide}
Button (secondary): border border-[${borderColor}] text-[${textMuted}] hover:text-[${textColor}] hover:border-[${primary}] ${design.buttonStyle ?? 'rounded-lg'} px-6 py-3

═══ HERO LAYOUT ═══
${heroGuide}

═══ ANIMATION RULES ═══
${animationGuide}

═══ DECORATION RULES ═══
${decorationGuide}

═══ PAGE BLUEPRINT ═══
Build EXACTLY these sections in this exact order:
${sectionList}

Do NOT add sections not in this list. Do NOT rearrange the order.
Each section must be a separate named function matching the section name exactly.

LAYOUT RULES (apply per section type):
- Features / FeaturesBento: grid layout — NEVER single column on desktop
- Testimonials: "grid grid-cols-1 md:grid-cols-3 ${componentGap}"
- Pricing: "grid grid-cols-1 md:grid-cols-3 ${componentGap}", middle card uses scale-105
- Footer: "grid grid-cols-2 md:grid-cols-4 gap-8"
- HEADINGS: The hero H1 ONLY may use the heading gradient (bg-clip-text text-transparent bg-gradient-to-r ${headingGradient}). ALL other section headings MUST use plain text-[${textColor}]. Vary each section heading style: underline accent, uppercase overline label, large number prefix, oversized drop cap, or border-l side bar — NEVER the same style twice.
${layoutStyleRules}
${structureVariationRules}

═══ SHADCN/UI COMPONENTS ═══
The following components are available as globals (no import needed). Use them for interactive UI elements:
- <Button variant="default|outline|ghost|secondary|destructive" size="default|sm|lg">...</Button>
- <Card className="..."><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>...</CardContent></Card>
- <Input placeholder="..." className="..." type="text|email|password" />
- <Badge variant="default|secondary|outline">Status</Badge>
- <Avatar><AvatarImage src="..." /><AvatarFallback>AB</AvatarFallback></Avatar>
Prefer these over raw <button> / <input> / <div> for form elements and action buttons.

═══ MULTI-FILE STRUCTURE ═══
Each section function will be extracted into its own TypeScript file. Mark file boundaries with delimiter comments:
// === FILE: src/components/Navbar.tsx ===
function Navbar() { ... }

// === FILE: src/components/Hero.tsx ===
function Hero() { ... }

// === FILE: src/App.tsx ===
function App() { ... }

Rules:
- Component/section files: src/components/
- App.tsx: src/
- Write each function as self-contained (no cross-function variable sharing)

═══ SVG ILLUSTRATIONS ═══
When a section needs a visual but no image is specified — create an inline SVG:
- Product/dashboard screenshot: SVG browser frame (rounded rect + 3 dot circles) containing simplified rect grid rows
- Bar chart: vertical rect elements at varying heights above a baseline line
- Line chart: polyline on faint grid lines
- Icon illustrations: simple geometric shapes using stroke="currentColor"
- Dimensions: viewBox="0 0 400 240" or "0 0 320 200", keep shapes simple
- Colors: use design accent color (${accent}) for highlight shapes, border color (${borderColor}) for structural lines

ABSOLUTE TECHNICAL RULES (breaking these crashes the preview):
1. NO import statements. NO require(). React and all hooks are already global.
2. NO export statements. Do NOT write "export default" or "export function".
3. NO TypeScript types or interfaces.
4. NO JSX fragments (<> </>). Always use a wrapper div.
5. Use React.useState, React.useEffect (always namespace with React.)
6. ONLY Tailwind CSS classes — no style={} objects except for WebkitTextStroke.
7. Each section function must be named EXACTLY as listed in the blueprint above.
8. Use Lucide icons — they are available as global variables in the preview. Use them as JSX: <ChevronRight size={16} />, <ArrowRight size={20} />, <Star size={18} />, <Check size={16} />, <Zap size={20} />, <Shield size={20} />, <Globe size={20} />, <Users size={20} />, <BarChart3 size={20} />, <Code2 size={20} />, <Layers size={20} />, <Sparkles size={20} />, <Play size={16} />, <Menu size={20} />, <X size={16} />, <ExternalLink size={14} />, <Github size={20} />, <Twitter size={20} />, <Mail size={16} />. Import syntax: NOT needed (globals). Use size prop and className for color.
9. Use bg-[#hexcode] syntax for custom colors from the design DNA above.

CODE STRUCTURE — required pattern:
// === FILE: src/components/SectionName.tsx ===
[one function per section, each preceded by its FILE delimiter]
// === FILE: src/App.tsx ===
function App() { return (<div>${appReturn}</div>); }

The App() function must render all ${blueprint.sectionOrder.length} sections: ${functionNames}

Use .map() for all repeated elements. Replace ALL placeholder text with real, specific content for this site.
OUTPUT: Raw JSX only. No markdown. Start with the first section function.`;
}

const CODEFIX_SYSTEM = `You are a Code Fix Agent. You receive React/JSX code and MUST fix it to be preview-safe.

1. Fix these CRITICAL issues:
   - Remove any import/export statements (they break the preview)
   - Remove any TypeScript types or interfaces
   - Remove any JSX fragments (<> </>) — replace with wrapper divs
   - Ensure the file ends with "function App()" that renders all sections
   - Ensure all React hooks use React.useState, React.useEffect (namespaced)
   - Convert inline style={} objects to Tailwind classes (exception: WebkitTextStroke is allowed)
   - Fix any syntax errors or unclosed JSX tags

2. Preserve the dynamic structure:
   - Do NOT add or remove sections — keep exactly the sections that exist in the code
   - Do NOT enforce any fixed section order — the blueprint determines the order
   - Add hover effects on interactive elements if missing (respect animation personality)
   - KEEP all Lucide icon JSX elements (<ChevronRight />, <ArrowRight />, <Star />, etc.) — they are available as globals in the preview. Do NOT remove them.

3. Return ONLY the corrected raw JSX code. No markdown, no explanation.
   Start with the first section function (not App).`;

const BACKEND_SYSTEM = `You are a Backend Agent generating Express.js TypeScript API route files.

Generate EACH API route file using FILE delimiter comments:
// === FILE: src/api/routeName.ts ===

Each generated file MUST include:
1. Import { Router, Request, Response } from 'express' and { z } from 'zod'
2. Zod validation schemas for request bodies (CreateSchema, UpdateSchema)
3. TypeScript interfaces for the entity
4. Express Router with GET /, POST /, GET /:id, PUT /:id, DELETE /:id routes
5. Async handlers with try/catch and proper HTTP status codes (200, 201, 400, 404, 500)
6. export default router at the end

Also generate:
// === FILE: src/server.ts ===
Express app with all routers mounted at /api/:routeName

// === FILE: src/middleware/errorHandler.ts ===
Global error handler middleware

Rules:
- Write complete, realistic CRUD stubs (not placeholder comments)
- Use meaningful field names inferred from entity names
- TypeScript strict mode: all types explicit
- Return JSON responses with { data } or { error } shape
- No hardcoded data — comment where DB calls will go
- Every file must compile without errors`;

const DATABASE_SYSTEM = `You are a Database Agent generating PostgreSQL and Prisma schema files.

Generate EXACTLY two files using FILE delimiter comments:

// === FILE: schema.sql ===
Complete PostgreSQL DDL

// === FILE: prisma/schema.prisma ===
Complete Prisma schema

Requirements for schema.sql:
- CREATE TABLE IF NOT EXISTS for every table
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- Foreign key constraints with ON DELETE CASCADE or SET NULL
- created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
- CREATE INDEX ON frequently queried columns (foreign keys, email, status)
- NOT NULL constraints where logically required

Requirements for prisma/schema.prisma:
- datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
- generator client { provider = "prisma-client-js" }
- Model for EVERY table with matching fields
- @id @default(uuid())
- @relation() decorators matching SQL foreign keys
- createdAt DateTime @default(now()), updatedAt DateTime @updatedAt
- @unique on email fields

Rules:
- camelCase field names in Prisma, snake_case column names in SQL
- Infer column types from entity names and context
- All relationships must have both sides defined in Prisma models
- Write complete schemas — do not truncate`;

const AUTH_SYSTEM = `You are an Auth Agent generating authentication implementation files.

Generate these files using FILE delimiter comments:

// === FILE: src/lib/auth.ts ===
JWT utility functions: signToken(payload), verifyToken(token), hashPassword(password), comparePassword(plain, hash)
Use jsonwebtoken and bcryptjs. Export named functions.

// === FILE: src/middleware/authMiddleware.ts ===
Express middleware: verifyAuth(req, res, next)
Extract Bearer token from Authorization header, verify with verifyToken, attach user to req.user.
Export as default and named.

// === FILE: src/api/auth.ts ===
Express Router with POST /login, POST /signup, POST /logout, GET /me routes.
Use Zod for input validation. Return JWT token on success.

// === FILE: src/pages/Login.tsx ===
React login form. IMPORTANT: NO import/export statements (CDN environment).
Use React.useState for form state (email, password, loading, error).
POST to /api/auth/login, store token in localStorage, redirect on success.
Styled with Tailwind — dark theme, centered card layout.

// === FILE: src/pages/Signup.tsx ===
React signup form. SAME rules as Login.tsx — no imports/exports.
Fields: name, email, password. POST to /api/auth/signup.

// === FILE: src/components/ProtectedRoute.tsx ===
React component. NO imports/exports (CDN environment).
Check localStorage for token, render children if present, show login prompt if not.

Rules:
- .ts files: use proper ES module imports/exports
- .tsx files: NO import/export (they render in CDN+Babel sandbox)
- .tsx files: Use React.useState, React.useEffect (namespaced)
- Write complete, working implementations — no placeholder comments`;

// ── EDIT AGENT ────────────────────────────────────────────────────────────────
const EDIT_SYSTEM = `You are an Edit Agent for an AI software builder. You receive an edit request and the current project files.

Your job: identify ONLY the files that need to change and output their COMPLETE new content.

OUTPUT FORMAT — use FILE delimiter comments exactly:
// === FILE: src/components/Pricing.tsx ===
[complete new file content here]

To delete a file:
// === DELETE: src/pages/OldPage.tsx ===

IDENTIFICATION RULES — be surgical:
- "Change pricing section" → Pricing.tsx only
- "Add dark mode" → index.css + tailwind.config.ts (or theme file)
- "Add new page X" → X.tsx (new file) + App.tsx (updated routes)
- "Fix navigation" → Navbar.tsx only
- "Change color scheme" → index.css or design tokens file
- "Add feature Y to dashboard" → Dashboard.tsx + any relevant component

CRITICAL RULES:
1. Output ONLY files that changed — never unchanged files
2. Each modified file MUST be COMPLETE (no truncation, no "// ... rest stays same")
3. Match the exact code style and import patterns of the existing codebase
4. For TSX files (src/): use proper React named imports (import React, { useState } from 'react')
5. For .ts files: use proper ES module exports
6. If adding a new page, also update App.tsx to include the new route
7. If changing shared types, update ALL files that use those types
8. Lucide icons: import { IconName } from 'lucide-react'`;

const INTENT_SYSTEM = `You are an Intent Detector for a React TypeScript project editor. Analyze the edit request and output the MINIMAL set of files that need to change.

Output ONLY valid JSON (no markdown, no code fences):
{
  "editType": "component|route|theme|layout|style|api",
  "targetFiles": ["list of EXISTING file paths to modify"],
  "newFiles": ["list of NEW file paths to create, if any"],
  "reason": "brief reason"
}

Targeting rules:
- "Change pricing section" -> targetFiles: ["src/components/Pricing.tsx"]
- "Move navbar" -> targetFiles: ["src/App.tsx"]
- "Add dark mode" -> targetFiles: ["src/index.css"]
- "Add Settings page" -> newFiles: ["src/pages/Settings.tsx"], targetFiles: ["src/App.tsx"]
- "Remove Blog page" -> targetFiles: ["src/App.tsx"]
- "Fix navigation" -> match the navbar file
- "Update hero" -> the hero component file
- Be SURGICAL: only include files that DEFINITELY change.`;

function resolveAffectedFiles(
  targetFiles: string[],
  depGraph: Record<string, string[]>,
  allFiles: Array<{ path: string; name: string }>
): string[] {
  const resolved = new Set<string>(targetFiles);
  for (const [file, deps] of Object.entries(depGraph)) {
    for (const dep of deps) {
      const depBase = dep.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "") ?? "";
      if (targetFiles.some((t) => {
        const tBase = t.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "") ?? "";
        return tBase === depBase;
      })) {
        resolved.add(file);
      }
    }
  }
  const hasPageChange = targetFiles.some((f) => f.includes("/pages/") || f.includes("router"));
  if (hasPageChange) {
    const appFile = allFiles.find((f) => f.name === "App.tsx");
    if (appFile) resolved.add(appFile.path + appFile.name);
  }
  return Array.from(resolved);
}

function validateEditFiles(
  modifiedFiles: Array<{ path: string; name: string; lang: string; content: string }>,
  existingFiles: Array<{ path: string; name: string }>,
  targetFiles: string[]
): { score: number; passed: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  if (modifiedFiles.length === 0) { issues.push("No files modified"); score -= 60; }
  for (const f of modifiedFiles) {
    if (!f.content || f.content.length < 20) { issues.push(`${f.name}: empty`); score -= 20; continue; }
    if ((f.lang === "tsx" || f.lang === "jsx") && !f.content.includes("export default")) {
      issues.push(`${f.name}: missing default export`); score -= 15;
    }
    if (f.content.includes("// ... rest stays same") || f.content.includes("// rest of")) {
      issues.push(`${f.name}: truncated — not a complete file`); score -= 30;
    }
  }
  const existingPaths = new Set(existingFiles.map((f) => f.path + f.name));
  for (const f of modifiedFiles) {
    const fp = f.path + f.name;
    if (existingPaths.has(fp) && !targetFiles.some((t) => fp.includes(t) || t.includes(fp.split("/").pop() ?? ""))) {
      warnings.push(`${f.name}: outside original target scope`);
    }
  }
  return { score: Math.max(0, Math.min(100, score)), passed: score >= 60, issues, warnings };
}

// ── QUALITY GATE V2 ───────────────────────────────────────────────────────────
interface QualityGateResult {
  score: number;
  passed: boolean;
  issues: string[];
}

function computeQualityScore(pb: ProjectBlueprint): QualityGateResult {
  const issues: string[] = [];
  let score = 100;

  if (!pb.description || pb.description.length < 5)    { issues.push('Missing description');            score -= 5; }
  if (!pb.projectType)                                  { issues.push('Missing project type');           score -= 10; }
  if (pb.pages.length === 0)                            { issues.push('No pages defined');               score -= 15; }
  if (!pb.techStack?.frontend)                          { issues.push('Missing frontend tech stack');    score -= 10; }
  if (pb.authNeeded && !pb.authProvider)                { issues.push('Auth needed but no provider');   score -= 10; }
  if (pb.databaseTables.length > 0 && pb.entities.length === 0) { issues.push('Tables defined but no entities'); score -= 10; }
  if (pb.databaseTables.length > 0 && pb.apis.length === 0)     { issues.push('Database tables without API routes'); score -= 10; }
  if (pb.authNeeded && !pb.apis.some(a => a.toLowerCase().includes('auth'))) { issues.push('Auth needed but no auth API route'); score -= 5; }
  if (pb.entities.length > 1 && pb.relationships.length === 0)  { issues.push('Multiple entities but no relationships'); score -= 5; }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, passed: finalScore >= 70, issues };
}

// ── EDIT AGENT HELPERS ────────────────────────────────────────────────────────
function extractEditFiles(raw: string): ProjectFileSSE[] {
  const files: ProjectFileSSE[] = [];
  const delimPattern = /\/\/\s*===\s*FILE:\s*([^=\n]+?)\s*===/g;
  const positions: Array<{ fullPath: string; start: number; headerEnd: number }> = [];
  let m: RegExpExecArray | null;

  while ((m = delimPattern.exec(raw)) !== null) {
    positions.push({ fullPath: m[1].trim(), start: m.index, headerEnd: m.index + m[0].length });
  }

  for (let i = 0; i < positions.length; i++) {
    const { fullPath, headerEnd } = positions[i];
    const rawContent = raw.slice(headerEnd, i + 1 < positions.length ? positions[i + 1].start : raw.length).trim();
    const content = rawContent
      .replace(/^```(?:tsx?|jsx?|typescript|javascript|json|sql|css|html)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    if (content.length === 0) continue;

    const lastSlash = fullPath.lastIndexOf('/');
    const path = lastSlash >= 0 ? fullPath.slice(0, lastSlash + 1) : '';
    const name = lastSlash >= 0 ? fullPath.slice(lastSlash + 1) : fullPath;
    const ext = name.split('.').pop() ?? 'ts';
    const lang = (ext === 'tsx' || ext === 'jsx') ? 'tsx' : ext === 'json' ? 'json' : ext === 'html' ? 'html' : ext === 'css' ? 'css' : 'ts';

    files.push({ path, name, lang, content });
  }

  return files;
}

function extractDeletedPaths(raw: string): string[] {
  const paths: string[] = [];
  const deletePattern = /\/\/\s*===\s*DELETE:\s*([^=\n]+?)\s*===/g;
  let m: RegExpExecArray | null;
  while ((m = deletePattern.exec(raw)) !== null) paths.push(m[1].trim());
  return paths;
}

function mergeProjectFiles(
  existing: ProjectFileSSE[],
  modified: ProjectFileSSE[],
  deleted: string[]
): ProjectFileSSE[] {
  let result = existing.filter(f => !deleted.includes(f.path + f.name));
  for (const mf of modified) {
    const idx = result.findIndex(f => f.path === mf.path && f.name === mf.name);
    if (idx >= 0) result[idx] = mf;
    else result.push(mf);
  }
  return result;
}

const DEFAULT_DESIGN: DesignDNA = {
  designLanguage: "monochrome",
  layoutStyle: "flat-ui",
  typographySystem: {
    headingWeight: "font-black",
    headingTracking: "tracking-tighter",
    scale: "lg",
    fontFamily: "sans",
  },
  spacingSystem: {
    density: "balanced",
    sectionPadding: "py-24",
    componentGap: "gap-6",
  },
  colorSystem: {
    theme: "dark",
    background: "#0a0a0a",
    surface: "#141414",
    primary: "#ffffff",
    secondary: "#e5e5e5",
    accent: "#ffffff",
    text: "#ffffff",
    textMuted: "#666666",
    border: "#2a2a2a",
  },
  animationPersonality: "subtle",
  decorationLevel: "none",
  componentPreferences: ["flat-card", "solid-button"],
  heroStyle: "centered-minimal",
  cardStyle: "flat-bordered",
  visualDensity: "balanced",
  theme: "dark",
  primaryColor: "#ffffff",
  secondaryColor: "#e5e5e5",
  accentColor: "#ffffff",
  bgColor: "#0a0a0a",
  bgGradient: "from-[#0a0a0a] to-[#111111]",
  headingGradient: "from-white to-gray-400",
  buttonStyle: "rounded-lg",
  buttonColors: "bg-white text-black hover:bg-gray-100",
  cardStyleTokens: "bg-[#141414] border border-[#2a2a2a] rounded-xl",
  mood: "Sharp",
};

// ── Phase 2: Blueprint Validation Layer ─────────────────────────────────────

interface BlueprintValidation {
  valid: boolean;
  errors: string[];
}

function validateProjectBlueprint(bp: ProjectBlueprint): BlueprintValidation {
  const errors: string[] = [];
  if (!bp.projectType || bp.projectType.trim() === '') errors.push('projectType is missing');
  if (!bp.pages || bp.pages.length === 0) errors.push('pages array is empty');
  if (!Array.isArray(bp.apis)) errors.push('apis must be an array');
  if (!Array.isArray(bp.databaseTables)) errors.push('databaseTables must be an array');
  // Auto-fix: if auth is needed but auth API is missing, add it
  if (bp.authNeeded && Array.isArray(bp.apis) && !bp.apis.includes('auth')) {
    bp.apis = ['auth', ...bp.apis];
  }
  return { valid: errors.length === 0, errors };
}

// ── Phase 3/4/5: TS/SQL/Prisma file delimiter extractor ─────────────────────
// Parses "// === FILE: path/to/file.ext ===" delimiters produced by
// Backend, Database, and Auth agents.

interface ExtractedFile {
  name: string;
  path: string;
  content: string;
}

function extractBackendFiles(code: string): ExtractedFile[] {
  const delimPattern = /\/\/\s*===\s*FILE:\s*([\w\/.-]+\.(?:ts|tsx|sql|prisma))\s*===/g;
  const positions: Array<{ filePath: string; start: number; headerEnd: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = delimPattern.exec(code)) !== null) {
    positions.push({ filePath: m[1], start: m.index, headerEnd: m.index + m[0].length });
  }
  if (positions.length === 0) return [];
  return positions.map((p, i) => {
    const content = code.slice(
      p.headerEnd,
      i + 1 < positions.length ? positions[i + 1].start : code.length
    ).trim();
    const parts = p.filePath.split('/');
    const fileName = parts[parts.length - 1];
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
    return { name: fileName, path: folder, content };
  });
}

// ── Phase 4: Backend Agent ────────────────────────────────────────────────────

async function generateBackendFiles(
  apis: string[],
  entities: string[],
  projectType: string,
  groqKey: string
): Promise<ProjectFileSSE[]> {
  if (apis.length === 0) return [];

  const apiFileDelimiters = apis.map(a => `// === FILE: src/api/${a}.ts ===`).join('\n');
  const userPrompt = `Generate Express.js TypeScript API route files for a ${projectType}.

APIs to generate:
${apis.map(a => `- ${a}`).join('\n')}

Entity context: ${entities.join(', ') || 'infer from API names'}

Required file delimiters:
${apiFileDelimiters}
// === FILE: src/server.ts ===
// === FILE: src/middleware/errorHandler.ts ===

Generate all files now. Do not truncate.`;

  try {
    const raw = await callGroq(
      groqKey, BACKEND_MODEL,
      [
        { role: 'system', content: BACKEND_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      false, 4000
    );
    const extracted = extractBackendFiles(raw);
    console.log(`[BackendAgent] Extracted ${extracted.length} files from output`);
    return extracted.map(f => ({
      path: f.path,
      name: f.name,
      lang: f.name.endsWith('.tsx') ? 'tsx' : 'ts',
      content: f.content,
    }));
  } catch (e) {
    console.error('[BackendAgent] Generation failed:', e);
    return [];
  }
}

// ── Phase 5: Database Agent ───────────────────────────────────────────────────

async function generateDatabaseFiles(
  tables: string[],
  relationships: string[],
  entities: string[],
  groqKey: string
): Promise<ProjectFileSSE[]> {
  if (tables.length === 0) return [];

  const userPrompt = `Generate complete PostgreSQL and Prisma schemas.

Tables:
${tables.map(t => `- ${t}`).join('\n')}

Entities: ${entities.join(', ')}

Relationships:
${relationships.length > 0 ? relationships.map(r => `- ${r}`).join('\n') : '(infer from table names)'}

Required files:
// === FILE: schema.sql ===
// === FILE: prisma/schema.prisma ===

Generate both files completely. Do not truncate.`;

  try {
    const raw = await callGroq(
      groqKey, BACKEND_MODEL,
      [
        { role: 'system', content: DATABASE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      false, 3000
    );
    const extracted = extractBackendFiles(raw);
    console.log(`[DatabaseAgent] Extracted ${extracted.length} files from output`);
    return extracted.map(f => ({
      path: f.path,
      name: f.name,
      lang: f.name.endsWith('.sql') ? 'sql' : f.name.endsWith('.prisma') ? 'prisma' : 'ts',
      content: f.content,
    }));
  } catch (e) {
    console.error('[DatabaseAgent] Generation failed:', e);
    return [];
  }
}

// ── Phase 6: Auth Agent ───────────────────────────────────────────────────────

async function generateAuthFiles(
  authProvider: string,
  groqKey: string
): Promise<ProjectFileSSE[]> {
  const provider = (authProvider || 'JWT').toUpperCase();

  const userPrompt = `Generate authentication files for provider: ${provider}.

Required files:
// === FILE: src/lib/auth.ts ===
// === FILE: src/middleware/authMiddleware.ts ===
// === FILE: src/api/auth.ts ===
// === FILE: src/pages/Login.tsx ===
// === FILE: src/pages/Signup.tsx ===
// === FILE: src/components/ProtectedRoute.tsx ===

Provider: ${provider}
${provider === 'SUPABASE' ? 'Use @supabase/supabase-js for all auth operations.' : ''}
${provider === 'CLERK' ? 'Use @clerk/clerk-react. ClerkProvider wraps the app.' : ''}
${!['SUPABASE', 'CLERK'].includes(provider) ? 'Use jsonwebtoken + bcryptjs. Store JWT in localStorage.' : ''}

Generate all files now. Do not truncate.`;

  try {
    const raw = await callGroq(
      groqKey, BACKEND_MODEL,
      [
        { role: 'system', content: AUTH_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      false, 4000
    );
    const extracted = extractBackendFiles(raw);
    console.log(`[AuthAgent] Extracted ${extracted.length} files from output`);
    return extracted.map(f => ({
      path: f.path,
      name: f.name,
      lang: f.name.endsWith('.tsx') ? 'tsx' : 'ts',
      content: f.content,
    }));
  } catch (e) {
    console.error('[AuthAgent] Generation failed:', e);
    return [];
  }
}

// ── Phase 9: .env.example generator ──────────────────────────────────────────

// ── V4: DEPENDENCY RESOLVER ──────────────────────────────────────────────────
function resolveDependencies(pb: ProjectBlueprint) {
  const featureText = (pb.features || []).join(' ').toLowerCase();

  const frontend: Record<string, string> = {
    react: '^18.3.1', 'react-dom': '^18.3.1',
    'react-router-dom': '^6.26.0',
    'lucide-react': '^0.400.0',
    clsx: '^2.1.1', 'tailwind-merge': '^2.4.0',
  };
  const frontendDev: Record<string, string> = {
    '@types/react': '^18.3.3', '@types/react-dom': '^18.3.0',
    '@vitejs/plugin-react': '^4.3.1', typescript: '^5.5.3',
    vite: '^5.4.10', tailwindcss: '^3.4.14',
    autoprefixer: '^10.4.20', postcss: '^8.4.47',
  };
  const backend: Record<string, string> = {
    express: '^4.19.2', cors: '^2.8.5', dotenv: '^16.4.5', zod: '^3.23.8',
  };
  const backendDev: Record<string, string> = {
    '@types/express': '^4.17.21', '@types/cors': '^2.8.17',
    '@types/node': '^22.0.0', typescript: '^5.5.3',
    tsx: '^4.17.0', nodemon: '^3.1.4',
  };

  // Auth
  if (pb.authNeeded) {
    const p = (pb.authProvider || '').toLowerCase();
    if (p === 'clerk')          frontend['@clerk/clerk-react']    = '^5.7.0';
    else if (p === 'supabase')  frontend['@supabase/supabase-js'] = '^2.45.0';
    else {
      backend.jsonwebtoken   = '^9.0.2'; backend.bcryptjs      = '^2.4.3';
      backendDev['@types/jsonwebtoken'] = '^9.0.6';
      backendDev['@types/bcryptjs']     = '^2.4.6';
    }
  }

  // Database / Prisma
  if ((pb.databaseTables || []).length > 0) {
    backend['@prisma/client'] = '^5.19.0';
    backendDev.prisma         = '^5.19.0';
  }

  // Charts / analytics
  if (/chart|graph|analytic|dashboard|metric|stat/.test(featureText))
    frontend.recharts = '^2.12.0';

  // Payments
  if (/payment|stripe|billing|checkout|subscript/.test(featureText)) {
    frontend['@stripe/stripe-js'] = '^4.6.0';
    backend.stripe = '^16.12.0';
  }

  // File uploads
  if (/upload|image|photo|media|file/.test(featureText)) {
    backend.multer              = '^1.4.5-lts.1';
    backendDev['@types/multer'] = '^1.4.12';
  }

  // Email / notifications
  if (/email|newsletter|notification|mail/.test(featureText)) {
    backend.nodemailer              = '^6.9.15';
    backendDev['@types/nodemailer'] = '^6.4.16';
  }

  // Maps / geo
  if (/map|location|geo|gps/.test(featureText)) {
    frontend.leaflet             = '^1.9.4';
    frontend['react-leaflet']    = '^4.2.1';
    frontendDev['@types/leaflet'] = '^1.9.12';
  }

  return { frontend, frontendDev, backend, backendDev };
}

// ── V4: PROJECT VALIDATOR ─────────────────────────────────────────────────────
function validateProject(files: ProjectFileSSE[], pb: ProjectBlueprint): QualityGateResult {
  const issues: string[] = [];
  let score = 100;

  const allPaths = files.map(f => f.path + f.name);
  const has  = (name: string) => allPaths.some(p => p.endsWith('/' + name) || p === name);
  const hasSrc = (part: string) => allPaths.some(p => p.includes(part));

  // Core frontend files
  if (!has('package.json'))  { issues.push('package.json missing');  score -= 15; }
  if (!has('index.html'))    { issues.push('index.html missing');     score -= 10; }
  if (!has('main.tsx'))      { issues.push('main.tsx missing');       score -= 10; }
  if (!has('App.tsx'))       { issues.push('App.tsx missing');        score -= 10; }
  if (!has('index.css'))     { issues.push('index.css missing');      score -= 5; }
  if (!has('vite.config.ts')){ issues.push('vite.config.ts missing'); score -= 5; }
  if (!has('tsconfig.json')) { issues.push('tsconfig.json missing');  score -= 5; }
  if (!hasSrc('src/'))       { issues.push('No src/ directory');      score -= 10; }
  if (!hasSrc('components/') && !hasSrc('pages/'))
    { issues.push('No components or pages generated'); score -= 10; }

  // Backend requirements
  if (pb.apis.length > 0 && !hasSrc('routes/'))
    { issues.push('Backend routes missing'); score -= 5; }

  // Database requirements
  if ((pb.databaseTables || []).length > 0 && !has('schema.prisma') && !has('schema.sql'))
    { issues.push('Database schema missing'); score -= 5; }

  // Auth requirements
  if (pb.authNeeded && !hasSrc('auth') && !hasSrc('Auth'))
    { issues.push('Auth files missing despite authNeeded=true'); score -= 5; }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, passed: finalScore >= 90, issues };
}

// ── V4: REPLIT CONFIG FILES ───────────────────────────────────────────────────
function generateReplitConfig(pb: ProjectBlueprint): ProjectFileSSE {
  const hasBackend = (pb.apis || []).length > 0;
  const content = hasBackend
    ? [
        `run = "npm run dev"`,
        ``,
        `[nix]`,
        `channel = "stable-24_05"`,
        ``,
        `[[ports]]`,
        `localPort = 5173`,
        `externalPort = 80`,
        ``,
        `[[ports]]`,
        `localPort = 3001`,
        `externalPort = 3001`,
        ``,
        `[env]`,
        `NODE_ENV = "development"`,
      ].join('\n')
    : [
        `run = "npm install && npm run dev"`,
        ``,
        `[nix]`,
        `channel = "stable-24_05"`,
        ``,
        `[[ports]]`,
        `localPort = 5173`,
        `externalPort = 80`,
        ``,
        `[env]`,
        `NODE_ENV = "development"`,
      ].join('\n');

  return { path: '', name: '.replit', lang: 'toml', content };
}

function generateReplitNix(): ProjectFileSSE {
  return {
    path: '', name: 'replit.nix', lang: 'nix',
    content: `{ pkgs }: {\n  deps = [\n    pkgs.nodejs-22_x\n    pkgs.nodePackages.npm\n  ];\n}\n`,
  };
}

function generateEnvExample(pb: ProjectBlueprint): ProjectFileSSE {
  const lines: string[] = [
    '# Environment Variables — copy to .env and fill in values',
    '',
    '# Server',
    'PORT=3001',
    'NODE_ENV=development',
    '',
  ];

  if (pb.databaseTables.length > 0) {
    lines.push('# Database', 'DATABASE_URL=postgresql://user:password@localhost:5432/dbname', '');
  }

  if (pb.authNeeded) {
    const provider = (pb.authProvider || 'JWT').toLowerCase();
    if (provider === 'supabase') {
      lines.push('# Supabase Auth', 'VITE_SUPABASE_URL=https://your-project.supabase.co', 'VITE_SUPABASE_ANON_KEY=your-anon-key', '');
    } else if (provider === 'clerk') {
      lines.push('# Clerk Auth', 'VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here', '');
    } else {
      lines.push('# JWT Auth', 'JWT_SECRET=change-this-to-a-long-random-secret', 'JWT_EXPIRES_IN=7d', '');
    }
  }

  return {
    path: '',
    name: '.env.example',
    lang: 'env',
    content: lines.join('\n'),
  };
}

// ── Phase 9: README generator ─────────────────────────────────────────────────

function generateReadme(pb: ProjectBlueprint): ProjectFileSSE {
  const hasBackend = pb.apis.length > 0;
  const hasDb = pb.databaseTables.length > 0;

  const content = [
    `# ${pb.projectType}`,
    '',
    pb.description || `Generated by NexoGen AI Software Builder.`,
    '',
    '## Tech Stack',
    '',
    `- **Frontend**: ${pb.techStack.frontend}`,
    `- **UI**: ${pb.techStack.ui}`,
    `- **Routing**: ${pb.techStack.routing}`,
    hasBackend ? `- **Backend**: ${pb.techStack.backend}` : '',
    hasDb ? `- **Database**: ${pb.techStack.database}` : '',
    pb.authNeeded ? `- **Auth**: ${pb.authProvider || 'JWT'}` : '',
    '',
    '## Project Structure',
    '',
    '```',
    'src/',
    '  components/     # Shared UI components',
    '  pages/          # Page components',
    hasBackend ? '  api/            # Express API routes' : '',
    pb.authNeeded ? '  middleware/     # Auth middleware' : '',
    pb.authNeeded ? '  lib/auth.ts     # Auth utilities' : '',
    '  lib/utils.ts    # Utilities',
    '  types/          # TypeScript types',
    '  App.tsx         # Root component',
    '  main.tsx        # Entry point',
    '```',
    '',
    hasDb ? `## Database\n\nTables: ${pb.databaseTables.join(', ')}\n\nSee \`schema.sql\` and \`prisma/schema.prisma\`.\n` : '',
    pb.authNeeded ? `## Auth\n\nProvider: ${pb.authProvider || 'JWT'}. Copy \`.env.example\` to \`.env\` and configure.\n` : '',
    '## Getting Started',
    '',
    '```bash',
    'npm install',
    hasDb ? 'npx prisma migrate dev' : '',
    'npm run dev',
    '```',
  ].filter(line => line !== null && line !== undefined).join('\n');

  return {
    path: '',
    name: 'README.md',
    lang: 'md',
    content,
  };
}

// ── Server-side multi-file project builder ───────────────────────────────────
// Splits a single-blob JSX string into proper TypeScript project files.
// The `done` SSE event emits these alongside `code` (which stays for the
// live preview iframe — a CDN+Babel runtime that cannot import modules).

interface ProjectFileSSE {
  path: string;
  name: string;
  lang: string;
  content: string;
}

const SSE_LUCIDE_ICONS = [
  'ChevronRight','ChevronLeft','ChevronDown','ChevronUp',
  'ArrowRight','ArrowLeft','Star','Check','CheckCircle','X','XCircle',
  'Zap','Shield','Globe','Users','User','UserCheck',
  'BarChart','BarChart2','BarChart3','LineChart','PieChart',
  'Code','Code2','Layers','Sparkles','Play','Pause','Menu',
  'ExternalLink','Github','Twitter','Mail','Phone',
  'MapPin','Clock','Calendar','Search','Filter','Settings',
  'Heart','ThumbsUp','MessageCircle','Send','Share2',
  'Download','Upload','Cloud','Lock','Unlock','Key',
  'Eye','EyeOff','Info','AlertCircle','AlertTriangle',
  'Rocket','Package','Box','Folder','File','FileText',
  'Plus','Minus','Edit','Trash2','Copy','Clipboard',
  'Link','Linkedin','Instagram','Facebook','Youtube',
  'Monitor','Smartphone','Tablet','Laptop','Server',
  'Database','Cpu','Wifi','Battery','Power',
  'DollarSign','CreditCard','TrendingUp','TrendingDown',
  'Award','Target','Compass','Map','Navigation',
  'Building','Building2','Home','Store','Briefcase',
];

/**
 * Extract component functions from the LLM output.
 *
 * Primary path: parse `// === FILE: src/pages/Name.tsx ===` and
 * `// === FILE: src/components/Name.tsx ===` delimiter comments emitted by
 * the Frontend Agent. The folder in the delimiter IS the source of truth for
 * page vs. shared component classification — no name-based heuristic needed.
 *
 * Fallback: function-boundary regex when the LLM omits delimiters.
 */
function sseExtractFunctions(code: string): Array<{ name: string; body: string; folder: string }> {
  // Primary: delimiter-based extraction — folder declared by the LLM
  const delimPattern = /\/\/\s*===\s*FILE:\s*(?:src\/)?((?:components|pages|lib|hooks|utils)\/)?([A-Z][a-zA-Z0-9]*)\.tsx\s*===/g;
  const delimPositions: Array<{ name: string; start: number; headerEnd: number; folder: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = delimPattern.exec(code)) !== null) {
    const subFolder = m[1] || '';
    // Preserve the declared subfolder (pages/, components/, etc.)
    const folder = subFolder ? `src/${subFolder}` : 'src/';
    delimPositions.push({ name: m[2], start: m.index, headerEnd: m.index + m[0].length, folder });
  }

  if (delimPositions.length >= 2) {
    return delimPositions.map((p, i) => ({
      name: p.name,
      folder: p.folder,
      body: code.slice(
        p.headerEnd,
        i + 1 < delimPositions.length ? delimPositions[i + 1].start : code.length
      ).trim(),
    }));
  }

  // Fallback: regex-based function boundary detection (folder defaults to components/)
  const funcPattern = /^function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\)/gm;
  const positions: Array<{ name: string; start: number }> = [];
  while ((m = funcPattern.exec(code)) !== null) {
    positions.push({ name: m[1], start: m.index });
  }
  return positions.map((p, i) => ({
    name: p.name,
    folder: 'src/components/',
    body: code.slice(p.start, i + 1 < positions.length ? positions[i + 1].start : code.length).trim(),
  }));
}

/**
 * Per-file sanitization pass — runs on each extracted function body before
 * wrapping it in proper TypeScript module syntax. This is the per-file
 * "Code Fix" step: it strips any stray TypeScript type declarations,
 * import/export remnants, and JSX fragment syntax that the Code Fix Agent
 * may have missed in the monolithic blob.
 */
function sanitizeFunctionBody(body: string): string {
  return body
    // Strip top-level interface/type declarations that leaked inside function bodies
    .replace(/^\s*(?:interface|type)\s+\w[\s\S]*?\n\}/gm, '')
    // Strip any lingering import/export statements inside the body
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '')
    // Strip TypeScript parameter annotations in arrow functions (e.g. (x: string) => …)
    // but only outside JSX — use a conservative pattern
    .replace(/:\s*(?:string|number|boolean|any|void|never|undefined|null)\b(?=\s*[,)=])/g, '')
    .trim();
}

function sseToTsxFile(name: string, rawBody: string): string {
  // 1. Per-file sanitization (strips TypeScript remnants from the function body)
  const sanitized = sanitizeFunctionBody(rawBody);

  // 2. Convert React.useState → useState etc. (CDN blob uses namespaced hooks;
  //    the generated TSX file uses named imports instead)
  const body = sanitized
    .replace(/React\.useState\b/g, 'useState')
    .replace(/React\.useEffect\b/g, 'useEffect')
    .replace(/React\.useRef\b/g, 'useRef')
    .replace(/React\.useMemo\b/g, 'useMemo')
    .replace(/React\.useCallback\b/g, 'useCallback');

  // 3. Detect which hooks and Lucide icons are actually used
  const hooks: string[] = [];
  if (/\buseState\b/.test(body)) hooks.push('useState');
  if (/\buseEffect\b/.test(body)) hooks.push('useEffect');
  if (/\buseRef\b/.test(body)) hooks.push('useRef');
  if (/\buseMemo\b/.test(body)) hooks.push('useMemo');
  if (/\buseCallback\b/.test(body)) hooks.push('useCallback');

  const icons = SSE_LUCIDE_ICONS.filter(icon => new RegExp(`<${icon}[\\s/>]`).test(body));

  // 4. Build proper TypeScript module with explicit named imports
  const hooksImport = hooks.length > 0 ? `, { ${hooks.join(', ')} }` : '';
  const lucideImport = icons.length > 0 ? `\nimport { ${icons.join(', ')} } from 'lucide-react';` : '';

  return `import React${hooksImport} from 'react';${lucideImport}\n\n${body}\n\nexport default ${name};\n`;
}

// ── Per-file deterministic validator ────────────────────────────────────────
// Runs on every extracted TSX file body after sseToTsxFile() wraps it in
// proper TypeScript module syntax. This is the per-file Code Fix stage:
// no LLM call needed for clean files; problems are logged so callers can
// optionally trigger a targeted repair pass.

interface TsxValidation { valid: boolean; issues: string[]; warnings: string[]; }

/**
 * V5.1 — Enhanced JSX/TSX validation with 12 deterministic checks.
 * Detects errors that cause preview crashes and Babel parse failures.
 */
function validateTsxFile(name: string, content: string): TsxValidation {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Strip import/export lines before checking the body
  const body = content
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s.*/gm, '');

  // ── Hard errors (break render) ───────────────────────────────────────────
  // 1. Must contain a capitalized function definition
  if (!/function\s+[A-Z]/.test(body))
    issues.push('missing capitalized function definition');

  // 2. Must have a JSX return statement
  if (!/\breturn\s*[(<]/.test(body))
    issues.push('missing JSX return statement');

  // 3. JSX fragments banned (CDN+Babel preview needs wrapper divs)
  if (/<>|<\/>/.test(body))
    issues.push('JSX fragment syntax (<> </>) — use a wrapper div instead');

  // 4. TypeScript-only annotations Babel cannot parse
  if (/:\s*React\.FC\b|:\s*JSX\.Element\b/.test(body))
    issues.push('React.FC / JSX.Element annotation — omit the type or use (): JSX.Element');

  // 5. Stray import inside function body
  if (/\nimport\s/.test(body))
    issues.push('stray import statement inside function body');

  // 6. HTML void elements used without self-closing slash — JSX parse error
  const voidElementRe = /<(br|hr|img|input|link|meta|area|base|col|embed|param|source|track|wbr)(\s[^>]*)?[^/]>/gi;
  if (voidElementRe.test(content))
    issues.push('HTML void element missing self-closing slash (e.g. <br> → <br />)');

  // 7. Object spread used as className value — runtime error
  if (/className=\{\{/.test(content))
    issues.push('className must be a string, not an object (className={{ … }})');

  // 8. Unclosed JSX root — checks that the return block has balanced < > pairs
  // Heuristic: count JSX open vs close tags in the return block
  const returnMatch = body.match(/return\s*\(([\s\S]*?)\);/);
  if (returnMatch) {
    const jsx = returnMatch[1];
    const openTags  = (jsx.match(/<[A-Za-z][^/]*?>/g) || []).length;
    const closeTags = (jsx.match(/<\/[A-Za-z]/g) || []).length;
    const selfClose = (jsx.match(/<[A-Za-z][^>]*\/>/g) || []).length;
    if (openTags > closeTags + selfClose + 3) // allow some slack
      warnings.push('possible unclosed JSX tags in return block');
  }

  // ── Warnings (degrade quality but don't always break render) ────────────
  // 9. .map() call but no key= prop — React will warn and may reorder
  if (/\.map\(/.test(content) && !/key=/.test(content))
    warnings.push('.map() present but no key= prop found — add key to list items');

  // 10. Using window.* or document.* at module scope (SSR-unsafe pattern)
  if (/^(?!.*\/\/).*\bwindow\.\b|^(?!.*\/\/).*\bdocument\.\b/m.test(body) &&
      !/useEffect\s*\(/.test(content))
    warnings.push('window/document access outside useEffect — wrap in useEffect');

  // 11. async component function (not supported in React 18 without Suspense)
  if (/^async\s+function\s+[A-Z]/.test(body))
    warnings.push('async component function — async is not valid in standard React components');

  // 12. Inline style with camelCase that looks like a string value
  if (/style=\{\{[^}]*:\s*"[^"]*px[^"]*"/.test(content))
    warnings.push('style prop using string for numeric values — use numbers: fontSize: 14 not "14px"');

  return { valid: issues.length === 0, issues, warnings };
}

function buildServerProjectFiles(
  code: string,
  pb: ProjectBlueprint,
  sectionOrder: string[]
): ProjectFileSSE[] {
  const files: ProjectFileSSE[] = [];
  const allFuncs = sseExtractFunctions(code);
  const sectionFuncs = allFuncs.filter(f => f.name !== 'App');

  // Blueprint-driven page classification: a function is a "page" if its
  // lowercase name matches any entry in pb.pages (supports suffix stripping).
  const pages = (pb.pages && pb.pages.length > 0) ? pb.pages : ['Landing'];
  const hasMultiplePages = pages.length > 1;
  const pageNameSet = new Set(pages.map(p => p.toLowerCase()));

  const isPageComponent = (name: string) => {
    if (!hasMultiplePages) return false;
    const n = name.toLowerCase();
    return pageNameSet.has(n) ||
      pageNameSet.has(n.replace(/page$/, '').replace(/view$/, '').replace(/screen$/, ''));
  };

  // Classification uses delimiter-declared folder as source of truth.
  // If the LLM outputs // === FILE: src/pages/Dashboard.tsx === then
  // Dashboard lands in src/pages/ regardless of its name.
  // Fallback: blueprint heuristic name-matching for delimiter-less outputs.
  const pageComponents: string[] = [];
  const sharedComponents: string[] = [];

  for (const f of sectionFuncs) {
    if (f.folder === 'src/pages/') {
      pageComponents.push(f.name);
    } else if (f.folder === 'src/components/' || !isPageComponent(f.name)) {
      sharedComponents.push(f.name);
    } else {
      // f.folder is generic ('src/' or default) AND name matches a blueprint page
      pageComponents.push(f.name);
    }
  }

  // Per-file generation using delimiter-declared folder + per-file validation
  for (const f of sectionFuncs) {
    const folder = f.folder !== 'src/'
      ? f.folder
      : (pageComponents.includes(f.name) ? 'src/pages/' : 'src/components/');
    const content = sseToTsxFile(f.name, f.body);
    const validation = validateTsxFile(f.name, content);
    if (!validation.valid) {
      console.warn(`[FileValidation] ${f.name}.tsx: ${validation.issues.join('; ')}`);
    }
    files.push({ path: folder, name: `${f.name}.tsx`, lang: 'tsx', content });
  }

  // Use React Router when any page components are present (deterministic from
  // delimiter folder or blueprint heuristic — not guessed from section names).
  const useRouter = pageComponents.length > 0;
  let appContent: string;

  if (useRouter) {
    const pageImports = pageComponents.map(n => `import ${n} from './pages/${n}';`).join('\n');
    const sharedImports = sharedComponents.map(n => `import ${n} from './components/${n}';`).join('\n');
    const routes = pageComponents.map((n, i) => {
      const path = i === 0 ? '/' : `/${n.toLowerCase()}`;
      return `        <Route path="${path}" element={<${n} />} />`;
    }).join('\n');
    appContent = `import React from 'react';\nimport { BrowserRouter as Router, Routes, Route } from 'react-router-dom';\n${pageImports}\n${sharedImports ? '\n' + sharedImports : ''}\n\nexport default function App() {\n  return (\n    <Router>\n      <Routes>\n${routes}\n      </Routes>\n    </Router>\n  );\n}\n`;
  } else {
    const allImports = sectionFuncs.map(f => {
      const folder = pageComponents.includes(f.name) ? 'pages' : 'components';
      return `import ${f.name} from './${folder}/${f.name}';`;
    }).join('\n');
    const rendered = sectionFuncs.map(f => `    <${f.name} />`).join('\n');
    appContent = `import React from 'react';\n${allImports}\n\nexport default function App() {\n  return (\n    <div>\n${rendered}\n    </div>\n  );\n}\n`;
  }

  files.push({ path: 'src/', name: 'App.tsx', lang: 'tsx', content: appContent });

  // src/main.tsx
  files.push({
    path: 'src/', name: 'main.tsx', lang: 'tsx',
    content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode><App /></React.StrictMode>\n);\n`,
  });

  // src/index.css
  files.push({
    path: 'src/', name: 'index.css', lang: 'css',
    content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nbody { margin: 0; }\n`,
  });

  // src/lib/utils.ts — shadcn-compatible cn() utility
  files.push({
    path: 'src/lib/', name: 'utils.ts', lang: 'ts',
    content: `import { type ClassValue, clsx } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\n/** shadcn/ui-compatible class merge utility */\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n\nexport function formatDate(date: Date | string): string {\n  return new Intl.DateTimeFormat('en-US', {\n    year: 'numeric', month: 'long', day: 'numeric',\n  }).format(new Date(date));\n}\n`,
  });

  // src/types/index.ts
  const tableTypes = (pb.databaseTables || []).map(t => {
    const T = t.charAt(0).toUpperCase() + t.slice(1).replace(/s$/, '');
    return `export interface ${T} {\n  id: string;\n  createdAt: string;\n  updatedAt: string;\n}`;
  }).join('\n\n');
  files.push({
    path: 'src/types/', name: 'index.ts', lang: 'ts',
    content: `// Types for ${pb.projectType || 'project'}\n\nexport interface User {\n  id: string;\n  name: string;\n  email: string;\n  createdAt: string;\n}\n\n${tableTypes}\n`,
  });

  // index.html
  files.push({
    path: '', name: 'index.html', lang: 'html',
    content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${pb.projectType || 'NexoGen App'}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
  });

  // ── V4: Dependency Resolution ────────────────────────────────────────────────
  const { frontend: resolvedDeps, frontendDev: resolvedDevDeps } = resolveDependencies(pb);
  const hasBackend = pb.apis.length > 0 || pb.databaseTables.length > 0 || pb.authNeeded;

  // package.json (frontend / root)
  const pkgScripts: Record<string, string> = {
    dev:     hasBackend ? 'concurrently "vite" "cd backend && npm run dev"' : 'vite',
    build:   'tsc && vite build',
    preview: 'vite preview',
  };
  if (hasBackend) {
    pkgScripts['dev:frontend'] = 'vite';
    pkgScripts['install:all']  = 'npm install && npm install --prefix backend';
    resolvedDeps.concurrently  = '^8.2.0';
  }

  files.push({
    path: '', name: 'package.json', lang: 'json',
    content: JSON.stringify({
      name: (pb.projectType || 'nexogen-app').toLowerCase().replace(/\s+/g, '-'),
      private: true, version: '0.1.0', type: 'module',
      scripts: pkgScripts,
      dependencies: resolvedDeps,
      devDependencies: resolvedDevDeps,
    }, null, 2),
  });

  // vite.config.ts — includes /api proxy to backend when needed
  const viteProxyBlock = hasBackend
    ? `,\n  server: {\n    proxy: {\n      '/api': {\n        target: 'http://localhost:3001',\n        changeOrigin: true,\n      },\n    },\n  }`
    : '';
  files.push({
    path: '', name: 'vite.config.ts', lang: 'ts',
    content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: { alias: { '@': '/src' } }${viteProxyBlock},\n});\n`,
  });

  // tsconfig.json
  files.push({
    path: '', name: 'tsconfig.json', lang: 'json',
    content: JSON.stringify({
      compilerOptions: {
        target: 'ES2020', useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext',
        skipLibCheck: true, moduleResolution: 'bundler',
        allowImportingTsExtensions: true, resolveJsonModule: true,
        isolatedModules: true, noEmit: true, jsx: 'react-jsx',
        strict: true, baseUrl: '.', paths: { '@/*': ['./src/*'] },
      },
      include: ['src'],
    }, null, 2),
  });

  // tailwind.config.ts
  files.push({
    path: '', name: 'tailwind.config.ts', lang: 'ts',
    content: `import type { Config } from 'tailwindcss';\n\nexport default {\n  content: ['./index.html', './src/**/*.{ts,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n} satisfies Config;\n`,
  });

  // postcss.config.js — required for Tailwind to work
  files.push({
    path: '', name: 'postcss.config.js', lang: 'js',
    content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`,
  });

  // .gitignore
  files.push({
    path: '', name: '.gitignore', lang: 'text',
    content: `# Dependencies\nnode_modules/\nbackend/node_modules/\n\n# Build output\ndist/\nbackend/dist/\n\n# Environment\n.env\n.env.local\n.env.*.local\n\n# Logs\n*.log\nnpm-debug.log*\n\n# OS\n.DS_Store\nThumbs.db\n\n# Prisma\nbackend/prisma/.env\n`,
  });

  // src/lib/api.ts — typed fetch wrapper for backend API calls
  if (hasBackend) {
    files.push({
      path: 'src/lib/', name: 'api.ts', lang: 'ts',
      content: `const API_BASE = import.meta.env.VITE_API_URL ?? '/api';\n\ntype FetchOptions = RequestInit & { data?: unknown };\n\nasync function request<T>(path: string, options: FetchOptions = {}): Promise<T> {\n  const { data, ...rest } = options;\n  const res = await fetch(\`\${API_BASE}\${path}\`, {\n    ...rest,\n    headers: { 'Content-Type': 'application/json', ...rest.headers },\n    body: data !== undefined ? JSON.stringify(data) : rest.body,\n  });\n  if (!res.ok) {\n    const err = await res.json().catch(() => ({ message: res.statusText }));\n    throw new Error(err.message ?? 'Request failed');\n  }\n  return res.json() as Promise<T>;\n}\n\nexport const api = {\n  get:    <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'GET', ...init }),\n  post:   <T>(path: string, data: unknown, init?: RequestInit) => request<T>(path, { method: 'POST', data, ...init }),\n  put:    <T>(path: string, data: unknown, init?: RequestInit) => request<T>(path, { method: 'PUT', data, ...init }),\n  patch:  <T>(path: string, data: unknown, init?: RequestInit) => request<T>(path, { method: 'PATCH', data, ...init }),\n  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { method: 'DELETE', ...init }),\n};\n`,
    });
  }

  // src/hooks/useAuth.ts — if auth is needed and not using external provider
  if (pb.authNeeded && !['clerk', 'supabase'].includes((pb.authProvider || '').toLowerCase())) {
    files.push({
      path: 'src/hooks/', name: 'useAuth.ts', lang: 'ts',
      content: `import { useState, useEffect, useCallback } from 'react';\nimport { api } from '../lib/api';\n\ninterface User { id: string; name: string; email: string; }\ninterface AuthState { user: User | null; token: string | null; loading: boolean; }\n\nexport function useAuth() {\n  const [auth, setAuth] = useState<AuthState>({\n    user: null,\n    token: localStorage.getItem('auth_token'),\n    loading: true,\n  });\n\n  useEffect(() => {\n    if (!auth.token) { setAuth(s => ({ ...s, loading: false })); return; }\n    api.get<{ user: User }>('/auth/me')\n      .then(({ user }) => setAuth(s => ({ ...s, user, loading: false })))\n      .catch(() => { localStorage.removeItem('auth_token'); setAuth({ user: null, token: null, loading: false }); });\n  }, [auth.token]);\n\n  const login = useCallback(async (email: string, password: string) => {\n    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });\n    localStorage.setItem('auth_token', token);\n    setAuth({ user, token, loading: false });\n  }, []);\n\n  const logout = useCallback(() => {\n    localStorage.removeItem('auth_token');\n    setAuth({ user: null, token: null, loading: false });\n  }, []);\n\n  const register = useCallback(async (name: string, email: string, password: string) => {\n    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password });\n    localStorage.setItem('auth_token', token);\n    setAuth({ user, token, loading: false });\n  }, []);\n\n  return { ...auth, login, logout, register };\n}\n`,
    });
  }

  // backend/package.json — Express + TypeScript stack
  if (hasBackend) {
    const { backend: bDeps, backendDev: bDevDeps } = resolveDependencies(pb);
    files.push({
      path: 'backend/', name: 'package.json', lang: 'json',
      content: JSON.stringify({
        name: (pb.projectType || 'nexogen-backend').toLowerCase().replace(/\s+/g, '-') + '-backend',
        private: true, version: '0.1.0',
        scripts: {
          dev:   'nodemon --exec tsx src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
        },
        dependencies: bDeps,
        devDependencies: bDevDeps,
      }, null, 2),
    });

    // backend/tsconfig.json
    files.push({
      path: 'backend/', name: 'tsconfig.json', lang: 'json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020', module: 'CommonJS',
          lib: ['ES2020'], outDir: './dist', rootDir: './src',
          strict: true, esModuleInterop: true,
          skipLibCheck: true, resolveJsonModule: true,
          declaration: true, declarationMap: true, sourceMap: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      }, null, 2),
    });

    // backend/src/index.ts — Express server entrypoint
    const apiRouteImports = pb.apis.slice(0, 8).map(route => {
      const name = route.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, c => c.toLowerCase());
      return `// import ${name}Router from './routes/${name}';`;
    }).join('\n');

    files.push({
      path: 'backend/src/', name: 'index.ts', lang: 'ts',
      content: `import express from 'express';\nimport cors from 'cors';\nimport dotenv from 'dotenv';\n${apiRouteImports ? '\n' + apiRouteImports : ''}\n\ndotenv.config();\n\nconst app = express();\nconst PORT = process.env.PORT ?? 3001;\n\n// ── Middleware ─────────────────────────────────────────────────────────────\napp.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));\napp.use(express.json());\napp.use(express.urlencoded({ extended: true }));\n\n// ── Routes ─────────────────────────────────────────────────────────────────\napp.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));\n\n// ── Server ─────────────────────────────────────────────────────────────────\napp.listen(PORT, () => {\n  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);\n});\n\nexport default app;\n`,
    });
  }

  return files;
}

// ═══════════════════════════════════════════════════════════════════════════
// V4.5 — DNA COMPOSITION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

interface DNAComposition {
  stripe: number; linear: number; framer: number; vercel: number;
  notion: number; cursor: number; raycast: number;
}

const DNA_BRAND_KEYS: (keyof DNAComposition)[] = ['stripe','linear','framer','vercel','notion','cursor','raycast'];

const EMPTY_DNA: DNAComposition = { stripe:0,linear:0,framer:0,vercel:0,notion:0,cursor:0,raycast:0 };

const BRAND_STRENGTHS_V45: Record<string, Record<string, number>> = {
  stripe:  { pricing:10, trust:10, cta:9, navbar:8, footer:8, testimonials:8, dashboard:6, hero:5, features:6, bento:4, animations:3, typography:5, changelog:3 },
  linear:  { hero:10, dashboard:10, typography:10, features:8, navbar:8, footer:6, cta:7, changelog:10, bento:6, animations:6, pricing:6, trust:5, testimonials:5 },
  framer:  { features:10, bento:10, animations:10, storytelling:10, hero:9, trust:6, footer:6, navbar:6, pricing:5, dashboard:5, typography:7, cta:6 },
  vercel:  { hero:8, features:7, navbar:7, footer:7, pricing:6, dashboard:7, bento:7, cta:6, trust:6, typography:7, changelog:7, animations:5 },
  notion:  { hero:5, features:6, navbar:6, footer:6, pricing:5, dashboard:7, typography:9, changelog:8, cta:4, trust:5, bento:5, animations:2 },
  cursor:  { hero:9, features:8, animations:8, bento:8, navbar:7, footer:6, pricing:6, dashboard:7, cta:7, trust:6, typography:6, changelog:6 },
  raycast: { hero:9, features:9, bento:9, animations:8, navbar:7, footer:6, pricing:5, cta:7, dashboard:6, trust:6, typography:6, changelog:7 },
};

const BRAND_TOKENS_V45: Record<string, { primary:string; surface:string; accent:string; border:string; card:string; text:string; textMuted:string }> = {
  stripe:  { primary:'#635BFF', surface:'#0A2540', accent:'#00D4FF', border:'rgba(255,255,255,0.1)', card:'#0F3460',  text:'#FFFFFF', textMuted:'#A8B4C0' },
  linear:  { primary:'#5E6AD2', surface:'#0F0F0F', accent:'#F7C948', border:'#2A2A2A',               card:'#111111',  text:'#FFFFFF', textMuted:'#8A8A8A' },
  framer:  { primary:'#FF3D57', surface:'#0B0B0B', accent:'#FF6B35', border:'#222222',               card:'#141414',  text:'#FFFFFF', textMuted:'#666666' },
  vercel:  { primary:'#FFFFFF', surface:'#000000', accent:'#0070F3', border:'#333333',               card:'#111111',  text:'#FFFFFF', textMuted:'#888888' },
  notion:  { primary:'#37352F', surface:'#FFFFFF', accent:'#2F80ED', border:'#E9E9E7',               card:'#F7F6F3',  text:'#37352F', textMuted:'#9B9B9B' },
  cursor:  { primary:'#00FF9D', surface:'#0D0D0D', accent:'#00CC7A', border:'#252525',               card:'#161616',  text:'#FFFFFF', textMuted:'#555555' },
  raycast: { primary:'#FF5F57', surface:'#0C0C0C', accent:'#FF8B50', border:'#1C1C1C',               card:'#111111',  text:'#FFFFFF', textMuted:'#666666' },
};

const DNA_MIXER_SYSTEM = `You are the NexoGen DNA Mixer Agent. Extract product/brand references and their design weight from the user's prompt.

Output ONLY valid JSON — no markdown, no explanation, ONLY the JSON object:
{ "stripe":0, "linear":0, "framer":0, "vercel":0, "notion":0, "cursor":0, "raycast":0 }

Rules:
1. Only include brands explicitly mentioned (others stay 0).
2. If explicit percentages given (e.g. "40% Stripe"), use those exact values.
3. If no percentages: first-mentioned brand gets a ~10% bonus; equal-split otherwise.
4. All non-zero values must sum to 100 after normalization.
5. "heavily inspired by X" → X gets ~65–70%.
6. "X with some Y" → X ~65%, Y ~35%.
7. "X + Y + Z" (equal) → roughly equal thirds (~34/33/33).
8. If no brands detected, return all zeros.`;

function normalizeDNAServer(raw: Partial<DNAComposition>): DNAComposition {
  const total = DNA_BRAND_KEYS.reduce((s, k) => s + (raw[k] ?? 0), 0);
  if (total === 0) return { ...EMPTY_DNA };
  const scale = 100 / total;
  return DNA_BRAND_KEYS.reduce((out, k) => {
    out[k] = Math.round((raw[k] ?? 0) * scale);
    return out;
  }, {} as DNAComposition);
}

function resolveSectionOwnershipServer(dna: DNAComposition, sections: string[]): Record<string, string> {
  const brands = (Object.entries(dna) as [string, number][]).filter(([, pct]) => pct > 0);
  if (brands.length === 0) return {};
  const ownership: Record<string, string> = {};
  for (const section of sections) {
    let best = brands[0][0];
    let bestScore = -1;
    for (const [brand, pct] of brands) {
      const strength = BRAND_STRENGTHS_V45[brand]?.[section] ?? 5;
      const score = (pct / 100) * strength;
      if (score > bestScore) { bestScore = score; best = brand; }
    }
    ownership[section] = best;
  }
  return ownership;
}

function pickOwnerServer(dna: DNAComposition, strengthKey: string): string {
  const brands = (Object.entries(dna) as [string, number][]).filter(([, pct]) => pct > 0);
  if (brands.length === 0) return 'linear';
  let best = brands[0][0]; let bestScore = -1;
  for (const [brand, pct] of brands) {
    const score = (pct / 100) * (BRAND_STRENGTHS_V45[brand]?.[strengthKey] ?? 5);
    if (score > bestScore) { bestScore = score; best = brand; }
  }
  return best;
}

function generateThemeTokensServer(dna: DNAComposition) {
  const primaryBrand  = pickOwnerServer(dna, 'cta');
  const surfaceBrand  = pickOwnerServer(dna, 'hero');
  const accentBrand   = pickOwnerServer(dna, 'animations');
  const pt = BRAND_TOKENS_V45[primaryBrand] ?? BRAND_TOKENS_V45.linear;
  const st = BRAND_TOKENS_V45[surfaceBrand] ?? BRAND_TOKENS_V45.linear;
  const at = BRAND_TOKENS_V45[accentBrand]  ?? BRAND_TOKENS_V45.linear;
  return {
    primary: pt.primary, surface: st.surface, accent: at.accent,
    border: st.border,   card: st.card,       text: st.text,   textMuted: st.textMuted,
    isDark: surfaceBrand !== 'notion',
    primaryBrand, surfaceBrand, accentBrand,
  };
}

function generateMotionProfileServer(dna: DNAComposition) {
  const score = (dna.framer ?? 0) + (dna.cursor ?? 0) * 0.7 + (dna.raycast ?? 0) * 0.7;
  return {
    level: score > 50 ? 'advanced' : score > 20 ? 'standard' : 'minimal',
    hoverLift: score > 20, staggerAnimation: score > 20, revealTransitions: score > 20,
    motionCards: score > 30, bentoInteractions: score > 20, advancedMode: score > 50,
    dominantSource: dna.framer >= dna.cursor && dna.framer >= dna.raycast
      ? (dna.framer > 0 ? 'framer' : 'none')
      : dna.cursor >= dna.raycast ? (dna.cursor > 0 ? 'cursor' : 'none')
      : (dna.raycast > 0 ? 'raycast' : 'none'),
  };
}

function buildDNAContextString(dna: DNAComposition, ownership: Record<string, string>, theme: ReturnType<typeof generateThemeTokensServer>): string {
  const active = DNA_BRAND_KEYS.filter(k => dna[k] > 0).map(k => `${k.charAt(0).toUpperCase()+k.slice(1)} ${dna[k]}%`);
  if (active.length === 0) return '';
  const ownerLines = Object.entries(ownership).slice(0, 8).map(([s, b]) => `  ${s} → ${b}`).join('\n');
  return `\n\n## DNA COMPOSITION (V4.5 Fusion Mode)\nComposition: ${active.join(' + ')}\nSection Ownership:\n${ownerLines}\nTheme: primary=${theme.primary} surface=${theme.surface} accent=${theme.accent}\nMode: ${theme.isDark ? 'dark' : 'light'}`;
}

async function extractDNAComposition(
  userPrompt: string,
  referenceSites: string,
  primaryRef: string,
  secondaryRefs: string[],
  groqKey: string
): Promise<DNAComposition> {
  // 1. Try explicit percentage extraction first (regex, no LLM)
  const percentPattern = /(\d+)\s*%?\s*(stripe|linear|framer|vercel|notion|cursor|raycast)/gi;
  const rawPct: Partial<DNAComposition> = {};
  let hasExplicitPct = false;
  for (const m of userPrompt.matchAll(percentPattern)) {
    (rawPct as Record<string, number>)[m[2].toLowerCase()] = parseInt(m[1]);
    hasExplicitPct = true;
  }
  if (hasExplicitPct) return normalizeDNAServer(rawPct);

  // 2. Use planner-detected references with position weighting (no LLM)
  const allRefs = [primaryRef, ...secondaryRefs]
    .filter(r => r && r !== 'none')
    .map(r => r.toLowerCase().trim())
    .filter(r => DNA_BRAND_KEYS.includes(r as keyof DNAComposition));

  if (allRefs.length > 0) {
    const hasWeightWords = /heavily|mostly|primarily|dominated|mainly|strongly|slight|little|mostly/i.test(userPrompt);
    if (!hasWeightWords) {
      // Equal distribution with first-position bonus
      const base = Math.floor(100 / allRefs.length);
      const bonus = 100 - base * allRefs.length;
      const rawEq: Partial<DNAComposition> = {};
      allRefs.forEach((r, i) => { (rawEq as Record<string,number>)[r] = base + (i === 0 ? bonus : 0); });
      return normalizeDNAServer(rawEq);
    }
  }

  // 3. Fall back to AI extraction for complex weighting language
  try {
    const extraction = await callGroq(groqKey, 'llama-3.1-8b-instant',
      [
        { role: 'system', content: DNA_MIXER_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      false, 300
    );
    if (extraction) {
      const jsonMatch = extraction.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const extracted: Partial<DNAComposition> = {};
        for (const k of DNA_BRAND_KEYS) {
          if (typeof parsed[k] === 'number' && parsed[k] > 0) extracted[k] = parsed[k];
        }
        if (Object.keys(extracted).length > 0) return normalizeDNAServer(extracted);
      }
    }
  } catch (e) {
    console.error('[DNAMixer] AI extraction failed, using reference fallback:', e);
  }

  // 4. Final fallback: reference sites from planner
  if (allRefs.length > 0) {
    const rawFb: Partial<DNAComposition> = {};
    allRefs.forEach((r, i) => { (rawFb as Record<string,number>)[r] = i === 0 ? 50 : Math.floor(50 / (allRefs.length - 1)); });
    return normalizeDNAServer(rawFb);
  }

  return { ...EMPTY_DNA };
}

// ─── V4.5 SECTIONS used for composition-based ownership ──────────────────────
const COMPOSITION_SECTIONS = ['hero','navbar','features','pricing','testimonials','trust','cta','footer','dashboard','bento','animations','typography','changelog'];

router.post("/agents/build", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  const { prompt } = req.body as { prompt: string };

  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!openrouterKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // ── AGENT 1: PLANNER ─────────────────────────────────────────────────────
    sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "active" });

    let planText = "";
    await callGroq(groqKey, PLANNER_MODEL,
      [
        { role: "system", content: PLANNER_SYSTEM },
        { role: "user", content: prompt },
      ],
      true, 1800,
      (token) => {
        planText += token;
        if (!planText.includes("---DESIGN_BRIEF---")) {
          sse(res, { type: "token", token });
        }
      }
    );

    let briefText = "";
    const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
    if (briefMatch) briefText = briefMatch[1].trim();

    let referenceSites = "none";
    const refMatch = briefText.match(/referenceSites:\s*(.+)/);
    if (refMatch) referenceSites = refMatch[1].trim();

    let primaryReference = "none";
    const primaryRefMatch = briefText.match(/primaryReference:\s*(.+)/);
    if (primaryRefMatch) primaryReference = primaryRefMatch[1].trim();
    if (primaryReference === "none" && referenceSites !== "none") {
      primaryReference = referenceSites.split(',')[0].trim();
    }

    let secondaryReferences: string[] = [];
    const secondaryRefMatch = briefText.match(/secondaryReferences:\s*(.+)/);
    if (secondaryRefMatch && secondaryRefMatch[1].trim() !== "none") {
      secondaryReferences = secondaryRefMatch[1].trim().split(',').map(s => s.trim());
    }

    const cleanPlan = planText
      .replace(/---DESIGN_BRIEF---[\s\S]*?---END_BRIEF---/, "")
      .replace(/---PAGE_BLUEPRINT---[\s\S]*?---END_BLUEPRINT---/, "")
      .trim();

    let blueprint: PageBlueprint = {
      websiteType: "Generic",
      sectionOrder: ["Navbar", "Hero", "Features", "Testimonials", "CTA", "Footer"],
    };
    const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
    if (blueprintMatch) {
      try {
        const raw = blueprintMatch[1].trim();
        const parsed = JSON.parse(raw);
        if (parsed.sectionOrder && Array.isArray(parsed.sectionOrder) && parsed.sectionOrder.length >= 3) {
          blueprint = parsed as PageBlueprint;
        }
      } catch (e) {
        console.error("Failed to parse page blueprint, using defaults:", e);
      }
    }

    console.log(`[Blueprint] websiteType=${blueprint.websiteType} sections=[${blueprint.sectionOrder.join(', ')}]`);
    console.log(`[Design] referenceSites="${referenceSites}" primaryReference="${primaryReference}"`);
    sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "done", blueprint });

    // ── V4.5: DNA COMPOSITION ENGINE ──────────────────────────────────────────
    let dnaComposition: DNAComposition = { ...EMPTY_DNA };
    let dnaOwnership: Record<string, string> = {};
    let dnaTheme: ReturnType<typeof generateThemeTokensServer> | null = null;
    let dnaMotion: ReturnType<typeof generateMotionProfileServer> | null = null;

    try {
      dnaComposition = await extractDNAComposition(prompt, referenceSites, primaryReference, secondaryReferences, groqKey);
      const activeBrands = DNA_BRAND_KEYS.filter(k => dnaComposition[k] > 0);
      if (activeBrands.length > 0) {
        const sectionList = [...new Set([
          ...COMPOSITION_SECTIONS,
          ...(blueprint.sectionOrder || []).map(s => s.toLowerCase()),
        ])];
        dnaOwnership = resolveSectionOwnershipServer(dnaComposition, sectionList);
        dnaTheme     = generateThemeTokensServer(dnaComposition);
        dnaMotion    = generateMotionProfileServer(dnaComposition);
        console.log(`[DNAMixer V4.5] ${activeBrands.map(k => `${k}:${dnaComposition[k]}%`).join(' + ')}`);
        sse(res, {
          type: "dna_composition",
          composition:    dnaComposition,
          sectionOwnership: dnaOwnership,
          themeTokens:    dnaTheme,
          motionProfile:  dnaMotion,
        });
      }
    } catch (e) {
      console.error('[DNAMixer] Failed (continuing without composition):', e);
    }

    // ── AGENT 2: ARCHITECTURE ─────────────────────────────────────────────────
    sse(res, { type: "step", step: 1, agent: "Architecture Agent", status: "active" });

    let projectBlueprint: ProjectBlueprint = {
      projectType: blueprint.websiteType || "Landing Page",
      pages: ["Landing"],
      components: blueprint.sectionOrder || [],
      databaseTables: [],
      apis: [],
      authNeeded: false,
      authProvider: "",
      dashboardNeeded: false,
      entities: [],
      relationships: [],
      navigation: [],
      features: [],
      techStack: {
        frontend: "React + TypeScript + Tailwind CSS",
        routing: "React Router v6",
        ui: "shadcn/ui + Lucide Icons",
        backend: "Express.js + TypeScript",
        database: "PostgreSQL + Prisma",
      },
      description: "",
    };

    try {
      const archResult = await callGroq(
        groqKey, PLANNER_MODEL,
        [
          { role: "system", content: ARCHITECTURE_SYSTEM },
          { role: "user", content: `Prompt: ${prompt}\nWebsite type: ${blueprint.websiteType}\nSections: ${blueprint.sectionOrder.join(', ')}` },
        ],
        false, 700
      );
      const archJsonMatch = archResult.match(/\{[\s\S]*\}/);
      if (archJsonMatch) {
        const parsed = JSON.parse(archJsonMatch[0]);
        projectBlueprint = { ...projectBlueprint, ...parsed };
      }
    } catch (e) {
      console.error("[ArchitectureAgent] Failed (using defaults):", e);
    }

    // ── Phase 2: Blueprint Validation (with retry) ────────────────────────────
    let bpValidation = validateProjectBlueprint(projectBlueprint);

    if (!bpValidation.valid) {
      console.warn(`[BlueprintValidation] FAILED: ${bpValidation.errors.join('; ')}. Retrying Architecture Agent...`);
      sse(res, { type: "blueprint_validation_retry", errors: bpValidation.errors });
      try {
        const archRetry = await callGroq(
          groqKey, PLANNER_MODEL,
          [
            { role: "system", content: ARCHITECTURE_SYSTEM },
            { role: "user", content: `RETRY — previous blueprint was invalid (${bpValidation.errors.join(', ')}). Generate a complete valid blueprint.\n\nPrompt: ${prompt}\nWebsite type: ${blueprint.websiteType}` },
          ],
          false, 2000
        );
        const retryJsonMatch = archRetry.match(/\{[\s\S]*\}/);
        if (retryJsonMatch) {
          const retryParsed = JSON.parse(retryJsonMatch[0]);
          projectBlueprint = { ...projectBlueprint, ...retryParsed };
          bpValidation = validateProjectBlueprint(projectBlueprint);
        }
      } catch (e) {
        console.error('[BlueprintValidation] Retry failed:', e);
      }

      if (!bpValidation.valid) {
        sse(res, { type: "error", error: `Blueprint validation failed after retry: ${bpValidation.errors.join(', ')}` });
        res.end();
        return;
      }
    }

    console.log(`[Architecture V2] projectType=${projectBlueprint.projectType} pages=[${projectBlueprint.pages.join(', ')}] apis=[${projectBlueprint.apis.join(', ')}] tables=[${projectBlueprint.databaseTables.join(', ')}] auth=${projectBlueprint.authNeeded}(${projectBlueprint.authProvider}) entities=[${(projectBlueprint.entities || []).join(', ')}]`);

    // ── QUALITY GATE V2 ───────────────────────────────────────────────────────
    const qg = computeQualityScore(projectBlueprint);
    console.log(`[QualityGate V2] score=${qg.score} passed=${qg.passed}${qg.issues.length ? ' — ' + qg.issues.join('; ') : ''}`);
    sse(res, { type: "quality_gate", score: qg.score, passed: qg.passed, issues: qg.issues });

    if (!qg.passed) {
      console.warn(`[QualityGate V2] Score ${qg.score} < 70 — retrying Architecture Agent to resolve issues...`);
      try {
        const qgRetry = await callGroq(
          groqKey, PLANNER_MODEL,
          [
            { role: "system", content: ARCHITECTURE_SYSTEM },
            { role: "user", content: `QUALITY FIX — Resolve these issues: ${qg.issues.join('; ')}\n\nOriginal prompt: ${prompt}\nWebsite type: ${blueprint.websiteType}\nSections: ${blueprint.sectionOrder.join(', ')}\n\nPrevious blueprint scored ${qg.score}/100. Produce a corrected, complete blueprint that fixes all issues.` }
          ],
          false, 2000
        );
        const qgJson = qgRetry.match(/\{[\s\S]*\}/);
        if (qgJson) {
          const qgParsed = JSON.parse(qgJson[0]);
          projectBlueprint = { ...projectBlueprint, ...qgParsed };
          const qg2 = computeQualityScore(projectBlueprint);
          console.log(`[QualityGate V2] Retry score=${qg2.score}`);
          sse(res, { type: "quality_gate_retry", score: qg2.score, passed: qg2.passed });
        }
      } catch (e) {
        console.error('[QualityGate V2] Retry failed:', e);
      }
    }

    sse(res, { type: "step", step: 1, agent: "Architecture Agent", status: "done", projectBlueprint });

    // ── AGENT 3: DESIGN DNA ───────────────────────────────────────────────────
    sse(res, { type: "step", step: 2, agent: "Design Agent", status: "active" });

    // Known reference sites and their DNA verification rules
    const REFERENCE_VERIFIERS: Record<string, (d: DesignDNA) => boolean> = {
      stripe:     (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient" && d.colorSystem.background !== "#0a0a0a",
      linear:     (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large" && d.decorationLevel === "none",
      vercel:     (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
      notion:     (d) => (d.colorSystem.theme === "light" || d.theme === "light") && d.heroStyle === "editorial-large",
      framer:     (d) => d.designLanguage === "bold-motion" && d.animationPersonality === "expressive",
      cursor:     (d) => d.colorSystem.primary !== "#ffffff" && d.designLanguage !== "premium-gradient",
      perplexity: (d) => d.colorSystem.primary !== "#ffffff" && d.colorSystem.primary !== "#e5e5e5",
    };

    function detectKnownRefs(refs: string): string[] {
      const lower = refs.toLowerCase();
      return Object.keys(REFERENCE_VERIFIERS).filter(r => lower.includes(r));
    }

    function verifyDNA(design: DesignDNA, refs: string): { passed: boolean; failedRefs: string[] } {
      const known = detectKnownRefs(refs);
      if (known.length === 0) return { passed: true, failedRefs: [] };
      const failedRefs = known.filter(r => !REFERENCE_VERIFIERS[r](design));
      return { passed: failedRefs.length === 0, failedRefs };
    }

    function parseDesignRaw(raw: string): DesignDNA | null {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const merged: DesignDNA = { ...DEFAULT_DESIGN, ...parsed };
        if (parsed.colorSystem) merged.colorSystem = { ...DEFAULT_DESIGN.colorSystem, ...parsed.colorSystem };
        if (parsed.typographySystem) merged.typographySystem = { ...DEFAULT_DESIGN.typographySystem, ...parsed.typographySystem };
        if (parsed.spacingSystem) merged.spacingSystem = { ...DEFAULT_DESIGN.spacingSystem, ...parsed.spacingSystem };
        return merged;
      } catch {
        return null;
      }
    }

    let design: DesignDNA = { ...DEFAULT_DESIGN };
    let designAgentStatus: "success" | "failed" | "retry_success" | "retry_failed" = "failed";
    let designAgentError: string | null = null;

    const dnaContextStr = dnaTheme
      ? buildDNAContextString(dnaComposition, dnaOwnership, dnaTheme)
      : '';
    const designPrompt = [
      `Website brief:\n${briefText || prompt}`,
      `Website type: ${blueprint.websiteType}`,
      referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
      dnaContextStr,
      `\nGenerate the complete design DNA JSON for this site.`,
    ].filter(Boolean).join('\n');

    async function runDesignAgent(attempt: number, overridePrompt?: string): Promise<{ raw: string; parsed: DesignDNA | null; error: string | null }> {
      try {
        const raw = await callOpenRouter(openrouterKey as string, DESIGN_MODEL,
          [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: overridePrompt ?? designPrompt }],
          1500
        );
        const parsed = parseDesignRaw(raw);
        return { raw, parsed, error: null };
      } catch (e: any) {
        const status = (e as OpenRouterError).status ?? "unknown";
        const reqId  = (e as OpenRouterError).requestId ?? "unknown";
        const errMsg = `Design Agent attempt ${attempt} FAILED — model: ${DESIGN_MODEL}, status: ${status}, requestId: ${reqId}, message: ${e.message}`;
        console.error(`[DesignAgent] ${errMsg}`);
        return { raw: "", parsed: null, error: errMsg };
      }
    }

    // Attempt 1
    const attempt1 = await runDesignAgent(1);
    if (attempt1.parsed) {
      const verify = verifyDNA(attempt1.parsed, referenceSites);
      if (verify.passed) {
        design = attempt1.parsed;
        designAgentStatus = "success";
        console.log(`[DesignAgent] Attempt 1 PASSED verification. refs="${referenceSites}"`);
      } else {
        // DNA collapsed — retry with a more explicit prompt
        console.warn(`[DesignAgent] Attempt 1 DNA VERIFICATION FAILED for refs: [${verify.failedRefs.join(", ")}]. bg=${attempt1.parsed.colorSystem.background} primary=${attempt1.parsed.colorSystem.primary} lang=${attempt1.parsed.designLanguage}. Retrying...`);
        sse(res, {
          type: "design_retry",
          reason: `DNA verification failed for references: [${verify.failedRefs.join(", ")}]`,
          failedFields: { designLanguage: attempt1.parsed.designLanguage, background: attempt1.parsed.colorSystem.background, primary: attempt1.parsed.colorSystem.primary },
        });

        // Retry with a reference-specific, explicit prompt
        const REFERENCE_DNA_REQUIREMENTS: Record<string, { designLanguage: string; heroStyle: string; extra?: string }> = {
          stripe:     { designLanguage: "premium-gradient", heroStyle: "centered-gradient",  extra: 'decorationLevel MUST be "rich", animationPersonality MUST be "expressive"' },
          linear:     { designLanguage: "minimal-flat",     heroStyle: "editorial-large",    extra: 'decorationLevel MUST be "none", animationPersonality MUST be "subtle"' },
          vercel:     { designLanguage: "monochrome",       heroStyle: "split-layout",       extra: 'decorationLevel MUST be "none", animationPersonality MUST be "subtle"' },
          framer:     { designLanguage: "bold-motion",      heroStyle: "editorial-large",    extra: 'animationPersonality MUST be "expressive"' },
          notion:     { designLanguage: "editorial",        heroStyle: "editorial-large",    extra: 'theme MUST be "light"' },
        };
        const primLower = primaryReference.toLowerCase();
        const req = REFERENCE_DNA_REQUIREMENTS[primLower];
        const retryUserPrompt = req
          ? [
              `CRITICAL: The PRIMARY reference is "${primaryReference}". You MUST output EXACTLY:`,
              `  designLanguage: "${req.designLanguage}"`,
              `  heroStyle: "${req.heroStyle}"`,
              req.extra ? `  ${req.extra}` : '',
              `Apply ONLY the ${primaryReference} DNA from the reference library. Do NOT mix with other design systems.`,
              `\n${designPrompt}`,
            ].filter(Boolean).join('\n')
          : [
              `IMPORTANT: The PRIMARY reference is "${primaryReference}". Apply its DNA EXACTLY as shown in the reference library.`,
              `Do NOT output generic defaults. Do NOT blend with other design systems.`,
              `\n${designPrompt}`,
            ].join('\n');

        const attempt2 = await runDesignAgent(2, retryUserPrompt);
        if (attempt2.parsed) {
          const verify2 = verifyDNA(attempt2.parsed, referenceSites);
          design = attempt2.parsed;
          designAgentStatus = verify2.passed ? "retry_success" : "retry_failed";
          if (!verify2.passed) {
            console.warn(`[DesignAgent] Retry also failed verification for [${verify2.failedRefs.join(", ")}]. Using retry result anyway.`);
          } else {
            console.log(`[DesignAgent] Retry PASSED verification.`);
          }
        } else {
          designAgentStatus = "retry_failed";
          designAgentError = attempt2.error;
          console.error(`[DesignAgent] Retry also failed: ${attempt2.error}`);
        }
      }
    } else {
      // Parse failed or model errored
      designAgentError = attempt1.error ?? "Design Agent returned unparseable output";
      sse(res, {
        type: "design_agent_error",
        designAgentStatus: "failed",
        error: designAgentError,
        model: DESIGN_MODEL,
      });
      console.error(`[DesignAgent] Using DEFAULT_DESIGN. Reason: ${designAgentError}`);
    }

    console.log(`[Design DNA] status=${designAgentStatus} language=${design.designLanguage} cardStyle=${design.cardStyle} heroStyle=${design.heroStyle} animation=${design.animationPersonality} bg=${design.colorSystem.background} primary=${design.colorSystem.primary}`);
    sse(res, { type: "step", step: 2, agent: "Design Agent", status: "done", design, designAgentStatus, designAgentError });

    // ── COMPONENT LIBRARY SELECTION ───────────────────────────────────────────
    const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, design, referenceSites, primaryReference);
    const componentContext = buildContextFromTemplates(selectedTemplates);
    console.log(`[ComponentLib] Selected ${selectedTemplates.length} templates: ${selectedTemplates.map(t => t.id).join(', ')}`);

    // ── AGENT 4: FRONTEND / CODE GENERATION ──────────────────────────────────
    sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "active" });

    const sectionCount = blueprint.sectionOrder.length;
    const isMultiPageApp = projectBlueprint.pages.length > 1;

    // Multi-page apps get a page-driven prompt (one page function per blueprint page).
    // Single-page / landing pages keep the section-order-driven prompt (proven quality).
    const codegenUserPrompt = isMultiPageApp
      ? `Build a ${projectBlueprint.projectType} with these pages from the architecture blueprint: ${projectBlueprint.pages.join(', ')}.

Output each page using FILE delimiters so files can be extracted:
${projectBlueprint.pages.map(p => `// === FILE: src/pages/${p}.tsx ===\nfunction ${p}() { /* full ${p} page */ }`).join('\n\n')}

Shared layout components (Navbar, Footer, Sidebar) use:
// === FILE: src/components/Navbar.tsx ===
function Navbar() { /* sticky navigation */ }

Architecture context: ${projectBlueprint.description}
Shared components: ${projectBlueprint.components.join(', ') || 'Navbar, Footer'}
Auth: ${projectBlueprint.authNeeded} | Dashboard: ${projectBlueprint.dashboardNeeded}

Prompt: ${prompt}
Plan: ${cleanPlan}

Apply the design DNA above to ALL pages. Make each page production-quality and visually coherent. Do not truncate.`
      : `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}\n\nBUILD EXACTLY ${sectionCount} SECTIONS in this order: ${blueprint.sectionOrder.join(' → ')}. Use component templates as structural reference — replace ALL placeholder text with real, specific content for this site. Apply the design DNA precisely. Do not truncate.`;

    let generatedCode = "";
    try {
      generatedCode = await callOpenRouter(openrouterKey, CODEGEN_MODEL,
        [
          { role: "system", content: buildCodeSystem(design, blueprint, componentContext, projectBlueprint) },
          { role: "user", content: codegenUserPrompt },
        ],
        8000
      );
    } catch (e) {
      console.error("OpenRouter codegen failed, falling back to Groq:", e);
      generatedCode = await callGroq(groqKey, "llama-3.3-70b-versatile",
        [
          { role: "system", content: buildCodeSystem(design, blueprint, componentContext, projectBlueprint) },
          { role: "user", content: isMultiPageApp ? codegenUserPrompt : `Build a complete landing page for: ${prompt}. Build EXACTLY ${sectionCount} sections in order: ${blueprint.sectionOrder.join(' → ')}. Apply the design DNA precisely. Do not truncate.` },
        ],
        false, 8000
      );
    }

    generatedCode = generatedCode
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "done" });

    // ── AGENT 5: CODE FIX ─────────────────────────────────────────────────────
    sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "active" });

    let fixedCode = generatedCode;
    try {
      const codeFix_userRaw = `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}`;
      const { system: cfSystem, user: cfUser } = truncateForGroq(CODEFIX_SYSTEM, codeFix_userRaw, 5_000);
      const fixed = await callGroq(groqKey, CODEFIX_MODEL,
        [
          { role: "system", content: cfSystem },
          { role: "user", content: cfUser },
        ],
        false, 5_000
      );
      if (fixed && fixed.length > 200) {
        fixedCode = fixed
          .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();
      }
    } catch (e) {
      console.error("Code fix agent error (using generated code):", e);
    }

    sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "done" });

    // ── BUILD PROJECT FILES ───────────────────────────────────────────────────
    // The preview iframe requires a single CDN+Babel blob (no module imports),
    // so `code` stays as-is for the preview. `files` is the true multi-file
    // TypeScript project output, driven by projectBlueprint.pages/components.
    const projectFiles = buildServerProjectFiles(fixedCode, projectBlueprint, blueprint.sectionOrder);
    console.log(`[ProjectFiles] Generated ${projectFiles.length} files (${projectFiles.filter(f => f.lang === 'tsx').length} TSX, ${projectFiles.filter(f => f.lang === 'ts').length} TS)`);

    // ── V5.1: MULTI-PASS VALIDATE → REPAIR LOOP ──────────────────────────────
    // Up to 3 passes. Each pass:
    //   1. Validate all TSX files deterministically
    //   2. Repair all failures in parallel (fast model, ≤1500 tokens each)
    // Tracks: repairAttempts, filesRepaired, per-file pass counts
    const PERFILE_FIX_MODEL = "llama-3.1-8b-instant";
    const MAX_REPAIR_PASSES = 3;
    const REPAIR_SYSTEM = 'You are a React JSX repair agent. Fix ONLY the reported issues. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';

    let totalRepairAttempts = 0;
    let totalFilesRepaired = 0;

    const tsxTargets = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');

    for (let pass = 0; pass < MAX_REPAIR_PASSES; pass++) {
      const failures = tsxTargets.filter(f => !validateTsxFile(f.name, f.content).valid);
      if (failures.length === 0) {
        console.log(`[RepairLoop] All files valid after pass ${pass}. Done.`);
        break;
      }
      if (pass === MAX_REPAIR_PASSES - 1) {
        console.warn(`[RepairLoop] Pass ${pass + 1}: ${failures.length} file(s) still failing after max passes.`);
        break;
      }
      console.log(`[RepairLoop] Pass ${pass + 1}: Repairing ${failures.length} file(s)...`);

      await Promise.all(failures.map(async (file) => {
        const validation = validateTsxFile(file.name, file.content);
        console.warn(`[RepairLoop:pass${pass + 1}] ${file.name}: ${validation.issues.join('; ')}`);
        totalRepairAttempts++;
        try {
          const fixed = await callGroq(groqKey, PERFILE_FIX_MODEL,
            [
              { role: 'system', content: REPAIR_SYSTEM },
              { role: 'user', content: `File: ${file.name}\nIssues to fix:\n${validation.issues.map(i => `- ${i}`).join('\n')}\nWarnings:\n${validation.warnings.map(w => `- ${w}`).join('\n') || '(none)'}\n\nFull file:\n${file.content}` },
            ],
            false, 1500
          );
          if (fixed && fixed.length > 80) {
            const cleaned = fixed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
            if (!validateTsxFile(file.name, cleaned).valid === false) {
              // repaired file still fails — keep if it's larger (partial improvement)
              if (cleaned.length > file.content.length * 0.5) {
                file.content = cleaned;
                totalFilesRepaired++;
                console.log(`[RepairLoop] ✓ ${file.name} repaired (${cleaned.length} chars)`);
              }
            } else {
              file.content = cleaned;
              totalFilesRepaired++;
              console.log(`[RepairLoop] ✓ ${file.name} repaired (${cleaned.length} chars)`);
            }
          }
        } catch (e) {
          console.error(`[RepairLoop] ✗ ${file.name} repair failed:`, e);
        }
      }));
    }

    // ── Build Health Metrics ──────────────────────────────────────────────────
    const finalTsxFiles = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');
    const passedTsxFiles = finalTsxFiles.filter(f => validateTsxFile(f.name, f.content).valid);
    const validationScore = finalTsxFiles.length > 0
      ? Math.round((passedTsxFiles.length / finalTsxFiles.length) * 100)
      : 100;

    const buildHealthMetrics = {
      validationScore,
      compileSuccessRate: validationScore,
      repairAttempts: totalRepairAttempts,
      filesRepaired: totalFilesRepaired,
      totalFiles: projectFiles.length,
      passedFiles: passedTsxFiles.length,
      failedFiles: finalTsxFiles.length - passedTsxFiles.length,
      tokenEstimate: estimateTokenCount(fixedCode),
    };

    console.log(`[BuildHealth] score=${validationScore}% passed=${passedTsxFiles.length}/${finalTsxFiles.length} repairs=${totalRepairAttempts} repaired=${totalFilesRepaired}`);
    sse(res, { type: "build_health", ...buildHealthMetrics });

    // ── AGENTS 6-8: BACKEND / DATABASE / AUTH (parallel) ─────────────────────
    // Each agent runs only when the blueprint declares it is needed.
    // All three run in parallel — total latency = slowest single agent.
    let backendFiles: ProjectFileSSE[] = [];
    let dbFiles: ProjectFileSSE[] = [];
    let authFiles: ProjectFileSSE[] = [];

    const hasApis    = projectBlueprint.apis.length > 0;
    const hasTables  = projectBlueprint.databaseTables.length > 0;
    const needsAuth  = projectBlueprint.authNeeded;

    if (hasApis || hasTables || needsAuth) {
      const fullStackTasks: Promise<void>[] = [];

      if (hasApis) {
        sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "active", apis: projectBlueprint.apis });
        fullStackTasks.push(
          generateBackendFiles(
            projectBlueprint.apis,
            projectBlueprint.entities || [],
            projectBlueprint.projectType,
            groqKey
          ).then(files => {
            backendFiles = files;
            console.log(`[BackendAgent] Generated ${files.length} backend files`);
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          }).catch(e => {
            console.error('[BackendAgent] Failed:', e);
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "error", error: e.message });
          })
        );
      }

      if (hasTables) {
        sse(res, { type: "step", step: 6, agent: "Database Agent", status: "active", tables: projectBlueprint.databaseTables });
        fullStackTasks.push(
          generateDatabaseFiles(
            projectBlueprint.databaseTables,
            projectBlueprint.relationships || [],
            projectBlueprint.entities || [],
            groqKey
          ).then(files => {
            dbFiles = files;
            console.log(`[DatabaseAgent] Generated ${files.length} database files`);
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          }).catch(e => {
            console.error('[DatabaseAgent] Failed:', e);
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "error", error: e.message });
          })
        );
      }

      if (needsAuth) {
        sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "active", provider: projectBlueprint.authProvider });
        fullStackTasks.push(
          generateAuthFiles(projectBlueprint.authProvider || 'JWT', groqKey).then(files => {
            authFiles = files;
            console.log(`[AuthAgent] Generated ${files.length} auth files`);
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          }).catch(e => {
            console.error('[AuthAgent] Failed:', e);
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "error", error: e.message });
          })
        );
      }

      await Promise.all(fullStackTasks);
    }

    // ── AGENT 9: SCAFFOLD AGENT (programmatic file assembly + Replit config) ────
    sse(res, { type: "step", step: 8, agent: "Scaffold Agent", status: "active" });

    const extraFiles: ProjectFileSSE[] = [
      ...backendFiles,
      ...dbFiles,
      ...authFiles,
      ...(hasApis || hasTables || needsAuth ? [generateEnvExample(projectBlueprint)] : []),
      generateReadme(projectBlueprint),
      generateReplitConfig(projectBlueprint),
      generateReplitNix(),
    ];

    // Merge, letting extra files win over buildServerProjectFiles duplicates
    const reservedNames = new Set(['README.md', '.replit', 'replit.nix', '.env.example']);
    const allFiles = [
      ...projectFiles.filter(f => !reservedNames.has(f.name)),
      ...extraFiles,
    ];

    console.log(`[Pipeline] Total files: ${allFiles.length} (frontend: ${projectFiles.length}, backend: ${backendFiles.length}, db: ${dbFiles.length}, auth: ${authFiles.length})`);

    // ── PROJECT VALIDATOR V4 ──────────────────────────────────────────────────
    const pv = validateProject(allFiles, projectBlueprint);
    console.log(`[ProjectValidator] score=${pv.score} passed=${pv.passed}${pv.issues.length ? ' — ' + pv.issues.join('; ') : ''}`);
    sse(res, { type: "project_validate", score: pv.score, passed: pv.passed, issues: pv.issues, fileCount: allFiles.length });

    sse(res, { type: "step", step: 8, agent: "Scaffold Agent", status: "done", fileCount: allFiles.length });

    // ── DONE ──────────────────────────────────────────────────────────────────
    sse(res, { type: "done", code: fixedCode, plan: cleanPlan, blueprint, projectBlueprint, sectionOrder: blueprint.sectionOrder, files: allFiles, dnaComposition, sectionOwnership: dnaOwnership, themeTokens: dnaTheme, motionProfile: dnaMotion });

  } catch (err: any) {
    sse(res, { type: "error", error: err?.message ?? "Multi-agent pipeline failed" });
  }

  res.end();
});

// ── DESIGN AUDIT ENDPOINT ────────────────────────────────────────────────────
// Returns every pipeline stage as structured JSON for debugging.
// POST /api/agents/audit  { prompt: string }
router.post("/agents/audit", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  const { prompt } = req.body as { prompt: string };

  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!openrouterKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const audit: Record<string, any> = {
    prompt,
    models: { planner: PLANNER_MODEL, design: DESIGN_MODEL, codegen: CODEGEN_MODEL, codefix: CODEFIX_MODEL },
  };

  // ── STAGE 1: PLANNER ──────────────────────────────────────────────────────
  try {
    let planText = "";
    await callGroq(groqKey, PLANNER_MODEL,
      [{ role: "system", content: PLANNER_SYSTEM }, { role: "user", content: prompt }],
      true, 2500, (token) => { planText += token; }
    );
    audit.plannerOutput = { raw: planText };

    const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
    const briefText = briefMatch ? briefMatch[1].trim() : "";
    const refMatch = briefText.match(/referenceSites:\s*(.+)/);
    const referenceSites = refMatch ? refMatch[1].trim() : "none";

    let auditPrimaryRef = "none";
    const auditPrimaryRefMatch = briefText.match(/primaryReference:\s*(.+)/);
    if (auditPrimaryRefMatch) auditPrimaryRef = auditPrimaryRefMatch[1].trim();
    if (auditPrimaryRef === "none" && referenceSites !== "none") {
      auditPrimaryRef = referenceSites.split(',')[0].trim();
    }

    let auditSecondaryRefs: string[] = [];
    const auditSecondaryMatch = briefText.match(/secondaryReferences:\s*(.+)/);
    if (auditSecondaryMatch && auditSecondaryMatch[1].trim() !== "none") {
      auditSecondaryRefs = auditSecondaryMatch[1].trim().split(',').map(s => s.trim());
    }

    const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
    let blueprint: PageBlueprint = { websiteType: "Generic", sectionOrder: ["Navbar", "Hero", "Features", "CTA", "Footer"] };
    if (blueprintMatch) {
      try { blueprint = JSON.parse(blueprintMatch[1].trim()); } catch {}
    }
    audit.plannerOutput.brief = briefText;
    audit.plannerOutput.referenceSites = referenceSites;
    audit.plannerOutput.primaryReference = auditPrimaryRef;
    audit.plannerOutput.secondaryReferences = auditSecondaryRefs;
    audit.plannerOutput.blueprint = blueprint;

    // ── STAGE 2: DESIGN AGENT ───────────────────────────────────────────────
    const designPrompt = [
      `Website brief:\n${briefText || prompt}`,
      `Website type: ${blueprint.websiteType}`,
      referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
      `\nGenerate the complete design DNA JSON for this site.`,
    ].filter(Boolean).join('\n');

    audit.designAgentInput = { systemPromptLength: DESIGN_SYSTEM.length, userPrompt: designPrompt };

    let designAgentRawOutput = "";
    let parsedDNA: Partial<DesignDNA> | null = null;
    let finalDNA: DesignDNA = { ...DEFAULT_DESIGN };
    let designAgentStatus = "not_run";
    let designAgentError: string | null = null;

    try {
      designAgentRawOutput = await callOpenRouter(openrouterKey, DESIGN_MODEL,
        [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: designPrompt }],
        1500
      );
      designAgentStatus = "success";
      const jsonMatch = designAgentRawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDNA = JSON.parse(jsonMatch[0]);
        finalDNA = { ...DEFAULT_DESIGN, ...(parsedDNA as any) };
        if ((parsedDNA as any).colorSystem) finalDNA.colorSystem = { ...DEFAULT_DESIGN.colorSystem, ...(parsedDNA as any).colorSystem };
        if ((parsedDNA as any).typographySystem) finalDNA.typographySystem = { ...DEFAULT_DESIGN.typographySystem, ...(parsedDNA as any).typographySystem };
        if ((parsedDNA as any).spacingSystem) finalDNA.spacingSystem = { ...DEFAULT_DESIGN.spacingSystem, ...(parsedDNA as any).spacingSystem };
      } else {
        designAgentStatus = "parse_failed";
        designAgentError = "Model response contained no JSON object";
      }
    } catch (e: any) {
      designAgentStatus = "failed";
      const orErr = e as OpenRouterError;
      designAgentError = e.message;
      audit.designAgentError = {
        message: e.message,
        model: orErr.model ?? DESIGN_MODEL,
        status: orErr.status ?? null,
        requestId: orErr.requestId ?? null,
        body: orErr.body ?? null,
      };
    }

    // ── STAGE 3: DNA DIFF vs DEFAULT ────────────────────────────────────────
    const KEY_FIELDS = [
      ["designLanguage"],
      ["layoutStyle"],
      ["animationPersonality"],
      ["decorationLevel"],
      ["heroStyle"],
      ["cardStyle"],
      ["colorSystem", "background"],
      ["colorSystem", "surface"],
      ["colorSystem", "primary"],
      ["colorSystem", "accent"],
      ["colorSystem", "textMuted"],
      ["colorSystem", "border"],
      ["typographySystem", "headingWeight"],
      ["typographySystem", "scale"],
      ["spacingSystem", "sectionPadding"],
    ] as const;

    const get = (obj: any, path: readonly string[]) => path.reduce((o, k) => o?.[k], obj);
    const dnaDiff: Record<string, { default: any; actual: any; changed: boolean }> = {};
    for (const path of KEY_FIELDS) {
      const key = path.join(".");
      const def = get(DEFAULT_DESIGN, path);
      const act = get(finalDNA, path);
      dnaDiff[key] = { default: def, actual: act, changed: def !== act };
    }
    const changedFields = Object.values(dnaDiff).filter(v => v.changed).length;

    audit.designAgentOutput = { raw: designAgentRawOutput, status: designAgentStatus, error: designAgentError };
    audit.parsedDNA = parsedDNA;
    audit.finalDNA = finalDNA;
    audit.dnaDiff = { fields: dnaDiff, changedFromDefault: changedFields, totalFields: KEY_FIELDS.length, collapsed: changedFields === 0 };

    // ── STAGE 4: CODE GEN PROMPT ────────────────────────────────────────────
    const AUDIT_HERO_MAP: Record<string, string> = {
      stripe: 'hero-centered-v1', linear: 'hero-editorial-v1', vercel: 'hero-asymmetric-v1',
      framer: 'hero-bento-v1', notion: 'hero-editorial-v1', cursor: 'hero-asymmetric-v1',
    };
    const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, finalDNA, referenceSites, auditPrimaryRef);
    const componentContext = buildContextFromTemplates(selectedTemplates);
    const codeGenSystemPrompt = buildCodeSystem(finalDNA, blueprint, componentContext);

    const selectedHero = selectedTemplates.find(t => t.category === 'hero')?.id ?? 'none';
    const expectedHero = AUDIT_HERO_MAP[auditPrimaryRef.toLowerCase()] ?? 'unknown';
    const heroMatch = expectedHero === 'unknown' || selectedHero === expectedHero;
    const dnaVerifiers: Record<string, (d: DesignDNA) => boolean> = {
      stripe: (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient",
      linear: (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large",
      vercel:  (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
    };
    const dnaVerifier = dnaVerifiers[auditPrimaryRef.toLowerCase()];
    const dnaPass = dnaVerifier ? dnaVerifier(finalDNA) : true;
    const validationStatus = heroMatch && dnaPass ? "pass" : !heroMatch ? "fail:hero_mismatch" : "fail:dna_mismatch";

    const SECTION_EXPECTED_FEATURES: Record<string, string> = {
      stripe: 'features-stripe-v1', paypal: 'features-stripe-v1',
      linear: 'features-editorial-v1', notion: 'features-editorial-v1',
      vercel: 'features-split-v1', netlify: 'features-split-v1',
      framer: 'features-framer-v1', webflow: 'features-framer-v1', figma: 'features-framer-v1',
    };
    const SECTION_EXPECTED_DASHBOARD: Record<string, string> = {
      stripe: 'dashboard-revenue-v1', paypal: 'dashboard-revenue-v1',
      linear: 'dashboard-kanban-v1', notion: 'dashboard-kanban-v1',
      vercel: 'dashboard-vercel-v1', netlify: 'dashboard-vercel-v1',
      framer: 'dashboard-aiflow-v1', webflow: 'dashboard-aiflow-v1',
    };
    const SECTION_EXPECTED_PRICING: Record<string, string> = {
      stripe: 'pricing-comparison-v1', paypal: 'pricing-comparison-v1',
      linear: 'pricing-minimal-v1', notion: 'pricing-minimal-v1',
      vercel: 'pricing-horizontal-v1', netlify: 'pricing-horizontal-v1',
      framer: 'pricing-cardstack-v1', webflow: 'pricing-cardstack-v1', figma: 'pricing-cardstack-v1',
    };

    const ref = auditPrimaryRef.toLowerCase();
    const selectedFeatures = selectedTemplates.find((t: any) => t.category === 'features')?.id ?? 'none';
    const selectedDashboard = selectedTemplates.find((t: any) => t.category === 'dashboard-preview')?.id ?? 'none';
    const selectedPricing = selectedTemplates.find((t: any) => t.category === 'pricing')?.id ?? 'none';
    const expectedFeatures = SECTION_EXPECTED_FEATURES[ref] ?? 'unknown';
    const expectedDashboard = SECTION_EXPECTED_DASHBOARD[ref] ?? 'unknown';
    const expectedPricing = SECTION_EXPECTED_PRICING[ref] ?? 'unknown';
    // null = section not in blueprint (N/A, doesn't count against score)
    const featuresMatch = selectedFeatures === 'none' ? null : (expectedFeatures === 'unknown' || selectedFeatures === expectedFeatures);
    const dashboardMatch = selectedDashboard === 'none' ? null : (expectedDashboard === 'unknown' || selectedDashboard === expectedDashboard);
    const pricingMatch = selectedPricing === 'none' ? null : (expectedPricing === 'unknown' || selectedPricing === expectedPricing);
    const activeChecks = ([heroMatch, featuresMatch, dashboardMatch, pricingMatch] as (boolean | null)[]).filter(m => m !== null) as boolean[];
    const matchPoints = activeChecks.filter(Boolean).length;
    const architectureMatchScore = activeChecks.length > 0 ? Math.round((matchPoints / activeChecks.length) * 100) : 100;

    // ── STAGE 4b: ARCHITECTURE DIVERSITY SCORE (Phase 10) ──────────────────
    const diversityCounts = {
      hero:              getTemplatesByCategory('hero').length,
      features:          getTemplatesByCategory('features').length,
      pricing:           getTemplatesByCategory('pricing').length,
      dashboard:         getTemplatesByCategory('dashboard-preview').length,
      navbar:            getTemplatesByCategory('navbar').length,
      bento:             getTemplatesByCategory('bento').length,
      cta:               getTemplatesByCategory('cta').length,
      faq:               getTemplatesByCategory('faq').length,
      testimonials:      getTemplatesByCategory('testimonials').length,
    };
    // Score: each category worth up to 100. Formula: min(100, (count / 6) * 100). 6+ variants = full score.
    const catScore = (n: number) => Math.min(100, Math.round((n / 6) * 100));
    const categoryScores: Record<string, number> = {};
    for (const [cat, count] of Object.entries(diversityCounts)) {
      categoryScores[cat] = catScore(count);
    }
    const overallArchitectureScore = Math.round(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.values(categoryScores).length
    );
    // Routing coverage: count how many routing maps have an entry for primaryRef
    const routingMaps = ['hero', 'features', 'dashboard', 'pricing', 'navbar', 'bento', 'cta', 'faq'];
    const routingCoverage = [heroMatch, featuresMatch, dashboardMatch, pricingMatch]
      .filter(m => m !== null).length;

    audit.referenceRouting = {
      primaryReference: auditPrimaryRef,
      secondaryReferences: auditSecondaryRefs,
      selectedHero,
      selectedFeatures,
      selectedDashboard,
      selectedPricing,
      expectedHero,
      expectedFeatures,
      expectedDashboard,
      expectedPricing,
      heroMatch,
      featuresMatch,
      dashboardMatch,
      pricingMatch,
      architectureMatchScore,
      dnaPass,
      validationStatus,
    };

    audit.architectureDiversity = {
      templateCounts: diversityCounts,
      categoryScores,
      overallArchitectureScore,
      routingCoverage,
      routingMapsCount: routingMaps.length,
      target: 90,
      passing: overallArchitectureScore >= 90,
      note: overallArchitectureScore >= 90
        ? `PASS — system diversity ≥ 90 (${overallArchitectureScore})`
        : `FAIL — system diversity ${overallArchitectureScore} < 90 target. Low categories: ${Object.entries(categoryScores).filter(([,s]) => s < 90).map(([c,s]) => `${c}(${s})`).join(', ')}`,
    };

    audit.codeGeneratorPrompt = {
      systemPromptLength: codeGenSystemPrompt.length,
      systemPromptPreview: codeGenSystemPrompt.slice(0, 1200) + (codeGenSystemPrompt.length > 1200 ? "\n...[truncated]" : ""),
      userPrompt: `Build a complete landing page for: ${prompt} — ${blueprint.sectionOrder.length} sections: ${blueprint.sectionOrder.join(' → ')}`,
      selectedTemplates: selectedTemplates.map(t => t.id),
    };

    audit.summary = {
      referenceSites,
      designAgentStatus,
      dnaCollapsed: changedFields === 0,
      changedFieldsFromDefault: changedFields,
      dominantColor: finalDNA.colorSystem.primary,
      background: finalDNA.colorSystem.background,
      designLanguage: finalDNA.designLanguage,
      animationPersonality: finalDNA.animationPersonality,
    };

  } catch (e: any) {
    audit.fatalError = e.message;
  }

  res.json(audit);
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 — ZIP EXPORT
// POST /agents/export → returns a downloadable project.zip
// ─────────────────────────────────────────────────────────────────────────────
router.post("/agents/export", (req, res) => {
  try {
    const { files, projectName = "nexogen-project" } = req.body as {
      files: Array<{ path: string; name: string; content: string }>;
      projectName?: string;
    };

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const zipData: Record<string, Uint8Array> = {};

    for (const file of files) {
      const key = `${safeName}/${file.path || ""}${file.name}`.replace(/\/\//g, "/");
      zipData[key] = strToU8(file.content || "");
    }

    const zipped = zipSync(zipData, { level: 6 });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.zip"`);
    res.send(Buffer.from(zipped));
  } catch (e: any) {
    console.error("[Export] ZIP error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — EDIT AGENT
// POST /agents/edit → SSE stream; patches only affected files
// ─────────────────────────────────────────────────────────────────────────────
router.post("/agents/edit", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const { prompt, projectFiles = [], projectMemory, componentRegistry, themeTokens } = req.body as {
    prompt: string;
    projectFiles: ProjectFileSSE[];
    projectMemory?: Record<string, any>;
    componentRegistry?: Record<string, string>;
    themeTokens?: Record<string, any>;
  };

  if (!prompt) return res.status(400).json({ error: "prompt required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // ── STEP 0: Intent Detection ────────────────────────────────────────────
    sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "active" });

    const fileList = projectFiles.map((f) => f.path + f.name).join("\n");
    let intentResult = { editType: "component", targetFiles: [] as string[], newFiles: [] as string[], reason: prompt };

    try {
      const { system: intentSys, user: intentUser } = truncateForGroq(
        INTENT_SYSTEM,
        `PROJECT FILES:\n${fileList}\n\nEDIT REQUEST: ${prompt}`,
        600
      );
      const intentRaw = await callGroq(
        groqKey, PLANNER_MODEL,
        [
          { role: "system", content: intentSys },
          { role: "user", content: intentUser },
        ],
        false, 600
      );
      const cleaned = intentRaw.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      intentResult = { ...intentResult, ...parsed };
    } catch { /* keep defaults */ }

    sse(res, { type: "intent_detected", ...intentResult });
    sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "done" });

    // ── STEP 1: File Resolution ─────────────────────────────────────────────
    sse(res, { type: "step", step: 1, agent: "File Resolver", status: "active" });

    const depGraph = (projectMemory?.dependencyGraph as Record<string, string[]>) ?? {};
    const resolvedFiles = resolveAffectedFiles(intentResult.targetFiles, depGraph, projectFiles);

    sse(res, { type: "file_targets", files: resolvedFiles, originalTargets: intentResult.targetFiles });
    sse(res, { type: "step", step: 1, agent: "File Resolver", status: "done" });

    // ── STEP 2: Patch Generation ────────────────────────────────────────────
    sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "active" });

    // ── Compressed context build ──────────────────────────────────────────
    // Budget: GROQ_TOKEN_BUDGET - system_prompt - response - header overhead
    const EDIT_RESPONSE_TOKENS = 4_000;
    const sysTokens = estimateTokenCount(EDIT_SYSTEM);
    const fileContextBudget = GROQ_TOKEN_BUDGET - EDIT_RESPONSE_TOKENS - sysTokens - 400;

    // Always include App.tsx as context reference for routing
    const allTargets = [
      ...resolvedFiles,
      ...(intentResult.newFiles ?? []),
      "App.tsx",
    ];

    const { context: fileContext, meta: ctxMeta } = buildMinimalEditContext(
      projectFiles,
      allTargets,
      fileContextBudget
    );
    logCompressionReport("EditPatch", ctxMeta);

    // Compress memory — strip editHistory, componentRegistry etc.
    const compressedMem = projectMemory ? compressProjectMemory(projectMemory) : null;

    const projectSummary = compressedMem
      ? `Project: ${compressedMem["projectType"] || "App"} | Pages: ${(compressedMem["pages"] as string[] || []).join(", ")} | Entities: ${(compressedMem["entities"] as string[] || []).join(", ")}\n`
      : `Files: ${projectFiles.map((f) => f.path + f.name).join(", ")}\n`;

    const designCtx = themeTokens
      ? `\nDesign tokens (PRESERVE): primary=${themeTokens.primary}, surface=${themeTokens.surface}, isDark=${themeTokens.isDark}`
      : "";

    // Trim componentRegistry to just names (not full signatures) to save tokens
    const registryCtx = componentRegistry && Object.keys(componentRegistry).length > 0
      ? `\nComponents: ${Object.keys(componentRegistry).slice(0, 20).join(", ")}`
      : "";

    const userMessageRaw = `${projectSummary}${designCtx}${registryCtx}
EDIT REQUEST: ${prompt}
INTENT: ${intentResult.editType} — ${intentResult.reason}
TARGET FILES: ${resolvedFiles.join(", ")}${intentResult.newFiles?.length ? `\nNEW FILES: ${intentResult.newFiles.join(", ")}` : ""}
ALL PROJECT FILES (do not modify unless listed above): ${projectFiles.map((f) => f.path + f.name).join(", ")}

CURRENT FILE CONTEXT:
${fileContext}`;

    // Final safety net — truncate if anything still exceeds budget
    const { system: editSystem, user: userMessage, truncated: wasTruncated } =
      truncateForGroq(EDIT_SYSTEM, userMessageRaw, EDIT_RESPONSE_TOKENS);

    if (wasTruncated) {
      console.warn("[EditPatch] Context was truncated by safety net");
      sse(res, { type: "debug", message: "context_compressed" });
    }

    const editRaw = await callGroq(
      groqKey, BACKEND_MODEL,
      [
        { role: "system", content: editSystem },
        { role: "user", content: userMessage },
      ],
      false, EDIT_RESPONSE_TOKENS
    );

    sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "done" });

    // ── STEP 3: Quality Gate ────────────────────────────────────────────────
    sse(res, { type: "step", step: 3, agent: "Quality Gate", status: "active" });

    const modifiedFiles = extractEditFiles(editRaw);
    const deletedPaths = extractDeletedPaths(editRaw);
    const qualityResult = validateEditFiles(modifiedFiles, projectFiles, resolvedFiles);

    console.log(`[EditAgent V5] modified=${modifiedFiles.length} deleted=${deletedPaths.length} quality=${qualityResult.score}`);
    sse(res, { type: "quality_check", ...qualityResult });
    sse(res, { type: "step", step: 3, agent: "Quality Gate", status: qualityResult.passed ? "done" : "warn" });

    // ── STEP 4: Merge Engine ────────────────────────────────────────────────
    sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "active" });

    const mergedFiles = mergeProjectFiles(projectFiles, modifiedFiles, deletedPaths);

    const existingPaths = new Set(projectFiles.map((f) => f.path + f.name));
    const diff = {
      changedFiles: modifiedFiles.filter((f) => existingPaths.has(f.path + f.name)).map((f) => f.path + f.name),
      createdFiles: modifiedFiles.filter((f) => !existingPaths.has(f.path + f.name)).map((f) => f.path + f.name),
      deletedFiles: deletedPaths,
    };

    sse(res, {
      type: "edit_identified",
      modifiedCount: modifiedFiles.length,
      deletedCount: deletedPaths.length,
      files: modifiedFiles.map((f) => f.path + f.name),
    });

    sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "done" });

    sse(res, {
      type: "edit_done",
      files: mergedFiles,
      diff,
      intentResult,
    });

    res.end();
  } catch (e: any) {
    console.error("[EditAgent V5] Error:", e);
    sse(res, { type: "error", error: e.message });
    res.end();
  }
});

export default router;
