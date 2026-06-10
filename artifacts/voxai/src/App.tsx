import { useRef, useEffect, useCallback, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import MessageInput from './components/MessageInput';
import ProjectsView from './components/ProjectsView';
import AdminView from './components/AdminView';
import AuthView from './components/auth/AuthView';
import LandingPage from './components/LandingPage';
import SettingsPage from './components/SettingsPage';
import WorkspacePanel from './components/WorkspacePanel';
import { useAppStore } from './hooks/useAppStore';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { generateWebsite } from './services/builderService';
import { Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'signup' | null;

function AppContent() {
  const { user, loading, signOut, refreshProfile, isAuthenticated } = useAuth();
  const store = useAppStore(isAuthenticated, refreshProfile);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [landingShown, setLandingShown] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [pendingMessage, setPendingMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const pendingSentRef = useRef(false);

  // ── Builder state ─────────────────────────────────────────────
  const [builderPrompt, setBuilderPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');

  const runGenerate = useCallback(async (prompt: string) => {
    setBuilderPrompt(prompt);
    setGeneratedCode('');
    setGenerationError('');
    setIsGenerating(true);
    try {
      const code = await generateWebsite(prompt);
      setGeneratedCode(code);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [store.activeChatMessages.length, store.isTyping, store.streamingContent, store.chatError, scrollToBottom]);

  // Authenticated + pending message → generate and go to builder
  useEffect(() => {
    if (
      isAuthenticated &&
      store.initialized &&
      pendingMessage &&
      !pendingSentRef.current
    ) {
      pendingSentRef.current = true;
      const msg = pendingMessage;
      setPendingMessage('');
      setLandingShown(false);
      setAuthMode(null);
      store.setView('builder');
      runGenerate(msg).finally(() => {
        pendingSentRef.current = false;
      });
    }
  }, [isAuthenticated, store.initialized, pendingMessage, store.setView, runGenerate]);

  const handleLandingSubmit = (text: string) => {
    if (!isAuthenticated) {
      setPendingMessage(text);
      setAuthMode('signup');
      return;
    }
    setLandingShown(false);
    store.setView('builder');
    runGenerate(text);
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
      ? store.chats.find((c) => c.id === store.activeChatId)?.title ?? 'VoxAI'
      : store.view === 'projects'
        ? 'Projects'
        : store.view === 'builder'
          ? 'Website Builder'
          : 'Admin Dashboard';

  return (
    <div className="h-[100dvh] flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
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
        {store.view === 'builder' && (
          <WorkspacePanel
            prompt={builderPrompt}
            generatedCode={generatedCode}
            isGenerating={isGenerating}
            generationError={generationError}
            onRegenerate={runGenerate}
          />
        )}
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
