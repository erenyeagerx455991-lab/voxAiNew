# V7.1.0 — Output Quality Benchmark Dataset

## Methodology
Static analysis of all 75 component templates across registry.ts (31), section-templates.ts (16), diversity-templates.ts (28). Actual build execution requires ~115s per build; 20 sequential builds = ~38 minutes. Build IDs are runtime-generated UUIDs. This document defines the 20 benchmark prompts; live builds are triggered separately.

## 20 Benchmark Prompts

### SaaS (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 01 | "Build a project management SaaS called Taskify. Dark theme, Linear-style. Features: task boards, team collaboration, time tracking. Pricing plans." | SaaS | Linear |
| 02 | "Build an analytics dashboard SaaS called DataFlow. Clean dark UI like Vercel. Features: real-time charts, event tracking, funnel analysis. Monthly/annual pricing." | SaaS | Vercel |

### AI Startup (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 03 | "Build a landing page for an AI writing tool called Scribe. Inspired by Cursor. Dark minimal. Features: AI suggestions, grammar checking, tone control. Free plan." | AI | Cursor |
| 04 | "Build a landing page for an AI image generator called PixelMind. Framer-style bold visuals. Features: style transfer, batch generation, API access. Usage-based pricing." | AI | Framer |

### Fintech (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 05 | "Build a personal finance app called Ledger. Stripe-style clean design. Features: expense tracking, budget goals, investment overview. Bank-level security focus." | Fintech | Stripe |
| 06 | "Build a crypto trading platform called VaultX. Dark professional UI. Features: portfolio tracking, market alerts, DeFi integration. Pro and enterprise plans." | Fintech | Linear |

### Agency (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 07 | "Build a creative agency website for Studio Noir. Editorial dark aesthetic. Services: brand identity, web design, motion. Project portfolio showcase." | Agency | Framer |
| 08 | "Build a digital marketing agency site for Amplify Co. Clean professional light theme. Services: SEO, paid ads, content strategy. Results-focused." | Agency | Notion |

### Portfolio (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 09 | "Build a personal portfolio for a senior product designer named Alex Chen. Minimal dark theme. Showcase UX/UI projects. Case studies. Contact form." | Portfolio | Linear |
| 10 | "Build a portfolio for a full-stack developer named Jordan Lee. Technical dark aesthetic inspired by Vercel. Projects, skills, open source, blog." | Portfolio | Vercel |

### Restaurant (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 11 | "Build a restaurant website for Ember & Oak, a fine dining steakhouse in Chicago. Dark warm aesthetic. Menu, reservations, chef story. Seasonal ingredients focus." | Restaurant | — |
| 12 | "Build a website for Saffron, a Mediterranean bistro. Warm amber and stone tones. Menu with categories, photo gallery, reservation system. Outdoor seating highlight." | Restaurant | — |

### Healthcare (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 13 | "Build a landing page for a telehealth platform called CareLink. Clean light theme. Features: video consultations, prescription management, mental health support. HIPAA compliant." | Healthcare | Notion |
| 14 | "Build a website for a dental clinic called Bright Smile Dental. Light professional theme. Services, team, online booking. Patients-first messaging." | Healthcare | — |

### Real Estate (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 15 | "Build a real estate agency site for Meridian Properties. Premium dark navy theme. Featured listings, agent profiles, market insights, contact." | Real Estate | Stripe |
| 16 | "Build a property listing platform called FindHome. Clean modern UI. Search filters, neighborhood guides, saved listings, agent matching." | Real Estate | Vercel |

### E-commerce (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 17 | "Build a landing page for a premium skincare brand called Lumis. Light editorial aesthetic. Products, ingredients, testimonials, subscribe & save." | E-commerce | Notion |
| 18 | "Build a streetwear brand site for Phantom Label. Dark bold aesthetic inspired by Framer. Products, drops calendar, lookbook, newsletter." | E-commerce | Framer |

### Dashboard (2 prompts)

| # | Prompt | Category | DNA Target |
|---|---|---|---|
| 19 | "Build a SaaS dashboard product page for CommandIQ. Dark UI like Linear. Real-time monitoring, incident management, alert routing. DevOps team focus." | Dashboard/SaaS | Linear |
| 20 | "Build a business intelligence tool landing page called Prism Analytics. Clean professional UI. Features: custom dashboards, data connectors, AI insights. Enterprise pricing." | Dashboard/SaaS | Stripe |

## Build Execution Notes

Each build generates:
- A unique `buildId` (UUID format)
- Multi-file React + TypeScript project in `/tmp/nexogen-runs/{buildId}/`
- Live preview accessible at the VoxAI preview pane after step 8

**Expected outputs per build:**
- 6–12 component files (Navbar, Hero, Features, Pricing, etc.)
- 1 App.tsx with routing
- 1 index.css with Tailwind
- 1 index.html entry point

**Execution time:** ~115s per build, ~38min for all 20 sequential

## Status
- [ ] Builds triggered (requires sequential execution)
- [ ] Build IDs captured
- [ ] Screenshots captured
- [x] Dataset prompts defined (this document)
