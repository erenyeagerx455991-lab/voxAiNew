# VoxAI (NexoGen) — Project Guide (Hinglish)

Ye file isliye likhi gayi hai ki tumhe apna khud ka project samajh aa jaye — bina kisi
line-by-line code padhe bhi tumhe pata chal jaye ki **kya kahan hai, kya karta hai, aur
change karna ho to kahan jaana hai**.

---

## 1. Project kya hai (Product level)

**VoxAI** (UI me brand naam **"NexoGen"**) ek AI website-builder hai — jaisa Lovable /
Bolt / v0 hota hai. User ek text prompt likhta hai (jaise "make a SaaS landing page for
a fitness app"), aur backend ka AI pipeline uska poora **React + Tailwind website**
generate kar deta hai — code, design, aur ek real build (Vite) ke saath.

Chat interface se user:
- Naya project generate kar sakta hai (prompt se)
- Us project ko edit kar sakta hai ("change button color", "add pricing section")
- Preview dekh sakta hai (live iframe me)
- Code download kar sakta hai (zip)

---

## 2. Teen "Artifacts" (Replit ki language me — teen alag services)

| Artifact | Folder | Kaam |
|---|---|---|
| **VoxAI** (frontend) | `artifacts/voxai` | React+Vite chat UI jo user dekhta hai |
| **API Server** (backend) | `artifacts/api-server` | Express server — saara AI/build logic yahin hai |
| **Canvas / mockup-sandbox** | `artifacts/mockup-sandbox` | Sirf design-preview ka internal tool (agent use karta hai UI mockup dikhaane ke liye) |

Teeno ke apne `pnpm` workflows hain (Replit "Workflows" panel me dikhte hain), har ek apna
alag process hai. Teeno alag `PORT` par chalte hain, Replit unhe automatically proxy karta hai.

---

## 3. Tech Stack (one-liner har piece ke liye)

- **pnpm workspace monorepo** — ek repo, multiple packages (`artifacts/*` + `lib/*`)
- **Frontend**: React 19 + Vite 7 + Tailwind CSS + shadcn/ui components + Framer Motion (animations) + Wouter (routing)
- **Backend**: Express 5 + esbuild (backend ko ek single `.mjs` file me bundle karta hai) + Pino (logging)
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`) — **abhi khaali hai** (koi table define nahi hui), sirf infra ready hai
- **AI**: OpenRouter (multi-model gateway, sab LLM calls yahin se jaati hain) + Groq (fast "code-fix" model)
- **Queue**: BullMQ + Redis — agar Redis nahi hai to automatically in-memory mode me chal jaata hai (dev me yehi ho raha hai)
- **Validation**: Zod
- **API contracts**: `lib/api-spec` (OpenAPI) se `lib/api-client-react` (frontend hooks) aur `lib/api-zod` (schemas) auto-generate hote hain

---

## 4. Folder Map (top-level)

```
artifacts/
  voxai/            → frontend (chat UI)
  api-server/        → backend (AI pipeline + routes)
  mockup-sandbox/     → internal design-preview tool
lib/
  db/                → Drizzle schema (database)
  api-spec/          → OpenAPI spec (API ka contract)
  api-client-react/  → auto-generated React Query hooks (isse frontend backend ko call karta hai)
  api-zod/           → auto-generated Zod validation schemas
scripts/             → post-merge / maintenance scripts
benchmarks/          → quality-benchmark test prompts + results
.agents/memory/      → agent (mujhe) ki apni "yaad rakhne" ki files — inse tumhe kuch lena dena nahi
replit.md            → project overview + run instructions (yeh file bhi padho, chhoti hai)
```

---

## 5. Frontend deep-dive — `artifacts/voxai/src`

```
main.tsx        → app ka entry point
App.tsx         → top-level routing/layout
pages/          → route-level pages (abhi sirf not-found.tsx — baaki sab ek single-page chat app hai)
components/      → saare UI blocks:
  LandingPage.tsx       → jab koi project open nahi hota, ye dikhta hai
  ChatView.tsx          → main chat/build interface (jahan user prompt likhta hai)
  MessageInput.tsx      → chat ka text box (jahan se "/agents/build" call trigger hoti hai)
  WorkspacePanel.tsx    → generated project ka file-tree + code view
  WorkspacePreviewPanel.tsx → generated website ka live iframe preview
  PreviewModal.tsx      → fullscreen preview popup
  Sidebar.tsx / Header.tsx → navigation shell
  ProjectsView.tsx      → user ke saved projects ki list
  SettingsPage.tsx      → settings screen
  AdminView.tsx         → admin/debug panel
  DNACompositionPanel.tsx     → "design DNA" (visual style) breakdown dikhata hai
  TemplateMarketplacePanel.tsx → template gallery
  auth/                 → login/signup components
  ui/                   → shadcn/ui base components (button, dialog, input, etc.) — inhe khud mat edit karo, generate hote hain
component-library/      → design/preview ke liye chhote reusable pieces
contexts/               → React context (global state — jaise current project, current build)
hooks/                  → custom React hooks (jaise "useBuild", "useChat" type)
services/               → backend ko call karne ka logic (SSE stream sunna, API calls)
lib/                    → helper functions
theme/                  → color/typography tokens
```

**Sabse important flow:** `MessageInput.tsx` → `services/` (API call) → backend `/agents/build`
→ Server-Sent Events (SSE) stream aata hai → `ChatView.tsx` / `WorkspacePanel.tsx` progress
aur final code dikhate hain.

---

## 6. Backend deep-dive — `artifacts/api-server/src`

```
index.ts        → server start hota hai yahan se
app.ts          → Express app setup (middleware, routes attach karna)
routes/
  agents.ts      → SABSE IMPORTANT FILE. /agents/build, /agents/edit, /agents/audit endpoints
  chat.ts        → chat-related endpoints
  health.ts      → health check
  security.ts    → security metrics endpoint
  telemetry.ts   → quality/usage metrics endpoint (dev-time monitoring)
orchestrator/    → build request ko pipeline tak route karta hai (Tool Router)
context/         → ek build ke liye shared "context" object banata hai (prompt, keys, ids)
agents/
  pipeline/      → ⭐ YAHIN ASLI LOGIC HAI. Har file ek pipeline "step" hai.
  llm/           → OpenRouter/Groq API calls ka wrapper (callAI())
  edit/          → jab user ek EXISTING project ko edit karta hai, uska logic
  audit/         → generated code ka quality-audit karne wala agent
  templates/     → pre-built template matching
  designCritic/, designEvaluator*, repair/, dna/, config/  → pipeline steps ke helper modules
runtime/         → generated code ko real Vite build karke test karta hai (self-healing repair loop)
component-tree/  → deterministic (no-AI) page-structure builder
design-*, backend-architect/, devops-architect/, qa-architect/,
frontend-architect/, product-manager/, reasoning-engine/,
knowledge-engine/, model-orchestrator/, agent-orchestrator/  → ye sab "static planning
  brains" hain (koi LLM call nahi) jo pipeline ko smart decisions dete hain
  (kitne candidates banayen, kaunsa model use karen, kaunse steps skip karen, etc.)
queue/           → BullMQ job queue (build requests background me process hoti hain)
limits/          → per-user daily build/token limits
cost/            → OpenRouter/Groq spend budget tracking
telemetry/       → metrics collection (kitne builds, kitna time, kitna score)
security/, auth/, middlewares/ → auth, rate-limiting, CORS, helmet
tests/           → Vitest test files
```

### Build Pipeline — dil hai is poore project ka

File: `artifacts/api-server/src/agents/pipeline/buildPipeline.ts`

Jab user prompt submit karta hai, `runBuildPipeline()` function chalta hai jo **13+ steps**
sequence me chalata hai (har step apna kaam karke aage next step ko output deta hai):

1. **Product Manager** — business/product strategy soch (koi LLM nahi, static rules)
2. **Frontend/Backend/DevOps/QA Architect** — technical blueprint (koi LLM nahi)
3. **Runtime Intelligence / Orchestrator / Model Orchestrator / Knowledge Engine / Reasoning Engine** — "smart brain" steps jo decide karte hain build kaise approach karna hai (koi LLM nahi, sab rule-based)
4. **Planner** — user ke prompt ko samajh kar ek plan banata hai (⭐ yahan se LLM calls shuru hoti hain)
5. **Architecture** — tech stack + project structure decide karta hai
6. **Component Tree** — page ka structure banata hai (deterministic)
7. **Frontend** — asli React/Tailwind code generate karta hai (LLM call)
8. **Candidate Selection** — 2-3 versions generate karke best wala choose karta hai
9. **Repair** — code me bugs fix karta hai
10. **Design Evaluator / Design Critic / Conversion / Accessibility / Optimization / Design Director** — quality-improvement loops (score badhane ke liye)
11. **Backend Scaffold** — API routes/DB schema files generate karta hai
12. **Runtime Validation** — real `npm install` + Vite build chalata hai, agar error aaye to auto-fix karta hai

Aakhir me sab result ek `"done"` SSE event ke through frontend ko bhej diya jaata hai.

**Agar tumhe kabhi "AI ka output kharab aa raha hai" jaisi problem fix karni ho, to
zyaadatar time yahi teen jagah dekhni padegi:** `frontendStep.ts` (code generation),
`repairStep.ts` (bug-fixing), `designEvaluatorStep.ts` (quality scoring).

---

## 7. Database

`lib/db/src/schema/index.ts` abhi **khaali hai** — koi table define nahi hui. Iska matlab
project abhi database ka use nahi kar raha; build history, telemetry, DNA-learning sab
`/tmp/voxai-*` files me store ho raha hai (temporary, restart pe reset ho jaata hai).

Agar tumhe users/projects permanently save karne hain, to yahin (`lib/db/src/schema/`)
Drizzle tables define karni hongi, phir `pnpm --filter @workspace/db run push` se DB me
push karni hongi.

---

## 8. Environment Variables / Secrets

`replit.md` me poori list hai. Sabse zaroori:
- `DATABASE_URL` — set hai (Replit ne diya)
- `OPENROUTER_API_KEY` / `GROQ_API_KEY` — **abhi pending hain, tumhe dena hoga** — inke bina koi build kaam nahi karega
- `REDIS_URL` — optional, na ho to in-memory queue chalti hai (dev me fine hai)

---

## 9. Run / Dev karne ka tareeka

Replit me 3 workflows already chal rahe hain (Workflows panel me dikhenge):
- `artifacts/voxai: web` → frontend
- `artifacts/api-server: API Server` → backend
- `artifacts/mockup-sandbox: Component Preview Server` → design tool

Manually terminal se:
```
pnpm install                                        # dependencies
pnpm --filter @workspace/voxai run dev              # frontend
pnpm --filter @workspace/api-server run dev         # backend
pnpm run typecheck                                  # type errors check
pnpm --filter @workspace/api-server run test        # backend tests (Vitest)
```

---

## 10. Change karna ho to kahan jaana hai (cheat-sheet)

| Tumhe kya karna hai | Kahan jao |
|---|---|
| Chat UI ka look/feel badalna | `artifacts/voxai/src/components/ChatView.tsx`, `MessageInput.tsx` |
| Generated website ki quality/style badalna | `artifacts/api-server/src/agents/pipeline/frontendStep.ts` aur uske prompt templates |
| Naya API endpoint add karna | `artifacts/api-server/src/routes/` me naya route + `lib/api-spec` me OpenAPI entry |
| Database me kuch save karna | `lib/db/src/schema/` me table define karo, phir `pnpm --filter @workspace/db run push` |
| Naya pipeline step add karna | `artifacts/api-server/src/agents/pipeline/` me naya `*Step.ts` file, `buildPipeline.ts` me call add karo |
| Limits/budget change karna | `artifacts/api-server/src/limits/`, `src/cost/` |
| Environment variable/secret add karna | Replit "Secrets" — code me kabhi hardcode mat karo |

---

## 11. Zaroori Gotchas (mat bhoolna)

- `.npmrc` / `pnpm-workspace.yaml` me `minimumReleaseAge: 1440` set hai — ye ek security
  protection hai (naya npm package install hone se pehle 1 din wait karta hai). **Ise hatao mat.**
- Port Replit khud inject karta hai (`process.env.PORT`) — kabhi hardcode mat karo.
- `OPENROUTER_API_KEY` / `GROQ_API_KEY` ke bina server chalega, lekin koi build/edit/repair
  request fail hogi.
- Redis na ho to koi problem nahi — in-memory queue dev ke liye kaafi hai.

---

*Ye guide manually maintain karna — jab bhi koi bada architectural change karo (naya
pipeline step, naya artifact, database schema), is file ko update kar dena taaki aage bhi
samajhna aasan rahe.*
