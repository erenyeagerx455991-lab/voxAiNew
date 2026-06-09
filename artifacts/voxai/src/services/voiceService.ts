import { supabase } from '../lib/supabase';
import type { VoiceModel } from '../lib/types';

export async function createVoiceModel(
  voiceName: string,
  description: string,
  sampleFile?: File
): Promise<VoiceModel> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let sampleAudioUrl = '';

  if (sampleFile) {
    const filePath = `${user.id}/${Date.now()}-${sampleFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('voice-samples')
      .upload(filePath, sampleFile);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('voice-samples')
      .getPublicUrl(filePath);

    sampleAudioUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('voice_models')
    .insert({
      user_id: user.id,
      voice_name: voiceName,
      description,
      sample_audio_url: sampleAudioUrl,
      status: 'pending',
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  // Trigger processing via edge function
  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = `https://jjxqvriyfjhvvaixjvwe.supabase.co/functions/v1/voices`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ voiceModelId: data.id, action: 'process' }),
  });

  return data;
}

export async function getVoiceModels(): Promise<VoiceModel[]> {
  const { data, error } = await supabase
    .from('voice_models')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteVoiceModel(id: string): Promise<void> {
  const { error } = await supabase
    .from('voice_models')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadVoiceSample(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const filePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('voice-samples')
    .upload(filePath, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('voice-samples')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
