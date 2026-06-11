import { Router } from "express";

const router: Router = Router();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

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

const CODE_SYSTEM = `You are an expert React and Tailwind CSS developer. Generate a complete landing page component that runs in a browser sandbox with React 18 and Tailwind CSS available as globals.

ABSOLUTE RULES — violating any of these will break the preview:
1. NO import statements. NO require(). React, ReactDOM, and all hooks are already global.
2. NO export statements of any kind. Do NOT write "export default App" or "export function App".
3. NO TypeScript types or interfaces.
4. NO JSX fragments (<> </>). Always use a <div> wrapper.
5. Use React.useState, React.useEffect etc. (namespace them with React.)
6. Use ONLY Tailwind CSS utility classes for styling.
7. All text content must be hardcoded strings based on the user's prompt.
8. The component MUST be named exactly: function App()

REQUIRED STRUCTURE — include all of these sections:
- Sticky top navigation bar with logo and nav links
- Full-width hero section with bold headline, subheadline, and CTA buttons
- Features/services section with a 3-column grid
- Testimonials or stats section
- Call-to-action banner
- Footer with links

Make it visually impressive with great colors, spacing, and typography.
Use emoji as icons where appropriate.
Fully responsive using Tailwind md: and lg: prefixes.

OUTPUT FORMAT: Return ONLY the raw function code. Absolutely no markdown code fences, no comments about the code, no explanations. The very first character of your response must be the letter 'f' (start of "function App()").`;

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
        model: MODEL,
        stream: true,
        messages: [
          { role: "system", content: PLAN_SYSTEM },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const err = await upstream.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
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
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
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
        model: MODEL,
        stream: false,
        max_tokens: 4096,
        messages: [
          { role: "system", content: CODE_SYSTEM },
          { role: "user", content: `Build a landing page for: ${prompt}` },
        ],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(500).json({ error: err });
    }

    const data = (await upstream.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    let code = data.choices?.[0]?.message?.content ?? "";

    // Strip any markdown code fences the model might add
    code = code
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
