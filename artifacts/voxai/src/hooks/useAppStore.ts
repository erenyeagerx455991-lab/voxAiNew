import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createChat, getChats, getMessages, updateChatTitle, deleteChat, addMessage } from '../services/chatService';
import { saveProject, deleteProject as deleteProjectApi, renameProject as renameProjectApi, getProject } from '../services/projectService';
import { mockStreamResponse, mockEditResponse, runtimeRepair } from '../services/mockAiService';
import type { ProjectBlueprint, ProjectFile, ProjectMemory, DNAComposition, ThemeTokens, MotionProfile, DNABuildData, EditOperation, EditDiff, ComponentRegistry, BuildHealth, ProjectKnowledgeGraph, RegistrySelection, RegistryHealth, RegistryFileMap, ComponentHistory, RuntimeState, RuntimeRepairRecord, RepairMetrics, SelfHealingState, RuntimeHealthV3, RuntimeTimeline, AutonomousBuildState } from '../services/builderService';
import { saveProjectMemory, loadProjectMemory, clearProjectMemory, buildDependencyGraph, buildComponentRegistry, saveKnowledgeGraph, loadKnowledgeGraph, clearKnowledgeGraph, saveRegistrySelection, loadRegistrySelection, clearRegistrySelection, buildRegistryFileMap, saveComponentHistory, loadComponentHistory, addComponentHistoryEntry, saveRepairHistory, loadRepairHistory, computeRepairMetrics, clearRepairHistory } from '../services/builderService';
import type { ProjectTemplate } from '../services/templateMarketplace';
import { TEMPLATE_LIBRARY, saveSelectedTemplate, loadSelectedTemplate, saveTemplateHistory, loadTemplateHistory, clearTemplateData } from '../services/templateMarketplace';
import type { View, Chat, Message } from '../lib/types';

export type { View, Chat, Message };
export type { ProjectBlueprint, ProjectFile };
export type { EditOperation, EditDiff, ComponentRegistry, BuildHealth, ProjectKnowledgeGraph, RegistrySelection, RegistryHealth, RegistryFileMap, ComponentHistory };
export type { RegistryHealthV2, EditImpact } from '../services/mockAiService';
export type { ProjectTemplate };
export type { RuntimeState };
export type { RuntimeRepairRecord, RepairMetrics, SelfHealingState };
export type { RuntimeHealthV3, RuntimeTimeline, AutonomousBuildState };

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
  editHistory: EditOperation[];
  lastEditDiff: EditDiff | null;
  canUndo: boolean;
  canRedo: boolean;
  editIntentType: string;
  editTargetFiles: string[];
  editQualityScore: number;
  buildHealth: BuildHealth | null;
  knowledgeGraph: ProjectKnowledgeGraph | null;
  graphContext: { filesLoaded: number; filesSkipped: number; tokensSaved: number; resolvedNodes: string[] } | null;
  runtimeErrors: { file: string; message: string; stack?: string; component?: string }[];
  runtimeRepairAttempt: number;
  onRuntimeError: (err: { file: string; message: string; stack?: string; component?: string }) => void;
  registrySelection: RegistrySelection | null;
  registryHealth: RegistryHealth | null;
  lockedComponents: string[];
  lockComponent: (cat: string) => void;
  unlockComponent: (cat: string) => void;
  registryFileMap: RegistryFileMap | null;
  componentHistory: ComponentHistory | null;
  editSafetyScore: number;
  lastEditImpact: { affectedSections: string[]; lockedConflicts: string[] } | null;
  selectedTemplate: ProjectTemplate | null;
  setSelectedTemplate: (t: ProjectTemplate | null) => void;
  autoMatchedTemplate: { templateId: string; templateName: string; confidence: number } | null;
  templateHistory: ProjectTemplate[];
  runtimeState: RuntimeState | null;
  repairHistory: RuntimeRepairRecord[];
  repairMetrics: RepairMetrics | null;
  selfHealingState: SelfHealingState | null;
  runtimeHealthV3: RuntimeHealthV3 | null;
  runtimeTimeline: RuntimeTimeline | null;
  autonomousBuildState: AutonomousBuildState | null;
  undoEdit: () => void;
  redoEdit: () => void;
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
  const [editHistory, setEditHistory] = useState<EditOperation[]>([]);
  const [lastEditDiff, setLastEditDiff] = useState<EditDiff | null>(null);
  const [editIntentType, setEditIntentType] = useState('');
  const [editTargetFiles, setEditTargetFiles] = useState<string[]>([]);
  const [editQualityScore, setEditQualityScore] = useState(100);
  const [buildHealth, setBuildHealth] = useState<BuildHealth | null>(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState<ProjectKnowledgeGraph | null>(null);
  const [graphContext, setGraphContext] = useState<{ filesLoaded: number; filesSkipped: number; tokensSaved: number; resolvedNodes: string[] } | null>(null);
  const [runtimeErrors, setRuntimeErrors] = useState<{ file: string; message: string; stack?: string; component?: string }[]>([]);
  const [registrySelection, setRegistrySelection] = useState<RegistrySelection | null>(null);
  const [registryHealth, setRegistryHealth] = useState<RegistryHealth | null>(null);
  const [lockedComponents, setLockedComponents] = useState<string[]>([]);
  const [registryFileMap, setRegistryFileMap] = useState<RegistryFileMap | null>(null);
  const [componentHistory, setComponentHistory] = useState<ComponentHistory | null>(null);
  const [editSafetyScore, setEditSafetyScore] = useState<number>(100);
  const [lastEditImpact, setLastEditImpact] = useState<{ affectedSections: string[]; lockedConflicts: string[] } | null>(null);
  const [selectedTemplate, setSelectedTemplateState] = useState<ProjectTemplate | null>(null);
  const [autoMatchedTemplate, setAutoMatchedTemplate] = useState<{ templateId: string; templateName: string; confidence: number } | null>(null);
  const [templateHistory, setTemplateHistory] = useState<ProjectTemplate[]>([]);
  const [runtimeRepairAttempt, setRuntimeRepairAttempt] = useState(0);
  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null);
  const [repairHistory, setRepairHistory] = useState<RuntimeRepairRecord[]>([]);
  const [repairMetrics, setRepairMetrics] = useState<RepairMetrics | null>(null);
  const [selfHealingState, setSelfHealingState] = useState<SelfHealingState | null>(null);
  const [runtimeHealthV3, setRuntimeHealthV3] = useState<RuntimeHealthV3 | null>(null);
  const [runtimeTimeline, setRuntimeTimeline] = useState<RuntimeTimeline | null>(null);
  const [autonomousBuildState, setAutonomousBuildState] = useState<AutonomousBuildState | null>(null);

  const setSelectedTemplate = useCallback((t: ProjectTemplate | null) => {
    setSelectedTemplateState(t);
    const cid = activeChatId;
    if (cid && t) saveSelectedTemplate(cid, t);
    else if (cid && !t) clearTemplateData(cid);
  }, [activeChatId]);
  const [initialized, setInitialized] = useState(false);
  const loadingRef = useRef(false);
  const projectFilesRef = useRef<ProjectFile[]>([]);
  const projectMemoryRef = useRef<ProjectMemory | null>(null);
  const dnaCompositionRef = useRef<DNAComposition | null>(null);
  const themeTokensRef = useRef<ThemeTokens | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const undoStackRef = useRef<ProjectFile[][]>([]);
  const redoStackRef = useRef<ProjectFile[][]>([]);

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const lockComponent = useCallback((cat: string) => {
    setLockedComponents(prev => {
      const next = prev.includes(cat) ? prev : [...prev, cat];
      const cid = activeChatId;
      if (cid) saveRegistrySelection(cid, registrySelection ?? {}, next);
      return next;
    });
  }, [activeChatId, registrySelection]);

  const unlockComponent = useCallback((cat: string) => {
    setLockedComponents(prev => {
      const next = prev.filter(c => c !== cat);
      const cid = activeChatId;
      if (cid) saveRegistrySelection(cid, registrySelection ?? {}, next);
      return next;
    });
  }, [activeChatId, registrySelection]);

  // Keep refs in sync for stale-closure-safe access inside callbacks
  useEffect(() => { projectFilesRef.current = projectFiles; }, [projectFiles]);
  useEffect(() => { projectMemoryRef.current = projectMemory; }, [projectMemory]);
  useEffect(() => { themeTokensRef.current = themeTokens; }, [themeTokens]);

  const undoEdit = useCallback(() => {
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;
    redoStackRef.current.push([...projectFilesRef.current]);
    setProjectFiles(snapshot);
    projectFilesRef.current = snapshot;
    const chatId = activeChatId;
    if (chatId) {
      try { localStorage.setItem(FILES_KEY(chatId), JSON.stringify(snapshot)); } catch {}
    }
  }, [activeChatId]);

  const redoEdit = useCallback(() => {
    const snapshot = redoStackRef.current.pop();
    if (!snapshot) return;
    undoStackRef.current.push([...projectFilesRef.current]);
    setProjectFiles(snapshot);
    projectFilesRef.current = snapshot;
    const chatId = activeChatId;
    if (chatId) {
      try { localStorage.setItem(FILES_KEY(chatId), JSON.stringify(snapshot)); } catch {}
    }
  }, [activeChatId]);

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
      // Restore persisted project files — localStorage first, backend DB fallback
      try {
        const cachedFiles = localStorage.getItem(FILES_KEY(id));
        if (cachedFiles) {
          setProjectFiles(JSON.parse(cachedFiles));
        } else {
          // Not in local cache (new device / cleared storage) — fetch from DB
          void getProject(id).then((project) => {
            if (project?.files && project.files.length > 0) {
              setProjectFiles(project.files as Parameters<typeof setProjectFiles>[0]);
              try { localStorage.setItem(FILES_KEY(id), JSON.stringify(project.files)); } catch {}
            }
            if (project?.previewHtml) {
              setGeneratedCode(project.previewHtml);
              try { localStorage.setItem(CODE_KEY(id), project.previewHtml); } catch {}
            }
          });
        }
      } catch {}
      // Restore project memory
      const mem = loadProjectMemory(id);
      if (mem) setProjectMemory(mem);
      // Restore knowledge graph
      const graph = loadKnowledgeGraph(id);
      if (graph) setKnowledgeGraph(graph);
    } else {
      setGeneratedCode('');
      setKnowledgeGraph(null);
      setRegistrySelection(null);
      setRegistryHealth(null);
      setLockedComponents([]);
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
    setKnowledgeGraph(null);
    setRegistrySelection(null);
    setRegistryHealth(null);
    setLockedComponents([]);
    setGraphContext(null);
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
          serverFiles?: ProjectFile[],
          diff?: EditDiff
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
            // For edit mode: save snapshot to undo stack before applying
            if (isEditMode && currentFiles.length > 0) {
              undoStackRef.current.push([...currentFiles]);
              redoStackRef.current = [];
            }

            setProjectFiles(serverFiles);
            if (diff) setLastEditDiff(diff);
            try { localStorage.setItem(FILES_KEY(chatId!), JSON.stringify(serverFiles)); } catch {}

            // Build component registry from new files
            const newRegistry = buildComponentRegistry(serverFiles);

            // V5.3: If this is a full build (not edit), graph was already received via onKnowledgeGraph callback.
            // On edit, rebuild graph from updated files to keep it in sync.
            if (isEditMode) {
              const { buildKnowledgeGraph } = await import('../services/builderService');
              const updatedGraph = buildKnowledgeGraph(serverFiles, pb ?? undefined);
              setKnowledgeGraph(updatedGraph);
              if (chatId) saveKnowledgeGraph(chatId, updatedGraph);
            }

            // Persist ProjectMemory
            const prevHistory = isEditMode && currentMemory ? (currentMemory.editHistory ?? []) : [];
            const editOp: EditOperation | null = isEditMode && diff ? {
              id: crypto.randomUUID(),
              prompt: content,
              timestamp: Date.now(),
              changedFiles: diff.changedFiles,
              createdFiles: diff.createdFiles,
              deletedFiles: diff.deletedFiles,
              snapshotFiles: currentFiles,
            } : null;

            const mem: ProjectMemory = isEditMode && currentMemory
              ? {
                  ...currentMemory,
                  generatedFiles: serverFiles.map(f => f.path + f.name),
                  dependencyGraph: buildDependencyGraph(serverFiles),
                  componentRegistry: newRegistry,
                  editHistory: editOp ? [...prevHistory.slice(-49), editOp] : prevHistory,
                  referenceComposition: dnaCompositionRef.current ?? currentMemory?.referenceComposition,
                  timestamp: Date.now(),
                }
              : {
                  projectType:      pb?.projectType    ?? 'App',
                  description:      pb?.description    ?? '',
                  pages:            pb?.pages          ?? [],
                  routes:           (pb?.pages ?? []).map((p: string) => `/${p.toLowerCase().replace(/\s+/g, '-')}`),
                  entities:         pb?.entities       ?? [],
                  features:         pb?.features       ?? [],
                  authProvider:     pb?.authProvider   ?? '',
                  generatedFiles:   serverFiles.map(f => f.path + f.name),
                  dependencyGraph:  buildDependencyGraph(serverFiles),
                  componentRegistry: newRegistry,
                  editHistory:      [],
                  referenceComposition: dnaCompositionRef.current ?? undefined,
                  timestamp:        Date.now(),
                };
            setProjectMemory(mem);
            if (editOp) setEditHistory(prev => [...prev.slice(-49), editOp]);
            saveProjectMemory(chatId!, mem);

            // Auto-save project files to backend DB (fire-and-forget)
            // userId is derived server-side; we never send it from the client.
            void (async () => {
              try {
                const previewFile = serverFiles.find(f => f.name === 'index.html') ?? serverFiles[0];
                await saveProject({
                  chatId: chatId!,
                  title: content.slice(0, 80),
                  prompt: content,
                  files: serverFiles.map(f => ({
                    name: f.name,
                    content: f.content,
                    lang: (f as { lang?: string }).lang ?? '',
                    path: (f as { path?: string }).path ?? '',
                  })),
                  fileCount: serverFiles.length,
                  previewHtml: previewFile?.content?.slice(0, 50_000) ?? null,
                });
              } catch { /* silently ignore save errors */ }
            })();
          }

          setBuildStep(9);
          loadingRef.current = false;
          onCreditsChange?.();

          // V6.2: Kick off Autonomous Runtime Builder after full build completes
          if (serverFiles && serverFiles.length > 0 && chatId) {
            const filesForAB = serverFiles.map(f => ({ name: f.name, content: f.content, lang: f.lang, path: f.path ?? '' }));
            setAutonomousBuildState({ active: true, currentPass: 0, maxPasses: 5, phase: 'deps', healthScore: 0, passScores: [], previewGatePass: false, depGraph: null, healthV3: null, timeline: null });
            (async () => {
              try {
                const resp = await fetch('/api/agents/autonomous-build', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chatId, files: filesForAB }),
                });
                if (!resp.ok || !resp.body) return;
                const reader = resp.body.getReader();
                const dec = new TextDecoder();
                let buf = '';
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buf += dec.decode(value, { stream: true });
                  const parts = buf.split('\n\n');
                  buf = parts.pop() ?? '';
                  for (const part of parts) {
                    if (!part.startsWith('data:')) continue;
                    try {
                      const ev = JSON.parse(part.slice(5).trim());
                      if (ev.type === 'autonomous_phase') {
                        setAutonomousBuildState(prev => prev ? { ...prev, phase: ev.phase as AutonomousBuildState['phase'] } : prev);
                      } else if (ev.type === 'dependency_plan' && ev.depGraph) {
                        setAutonomousBuildState(prev => prev ? { ...prev, depGraph: ev.depGraph } : prev);
                      } else if (ev.type === 'autonomous_build_pass') {
                        setAutonomousBuildState(prev => prev ? { ...prev, currentPass: ev.pass, healthScore: ev.health, passScores: ev.passScores ?? prev.passScores } : prev);
                      } else if (ev.type === 'runtime_health_v3' && ev.healthV3) {
                        setRuntimeHealthV3(ev.healthV3);
                        setAutonomousBuildState(prev => prev ? { ...prev, healthV3: ev.healthV3, healthScore: ev.healthV3.overall, passScores: ev.passScores ?? prev.passScores } : prev);
                      } else if (ev.type === 'runtime_timeline' && ev.timeline) {
                        setRuntimeTimeline(ev.timeline);
                        setAutonomousBuildState(prev => prev ? { ...prev, timeline: ev.timeline } : prev);
                      } else if (ev.type === 'preview_gate_pass') {
                        setAutonomousBuildState(prev => prev ? { ...prev, previewGatePass: true } : prev);
                      } else if (ev.type === 'preview_gate_repaired') {
                        setAutonomousBuildState(prev => prev ? { ...prev, previewGatePass: ev.gatePass ?? false } : prev);
                      } else if (ev.type === 'autonomous_build_done') {
                        setAutonomousBuildState(prev => prev ? {
                          ...prev, active: false, phase: 'done',
                          previewGatePass: ev.gatePass ?? false,
                          healthScore: ev.healthV3?.overall ?? prev.healthScore,
                          healthV3: ev.healthV3 ?? prev.healthV3,
                          timeline: ev.timeline ?? prev.timeline,
                        } : prev);
                        if (ev.healthV3) setRuntimeHealthV3(ev.healthV3);
                        if (ev.timeline) setRuntimeTimeline(ev.timeline);
                      } else if (ev.type === 'autonomous_build_error') {
                        setAutonomousBuildState(prev => prev ? { ...prev, active: false, phase: 'done' } : prev);
                        console.warn('[AutonomousBuild] error:', ev.error);
                      }
                    } catch { /* parse error — skip */ }
                  }
                }
              } catch (e) {
                console.warn('[AutonomousBuild] fetch error:', e);
                setAutonomousBuildState(prev => prev ? { ...prev, active: false, phase: 'done' } : prev);
              }
            })();
          }
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
          const registry = currentMemory?.componentRegistry ?? buildComponentRegistry(currentFiles);
          const themeTokensSnapshot = themeTokensRef.current;
          const graphSnapshot = knowledgeGraph;
          const currentLockedComponents = lockedComponents;
          const currentRegistryFileMap = registryFileMap;
          await mockEditResponse(
            content,
            currentFiles,
            currentMemory,
            (token) => setStreamingContent((prev) => prev + token),
            handleDone,
            handleError,
            handleStep,
            (editType, targetFiles, _reason) => {
              setEditIntentType(editType);
              setEditTargetFiles(targetFiles);
            },
            (files) => { setEditTargetFiles(files); },
            (score, _passed, _issues) => { setEditQualityScore(score); },
            registry,
            themeTokensSnapshot as Record<string, unknown> | null,
            graphSnapshot,
            (ctx) => setGraphContext(ctx),
            currentLockedComponents,
            currentRegistryFileMap ?? undefined,
            (health) => setEditSafetyScore(health.editSafetyScore),
            (impact) => setLastEditImpact({ affectedSections: impact.affectedSections, lockedConflicts: impact.lockedConflicts }),
            (retryAttempt, violations) => console.log(`[V5.5] Locked protection retry=${retryAttempt} violations=${violations.join(',')}`)
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
            },
            (health: BuildHealth) => setBuildHealth(health),
            (graph: ProjectKnowledgeGraph) => {
              setKnowledgeGraph(graph);
              const cid = activeChatId;
              if (cid) saveKnowledgeGraph(cid, graph);
            },
            (sel: RegistrySelection) => {
              setRegistrySelection(sel);
              setLockedComponents([]);
              const cid = activeChatId;
              if (cid) saveRegistrySelection(cid, sel, []);
              // V5.5: build registryFileMap from new selection + current files
              const files = projectFilesRef.current;
              if (files.length > 0) {
                const fileMap = buildRegistryFileMap(files, sel);
                setRegistryFileMap(fileMap);
              }
              // V5.5: seed component history with generated entries
              const hist: ComponentHistory = {};
              for (const [cat, hint] of Object.entries(sel)) {
                const name = (hint as string).split(' ')[0] ?? cat;
                hist[cat] = [{ componentName: name, reason: 'generated', timestamp: Date.now() }];
              }
              setComponentHistory(hist);
              if (cid) saveComponentHistory(cid, hist);
            },
            (health: RegistryHealth) => setRegistryHealth(health),
            // V5.6: auto-matched template callback
            (templateId, templateName, confidence, _pages, _apis, _databaseTables, _features) => {
              setAutoMatchedTemplate({ templateId, templateName, confidence });
              // Store in template history
              const matched = TEMPLATE_LIBRARY.find(t => t.id === templateId);
              if (matched) {
                setTemplateHistory(prev => {
                  const next = [matched, ...prev.filter(h => h.id !== templateId)].slice(0, 5);
                  const cid = activeChatId;
                  if (cid) saveTemplateHistory(cid, next);
                  return next;
                });
              }
            },
            selectedTemplate?.id,
            activeChatId ?? undefined,
            (state: RuntimeState) => setRuntimeState(state)
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
      void deleteProjectApi(id);
      removeLocalChat(id);
      localStorage.removeItem(CODE_KEY(id));
      localStorage.removeItem(FILES_KEY(id));
      clearProjectMemory(id);
      clearKnowledgeGraph(id);
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
        setKnowledgeGraph(null);
        setGraphContext(null);
      }
    },
    [activeChatId]
  );

  const handleRenameChat = useCallback(async (id: string, title: string) => {
    try {
      await updateChatTitle(id, title);
    } catch {}
    void renameProjectApi(id, title);
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
    editHistory,
    lastEditDiff,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    editIntentType,
    editTargetFiles,
    editQualityScore,
    buildHealth,
    knowledgeGraph,
    graphContext,
    runtimeErrors,
    runtimeRepairAttempt,
    registrySelection,
    registryHealth,
    lockedComponents,
    lockComponent,
    unlockComponent,
    registryFileMap,
    componentHistory,
    editSafetyScore,
    lastEditImpact,
    selectedTemplate,
    setSelectedTemplate,
    autoMatchedTemplate,
    templateHistory,
    runtimeState,
    repairHistory,
    repairMetrics,
    selfHealingState,
    runtimeHealthV3,
    runtimeTimeline,
    autonomousBuildState,
    onRuntimeError: (err: { file: string; message: string; stack?: string; component?: string }) => {
      setRuntimeErrors(prev => [...prev.slice(-9), err]);
      // Auto-trigger V6.1 self-healing loop (max 3 attempts)
      setRuntimeRepairAttempt(prev => {
        const attempt = prev;
        if (attempt >= 3) return prev;
        const currentFiles = projectFilesRef.current;
        if (currentFiles.length === 0) return prev;
        const chatId = activeChatId;
        const kgSnapshot = knowledgeGraph;
        const lockedSnapshot = lockedComponents;

        setSelfHealingState({ active: true, currentAttempt: attempt + 1, maxAttempts: 3, category: 'unknown', targetFile: err.file, phase: 'classify', lastQualityScore: 0 });

        runtimeRepair(
          currentFiles, err, attempt,
          (repairedFiles, repairedFile, category, qualityScore) => {
            console.log(`[RuntimeRepair V6.1] Repaired ${repairedFile} (${category}, quality=${qualityScore})`);
            setProjectFiles(repairedFiles);
            projectFilesRef.current = repairedFiles;
            try {
              if (chatId) localStorage.setItem(`voxai_files_${chatId}`, JSON.stringify(repairedFiles));
            } catch {}
            // Update repair history from localStorage
            if (chatId) {
              const hist = loadRepairHistory(chatId);
              setRepairHistory(hist);
              setRepairMetrics(computeRepairMetrics(hist));
            }
            setSelfHealingState(prev => prev ? { ...prev, active: false, phase: 'done' } : null);
          },
          (reason) => {
            console.warn(`[RuntimeRepair V6.1] Attempt ${attempt + 1} failed: ${reason}`);
            setSelfHealingState(prev => prev ? { ...prev, active: false, phase: 'done' } : null);
          },
          kgSnapshot,
          lockedSnapshot,
          chatId ?? undefined,
          (event) => {
            setSelfHealingState(prev => {
              if (!prev) return prev;
              const phase =
                event.type === 'repair_classify'  ? 'classify' :
                event.type === 'repair_targets'   ? 'target' :
                event.type === 'repair_generate'  ? 'generate' :
                event.type === 'repair_validate'  ? 'validate' :
                event.type === 'repair_complete'  ? 'done' : prev.phase;
              return {
                ...prev,
                phase,
                category: event.category ?? prev.category,
                targetFile: event.file ?? prev.targetFile,
                lastQualityScore: event.score ?? prev.lastQualityScore,
                currentAttempt: event.attempt ?? prev.currentAttempt,
              };
            });
          }
        );
        return prev + 1;
      });
    },
    undoEdit,
    redoEdit,
    handleSend,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    loadChats,
    loadMessages,
    initialized,
  };
}
