import { supabase } from '../lib/supabase';

export interface AdminStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalTtsGenerations: number;
  totalVoiceModels: number;
  creditsUsed: number;
  activeSubscriptions: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export async function getAdminStats(): Promise<AdminStats> {
  const headers = await getAuthHeaders();
  const apiUrl = `https://jjxqvriyfjhvvaixjvwe.supabase.co/functions/v1/admin`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to fetch admin stats' }));
    throw new Error(err.error || 'Failed to fetch admin stats');
  }

  return response.json();
}

export async function getAdminUsers(page = 1, limit = 20) {
  const headers = await getAuthHeaders();
  const apiUrl = `https://jjxqvriyfjhvvaixjvwe.supabase.co/functions/v1/admin`;

  const response = await fetch(`${apiUrl}?action=users&page=${page}&limit=${limit}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}
