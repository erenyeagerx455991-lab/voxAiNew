import { supabase } from '../lib/supabase';
import type { Chat, Message } from '../lib/types';

export async function createChat(title = 'New chat'): Promise<Chat> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: user.id, title })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getChat(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateChatTitle(chatId: string, title: string): Promise<Chat> {
  const { data, error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) throw error;
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addMessage(
  chatId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, role, content })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (userMessageId: string, assistantMessageId: string) => void;
  onError: (error: string, userMessageId?: string) => void;
}

export async function sendMessageStream(
  chatId: string,
  content: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const apiUrl = `https://jjxqvriyfjhvvaixjvwe.supabase.co/functions/v1/chat`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ chatId, message: content }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Failed to get AI response' }));
    callbacks.onError(err.error || 'Failed to get AI response', err.userMessageId);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('No response stream');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'token' && parsed.text) {
              callbacks.onToken(parsed.text);
            } else if (parsed.type === 'done') {
              callbacks.onDone(parsed.userMessageId, parsed.messageId);
            } else if (parsed.type === 'error') {
              callbacks.onError(parsed.error || 'Stream error');
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : 'Stream read error');
  }
}
