import { useRef, useEffect, useState } from 'react';
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
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-white dark:bg-gray-900">
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
  const headerTitle =
    store.view === 'chat'
      ? 'VoxAI'
      : store.view === 'projects'
        ? 'Projects'
        : 'Admin Dashboard';

  const isWorkspaceView = store.view === 'chat';

  return (
    <>
      <div className="h-[100dvh] flex flex-col bg-white dark:bg-gray-900 md:bg-[#111118] overflow-hidden">
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

        <main className="flex-1 flex flex-col md:flex-row mt-14 overflow-hidden">
          {store.view === 'chat' && (
            <>
              {/* ── Chat panel: full width on mobile, 40% on split ── */}
              <div className="w-full md:w-2/5 flex flex-col overflow-hidden bg-white dark:bg-gray-900 md:bg-[#111118] md:border-r md:border-white/8">
                <ChatView
                  messages={store.activeChatMessages}
                  isTyping={store.isTyping}
                  streamingContent={store.streamingContent}
                  chatError={store.chatError}
                  buildStep={store.buildStep}
                />
                <MessageInput onSend={store.handleSend} disabled={store.isTyping} />
              </div>

              {/* ── Preview panel: hidden on mobile, 60% on split ── */}
              <div className="hidden md:flex md:w-3/5 flex-col overflow-hidden">
                <WorkspacePreviewPanel
                  code={store.generatedCode}
                  isBuilding={store.isTyping}
                  buildStep={store.buildStep}
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
