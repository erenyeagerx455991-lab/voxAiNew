import { Router } from "express";

const router: Router = Router();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const PLANNER_MODEL = "llama-3.1-8b-instant";
const DESIGN_MODEL = "google/gemini-flash-1.5-8b";
const CODEGEN_MODEL = "deepseek/deepseek-chat";
const CODEFIX_MODEL = "llama-3.3-70b-versatile";

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

const PLANNER_SYSTEM = `You are a Planner Agent for an AI website builder. Analyze the user's request and produce TWO things:

PART 1 — PLAN (visible to user):
Format with these exact emoji headers:
✅ Plan (Checklist)
Write 4-7 TECHNICAL BUILD STEPS. Each must name a real component, library, or UI feature (e.g. "Build Hero section with animated gradient headline", "Create sticky Navbar with hamburger menu").

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

function buildCodeSystem(design: any) {
  return `You are a Code Generation Agent. Generate a COMPLETE, PRODUCTION-READY React + Tailwind website.

DESIGN TOKENS (follow these exactly):
- Theme: ${design.theme}
- Background: ${design.bgColor} with gradient: ${design.bgGradient}
- Primary: ${design.primaryColor}, Secondary: ${design.secondaryColor}, Accent: ${design.accentColor}
- Heading gradient: ${design.headingGradient}
- Button: ${design.buttonStyle} with ${design.buttonColors}
- Card style: ${design.cardStyle}
- Mood: ${design.mood}
- Layout: ${design.layoutStyle}

MANDATORY LAYOUT RULES:
1. Hero: "min-h-screen flex flex-col items-center justify-center text-center px-6" — centered, badge pill above heading, stats row below CTA
2. Features: "grid grid-cols-1 md:grid-cols-3 gap-6" — NEVER single column
3. Testimonials/Social Proof: "grid grid-cols-1 md:grid-cols-3 gap-6"
4. Pricing (if any): "grid grid-cols-1 md:grid-cols-3 gap-6", middle card uses scale-105
5. Footer: "grid grid-cols-2 md:grid-cols-4 gap-8"
6. Section headings: use heading gradient with bg-clip-text text-transparent
7. All sections: "py-24" vertical padding
8. Card text on dark: titles "text-white font-semibold text-lg", desc "text-gray-300 text-sm"

ABSOLUTE TECHNICAL RULES (breaking these crashes the preview):
1. NO import statements. NO require(). React and all hooks are already global.
2. NO export statements. Do NOT write "export default" or "export function".
3. NO TypeScript types or interfaces.
4. NO JSX fragments (<> </>). Always use a wrapper div.
5. Use React.useState, React.useEffect (always namespace with React.)
6. ONLY Tailwind CSS classes — no style={} objects.
7. Function must be named exactly: function App()
8. NO emoji as decorative icons — use CSS shapes or unicode characters.

CODE STRUCTURE — required pattern:
function Navbar() { return (<nav>...</nav>); }
function Hero() { return (<section>...</section>); }
function Features() { const items = [...]; return (<section>...</section>); }
function SocialProof() { return (<section>...</section>); }
function CtaBanner() { return (<section>...</section>); }
function Footer() { return (<footer>...</footer>); }
function App() { return (<div><Navbar/><Hero/><Features/><SocialProof/><CtaBanner/><Footer/></div>); }

REQUIRED SECTIONS (all 6 must be present):
1. Navbar — sticky, backdrop-blur, logo left, links right
2. Hero — badge pill, large gradient heading, subheading, 2 CTA buttons, stats row
3. Features — 3-col card grid with .map() over data array
4. SocialProof — testimonials or stats using .map()
5. CtaBanner — gradient bg, bold headline, one button
6. Footer — 4-col grid with links, copyright bar

Use .map() for all repeated elements. Keep each function under 40 lines.
OUTPUT: Raw JSX only. No markdown. Start with "function Navbar()".`;
}

const CODEFIX_SYSTEM = `You are a Code Fix Agent. You receive React/JSX code and MUST:

1. Check and fix these CRITICAL issues:
   - Remove any import/export statements (they break the preview)
   - Remove any TypeScript types or interfaces
   - Remove any JSX fragments (<> </>) — replace with wrapper divs
   - Ensure function is named exactly "function App()"
   - Ensure all React hooks use React.useState, React.useEffect (namespaced)
   - Ensure no inline style objects (style={{}}) — convert to Tailwind classes
   - Fix any syntax errors or unclosed JSX tags

2. Improve quality:
   - Ensure all 6 sections exist: Navbar, Hero, Features, SocialProof, CtaBanner, Footer
   - If any section is missing, add a basic version
   - Ensure Features and SocialProof use "grid grid-cols-1 md:grid-cols-3 gap-6"
   - Add hover effects on all interactive elements if missing

3. Return ONLY the corrected raw JSX code. No markdown, no explanation.
   Start with "function Navbar()".`;

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
      true, 2000,
      (token) => {
        planText += token;
        // Only stream tokens before the design brief separator
        if (!planText.includes("---DESIGN_BRIEF---")) {
          sse(res, { type: "token", token });
        }
      }
    );

    // Extract design brief from plan text
    let briefText = "";
    const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
    if (briefMatch) briefText = briefMatch[1].trim();
    const cleanPlan = planText.replace(/---DESIGN_BRIEF---[\s\S]*?---END_BRIEF---/, "").trim();

    sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "done" });

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
          { role: "user", content: `Website brief:\n${briefText || prompt}\n\nGenerate design decisions JSON.` },
        ],
        1000
      );
      const jsonMatch = designRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) design = { ...design, ...JSON.parse(jsonMatch[0]) };
    } catch (e) {
      console.error("Design agent error (using defaults):", e);
    }

    sse(res, { type: "step", step: 1, agent: "Design Agent", status: "done", design });

    // ── AGENT 3: CODE GENERATION ──────────────────────────────────────────────
    sse(res, { type: "step", step: 2, agent: "Code Generation Agent", status: "active" });

    let generatedCode = "";
    try {
      generatedCode = await callOpenRouter(openrouterKey, CODEGEN_MODEL,
        [
          { role: "system", content: buildCodeSystem(design) },
          { role: "user", content: `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}\n\nInclude ALL 6 sections: Navbar, Hero, Features, SocialProof, CtaBanner, Footer. Do not truncate.` },
        ],
        8000
      );
    } catch (e) {
      console.error("OpenRouter codegen failed, falling back to Groq:", e);
      generatedCode = await callGroq(groqKey, "llama-3.3-70b-versatile",
        [
          { role: "system", content: buildCodeSystem(design) },
          { role: "user", content: `Build a complete landing page for: ${prompt}. Include ALL 6 sections. Do not truncate.` },
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
          { role: "user", content: `Fix and improve this React website code:\n\n${generatedCode}` },
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
    sse(res, { type: "done", code: fixedCode, plan: cleanPlan });

  } catch (err: any) {
    sse(res, { type: "error", error: err?.message ?? "Multi-agent pipeline failed" });
  }

  res.end();
});

export default router;
