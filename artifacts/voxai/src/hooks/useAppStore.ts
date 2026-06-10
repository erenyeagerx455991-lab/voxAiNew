import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createChat, getChats, getMessages, updateChatTitle, deleteChat } from '../services/chatService';
import { mockStreamResponse } from '../services/mockAiService';
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
  generatedCode: string;
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
  const [generatedCode, setGeneratedCode] = useState('');
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
      setGeneratedCode('');
      setView('chat');
      closeSidebar();
    } catch {
      // reset to empty chat state even if Supabase fails
      setActiveChatIdState(null);
      setActiveChatMessages([]);
      setChatError('');
      setGeneratedCode('');
      setView('chat');
      closeSidebar();
    }
  }, [closeSidebar]);

  const handleSend = useCallback(
    async (content: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        setChatError('');

        // Try to create/find a chat in Supabase (best-effort, not blocking)
        let chatId = activeChatId;
        if (!chatId) {
          try {
            const chat = await createChat(content.slice(0, 40) + (content.length > 40 ? '...' : ''));
            chatId = chat.id;
            setChats((prev) => [chat, ...prev]);
            setActiveChatIdState(chat.id);
          } catch {
            // Use a local ID if Supabase fails
            chatId = crypto.randomUUID();
            setActiveChatIdState(chatId);
          }
        }

        // Add user message to local state
        const userMsgId = crypto.randomUUID();
        const userMsg: Message = {
          id: userMsgId,
          chat_id: chatId,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
        setActiveChatMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);
        setStreamingContent('');

        // Stream mock AI response
        await mockStreamResponse(
          content,
          (token) => {
            setStreamingContent((prev) => prev + token);
          },
          (fullText, code) => {
            // Done — commit streamed content as an assistant message
            const assistantMsgId = crypto.randomUUID();
            const assistantMsg: Message = {
              id: assistantMsgId,
              chat_id: chatId!,
              role: 'assistant',
              content: fullText,
              created_at: new Date().toISOString(),
            };
            setActiveChatMessages((prev) => [...prev, assistantMsg]);
            setStreamingContent('');
            setIsTyping(false);
            setGeneratedCode(code);
            loadingRef.current = false;
            onCreditsChange?.();
          },
          (err) => {
            setChatError(err);
            setStreamingContent('');
            setIsTyping(false);
            loadingRef.current = false;
          }
        );
      } catch (err) {
        console.error('handleSend error:', err);
        setChatError('Something went wrong. Please try again.');
        setStreamingContent('');
        setIsTyping(false);
        loadingRef.current = false;
      }
    },
    [activeChatId, onCreditsChange]
  );

  const handleDeleteChat = useCallback(
    async (id: string) => {
      try {
        await deleteChat(id);
      } catch {
        // ignore
      }
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatIdState(null);
        setActiveChatMessages([]);
        setChatError('');
        setGeneratedCode('');
      }
    },
    [activeChatId]
  );

  const handleRenameChat = useCallback(async (id: string, title: string) => {
    try {
      await updateChatTitle(id, title);
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    } catch {
      // ignore
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
    generatedCode,
    handleSend,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    loadChats,
    loadMessages,
    initialized,
  };
}
