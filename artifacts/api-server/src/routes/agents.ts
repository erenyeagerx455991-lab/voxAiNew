import { Router } from "express";
import { selectTemplatesForPrompt, buildContextFromTemplates } from "../components/registry";

const router: Router = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PLANNER_MODEL = "llama-3.1-8b-instant";
const DESIGN_MODEL = "google/gemini-2.5-flash-lite";
const CODEGEN_MODEL = "deepseek/deepseek-chat";
const CODEFIX_MODEL = "llama-3.3-70b-versatile";

interface PageBlueprint {
  websiteType: string;
  sectionOrder: string[];
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
referenceSites: [comma-separated list of any mentioned design references e.g. "Linear, Stripe" — or "none" if not mentioned]
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

Respond ONLY in this format. No preamble.`;

const DESIGN_SYSTEM = `You are a Design Agent. Your job is to detect the visual DNA from the website brief and reference sites, then output a precise design system as JSON.

REFERENCE SITE DNA LIBRARY — when a reference is detected, apply its design DNA exactly:

Linear → { designLanguage: "minimal-flat", theme: dark, bg: #0F0F0F, surface: #1A1A1A, primary: #5E6AD2, accent: #5E6AD2, text: #FFFFFF, textMuted: #8A8A8A, border: #2A2A2A, headingWeight: font-black, headingTracking: tracking-tight, scale: lg, cardStyle: flat-bordered, heroStyle: centered-minimal, animationPersonality: subtle, decorationLevel: none, visualDensity: dense, buttonStyle: rounded-md, mood: Focused }

Stripe → { designLanguage: "premium-gradient", theme: dark, bg: #0A2540, surface: #0F3460, primary: #635BFF, accent: #00D4FF, text: #FFFFFF, textMuted: #A8B4C0, border: rgba(255,255,255,0.1), headingWeight: font-bold, headingTracking: tracking-tight, scale: xl, cardStyle: gradient-border, heroStyle: centered-gradient, animationPersonality: expressive, decorationLevel: rich, visualDensity: balanced, buttonStyle: rounded-full, mood: Premium }

Vercel → { designLanguage: "monochrome", theme: dark, bg: #000000, surface: #111111, primary: #FFFFFF, accent: #FFFFFF, text: #FFFFFF, textMuted: #888888, border: #333333, headingWeight: font-black, headingTracking: tracking-tighter, scale: xl, cardStyle: flat-bordered, heroStyle: centered-minimal, animationPersonality: subtle, decorationLevel: none, visualDensity: balanced, buttonStyle: rounded-lg, mood: Sharp }

Notion → { designLanguage: "editorial", theme: light, bg: #FFFFFF, surface: #F7F6F3, primary: #37352F, accent: #2F80ED, text: #37352F, textMuted: #9B9B9B, border: #E9E9E7, headingWeight: font-bold, headingTracking: tracking-normal, scale: md, cardStyle: outline-hover, heroStyle: editorial-large, animationPersonality: none, decorationLevel: minimal, visualDensity: comfortable, buttonStyle: rounded-md, mood: Editorial }

Framer → { designLanguage: "bold-motion", theme: dark, bg: #0B0B0B, surface: #141414, primary: #FF3D57, accent: #FF6B35, text: #FFFFFF, textMuted: #666666, border: #222222, headingWeight: font-black, headingTracking: tracking-tighter, scale: xl, cardStyle: flat-bordered, heroStyle: editorial-large, animationPersonality: expressive, decorationLevel: moderate, visualDensity: balanced, buttonStyle: rounded-none, mood: Dramatic }

Cursor → { designLanguage: "dev-minimal", theme: dark, bg: #0D0D0D, surface: #161616, primary: #00FF9D, accent: #00FF9D, text: #FFFFFF, textMuted: #555555, border: #252525, headingWeight: font-bold, headingTracking: tracking-tight, scale: lg, cardStyle: flat-bordered, heroStyle: centered-minimal, animationPersonality: subtle, decorationLevel: none, visualDensity: dense, buttonStyle: rounded-sm, mood: Terminal }

Perplexity → { designLanguage: "academic-clean", theme: dark, bg: #1C1C1E, surface: #2C2C2E, primary: #FF6600, accent: #FF6600, text: #FFFFFF, textMuted: #8E8E93, border: #3A3A3C, headingWeight: font-semibold, headingTracking: tracking-normal, scale: md, cardStyle: solid-surface, heroStyle: centered-minimal, animationPersonality: subtle, decorationLevel: none, visualDensity: dense, buttonStyle: rounded-lg, mood: Informative }

INSTRUCTIONS:
1. Scan the brief for any reference site names (Linear, Stripe, Vercel, Notion, Framer, Cursor, Perplexity, etc.)
2. If a reference is found, use its DNA as the foundation — then adapt colors/content for the specific business
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

function buildCodeSystem(design: DesignDNA, blueprint: PageBlueprint, componentContext?: string) {
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
- All section headings: use heading gradient with bg-clip-text text-transparent

ABSOLUTE TECHNICAL RULES (breaking these crashes the preview):
1. NO import statements. NO require(). React and all hooks are already global.
2. NO export statements. Do NOT write "export default" or "export function".
3. NO TypeScript types or interfaces.
4. NO JSX fragments (<> </>). Always use a wrapper div.
5. Use React.useState, React.useEffect (always namespace with React.)
6. ONLY Tailwind CSS classes — no style={} objects except for WebkitTextStroke.
7. Each section function must be named EXACTLY as listed in the blueprint above.
8. NO emoji as decorative icons — use CSS shapes, unicode characters (◆ ▸ ◈ ◉ ◐ ✦ ⬡), or text symbols.
9. Use bg-[#hexcode] syntax for custom colors from the design DNA above.

CODE STRUCTURE — required pattern:
[one function per section in blueprint order]
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
    console.log(`[Design] referenceSites="${referenceSites}"`);
    sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "done", blueprint });

    // ── AGENT 2: DESIGN DNA ───────────────────────────────────────────────────
    sse(res, { type: "step", step: 1, agent: "Design Agent", status: "active" });

    // Known reference sites and their DNA verification rules
    const REFERENCE_VERIFIERS: Record<string, (d: DesignDNA) => boolean> = {
      stripe:     (d) => d.designLanguage !== "monochrome" && d.colorSystem.background !== "#0a0a0a" && d.colorSystem.primary !== "#ffffff",
      linear:     (d) => d.colorSystem.primary !== "#ffffff" && d.colorSystem.primary !== "#e5e5e5",
      vercel:     (_) => true, // Vercel IS monochrome — always passes
      notion:     (d) => d.colorSystem.theme === "light" || d.theme === "light",
      framer:     (d) => d.designLanguage !== "monochrome" && d.animationPersonality !== "subtle",
      cursor:     (d) => d.colorSystem.primary !== "#ffffff",
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

    async function runDesignAgent(attempt: number): Promise<{ raw: string; parsed: DesignDNA | null; error: string | null }> {
      try {
        const raw = await callOpenRouter(openrouterKey, DESIGN_MODEL,
          [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: designPrompt }],
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

        // Retry with a more explicit, stripped-down prompt
        const retryUserPrompt = [
          `IMPORTANT: The user explicitly wants a design SIMILAR TO ${referenceSites.toUpperCase()}.`,
          `You MUST apply the ${referenceSites} DNA from the reference library — do NOT output generic monochrome defaults.`,
          `\n${designPrompt}`,
        ].join('\n');

        const attempt2 = await runDesignAgent(2);
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
    sse(res, { type: "step", step: 1, agent: "Design Agent", status: "done", design, designAgentStatus, designAgentError });

    // ── COMPONENT LIBRARY SELECTION ───────────────────────────────────────────
    const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder);
    const componentContext = buildContextFromTemplates(selectedTemplates);
    console.log(`[ComponentLib] Selected ${selectedTemplates.length} templates: ${selectedTemplates.map(t => t.id).join(', ')}`);

    // ── AGENT 3: CODE GENERATION ──────────────────────────────────────────────
    sse(res, { type: "step", step: 2, agent: "Code Generation Agent", status: "active" });

    const sectionCount = blueprint.sectionOrder.length;
    let generatedCode = "";
    try {
      generatedCode = await callOpenRouter(openrouterKey, CODEGEN_MODEL,
        [
          { role: "system", content: buildCodeSystem(design, blueprint, componentContext) },
          { role: "user", content: `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}\n\nBUILD EXACTLY ${sectionCount} SECTIONS in this order: ${blueprint.sectionOrder.join(' → ')}. Use component templates as structural reference — replace ALL placeholder text with real, specific content for this site. Apply the design DNA precisely. Do not truncate.` },
        ],
        8000
      );
    } catch (e) {
      console.error("OpenRouter codegen failed, falling back to Groq:", e);
      generatedCode = await callGroq(groqKey, "llama-3.3-70b-versatile",
        [
          { role: "system", content: buildCodeSystem(design, blueprint, componentContext) },
          { role: "user", content: `Build a complete landing page for: ${prompt}. Build EXACTLY ${sectionCount} sections in order: ${blueprint.sectionOrder.join(' → ')}. Apply the design DNA precisely. Do not truncate.` },
        ],
        false, 8000
      );
    }

    generatedCode = generatedCode
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    sse(res, { type: "step", step: 2, agent: "Code Generation Agent", status: "done" });

    // ── AGENT 4: CODE FIX ─────────────────────────────────────────────────────
    sse(res, { type: "step", step: 3, agent: "Code Fix Agent", status: "active" });

    let fixedCode = generatedCode;
    try {
      const fixed = await callGroq(groqKey, CODEFIX_MODEL,
        [
          { role: "system", content: CODEFIX_SYSTEM },
          { role: "user", content: `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}` },
        ],
        false, 8000
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

    sse(res, { type: "step", step: 3, agent: "Code Fix Agent", status: "done" });

    // ── DONE ──────────────────────────────────────────────────────────────────
    sse(res, { type: "done", code: fixedCode, plan: cleanPlan, blueprint });

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
    const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
    let blueprint: PageBlueprint = { websiteType: "Generic", sectionOrder: ["Navbar", "Hero", "Features", "CTA", "Footer"] };
    if (blueprintMatch) {
      try { blueprint = JSON.parse(blueprintMatch[1].trim()); } catch {}
    }
    audit.plannerOutput.brief = briefText;
    audit.plannerOutput.referenceSites = referenceSites;
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
    const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder);
    const componentContext = buildContextFromTemplates(selectedTemplates);
    const codeGenSystemPrompt = buildCodeSystem(finalDNA, blueprint, componentContext);

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
