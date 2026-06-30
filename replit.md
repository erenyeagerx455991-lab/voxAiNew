# VoxAI — AI-Powered Website Builder

VoxAI (branded "NexoGen") generates polished landing pages and web apps from a text prompt using a multi-model AI pipeline (OpenRouter + Groq).

## Run & Operate

- `pnpm install` — install all dependencies (run from workspace root after cloning)
- `pnpm --filter @workspace/voxai run dev` — run the React/Vite frontend
- `pnpm --filter @workspace/api-server run dev` — build + start the Express API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 20+, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS v3, shadcn/ui, Framer Motion, Wouter
- API: Express 5, esbuild (CJS bundle), Pino logging
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- AI: OpenRouter (primary LLM gateway), Groq (code-fix / fast models)
- Queue: BullMQ + Redis (falls back to in-memory when Redis is unavailable)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Required Environment Variables

### Backend (API server)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string — obtain from Replit DB or any Postgres host |
| `OPENROUTER_API_KEY` | **Yes** | OpenRouter API key — get at https://openrouter.ai/keys (powers all LLM calls) |
| `GROQ_API_KEY` | **Yes** | Groq API key — get at https://console.groq.com/keys (powers fast code-fix model) |
| `PORT` | Injected by Replit | TCP port for the API server (Replit sets this automatically via workflows) |
| `API_KEY` | Optional | Bearer token to protect the API — if unset, auth is disabled (dev mode only) |
| `REDIS_URL` | Optional | Redis connection string — if unset, queue runs in-memory |
| `SESSION_SECRET` | Optional | Express session secret |
| `ALLOWED_ORIGINS` | Optional | CORS allowlist (comma-separated origins) |
| `BUDGET_DAILY_OR` / `BUDGET_MONTHLY_OR` | Optional | OpenRouter spend limits (USD) |
| `BUDGET_DAILY_GROQ` / `BUDGET_MONTHLY_GROQ` | Optional | Groq spend limits (USD) |
| `LIMIT_DAILY_BUILDS` | Optional | Max builds per user per day |
| `LIMIT_DAILY_TOKENS` | Optional | Max tokens per user per day |
| `LIMIT_MAX_ACTIVE` | Optional | Max concurrent active builds |
| `LIMIT_MAX_QUEUED` | Optional | Max queued builds |
| `WORKER_CONCURRENCY` | Optional | BullMQ worker concurrency (default: 2) |
| `WORKSPACE_ROOT` | Optional | Path for isolated build workspaces (default: `/tmp/nexogen-runs`) |

### Frontend (Vite)
| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase anon key — only needed if Supabase auth/storage is used |
| `VITE_API_KEY` | Optional | Passed as Bearer token in frontend API requests (should match `API_KEY`) |

## Where things live

- `artifacts/voxai/` — React/Vite frontend (NexoGen UI)
- `artifacts/api-server/` — Express 5 API server (build pipeline, AI agents, queue)
- `artifacts/api-server/src/agents/` — AI pipeline steps (architecture, frontend, backend, etc.)
- `artifacts/api-server/src/routes/` — API routes (build, edit, chat, telemetry, security)
- `lib/db/` — Drizzle ORM schema + pool (source of truth for DB schema)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — Generated React Query hooks (from `pnpm run codegen`)
- `lib/api-zod/` — Generated Zod schemas (from `pnpm run codegen`)

## Architecture decisions

- **Queue-first builds**: every generate request goes through BullMQ (in-memory fallback when Redis is absent). SSE bridges job events to the frontend in real time.
- **OpenRouter as primary gateway**: all LLM calls route through a single `callAI()` helper with a 3-model fallback chain; Groq is reserved for the code-fix / repair step.
- **Real Vite builds**: generated projects are written to isolated `/tmp/nexogen-runs/{id}` directories, `npm install`ed, and Vite-built for validation before being returned.
- **DNA composition**: multi-brand visual DNA is fused from reference sites rather than winner-takes-all; section ownership is resolved algorithmically.
- **Component registry**: shadcn/ui components are selected based on DNA + industry context, with locked components surviving edits.

## Gotchas

- `DATABASE_URL` must be set before starting the API server — the DB client throws on import if missing.
- `OPENROUTER_API_KEY` + `GROQ_API_KEY` are required for any build to complete; the server starts without them but all generate/edit/repair routes return errors.
- Redis is optional — if `REDIS_URL` is not set, the queue runs in-memory and jobs execute inline. This is fine for development.
- The `minimumReleaseAge: 1440` setting in `.npmrc`/`pnpm-workspace.yaml` is intentional supply-chain protection — do not remove it.
- Port is injected by Replit workflows automatically; do not hardcode it.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
