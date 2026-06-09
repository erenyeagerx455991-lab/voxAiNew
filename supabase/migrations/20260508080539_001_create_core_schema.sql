/*
  # Create Core Database Schema for VoxAI Platform

  1. New Tables
    - `profiles` — User profiles extending Supabase auth.users
      - `id` (uuid, PK, references auth.users)
      - `name` (text)
      - `email` (text)
      - `avatar_url` (text)
      - `credits` (integer, default 50)
      - `subscription_plan` (text, default 'free')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chats` — User chat sessions
      - `id` (uuid, PK)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `messages` — Individual messages within chats
      - `id` (uuid, PK)
      - `chat_id` (uuid, references chats)
      - `role` (text: 'user' or 'assistant')
      - `content` (text)
      - `created_at` (timestamptz)

    - `tts_history` — Text-to-speech generation records
      - `id` (uuid, PK)
      - `user_id` (uuid, references profiles)
      - `text` (text)
      - `voice_name` (text)
      - `audio_url` (text)
      - `duration_seconds` (integer)
      - `created_at` (timestamptz)

    - `voice_models` — Custom voice clone models
      - `id` (uuid, PK)
      - `user_id` (uuid, references profiles)
      - `voice_name` (text)
      - `description` (text)
      - `sample_audio_url` (text)
      - `status` (text: 'pending', 'processing', 'completed', 'failed')
      - `created_at` (timestamptz)

    - `subscriptions` — User subscription records
      - `id` (uuid, PK)
      - `user_id` (uuid, references profiles)
      - `plan_name` (text: 'free', 'pro', 'premium')
      - `status` (text: 'active', 'cancelled', 'expired')
      - `credits_per_month` (integer)
      - `renewal_date` (timestamptz)
      - `created_at` (timestamptz)

    - `credit_usage` — Credit consumption audit log
      - `id` (uuid, PK)
      - `user_id` (uuid, references profiles)
      - `feature_used` (text: 'chat', 'tts', 'voice_clone')
      - `credits_used` (integer)
      - `reference_id` (uuid, optional reference to chat/tts/voice)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on ALL tables
    - Users can only CRUD their own data
    - Admin access via service role only (no public admin policies)
    - All policies require authenticated users

  3. Indexes
    - chats: user_id index for fast chat listing
    - messages: chat_id index for fast message retrieval
    - tts_history: user_id index
    - voice_models: user_id index
    - credit_usage: user_id index

  4. Triggers
    - Auto-create profile on user signup
    - Auto-update updated_at on row modification
*/

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  credits integer NOT NULL DEFAULT 50,
  subscription_plan text NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'premium')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- CHATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON chats FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own chats"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own chats"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own chats"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);

-- ============================================
-- TTS HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tts_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL DEFAULT '',
  voice_name text NOT NULL DEFAULT 'alloy',
  audio_url text DEFAULT '',
  duration_seconds integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tts_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own TTS history"
  ON tts_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own TTS history"
  ON tts_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own TTS history"
  ON tts_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tts_history_user_id ON tts_history(user_id);

-- ============================================
-- VOICE MODELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voice_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  sample_audio_url text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE voice_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice models"
  ON voice_models FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice models"
  ON voice_models FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice models"
  ON voice_models FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice models"
  ON voice_models FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_voice_models_user_id ON voice_models(user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_name text NOT NULL DEFAULT 'free' CHECK (plan_name IN ('free', 'pro', 'premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  credits_per_month integer NOT NULL DEFAULT 50,
  renewal_date timestamptz DEFAULT now() + interval '1 month',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CREDIT USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_used text NOT NULL CHECK (feature_used IN ('chat', 'tts', 'voice_clone')),
  credits_used integer NOT NULL DEFAULT 1,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit usage"
  ON credit_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit usage"
  ON credit_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS chats_updated_at ON chats;
CREATE TRIGGER chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
