import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createChat, getChats, getMessages, updateChatTitle, deleteChat, addMessage } from '../services/chatService';
import { mockStreamResponse, mockEditResponse } from '../services/mockAiService';
import type { ProjectBlueprint, ProjectFile, ProjectMemory, DNAComposition, ThemeTokens, MotionProfile, DNABuildData } from '../services/builderService';
import { saveProjectMemory, loadProjectMemory, clearProjectMemory, buildDependencyGraph } from '../services/builderService';
import type { View, Chat, Message } from '../lib/types';

export type { View, Chat, Message };
export type { ProjectBlueprint, ProjectFile };

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
  projectBlueprint: ProjectBlueprint | null;
  sectionOrder: string[] | undefined;
  projectFiles: ProjectFile[];
  projectMemory: ProjectMemory | null;
  dnaComposition: DNAComposition | null;
  sectionOwnership: Record<string, string> | null;
  themeTokens: ThemeTokens | null;
  motionProfile: MotionProfile | null;
  handleSend: (content: string) => Promise<void>;
  handleNewChat: () => Promise<void>;
  handleDeleteChat: (id: string) => Promise<void>;
  handleRenameChat: (id: string, title: string) => Promise<void>;
  loadChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  initialized: boolean;
}

const CODE_KEY  = (id: string) => `voxai_code_${id}`;
const FILES_KEY = (id: string) => `voxai_files_${id}`;
const LOCAL_CHATS_KEY = 'voxai_local_chats';
const LOCAL_MSGS_KEY = (id: string) => `voxai_msgs_${id}`;

function getLocalChats(): Chat[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHATS_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}

function saveLocalChats(chats: Chat[]) {
  try {
    localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
  } catch {}
}

function addLocalChat(chat: Chat) {
  const existing = getLocalChats();
  if (existing.some((c) => c.id === chat.id)) return;
  saveLocalChats([chat, ...existing]);
}

function removeLocalChat(id: string) {
  saveLocalChats(getLocalChats().filter((c) => c.id !== id));
  localStorage.removeItem(LOCAL_MSGS_KEY(id));
}

function updateLocalChatTitle(id: string, title: string) {
  saveLocalChats(
    getLocalChats().map((c) => (c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c))
  );
}

function getLocalMessages(chatId: string): Message[] {
  try {
    const raw = localStorage.getItem(LOCAL_MSGS_KEY(chatId));
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

function addLocalMessage(msg: Message) {
  const existing = getLocalMessages(msg.chat_id);
  if (existing.some((m) => m.id === msg.id)) return;
  try {
    localStorage.setItem(LOCAL_MSGS_KEY(msg.chat_id), JSON.stringify([...existing, msg]));
  } catch {}
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
  const [buildStep, setBuildStep] = useState(-1);
  const [projectBlueprint, setProjectBlueprint] = useState<ProjectBlueprint | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[] | undefined>(undefined);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [projectMemory, setProjectMemory] = useState<ProjectMemory | null>(null);
  const [dnaComposition, setDnaComposition]     = useState<DNAComposition | null>(null);
  const [sectionOwnership, setSectionOwnership] = useState<Record<string, string> | null>(null);
  const [themeTokens, setThemeTokens]           = useState<ThemeTokens | null>(null);
  const [motionProfile, setMotionProfile]       = useState<MotionProfile | null>(null);
  const [initialized, setInitialized] = useState(false);
  const loadingRef = useRef(false);
  const projectFilesRef = useRef<ProjectFile[]>([]);
  const projectMemoryRef = useRef<ProjectMemory | null>(null);
  const dnaCompositionRef = useRef<DNAComposition | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Keep refs in sync for stale-closure-safe access inside callbacks
  useEffect(() => { projectFilesRef.current = projectFiles; }, [projectFiles]);
  useEffect(() => { projectMemoryRef.current = projectMemory; }, [projectMemory]);

  const loadChats = useCallback(async () => {
    try {
      const data = await getChats();
      // Merge with any locally saved chats (ids not already in Supabase)
      const localChats = getLocalChats();
      const supabaseIds = new Set(data.map((c) => c.id));
      const localOnly = localChats.filter((c) => !supabaseIds.has(c.id));
      setChats([...data, ...localOnly].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));
    } catch {
      // Supabase unavailable — fall back to localStorage entirely
      setChats(getLocalChats());
    }
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const msgs = await getMessages(chatId);
      if (msgs.length > 0) {
        setActiveChatMessages(msgs);
      } else {
        // Supabase returned nothing — try localStorage
        setActiveChatMessages(getLocalMessages(chatId));
      }
    } catch {
      setActiveChatMessages(getLocalMessages(chatId));
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

  // Load chats on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      loadChats().then(() => setInitialized(true));
    } else {
      // Not logged in — load from localStorage
      setChats(getLocalChats());
      setActiveChatIdState(null);
      setActiveChatMessages([]);
      setInitialized(true);
    }
  }, [isAuthenticated, loadChats]);

  const setActiveChatId = useCallback((id: string | null) => {
    setActiveChatIdState(id);
    setChatError('');
    setBuildStep(-1);
    setProjectBlueprint(null);
    setSectionOrder(undefined);
    setProjectFiles([]);
    setProjectMemory(null);
    if (id) {
      loadMessages(id);
      const cached = localStorage.getItem(CODE_KEY(id));
      setGeneratedCode(cached ?? '');
      // Restore persisted project files
      try {
        const cachedFiles = localStorage.getItem(FILES_KEY(id));
        if (cachedFiles) setProjectFiles(JSON.parse(cachedFiles));
      } catch {}
      // Restore project memory
      const mem = loadProjectMemory(id);
      if (mem) setProjectMemory(mem);
    } else {
      setGeneratedCode('');
    }
  }, [loadMessages]);

  const handleNewChat = useCallback(async () => {
    const now = new Date().toISOString();
    let chat: Chat;
    try {
      chat = await createChat();
    } catch {
      chat = {
        id: crypto.randomUUID(),
        user_id: 'local',
        title: 'New chat',
        created_at: now,
        updated_at: now,
      };
    }
    addLocalChat(chat);
    setChats((prev) => {
      if (prev.some((c) => c.id === chat.id)) return prev;
      return [chat, ...prev];
    });
    setActiveChatIdState(chat.id);
    setActiveChatMessages([]);
    setChatError('');
    setGeneratedCode('');
    setBuildStep(-1);
    setProjectBlueprint(null);
    setSectionOrder(undefined);
    setProjectFiles([]);
    setProjectMemory(null);
    setView('chat');
    closeSidebar();
  }, [closeSidebar]);

  const handleSend = useCallback(
    async (content: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        setChatError('');

        let chatId = activeChatId;
        if (!chatId) {
          const now = new Date().toISOString();
          const title = content.slice(0, 50) + (content.length > 50 ? '…' : '');
          let newChat: Chat;
          try {
            newChat = await createChat(title);
          } catch {
            newChat = {
              id: crypto.randomUUID(),
              user_id: 'local',
              title,
              created_at: now,
              updated_at: now,
            };
          }
          // Always persist locally so it survives reloads
          addLocalChat(newChat);
          chatId = newChat.id;
          setChats((prev) => {
            if (prev.some((c) => c.id === newChat.id)) return prev;
            return [newChat, ...prev];
          });
          setActiveChatIdState(newChat.id);
        }

        // Save user message (Supabase first, localStorage fallback)
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
        addLocalMessage(userMsg);
        setActiveChatMessages((prev) =>
          prev.some((m) => m.id === userMsg.id) ? prev : [...prev, userMsg]
        );

        setIsTyping(true);
        setStreamingContent('');

        // Snapshot refs so the closures below don't go stale
        const currentFiles  = projectFilesRef.current;
        const currentMemory = projectMemoryRef.current;
        const isEditMode    = currentFiles.length > 0;

        // ── Shared callbacks ─────────────────────────────────────────────────
        const handleDone = async (
          fullText: string,
          code: string,
          pb?: ProjectBlueprint,
          so?: string[],
          serverFiles?: ProjectFile[]
        ) => {
          let assistantMsg: Message;
          try {
            assistantMsg = await addMessage(chatId!, 'assistant', fullText || 'Done');
          } catch {
            assistantMsg = {
              id: crypto.randomUUID(),
              chat_id: chatId!,
              role: 'assistant',
              content: fullText || 'Done',
              created_at: new Date().toISOString(),
            };
          }
          addLocalMessage(assistantMsg);
          setActiveChatMessages((prev) =>
            prev.some((m) => m.id === assistantMsg.id) ? prev : [...prev, assistantMsg]
          );

          if (code && chatId) localStorage.setItem(CODE_KEY(chatId), code);

          setStreamingContent('');
          setIsTyping(false);
          setGeneratedCode(code);
          if (pb) setProjectBlueprint(pb);
          if (so) setSectionOrder(so);

          if (serverFiles && serverFiles.length > 0) {
            setProjectFiles(serverFiles);
            try { localStorage.setItem(FILES_KEY(chatId!), JSON.stringify(serverFiles)); } catch {}

            // Persist ProjectMemory
            const mem: ProjectMemory = isEditMode && currentMemory
              ? {
                  ...currentMemory,
                  generatedFiles: serverFiles.map(f => f.path + f.name),
                  dependencyGraph: buildDependencyGraph(serverFiles),
                  referenceComposition: dnaCompositionRef.current ?? currentMemory?.referenceComposition,
                  timestamp: Date.now(),
                }
              : {
                  projectType:     pb?.projectType    ?? 'App',
                  description:     pb?.description    ?? '',
                  pages:           pb?.pages          ?? [],
                  routes:          (pb?.pages ?? []).map((p: string) => `/${p.toLowerCase().replace(/\s+/g, '-')}`),
                  entities:        pb?.entities       ?? [],
                  features:        pb?.features       ?? [],
                  authProvider:    pb?.authProvider   ?? '',
                  generatedFiles:  serverFiles.map(f => f.path + f.name),
                  dependencyGraph: buildDependencyGraph(serverFiles),
                  referenceComposition: dnaCompositionRef.current ?? undefined,
                  timestamp:       Date.now(),
                };
            setProjectMemory(mem);
            saveProjectMemory(chatId!, mem);
          }

          setBuildStep(9);
          loadingRef.current = false;
          onCreditsChange?.();
        };

        const handleError = (err: string) => {
          setChatError(err);
          setStreamingContent('');
          setIsTyping(false);
          setBuildStep(-1);
          loadingRef.current = false;
        };

        const handleStep = (step: number) => setBuildStep(step);

        // ── Route: edit existing project OR full build ────────────────────────
        if (isEditMode) {
          await mockEditResponse(
            content,
            currentFiles,
            currentMemory,
            (token) => setStreamingContent((prev) => prev + token),
            handleDone,
            handleError,
            handleStep
          );
        } else {
          await mockStreamResponse(
            content,
            (token) => setStreamingContent((prev) => prev + token),
            handleDone,
            handleError,
            handleStep,
            (dna: DNABuildData) => {
              setDnaComposition(dna.composition);
              setSectionOwnership(dna.sectionOwnership);
              setThemeTokens(dna.themeTokens);
              setMotionProfile(dna.motionProfile);
              dnaCompositionRef.current = dna.composition;
            }
          );
        }
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
      } catch {}
      removeLocalChat(id);
      localStorage.removeItem(CODE_KEY(id));
      localStorage.removeItem(FILES_KEY(id));
      clearProjectMemory(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatIdState(null);
        setActiveChatMessages([]);
        setChatError('');
        setGeneratedCode('');
        setBuildStep(-1);
        setProjectBlueprint(null);
        setSectionOrder(undefined);
        setProjectFiles([]);
        setProjectMemory(null);
      }
    },
    [activeChatId]
  );

  const handleRenameChat = useCallback(async (id: string, title: string) => {
    try {
      await updateChatTitle(id, title);
    } catch {}
    updateLocalChatTitle(id, title);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
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
    projectBlueprint,
    sectionOrder,
    projectFiles,
    projectMemory,
    dnaComposition,
    sectionOwnership,
    themeTokens,
    motionProfile,
    handleSend,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    loadChats,
    loadMessages,
    initialized,
  };
}
