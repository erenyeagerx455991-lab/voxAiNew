import { supabase } from '../lib/supabase';
import type { Subscription, CreditUsage, Profile } from '../lib/types';

export const PLAN_CREDITS: Record<string, number> = {
  free: 50,
  pro: 500,
  premium: 2000,
};

export const CREDIT_COSTS: Record<string, number> = {
  chat: 1,
  tts: 2,
  voice_clone: 10,
};

export async function getSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCreditUsage(limit = 50): Promise<CreditUsage[]> {
  const { data, error } = await supabase
    .from('credit_usage')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function deductCredits(
  feature: 'chat' | 'tts' | 'voice_clone',
  referenceId?: string
): Promise<{ credits: number; success: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/credits`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ feature, referenceId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Credit deduction failed' }));
    throw new Error(err.error || 'Credit deduction failed');
  }

  return response.json();
}

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
