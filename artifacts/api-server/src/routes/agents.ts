import { Router } from "express";
import { selectTemplatesForPrompt, buildContextFromTemplates, getTemplatesByCategory } from "../components/registry";

const router: Router = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PLANNER_MODEL = "llama-3.3-70b-versatile";
const DESIGN_MODEL = "google/gemini-2.5-flash-lite";
const CODEGEN_MODEL = "deepseek/deepseek-chat";
const CODEFIX_MODEL = "llama-3.3-70b-versatile";

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
  dashboardNeeded: boolean;
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

const ARCHITECTURE_SYSTEM = `You are an Architecture Agent for an AI software builder. Analyze the user's prompt and output a precise project blueprint as JSON.

Output ONLY valid JSON (no markdown, no code fences, no explanation):
{
  "projectType": "one of: Landing Page, SaaS, E-commerce, Portfolio, Restaurant, Agency, Blog, Dashboard App, AI Tool, Developer Tool",
  "pages": ["array of page names, e.g. Landing, Dashboard, Login, Signup, Settings, Pricing, Blog, About, Contact"],
  "components": ["reusable component names, e.g. Navbar, Hero, PricingCard, FeatureGrid, Footer, Testimonials"],
  "databaseTables": ["database entities, e.g. users, projects, subscriptions, posts — empty array for simple landing pages"],
  "apis": ["API route domains, e.g. auth, users, projects, billing, ai — empty array for simple landing pages"],
  "authNeeded": false,
  "dashboardNeeded": false,
  "techStack": {
    "frontend": "React + TypeScript + Tailwind CSS",
    "routing": "React Router v6",
    "ui": "shadcn/ui + Lucide Icons",
    "backend": "Express.js + TypeScript",
    "database": "PostgreSQL + Prisma"
  },
  "description": "one sentence describing what this software does"
}

Rules:
- Simple landing page/portfolio/restaurant: authNeeded false, dashboardNeeded false, pages ["Landing"], databaseTables [], apis []
- SaaS/app with user accounts: authNeeded true, dashboardNeeded true, multiple pages including Login/Signup/Dashboard
- E-commerce: authNeeded true, pages include Landing/Products/Cart/Checkout
- Be realistic — don't add unnecessary complexity for simple marketing sites`;

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
  const componentSection = componentContext
    ? `\n\nCOMPONENT LIBRARY TEMPLATES (use as structural reference — adapt content, colors, and copy for this specific site):\n${componentContext}\n`
    : '';

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

interface TsxValidation { valid: boolean; issues: string[]; }

function validateTsxFile(name: string, content: string): TsxValidation {
  const issues: string[] = [];
  // Strip known wrapper lines (imports / export) before checking the body
  const body = content
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export\s.*/gm, '');

  // 1. Must contain a capitalized function definition
  if (!/function\s+[A-Z]/.test(body)) issues.push('missing capitalized function definition');
  // 2. Must have a JSX return statement
  if (!/\breturn\s*[(<]/.test(body)) issues.push('missing JSX return statement');
  // 3. JSX fragments are banned (CDN+Babel preview requires wrapper divs)
  if (/<>|<\/>/.test(body)) issues.push('JSX fragment syntax (<> </>) — use a wrapper div');
  // 4. Stray TypeScript-only syntax that crashes Babel strict mode
  if (/:\s*React\.FC\b|:\s*JSX\.Element\b/.test(body)) issues.push('React.FC / JSX.Element type annotation');
  // 5. Stray import left over in the body (would cause ReferenceError)
  if (/\nimport\s/.test(body)) issues.push('stray import statement inside function body');

  return { valid: issues.length === 0, issues };
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

  // package.json
  const deps: Record<string, string> = {
    react: '^18.3.1', 'react-dom': '^18.3.1',
    'lucide-react': '^0.400.0', clsx: '^2.1.1', 'tailwind-merge': '^2.4.0',
  };
  if (useRouter) deps['react-router-dom'] = '^6.26.0';
  if (pb.authNeeded) deps['@supabase/supabase-js'] = '^2.45.0';

  files.push({
    path: '', name: 'package.json', lang: 'json',
    content: JSON.stringify({
      name: (pb.projectType || 'nexogen-app').toLowerCase().replace(/\s+/g, '-'),
      private: true, version: '0.0.0', type: 'module',
      scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
      dependencies: deps,
      devDependencies: {
        '@types/react': '^18.3.3', '@types/react-dom': '^18.3.0',
        '@vitejs/plugin-react': '^4.3.1', typescript: '^5.5.3',
        vite: '^5.4.10', tailwindcss: '^3.4.14',
        autoprefixer: '^10.4.20', postcss: '^8.4.47',
      },
    }, null, 2),
  });

  // vite.config.ts
  files.push({
    path: '', name: 'vite.config.ts', lang: 'ts',
    content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  resolve: { alias: { '@': '/src' } },\n});\n`,
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

  return files;
}

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
      true, 2500,
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

    // ── AGENT 2: ARCHITECTURE ─────────────────────────────────────────────────
    sse(res, { type: "step", step: 1, agent: "Architecture Agent", status: "active" });

    let projectBlueprint: ProjectBlueprint = {
      projectType: blueprint.websiteType || "Landing Page",
      pages: ["Landing"],
      components: blueprint.sectionOrder || [],
      databaseTables: [],
      apis: [],
      authNeeded: false,
      dashboardNeeded: false,
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
        false, 1000
      );
      const archJsonMatch = archResult.match(/\{[\s\S]*\}/);
      if (archJsonMatch) {
        const parsed = JSON.parse(archJsonMatch[0]);
        projectBlueprint = { ...projectBlueprint, ...parsed };
      }
    } catch (e) {
      console.error("[ArchitectureAgent] Failed (using defaults):", e);
    }

    console.log(`[Architecture] projectType=${projectBlueprint.projectType} pages=[${projectBlueprint.pages.join(', ')}] auth=${projectBlueprint.authNeeded} dashboard=${projectBlueprint.dashboardNeeded}`);
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

    const designPrompt = [
      `Website brief:\n${briefText || prompt}`,
      `Website type: ${blueprint.websiteType}`,
      referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
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
      const fixed = await callGroq(groqKey, CODEFIX_MODEL,
        [
          { role: "system", content: CODEFIX_SYSTEM },
          { role: "user", content: `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}` },
        ],
        false, 8192
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

    // ── PER-FILE FIX LOOP ─────────────────────────────────────────────────────
    // Validate every generated TSX file. Files that fail the deterministic check
    // get a targeted, fast LLM repair call (llama-3.1-8b-instant, ≤1500 tokens).
    // All repairs run in parallel — total latency = slowest single repair.
    const PERFILE_FIX_MODEL = "llama-3.1-8b-instant";
    const repairTargets = projectFiles.filter(f =>
      f.lang === 'tsx' && f.name !== 'main.tsx'
    );
    const repairJobs = repairTargets
      .map(file => {
        const validation = validateTsxFile(file.name, file.content);
        if (validation.valid) return null;
        console.warn(`[PerFileRepair] Repairing ${file.name}: ${validation.issues.join('; ')}`);
        return (async () => {
          try {
            const fixed = await callGroq(groqKey, PERFILE_FIX_MODEL,
              [
                { role: 'system', content: 'Fix the React TypeScript component file. Return ONLY the corrected file — no markdown, no explanation.' },
                { role: 'user', content: `Fix ${file.name}. Issues: ${validation.issues.join(', ')}.\n\n${file.content}` },
              ],
              false, 1500
            );
            if (fixed && fixed.length > 80) {
              file.content = fixed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
              console.log(`[PerFileRepair] ${file.name} repaired (${file.content.length} chars).`);
            }
          } catch (e) {
            console.error(`[PerFileRepair] Failed to repair ${file.name}:`, e);
          }
        })();
      })
      .filter(Boolean) as Promise<void>[];

    if (repairJobs.length > 0) {
      await Promise.all(repairJobs);
    }

    // ── DONE ──────────────────────────────────────────────────────────────────
    sse(res, { type: "done", code: fixedCode, plan: cleanPlan, blueprint, projectBlueprint, sectionOrder: blueprint.sectionOrder, files: projectFiles });

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

export default router;
