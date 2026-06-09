import { supabase } from '../lib/supabase';
import type { TtsHistory } from '../lib/types';

export async function generateSpeech(text: string, voiceName: string): Promise<TtsHistory> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = `https://jjxqvriyfjhvvaixjvwe.supabase.co/functions/v1/tts`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'TTS generation failed' }));
    throw new Error(err.error || 'TTS generation failed');
  }

  return response.json();
}

export async function getTtsHistory(): Promise<TtsHistory[]> {
  const { data, error } = await supabase
    .from('tts_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteTtsRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('tts_history')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
