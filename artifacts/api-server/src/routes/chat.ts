import { Router } from "express";

const router: Router = Router();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const PLAN_MODEL = "llama-3.1-8b-instant";   // fast + token-light for plan text
const CODE_MODEL = "llama-3.3-70b-versatile"; // powerful for code generation

function parseGroqError(raw: string): string {
  try {
    const outer = JSON.parse(raw);
    const msg: string = outer?.error?.message ?? outer?.error ?? raw;
    if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("rate_limit")) {
      return "Rate limit reached — please wait a minute and try again.";
    }
    return msg;
  } catch {
    return "AI service error. Please try again.";
  }
}

const PLAN_SYSTEM = `You are an AI website builder assistant. Carefully analyse the user's request and generate a FULLY TAILORED, UNIQUE response every time.

CRITICAL RULES:
- NEVER use a fixed template. Every response must reflect the specific website requested.
- Match response depth to request complexity:
    • Simple (portfolio, personal blog, landing page) → 3-4 checklist items, 2 pages, 1-sentence summary
    • Medium (business site, restaurant, agency) → 5-6 checklist items, 3-4 pages, 2-sentence summary
    • Complex (SaaS, e-commerce, platform, marketplace) → 7-8 checklist items, 4-5 pages, 3-sentence summary
- Use the ACTUAL business name, product, or industry from the request in all content.
- Page names and section content must be specific to this exact website type.

RESPONSE FORMAT — use these exact emoji headers in this order:

✅ Plan (Checklist)
Write TECHNICAL BUILD STEPS only — exactly as a developer would write tasks in a project tracker.
STRICT RULES for each bullet:
- Always name the ACTUAL library, tool, page, component, or feature being built/installed
- NEVER write generic steps like "Define the purpose", "Design the interface", "Plan the layout", "Set up project", or "Test the website"
- Every step must mention something specific: a real component name, a real library, or a real UI feature
- Good examples:
  • "Build Hero section with animated gradient headline and dual CTA buttons"
  • "Create sticky Navbar with mobile hamburger menu using React state"
  • "Install framer-motion and add scroll-triggered fade-in animations"
  • "Build Pricing section with 3-tier card grid and toggle for monthly/yearly"
  • "Create Contact form with name, email, message fields and submit handler"
  • "Build Product grid with filter sidebar and sort dropdown"
- Bad examples (NEVER write these): "Define website goals", "Plan navigation structure", "Ensure mobile responsiveness", "Review design"
- Step count based on complexity: simple site = 3-4 steps, medium = 5-6 steps, complex = 7-8 steps

📋 Project Summary
Describe what is being built, who it targets, and the visual direction — tailored to this request.

📄 Pages Details
List ONLY the pages relevant to this website. For each page, list 3-4 specific sections.
Format each page as:
[N]. [Specific Page Name]
   • [Specific section relevant to this page]
   • [Another relevant section]
   • [Another relevant section]

Examples of page choices:
- Restaurant → Home, Menu, Reservations, About / Chef
- Portfolio → Home, Work / Projects, About, Contact
- SaaS → Landing, Features, Pricing, Docs / FAQ, Contact
- E-commerce → Home, Shop / Products, Product Detail, Cart / Checkout, Account
- Real estate → Listings, Property Detail, About Agent, Contact
- Fitness / gym → Home, Classes / Programs, Trainers, Membership, Contact

⚙️ Technical Details
• Tech Stack: React 18 + Tailwind CSS
• [Add 2-3 technical details specific to this website's needs, e.g. filtering for e-commerce, booking form for restaurants, animation for portfolios]
• Responsive: Optimised for mobile, tablet, and desktop

Respond ONLY in this format. No preamble, no extra commentary, no greetings.`;

const CODE_SYSTEM = `You are an expert UI/UX developer. Generate PREMIUM, PRODUCTION-READY websites.

DESIGN RULES — STRICTLY FOLLOW:
- Use sophisticated color palettes (no plain blue/red/green)
- Dark themes: use #0a0a0a, #111, #1a1a2e type backgrounds
- Light themes: use subtle gradients, not plain white
- Typography: large bold headings, proper hierarchy
- Use glassmorphism, subtle gradients, backdrop blur effects
- Buttons: gradient backgrounds, rounded-full, hover effects
- Add micro-animations and smooth transitions
- NO orange+green button combinations
- Cards: glass effect with border and shadow
- Spacing: generous padding, breathing room

STRICT RULE 1 — HERO SECTION:
- Must use min-h-screen with flex items-center justify-center so content is vertically centered
- Must have a large gradient background (e.g. bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0d0d1a])
- Must include a badge/pill element ABOVE the main heading (e.g. a small rounded-full span with border and subtle bg)
- Must include a stats row BELOW the CTA buttons (3 stats side by side, e.g. "10k+ Users · 99.9% Uptime · 4.9★ Rating")
- No empty/blank space anywhere — fill the viewport with content

STRICT RULE 2 — NO EMOJI AS ICONS:
- NEVER use emoji (🚀 ⚡ 🎨 ✅ etc.) as decorative icons inside cards, feature grids, or section headers
- Use only: CSS-based shapes (div with border-radius, gradients), unicode arrow/symbol characters styled with Tailwind (→ ↗ ◆ ▸), or simple bold text labels
- Emoji are allowed ONLY in stats rows or testimonials where they represent actual content (e.g. star ratings)

STRICT LAYOUT RULES — every rule below is MANDATORY, no exceptions:

Rule 1 — HERO: Always use "min-h-screen flex flex-col items-center justify-center text-center px-6" on the hero section. Content must appear in the MIDDLE of the screen — no top-heavy or bottom-heavy layouts. The main heading must use "text-5xl md:text-7xl font-black".

Rule 2 — FEATURES GRID: Always use "grid grid-cols-1 md:grid-cols-3 gap-6" for features. NEVER stack features in a single vertical column.

Rule 3 — FEATURE CARDS: Every feature card must use exactly these classes: "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300"

Rule 4 — TESTIMONIALS: Always display testimonials in "grid grid-cols-1 md:grid-cols-3 gap-6". Never stack them vertically.

Rule 5 — CTA SECTION: Always use a gradient background: "bg-gradient-to-r from-purple-600 to-blue-600". Never use a flat plain color.

Rule 6 — PRICING (if included): Use "grid grid-cols-1 md:grid-cols-3 gap-6". The middle/recommended card must use "border-purple-500 scale-105" to stand out.

Rule 7 — FOOTER: Always use "grid grid-cols-2 md:grid-cols-4 gap-8" for footer columns. Never a single column.

Rule 8 — SECTION HEADINGS: Every section heading must use "text-3xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent". Never plain text color for headings.

Rule 9 — SECTION SPACING: Every section must use "py-24" as its vertical padding. Never use py-8 or less.

Rule 10 — CARD TEXT VISIBILITY: All card text must be clearly readable on dark backgrounds.
- Card titles: always "text-white font-semibold text-lg"
- Card descriptions: always "text-gray-300 text-sm"
- NEVER use text-gray-600, text-gray-700, text-gray-800, or any shade darker than text-gray-400 on dark backgrounds

CODE RULES:
- Use Tailwind CSS classes only
- Every component must look like a $10,000 website
- Take inspiration from Stripe, Linear, Vercel designs
- Mobile-first responsive design
- Add hover states on all interactive elements

ABSOLUTE TECHNICAL RULES — violating any of these will break the preview:
1. NO import statements. NO require(). React, ReactDOM, and all hooks are already global.
2. NO export statements of any kind. Do NOT write "export default App" or "export function App".
3. NO TypeScript types or interfaces.
4. NO JSX fragments (<> </>). Always use a wrapper div.
5. Use React.useState, React.useEffect etc. (always namespace with React.)
6. Use ONLY Tailwind CSS utility classes — no inline style objects.
7. All text content must be hardcoded and specific to the user's request.
8. The component MUST be named exactly: function App()

CODE STRUCTURE — use this exact pattern to avoid premature JSX closure:
Write each section as its own named function, then compose them in App().
This is REQUIRED — do not put everything inside one giant return statement.

Example skeleton (fill in real content):
function Navbar() {
  return (<nav className="...">...</nav>);
}
function Hero() {
  return (<section className="...">...</section>);
}
function Features() {
  const items = [{icon:'...', title:'...', desc:'...'},...];
  return (<section className="...">...</section>);
}
function SocialProof() {
  return (<section className="...">...</section>);
}
function CtaBanner() {
  return (<section className="...">...</section>);
}
function Footer() {
  return (<footer className="...">...</footer>);
}
function App() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <SocialProof />
      <CtaBanner />
      <Footer />
    </div>
  );
}

REQUIRED SECTIONS — all six MUST be present:
1. Navbar — sticky, logo text left, nav links right, backdrop-blur bg
2. Hero — min-h-screen, gradient headline, subheadline, 2 CTA buttons
3. Features — 3-column card grid using .map() over a data array
4. SocialProof — stats row OR 2-3 testimonial cards using .map()
5. CtaBanner — gradient bg, headline, one button
6. Footer — columns with links, bottom copyright bar

EFFICIENCY — use .map() for all repeated elements; keep each function under 35 lines.

OUTPUT FORMAT: Return ONLY the raw JS/JSX code. No markdown fences, no explanations. Start with "function Navbar()".`;

// POST /api/chat/stream  — streams the plan text as SSE
router.post("/chat/stream", async (req, res) => {
  const apiKey = process.env["GROQ_API_KEY"];
  const { prompt } = req.body as { prompt: string };

  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PLAN_MODEL,
        stream: true,
        messages: [
          { role: "system", content: PLAN_SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      res.write(`data: ${JSON.stringify({ error: parseGroqError(errText) })}\n\n`);
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw = decoder.decode(value, { stream: true });
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") {
          res.write("data: [DONE]\n\n");
          continue;
        }
        try {
          const json = JSON.parse(payload);
          const token: string = json.choices?.[0]?.delta?.content ?? "";
          if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
        } catch {
          // skip malformed chunks
        }
      }
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "Stream connection failed. Please try again." })}\n\n`);
  }

  res.end();
});

// POST /api/chat/code  — generates React+Tailwind component code
router.post("/chat/code", async (req, res) => {
  const apiKey = process.env["GROQ_API_KEY"];
  const { prompt } = req.body as { prompt: string };

  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CODE_MODEL,
        stream: false,
        max_tokens: 8000,
        messages: [
          { role: "system", content: CODE_SYSTEM },
          { role: "user", content: `Build a complete landing page for: ${prompt}. Include ALL sections: navbar, hero, features grid, social proof, CTA banner, and footer. Do not truncate or stop early.` },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(500).json({ error: parseGroqError(errText) });
    }

    const data = (await upstream.json()) as {
      choices: Array<{ message: { content: string }; finish_reason: string }>;
    };
    let code = data.choices?.[0]?.message?.content ?? "";
    const finishReason = data.choices?.[0]?.finish_reason ?? "unknown";

    console.log(`[code] finish_reason=${finishReason} chars=${code.length}`);

    // Strip any markdown code fences the model might add
    code = code
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    res.json({ code, finishReason });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
