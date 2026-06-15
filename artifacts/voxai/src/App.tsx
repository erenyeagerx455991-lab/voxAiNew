import { useRef, useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import MessageInput from './components/MessageInput';
import ProjectsView from './components/ProjectsView';
import AdminView from './components/AdminView';
import AuthView from './components/auth/AuthView';
import LandingPage from './components/LandingPage';
import SettingsPage from './components/SettingsPage';
import PreviewModal from './components/PreviewModal';
import WorkspacePreviewPanel from './components/WorkspacePreviewPanel';
import { useAppStore } from './hooks/useAppStore';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'signup' | null;

function AppContent() {
  const { user, loading, signOut, refreshProfile, isAuthenticated } = useAuth();
  const store = useAppStore(isAuthenticated, refreshProfile);
  const [landingShown, setLandingShown] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const pendingSentRef = useRef(false);

  // ── Resizable split panel ──────────────────────────────────────
  const [splitPos, setSplitPos] = useState(40); // % width for chat panel
  const [isMd, setIsMd] = useState(() => window.innerWidth >= 768);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // gesture state: tracks each swipe/drag across both panels + divider
  const gestureRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    mode: 'idle' as 'idle' | 'detecting' | 'resize' | 'scroll',
    source: null as 'chat' | 'preview' | 'divider' | null,
  });

  useEffect(() => {
    const check = () => setIsMd(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const clamp = (v: number) => Math.min(75, Math.max(20, v));

  const applyResize = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSplitPos(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  // Call this on mousedown / touchstart anywhere on a panel or the divider
  const startPanelGesture = useCallback((clientX: number, clientY: number, source: 'chat' | 'preview' | 'divider') => {
    if (!isMd) return;
    const mode = source === 'divider' ? 'resize' : 'detecting';
    gestureRef.current = { active: true, startX: clientX, startY: clientY, mode, source };
    if (source === 'divider') {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
  }, [isMd]);

  const onGestureMove = useCallback((clientX: number, clientY: number) => {
    const g = gestureRef.current;
    if (!g.active) return;
    const dx = clientX - g.startX;
    const dy = clientY - g.startY;
    // direction detection: lock mode on first significant movement
    if (g.mode === 'detecting' && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      g.mode = Math.abs(dx) >= Math.abs(dy) ? 'resize' : 'scroll';
      if (g.mode === 'resize') {
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }
    }
    if (g.mode === 'resize') applyResize(clientX);
  }, [applyResize]);

  const onGestureEnd = useCallback((_clientX: number, _clientY: number) => {
    const g = gestureRef.current;
    // If tap on preview panel (no resize), briefly disable overlay so click reaches iframe
    if (g.source === 'preview' && g.mode !== 'resize' && overlayRef.current) {
      overlayRef.current.style.pointerEvents = 'none';
      setTimeout(() => {
        if (overlayRef.current) overlayRef.current.style.pointerEvents = 'auto';
      }, 200);
    }
    gestureRef.current = { active: false, startX: 0, startY: 0, mode: 'idle', source: null };
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => onGestureMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      onGestureMove(e.touches[0].clientX, e.touches[0].clientY);
      // Block page scroll only when actively resizing
      if (gestureRef.current.mode === 'resize') e.preventDefault();
    };
    const onMouseUp = (e: MouseEvent) => onGestureEnd(e.clientX, e.clientY);
    const onTouchEnd = (e: TouchEvent) => onGestureEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onGestureMove, onGestureEnd]);

  // Authenticated + pending message → send it and go to workspace
  useEffect(() => {
    if (
      isAuthenticated &&
      store.initialized &&
      pendingMessage &&
      !pendingSentRef.current
    ) {
      pendingSentRef.current = true;
      setLandingShown(false);
      setAuthMode(null);
      store.setView('chat');
      store.handleSend(pendingMessage).finally(() => {
        setPendingMessage('');
        pendingSentRef.current = false;
      });
    }
  }, [isAuthenticated, store.initialized, pendingMessage, store.handleSend, store.setView]);

  const handleLandingSubmit = (text: string) => {
    setPendingMessage(text);
    if (!isAuthenticated) {
      setAuthMode('signup');
    } else {
      setLandingShown(false);
      store.setView('chat');
    }
  };

  const handleCreateProject = () => {
    setLandingShown(true);
    setAuthMode(null);
  };

  const handleOpenProjectsFromLanding = () => {
    if (isAuthenticated) {
      setLandingShown(false);
      store.setView('projects');
    } else {
      setAuthMode('login');
    }
  };

  const handleOpenProject = (chatId: string) => {
    store.setActiveChatId(chatId);
    store.setView('chat');
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading || !store.initialized) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-white dark:bg-[#181817]">
        <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center mb-4 animate-pulse">
          <Sparkles size={24} className="text-white dark:text-black" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  // ── Settings overlay ────────────────────────────────────────────
  if (showSettings) {
    return <SettingsPage onClose={() => setShowSettings(false)} />;
  }

  // ── Landing / Auth flow ────────────────────────────────────────
  if (landingShown) {
    if (!isAuthenticated && authMode) {
      return (
        <AuthView
          initialMode={authMode}
          onBack={() => setAuthMode(null)}
        />
      );
    }

    return (
      <LandingPage
        onLogin={() => setAuthMode('login')}
        onSignup={() => setAuthMode('signup')}
        onSubmit={handleLandingSubmit}
        onOpenProjects={handleOpenProjectsFromLanding}
        onOpenSettings={() => setShowSettings(true)}
        onSignOut={signOut}
        profile={user}
        hideAuthButtons={isAuthenticated}
      />
    );
  }

  // ── Main authenticated app ────────────────────────────────────
  const activeChat = store.chats.find((c) => c.id === store.activeChatId);
  const headerTitle =
    store.view === 'chat'
      ? (activeChat?.title || '')
      : store.view === 'projects'
        ? 'Projects'
        : 'Admin Dashboard';

  const isWorkspaceView = store.view === 'chat';

  return (
    <>
      <div className="h-[100dvh] flex flex-col bg-white dark:bg-[#181817] md:bg-[#181817] overflow-hidden">
        <Sidebar
          open={store.sidebarOpen}
          onClose={store.closeSidebar}
          view={store.view}
          onViewChange={store.setView}
          chats={store.chats}
          activeChatId={store.activeChatId}
          onChatSelect={store.setActiveChatId}
          onNewChat={store.handleNewChat}
          onDeleteChat={store.handleDeleteChat}
          onRenameChat={store.handleRenameChat}
          profile={user}
          onSignOut={signOut}
          onGoHome={() => setLandingShown(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
        <Header
          onMenuClick={store.toggleSidebar}
          title={headerTitle}
          profile={user}
          showPreview={isWorkspaceView}
          hasCode={!!store.generatedCode}
          onPreview={() => setShowPreviewModal(true)}
        />

        <main
          ref={containerRef}
          className="flex-1 flex flex-col md:flex-row mt-14 overflow-hidden"
        >
          {store.view === 'chat' && (
            <>
              {/* ── Chat panel: full width on mobile, dynamic on split ── */}
              <div
                className="flex flex-col overflow-hidden bg-white dark:bg-[#181817] md:bg-[#181817] md:shrink-0"
                style={isMd ? { width: `${splitPos}%` } : { width: '100%' }}
                onMouseDown={isMd ? (e) => startPanelGesture(e.clientX, e.clientY, 'chat') : undefined}
                onTouchStart={isMd ? (e) => startPanelGesture(e.touches[0].clientX, e.touches[0].clientY, 'chat') : undefined}
              >
                <ChatView
                  messages={store.activeChatMessages}
                  isTyping={store.isTyping}
                  streamingContent={store.streamingContent}
                  chatError={store.chatError}
                  buildStep={store.buildStep}
                  isEditMode={store.projectFiles.length > 0}
                  lastEditDiff={store.lastEditDiff}
                />
                <MessageInput onSend={store.handleSend} disabled={store.isTyping} />
              </div>

              {/* ── Drag handle divider: only on md+ ── */}
              <div
                onMouseDown={(e) => { e.preventDefault(); startPanelGesture(e.clientX, e.clientY, 'divider'); }}
                onTouchStart={(e) => { e.preventDefault(); startPanelGesture(e.touches[0].clientX, e.touches[0].clientY, 'divider'); }}
                className="hidden md:flex w-[5px] shrink-0 cursor-col-resize items-center justify-center bg-white/4 hover:bg-indigo-500/30 active:bg-indigo-500/50 transition-colors group z-10"
                title="Drag to resize"
              >
                <div className="flex flex-col gap-1">
                  <div className="w-0.5 h-1.5 rounded-full bg-white/25 group-hover:bg-indigo-400/70 transition-colors" />
                  <div className="w-0.5 h-1.5 rounded-full bg-white/25 group-hover:bg-indigo-400/70 transition-colors" />
                  <div className="w-0.5 h-1.5 rounded-full bg-white/25 group-hover:bg-indigo-400/70 transition-colors" />
                </div>
              </div>

              {/* ── Preview panel: hidden on mobile, dynamic on split ── */}
              <div className="hidden md:flex flex-col flex-1 overflow-hidden relative">
                <WorkspacePreviewPanel
                  code={store.generatedCode}
                  isBuilding={store.isTyping}
                  buildStep={store.buildStep}
                  projectBlueprint={store.projectBlueprint}
                  sectionOrder={store.sectionOrder}
                  projectFiles={store.projectFiles}
                  dnaComposition={store.dnaComposition}
                  sectionOwnership={store.sectionOwnership}
                  themeTokens={store.themeTokens}
                  motionProfile={store.motionProfile}
                  lastEditDiff={store.lastEditDiff}
                  canUndo={store.canUndo}
                  canRedo={store.canRedo}
                  onUndo={store.undoEdit}
                  onRedo={store.redoEdit}
                />
                {/* Transparent overlay — captures swipe anywhere on preview to resize.
                    Taps pass through automatically (pointer-events toggled in onGestureEnd). */}
                <div
                  ref={overlayRef}
                  className="absolute inset-0 z-10"
                  style={{ pointerEvents: 'auto', touchAction: 'none' }}
                  onMouseDown={(e) => startPanelGesture(e.clientX, e.clientY, 'preview')}
                  onTouchStart={(e) => startPanelGesture(e.touches[0].clientX, e.touches[0].clientY, 'preview')}
                />
              </div>
            </>
          )}
          {store.view === 'projects' && (
            <ProjectsView
              chats={store.chats}
              onOpenProject={handleOpenProject}
              onCreateProject={handleCreateProject}
              onDeleteChat={store.handleDeleteChat}
              onRenameChat={store.handleRenameChat}
            />
          )}
          {store.view === 'admin' && <AdminView />}
        </main>
      </div>

      {/* ── Preview Modal (full-screen overlay) ── */}
      {showPreviewModal && store.generatedCode && (
        <PreviewModal
          code={store.generatedCode}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
