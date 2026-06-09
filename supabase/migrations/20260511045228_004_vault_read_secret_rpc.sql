/*
  # Create vault_read_secret RPC function

  1. New Functions
    - `vault_read_secret(secret_name text)` — Reads a decrypted secret from the Supabase vault by name
      - Returns the decrypted secret value as text
      - Uses SECURITY DEFINER so edge functions can call it via REST API with service role key
      - Only accessible via service role (no public RLS bypass)

  2. Security
    - Function is SECURITY DEFINER to access vault.decrypted_secrets
    - No public access — only callable with service role key via RPC
*/

CREATE OR REPLACE FUNCTION public.vault_read_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result text;
BEGIN
  SELECT decrypted_secret INTO result
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;

  RETURN result;
END;
$$;

-- Revoke execute from public, only service role can call it
REVOKE ALL ON FUNCTION public.vault_read_secret(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vault_read_secret(text) TO postgres;
