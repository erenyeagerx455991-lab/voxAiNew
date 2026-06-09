/*
  # Create Storage Buckets

  1. Storage Buckets
    - `avatars` — User profile images (public)
    - `audio` — Generated TTS audio files (private per user)
    - `voice-samples` — Voice cloning sample uploads (private per user)

  2. Security
    - Avatars: public read, authenticated upload for own folder
    - Audio: private, only owner can read/write
    - Voice samples: private, only owner can read/write
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('audio', 'audio', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']),
  ('voice-samples', 'voice-samples', false, 26214400, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'])
ON CONFLICT (id) DO NOTHING;

-- Avatar policies
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Audio policies
CREATE POLICY "Users can view own audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Voice sample policies
CREATE POLICY "Users can view own voice samples"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'voice-samples'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own voice samples"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-samples'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own voice samples"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'voice-samples'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
