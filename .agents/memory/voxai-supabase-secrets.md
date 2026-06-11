---
name: VoxAI Supabase secrets swap
description: Both Supabase secrets were entered as JWTs; URL is hardcoded in supabase.ts as workaround. Anon key is now correctly set in VITE_SUPABASE_ANON_KEY.
---

# VoxAI Supabase Secrets — Swap Workaround

**The rule:** VITE_SUPABASE_URL was previously entered as a JWT token (the anon key), not the project URL. The URL is hardcoded in `artifacts/voxai/src/lib/supabase.ts` as `https://jjxqvriyfjhvvaixjvwe.supabase.co`.

**Current state (June 2026):** VITE_SUPABASE_ANON_KEY is correctly set in Replit Secrets with the JWT anon key. The URL remains hardcoded in supabase.ts.

**Why:** When the user first entered the secrets, they pasted the anon key JWT into both fields instead of the project URL into VITE_SUPABASE_URL.

**How to apply:** If the user ever corrects the URL secret (VITE_SUPABASE_URL set to the actual project URL), revert supabase.ts to use `import.meta.env.VITE_SUPABASE_URL` instead of the hardcoded string.
