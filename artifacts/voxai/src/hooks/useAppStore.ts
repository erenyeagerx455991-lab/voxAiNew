import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createChat, getChats, getMessages, updateChatTitle, deleteChat, addMessage } from '../services/chatService';
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
  buildStep: number;
  handleSend: (content: string) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleDeleteChat: (id: string) => Promise<void>;
  handleRenameChat: (id: string, title: string) => Promise<void>;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  initialized: boolean;
}

const CODE_KEY = (id: string) => `voxai_code_${id}`;

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
  const [buildStep, setBuildStep] = useState(-1);
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
    setBuildStep(-1);
    if (id) {
      loadMessages(id);
      // Restore cached generated code for this project
      const cached = localStorage.getItem(CODE_KEY(id));
      setGeneratedCode(cached ?? '');
    } else {
      setGeneratedCode('');
    }
  }, [loadMessages]);

  const handleNewChat = useCallback(async () => {
    try {
      const chat = await createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveChatIdState(chat.id);
      setActiveChatMessages([]);
      setChatError('');
      setGeneratedCode('');
      setBuildStep(-1);
      setView('chat');
      closeSidebar();
    } catch {
      setActiveChatIdState(null);
      setActiveChatMessages([]);
      setChatError('');
      setGeneratedCode('');
      setBuildStep(-1);
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

        // Create or reuse a chat in Supabase
        let chatId = activeChatId;
        if (!chatId) {
          try {
            const chat = await createChat(content.slice(0, 50) + (content.length > 50 ? '…' : ''));
            chatId = chat.id;
            setChats((prev) => [chat, ...prev]);
            setActiveChatIdState(chat.id);
          } catch {
            chatId = crypto.randomUUID();
            setActiveChatIdState(chatId);
          }
        }

        // Save user message to Supabase (best-effort), then show it
        let userMsg: Message;
        try {
          userMsg = await addMessage(chatId, 'user', content);
        } catch {
          userMsg = {
            id: crypto.randomUUID(),
            chat_id: chatId,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
          };
        }
        // Add only if not already injected by real-time subscription
        setActiveChatMessages((prev) =>
          prev.some((m) => m.id === userMsg.id) ? prev : [...prev, userMsg]
        );

        setIsTyping(true);
        setStreamingContent('');

        await mockStreamResponse(
          content,
          (token) => setStreamingContent((prev) => prev + token),
          async (fullText, code) => {
            // Save assistant (plan) message to Supabase
            let assistantMsg: Message;
            try {
              assistantMsg = await addMessage(chatId!, 'assistant', fullText);
            } catch {
              assistantMsg = {
                id: crypto.randomUUID(),
                chat_id: chatId!,
                role: 'assistant',
                content: fullText,
                created_at: new Date().toISOString(),
              };
            }
            setActiveChatMessages((prev) =>
              prev.some((m) => m.id === assistantMsg.id) ? prev : [...prev, assistantMsg]
            );

            // Persist generated code to localStorage so it survives page reloads
            if (code && chatId) {
              localStorage.setItem(CODE_KEY(chatId), code);
            }

            setStreamingContent('');
            setIsTyping(false);
            setGeneratedCode(code);
            setBuildStep(5);
            loadingRef.current = false;
            onCreditsChange?.();
          },
          (err) => {
            setChatError(err);
            setStreamingContent('');
            setIsTyping(false);
            setBuildStep(-1);
            loadingRef.current = false;
          },
          (step) => setBuildStep(step)
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
      // Remove cached code for this project
      localStorage.removeItem(CODE_KEY(id));
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatIdState(null);
        setActiveChatMessages([]);
        setChatError('');
        setGeneratedCode('');
        setBuildStep(-1);
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
    buildStep,
    handleSend,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    loadChats,
    loadMessages,
    initialized,
  };
}
