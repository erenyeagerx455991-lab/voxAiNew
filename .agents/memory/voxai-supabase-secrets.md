---
name: VoxAI Supabase secrets swap
description: Both Supabase secrets were entered as JWT anon keys; URL is hardcoded in vite.config.ts define block as workaround.
---

# VoxAI Supabase Secrets — Swap Workaround

**The rule:** VITE_SUPABASE_URL in Replit Secrets currently holds a JWT token (the anon key), not the project URL. Both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY contain the same JWT.

**Why:** When the user entered the secrets, they pasted the anon key JWT into both fields instead of the URL into VITE_SUPABASE_URL.

**How it's fixed today:** `artifacts/voxai/vite.config.ts` has a `define` block that hardcodes the correct Supabase URL (`https://jjxqvriyfjhvvaixjvwe.supabase.co`) and reads the anon key from either env var.

**How to apply:** If the Supabase URL ever changes or the secrets are corrected, remove the `define` block from `vite.config.ts` (lines ~33–36) and rely on Vite's normal `import.meta.env.VITE_*` injection. Follow-up task #3 tracks this cleanup.
