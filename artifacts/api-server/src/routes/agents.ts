import { Router } from "express";
import { selectTemplatesForPrompt, buildContextFromTemplates } from "../components/registry";

const router: Router = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PLANNER_MODEL = "llama-3.1-8b-instant";
const DESIGN_MODEL = "google/gemini-flash-1.5-8b";
const CODEGEN_MODEL = "deepseek/deepseek-chat";
const CODEFIX_MODEL = "llama-3.3-70b-versatile";

interface PageBlueprint {
  websiteType: string;
  sectionOrder: string[];
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
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenRouter error: ${txt}`);
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

const DESIGN_SYSTEM = `You are a Design Agent. Given a website brief, output ONLY a JSON object with design decisions.

Output EXACTLY this JSON structure (no markdown, no explanation):
{
  "theme": "dark" or "light",
  "primaryColor": "#hexcode",
  "secondaryColor": "#hexcode", 
  "accentColor": "#hexcode",
  "bgColor": "#hexcode",
  "bgGradient": "tailwind gradient class e.g. from-[#0a0a0a] via-[#1a1a2e] to-[#0d0d1a]",
  "fontStyle": "modern" or "serif" or "playful" or "minimal",
  "layoutStyle": "glassmorphism" or "neumorphism" or "flat-minimal" or "bold-editorial",
  "headingGradient": "tailwind gradient e.g. from-purple-400 via-pink-400 to-blue-400",
  "buttonStyle": "gradient rounded-full" or "solid rounded-lg" or "outline rounded-full",
  "buttonColors": "tailwind classes e.g. bg-gradient-to-r from-purple-600 to-blue-600",
  "cardStyle": "glassmorphism bg-white/5 backdrop-blur-sm border border-white/10" or "solid bg-gray-800 border border-gray-700",
  "mood": "one word e.g. Innovative, Elegant, Vibrant, Calm, Bold"
}

Rules:
- Dark theme: use deep backgrounds like #0a0a0a, #0f0f1a, #111827
- Light theme: use subtle tints like #fafafa, #f8f6ff, #f0fdf4
- Colors must match the website type and audience
- No generic blue+green combos; be creative`;

function buildCodeSystem(design: any, blueprint: PageBlueprint, componentContext?: string) {
  const sectionList = blueprint.sectionOrder.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const functionNames = blueprint.sectionOrder.map(s => `${s}()`).join(', ');
  const appReturn = blueprint.sectionOrder.map(s => `<${s}/>`).join('');
  const componentSection = componentContext
    ? `\n\nCOMPONENT LIBRARY TEMPLATES (use as structural reference — adapt content, colors, and copy for this specific site):\n${componentContext}\n`
    : '';

  return `You are a Code Generation Agent. Generate a COMPLETE, PRODUCTION-READY React + Tailwind website.${componentSection}

DESIGN TOKENS (follow these exactly):
- Theme: ${design.theme}
- Background: ${design.bgColor} with gradient: ${design.bgGradient}
- Primary: ${design.primaryColor}, Secondary: ${design.secondaryColor}, Accent: ${design.accentColor}
- Heading gradient: ${design.headingGradient}
- Button: ${design.buttonStyle} with ${design.buttonColors}
- Card style: ${design.cardStyle}
- Mood: ${design.mood}
- Layout: ${design.layoutStyle}

PAGE BLUEPRINT — build EXACTLY these sections in this exact order:
${sectionList}

Do NOT add sections not in this list. Do NOT rearrange the order.
Each section must be a separate named function matching the section name exactly.

LAYOUT RULES (apply per section type):
- Hero: "min-h-screen flex flex-col items-center justify-center text-center px-6" — centered, badge above heading, stats row below CTA
- Features / FeaturesBento: grid layout — NEVER single column on desktop
- Testimonials: "grid grid-cols-1 md:grid-cols-3 gap-6"
- Pricing: "grid grid-cols-1 md:grid-cols-3 gap-6", middle card uses scale-105
- Footer: "grid grid-cols-2 md:grid-cols-4 gap-8"
- All sections: "py-24" vertical padding
- Section headings: use heading gradient with bg-clip-text text-transparent

ABSOLUTE TECHNICAL RULES (breaking these crashes the preview):
1. NO import statements. NO require(). React and all hooks are already global.
2. NO export statements. Do NOT write "export default" or "export function".
3. NO TypeScript types or interfaces.
4. NO JSX fragments (<> </>). Always use a wrapper div.
5. Use React.useState, React.useEffect (always namespace with React.)
6. ONLY Tailwind CSS classes — no style={} objects except for WebkitTextStroke.
7. Each section function must be named EXACTLY as listed in the blueprint above.
8. NO emoji as decorative icons — use CSS shapes, unicode characters, or text symbols.

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
   - Add hover effects on interactive elements if missing

3. Return ONLY the corrected raw JSX code. No markdown, no explanation.
   Start with the first section function (not App).`;

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
        // Only stream tokens before the design brief separator
        if (!planText.includes("---DESIGN_BRIEF---")) {
          sse(res, { type: "token", token });
        }
      }
    );

    // Extract design brief
    let briefText = "";
    const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
    if (briefMatch) briefText = briefMatch[1].trim();
    const cleanPlan = planText.replace(/---DESIGN_BRIEF---[\s\S]*?---END_BRIEF---/, "")
                               .replace(/---PAGE_BLUEPRINT---[\s\S]*?---END_BLUEPRINT---/, "")
                               .trim();

    // Extract page blueprint
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
    sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "done", blueprint });

    // ── AGENT 2: DESIGN ───────────────────────────────────────────────────────
    sse(res, { type: "step", step: 1, agent: "Design Agent", status: "active" });

    let design: any = {
      theme: "dark",
      primaryColor: "#7c3aed",
      secondaryColor: "#3b82f6",
      accentColor: "#a855f7",
      bgColor: "#0a0a0a",
      bgGradient: "from-[#0a0a0a] via-[#1a1a2e] to-[#0d0d1a]",
      headingGradient: "from-purple-400 via-pink-400 to-blue-400",
      buttonStyle: "gradient rounded-full",
      buttonColors: "bg-gradient-to-r from-purple-600 to-blue-600",
      cardStyle: "glassmorphism bg-white/5 backdrop-blur-sm border border-white/10",
      mood: "Innovative",
      layoutStyle: "glassmorphism",
      fontStyle: "modern",
    };

    try {
      const designRaw = await callOpenRouter(openrouterKey, DESIGN_MODEL,
        [
          { role: "system", content: DESIGN_SYSTEM },
          { role: "user", content: `Website brief:\n${briefText || prompt}\nWebsite type: ${blueprint.websiteType}\n\nGenerate design decisions JSON.` },
        ],
        1000
      );
      const jsonMatch = designRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) design = { ...design, ...JSON.parse(jsonMatch[0]) };
    } catch (e) {
      console.error("Design agent error (using defaults):", e);
    }

    sse(res, { type: "step", step: 1, agent: "Design Agent", status: "done", design });

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
          { role: "user", content: `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}\n\nBUILD EXACTLY ${sectionCount} SECTIONS in this order: ${blueprint.sectionOrder.join(' → ')}. Use component templates as structural reference — replace ALL placeholder text with real, specific content for this site. Do not truncate.` },
        ],
        8000
      );
    } catch (e) {
      console.error("OpenRouter codegen failed, falling back to Groq:", e);
      generatedCode = await callGroq(groqKey, "llama-3.3-70b-versatile",
        [
          { role: "system", content: buildCodeSystem(design, blueprint, componentContext) },
          { role: "user", content: `Build a complete landing page for: ${prompt}. Build EXACTLY ${sectionCount} sections in order: ${blueprint.sectionOrder.join(' → ')}. Do not truncate.` },
        ],
        false, 8000
      );
    }

    // Strip markdown fences if present
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

export default router;
