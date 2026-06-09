---
name: VoxAI Supabase secrets swap
description: Both Supabase secrets were entered as JWT anon keys; URL is hardcoded in supabase.ts as workaround.
---

# VoxAI Supabase Secrets — Swap Workaround

**The rule:** VITE_SUPABASE_URL in Replit Secrets currently holds a JWT token (the anon key), not the project URL. Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY contain the same JWT anon key.

**Why:** When the user entered the secrets, they pasted the anon key JWT into both fields instead of the project URL into VITE_SUPABASE_URL.

**How it's fixed:** `artifacts/voxai/src/lib/supabase.ts` hardcodes the Supabase project URL (`https://jjxqvriyfjhvvaixjvwe.supabase.co`) and reads the anon key from whichever env var has it (VITE_SUPABASE_ANON_KEY || VITE_SUPABASE_URL fallback).

**Why not use vite.config.ts define block:** Vite's built-in VITE_* env injection runs after the define substitution in dev mode, overwriting the define values. Hardcoding directly in supabase.ts is more reliable.

**How to apply:** If the user ever corrects the secrets (URL in VITE_SUPABASE_URL, key in VITE_SUPABASE_ANON_KEY), revert supabase.ts to use `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` normally. Follow-up task #3 tracks this cleanup.
