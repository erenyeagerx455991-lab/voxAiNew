import { Router } from "express";

const router: Router = Router();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const PLAN_SYSTEM = `You are an AI website builder assistant. When the user describes a website, respond with EXACTLY this structured format using these exact emoji headers:

✅ Plan (Checklist)

• List 6-8 concrete build steps tailored to the request

📋 Project Summary

Write 2-3 sentences describing what is being built, who it targets, and the overall design direction.

📄 Pages Details

1. Home Page
   • Hero section — bold headline, subheadline, and primary CTA button
   • Features grid — 3 key benefits with descriptions
   • Social proof — testimonials or trust indicators
   • Call-to-action section

2. About Page
   • Company story and mission statement
   • Team member showcase with roles
   • Core values and principles
   • Achievements or milestones

3. Services / Products Page
   • Service or product cards with descriptions and pricing
   • Feature comparison or highlights
   • FAQ accordion section
   • CTA to get started

4. Contact Page
   • Contact form (name, email, message fields)
   • Business location and hours
   • Social media links
   • Direct email or phone contact

⚙️ Technical Details

• Tech Stack: React 18 + Tailwind CSS
• Components: Functional components with React hooks
• Styling: Tailwind CSS utility classes (mobile-first)
• Responsive: Optimised for mobile, tablet, and desktop
• Typography: Clean readable font stack with hierarchy
• State: React useState for interactive elements

Respond ONLY in this exact format. No preamble, no extra commentary.`;

const CODE_SYSTEM = `You are an expert React and Tailwind CSS developer. Generate a complete, impressive landing page component.

STRICT RULES:
- Write a function named App() 
- End the file with exactly: export default App
- NO import or require statements anywhere
- NO JSX fragments (<> </>), use a <div> wrapper instead
- Use ONLY Tailwind CSS classes for all styling
- All content is hardcoded based on the user's description
- Make it visually stunning: good colors, spacing, typography
- Include: sticky nav, hero, features/services, social proof, CTA, footer
- Use emoji as icons where suitable
- Fully mobile-responsive using Tailwind's md: and lg: prefixes

Return ONLY the raw JSX/JS code. No markdown fences. No imports. No explanations. Start directly with: function App() {`;

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
