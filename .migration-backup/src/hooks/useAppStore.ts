import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sendMessageStream, createChat, getChats, getMessages, updateChatTitle, deleteChat } from '../services/chatService';
import type { View, Chat, Message } from '../lib/types';

export type { View, Chat, Message };

interface AppState {
  view: View;
  setView: (view: View) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  chats: Chat[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  activeChatMessages: Message[];
  isTyping: boolean;
  streamingContent: string;
  chatError: string;
  handleSend: (content: string) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleDeleteChat: (id: string) => Promise<void>;
  handleRenameChat: (id: string, title: string) => Promise<void>;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  initialized: boolean;
}

export function useAppStore(isAuthenticated: boolean, onCreditsChange?: () => void): AppState {
  const [view, setView] = useState<View>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [chatError, setChatError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const loadingRef = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const loadChats = useCallback(async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch {
      setChats([]);
    }
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const msgs = await getMessages(chatId);
      setActiveChatMessages(msgs);
    } catch {
      setActiveChatMessages([]);
    }
  }, []);

  // Subscribe to real-time messages for active chat
  useEffect(() => {
    if (!activeChatId || !isAuthenticated) {
      setActiveChatMessages([]);
      return;
    }

    loadMessages(activeChatId);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${activeChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setActiveChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeChatId, isAuthenticated, loadMessages]);

  // Subscribe to real-time chat list changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('chats-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, loadChats]);

  // Load chats when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadChats().then(() => setInitialized(true));
    } else {
      setChats([]);
      setActiveChatIdState(null);
      setActiveChatMessages([]);
      setInitialized(true);
    }
  }, [isAuthenticated, loadChats]);

  const setActiveChatId = useCallback((id: string | null) => {
    setActiveChatIdState(id);
    setChatError('');
    if (id) loadMessages(id);
  }, [loadMessages]);

  const handleNewChat = useCallback(async () => {
    try {
      const chat = await createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveChatIdState(chat.id);
      setActiveChatMessages([]);
      setChatError('');
      setView('chat');
      closeSidebar();
    } catch {
      // handle error
    }
  }, [closeSidebar]);

  const handleSend = useCallback(
    async (content: string) => {
      if (loadingRef.current) return;
      let chatId = activeChatId;
      let tempMsgId: string | undefined;

      try {
        setChatError('');

        if (!chatId) {
          const chat = await createChat(content.slice(0, 30) + (content.length > 30 ? '...' : ''));
          chatId = chat.id;
          setChats((prev) => [chat, ...prev]);
          setActiveChatIdState(chat.id);
        }

        // Optimistically add user message
        tempMsgId = crypto.randomUUID();
        const tempUserMsg: Message = {
          id: tempMsgId,
          chat_id: chatId,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
        setActiveChatMessages((prev) => [...prev, tempUserMsg]);
        setIsTyping(true);
        setStreamingContent('');
        loadingRef.current = true;

        await sendMessageStream(chatId, content, {
          onToken: (token) => {
            setStreamingContent((prev) => prev + token);
          },
          onDone: (userMessageId, assistantMessageId) => {
            // Replace temp user message with real one from DB
            setActiveChatMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== tempMsgId);
              const withUserMsg = filtered.some((m) => m.id === userMessageId)
                ? filtered
                : [...filtered, { id: userMessageId, chat_id: chatId!, role: 'user' as const, content, created_at: new Date().toISOString() }];
              if (withUserMsg.some((m) => m.id === assistantMessageId)) return withUserMsg;
              return [...withUserMsg, { id: assistantMessageId, chat_id: chatId!, role: 'assistant' as const, content: '', created_at: new Date().toISOString() }];
            });

            // Reload messages to get the full saved assistant message
            if (chatId) loadMessages(chatId);

            setStreamingContent('');
            setIsTyping(false);
            loadingRef.current = false;
            loadChats();
            onCreditsChange?.();
          },
          onError: (errorMsg, userMessageId) => {
            console.error('Stream error:', errorMsg);

            // The user message was already saved to DB by the edge function.
            // Replace the optimistic temp message with the real one from DB.
            if (userMessageId) {
              setActiveChatMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== tempMsgId);
                if (filtered.some((m) => m.id === userMessageId)) return filtered;
                return [...filtered, { id: userMessageId, chat_id: chatId!, role: 'user' as const, content, created_at: new Date().toISOString() }];
              });
            }
            // If no userMessageId, the edge function failed before saving,
            // so keep the optimistic message so the user can see what they sent.

            setChatError(errorMsg);
            setStreamingContent('');
            setIsTyping(false);
            loadingRef.current = false;
          },
        });
      } catch (err) {
        console.error('Failed to send message:', err);
        // Keep the optimistic user message visible on unexpected errors
        setChatError('Something went wrong. Please try again.');
        setStreamingContent('');
        setIsTyping(false);
        loadingRef.current = false;
      }
    },
    [activeChatId, loadChats, loadMessages, onCreditsChange]
  );

  const handleDeleteChat = useCallback(
    async (id: string) => {
      try {
        await deleteChat(id);
        setChats((prev) => prev.filter((c) => c.id !== id));
        if (activeChatId === id) {
          setActiveChatIdState(null);
          setActiveChatMessages([]);
          setChatError('');
        }
      } catch {
        // handle error
      }
    },
    [activeChatId]
  );

  const handleRenameChat = useCallback(async (id: string, title: string) => {
    try {
      await updateChatTitle(id, title);
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    } catch {
      // handle error
    }
  }, []);

  return {
    view,
    setView,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    chats,
    activeChatId,
    setActiveChatId,
    activeChatMessages,
    isTyping,
    streamingContent,
    chatError,
    handleSend,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    loadChats,
    loadMessages,
    initialized,
  };
}
