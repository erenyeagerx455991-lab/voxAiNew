/*
  # Add SECURITY DEFINER functions for credit deduction

  1. New Functions
    - `deduct_credits` — Atomically deduct credits from a user's profile.
      Uses SECURITY DEFINER so it runs with the function owner's privileges,
      allowing the edge function to deduct credits using only the user's JWT
      (anon key level) without needing the service role key.

    - `get_user_credits` — Safely read a user's credit balance.

  2. Security
    - Both functions verify auth.uid() matches the requested user_id
    - deduct_credits prevents negative balances
    - No service role key required — works with RLS-enforced anon key

  3. Why this approach
    - Edge functions receive the user's JWT (anon key level)
    - RLS prevents direct profile UPDATE by the user (only their own row)
    - But credit deduction needs atomic read-then-write
    - SECURITY DEFINER functions execute with elevated privileges
      while still verifying the caller's identity via auth.uid()
*/

-- ============================================
-- DEDUCT CREDITS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_feature text,
  p_reference_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits integer;
  v_new_credits integer;
BEGIN
  -- Verify the caller is the user they claim to be
  IF auth.uid() != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: user ID mismatch'
    );
  END IF;

  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;

  -- Check sufficient credits
  IF v_current_credits < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'credits', v_current_credits
    );
  END IF;

  -- Deduct credits
  v_new_credits := v_current_credits - p_amount;

  UPDATE profiles SET credits = v_new_credits WHERE id = p_user_id;

  -- Log usage
  INSERT INTO credit_usage (user_id, feature_used, credits_used, reference_id)
  VALUES (p_user_id, p_feature, p_amount, p_reference_id);

  RETURN json_build_object(
    'success', true,
    'credits', v_new_credits
  );
END;
$$;

-- ============================================
-- GET USER CREDITS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_credits(
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits integer;
BEGIN
  IF auth.uid() != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized'
    );
  END IF;

  SELECT credits INTO v_credits
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Profile not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'credits', v_credits
  );
END;
$$;

-- ============================================
-- GRANT EXECUTE TO AUTHENTICATED USERS
-- ============================================
GRANT EXECUTE ON FUNCTION public.deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_credits TO authenticated;
