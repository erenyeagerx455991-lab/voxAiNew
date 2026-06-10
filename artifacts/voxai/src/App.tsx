import { useRef, useEffect, useCallback, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import MessageInput from './components/MessageInput';
import ProjectsView from './components/ProjectsView';
import AdminView from './components/AdminView';
import AuthView from './components/auth/AuthView';
import LandingPage from './components/LandingPage';
import { useAppStore } from './hooks/useAppStore';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'signup' | null;

function AppContent() {
  const { user, loading, signOut, refreshProfile, isAuthenticated } = useAuth();
  const store = useAppStore(isAuthenticated, refreshProfile);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Always show landing first — regardless of auth state
  const [landingShown, setLandingShown] = useState(true);
  // null = landing, 'login'/'signup' = auth form (only for unauthenticated)
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const pendingSentRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [store.activeChatMessages.length, store.isTyping, store.streamingContent, store.chatError, scrollToBottom]);

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
    }
    // If authenticated, the useEffect above handles redirect
  };

  // "Create project" from Projects view → go back to home/landing
  const handleCreateProject = () => {
    setLandingShown(true);
    setAuthMode(null);
  };

  // Hamburger → Projects on landing page
  const handleOpenProjectsFromLanding = () => {
    if (isAuthenticated) {
      setLandingShown(false);
      store.setView('projects');
    } else {
      setAuthMode('login');
    }
  };

  // Open a project card → switch to that chat in workspace
  const handleOpenProject = (chatId: string) => {
    store.setActiveChatId(chatId);
    store.setView('chat');
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading || !store.initialized) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-4 animate-pulse">
          <Sparkles size={24} className="text-white" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  // ── Landing / Auth flow ────────────────────────────────────────
  if (landingShown) {
    // Non-authenticated user clicked Login or Signup → show auth form
    if (!isAuthenticated && authMode) {
      return (
        <AuthView
          initialMode={authMode}
          onBack={() => setAuthMode(null)}
        />
      );
    }

    // Landing page — hide auth buttons if already logged in
    return (
      <LandingPage
        onLogin={() => setAuthMode('login')}
        onSignup={() => setAuthMode('signup')}
        onSubmit={handleLandingSubmit}
        onOpenProjects={handleOpenProjectsFromLanding}
        hideAuthButtons={isAuthenticated}
      />
    );
  }

  // ── Main authenticated app ────────────────────────────────────
  const headerTitle =
    store.view === 'chat'
      ? store.chats.find((c) => c.id === store.activeChatId)?.title ?? 'VoxAI'
      : store.view === 'projects'
        ? 'Projects'
        : 'Admin Dashboard';

  return (
    <div className="h-[100dvh] flex flex-col bg-white overflow-hidden">
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
      />
      <Header onMenuClick={store.toggleSidebar} title={headerTitle} profile={user} />

      <main className="flex-1 flex flex-col mt-14 overflow-hidden">
        {store.view === 'chat' && (
          <>
            <ChatView
              messages={store.activeChatMessages}
              isTyping={store.isTyping}
              streamingContent={store.streamingContent}
              chatError={store.chatError}
            />
            <MessageInput onSend={store.handleSend} disabled={store.isTyping} />
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
      <div ref={chatEndRef} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
