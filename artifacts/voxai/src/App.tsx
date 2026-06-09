import { useRef, useEffect, useCallback, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatView from './components/ChatView';
import MessageInput from './components/MessageInput';
import TextToSpeechView from './components/TextToSpeechView';
import CreateVoiceView from './components/CreateVoiceView';
import AdminView from './components/AdminView';
import AuthView from './components/auth/AuthView';
import LandingPage from './components/LandingPage';
import { useAppStore } from './hooks/useAppStore';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { Sparkles } from 'lucide-react';

type PublicView = 'landing' | 'login' | 'signup';

function AppContent() {
  const { user, loading, signOut, refreshProfile, isAuthenticated } = useAuth();
  const store = useAppStore(isAuthenticated, refreshProfile);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [publicView, setPublicView] = useState<PublicView>('landing');
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

  // When authenticated + app initialized + pending message → auto-send it
  useEffect(() => {
    if (
      isAuthenticated &&
      store.initialized &&
      pendingMessage &&
      !pendingSentRef.current
    ) {
      pendingSentRef.current = true;
      store.handleSend(pendingMessage).finally(() => {
        setPendingMessage('');
        pendingSentRef.current = false;
      });
    }
  }, [isAuthenticated, store.initialized, pendingMessage, store.handleSend]);

  const handleLandingSubmit = (text: string) => {
    setPendingMessage(text);
    if (!isAuthenticated) {
      setPublicView('signup');
    }
    // If already authenticated, the useEffect above will pick it up
  };

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

  if (!isAuthenticated) {
    if (publicView === 'landing') {
      return (
        <LandingPage
          onLogin={() => setPublicView('login')}
          onSignup={() => setPublicView('signup')}
          onSubmit={handleLandingSubmit}
        />
      );
    }
    return (
      <AuthView
        initialMode={publicView}
        onBack={() => setPublicView('landing')}
      />
    );
  }

  const headerTitle =
    store.view === 'chat'
      ? store.chats.find((c) => c.id === store.activeChatId)?.title ?? 'VoxAI'
      : store.view === 'tts'
        ? 'Text to Speech'
        : store.view === 'create-voice'
          ? 'Create Your Own AI Voice'
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
        {store.view === 'tts' && <TextToSpeechView onCreditsChange={refreshProfile} />}
        {store.view === 'create-voice' && <CreateVoiceView onCreditsChange={refreshProfile} />}
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
