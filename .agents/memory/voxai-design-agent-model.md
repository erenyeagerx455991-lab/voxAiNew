---
name: VoxAI Design Agent model
description: Which OpenRouter model is used for the Design Agent and why the old one caused silent DNA collapse.
---

The Design Agent in `artifacts/api-server/src/routes/agents.ts` uses `DESIGN_MODEL` (top of file).

**Rule:** Must be `google/gemini-2.5-flash-lite`. Do not use `google/gemini-flash-1.5-8b` or any `1.5` variant.

**Why:** `google/gemini-flash-1.5-8b` returns HTTP 404 ("No endpoints found") from OpenRouter. The old catch block was silent, so every request fell through to DEFAULT_DESIGN (monochrome #0a0a0a/#ffffff) — 20/20 DNA fields collapsed for ALL site generations regardless of the prompt's reference sites.

**How to apply:** If the Design Agent ever starts producing monochrome defaults again, check `DESIGN_MODEL` first. Verify the model exists by hitting `GET https://openrouter.ai/api/v1/models` and filtering for the slug. Use the `/api/agents/audit` endpoint (POST with `{ prompt }`) to get `designAgentOutput.status` and `designAgentError` without running the full build.

Available Google models on this OpenRouter account (as of June 2026):
- google/gemini-2.5-flash-lite (cheapest, 1M ctx) ← current
- google/gemini-2.5-flash (higher quality)
- google/gemini-3.5-flash
- google/gemini-3.1-flash-lite
