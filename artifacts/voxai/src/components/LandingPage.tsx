import { useState } from 'react';
import { Menu, FolderOpen, X, Plus, Mic, ArrowUp, ChevronDown, LogOut } from 'lucide-react';
import type { Profile } from '../lib/types';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
  onSubmit: (text: string) => void;
  onOpenProjects?: () => void;
  onSignOut?: () => void;
  profile?: Profile | null;
  hideAuthButtons?: boolean;
}

export default function LandingPage({ onLogin, onSignup, onSubmit, onOpenProjects, onSignOut, profile, hideAuthButtons }: LandingPageProps) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const hasText = text.trim().length > 0;

  const handleSubmit = () => {
    if (hasText) onSubmit(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && hasText) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex flex-col overflow-hidden">

      {/* Drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#111111] border-r border-white/10 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-[16px] font-bold text-white tracking-tight">NexoGen</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 pt-4 flex-1">
          <p className="px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Menu
          </p>
          <button
            onClick={() => {
              setMenuOpen(false);
              onOpenProjects?.();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <FolderOpen size={18} strokeWidth={1.5} />
            Projects
          </button>
        </nav>

        {/* Profile section at bottom */}
        {profile && (
          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {(profile.name || profile.email || 'U')[0].toUpperCase()}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">{profile.email}</p>
              </div>
              {/* Sign out */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut?.();
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={16} className="text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Login/Signup in drawer if not authenticated */}
        {!profile && (
          <div className="border-t border-white/10 px-4 py-4 flex flex-col gap-2">
            <button
              onClick={() => { setMenuOpen(false); onLogin(); }}
              className="w-full py-2.5 rounded-xl border border-white/20 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => { setMenuOpen(false); onSignup(); }}
              className="w-full py-2.5 rounded-xl bg-white text-sm font-semibold text-black hover:bg-gray-100 transition-colors"
            >
              Sign up
            </button>
          </div>
        )}
      </aside>

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 z-10">
        <div className="flex items-center gap-3">
          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <Menu size={18} className="text-white" strokeWidth={1.5} />
          </button>
          <span className="text-[18px] font-bold tracking-tight">NexoGen</span>
        </div>

        {!hideAuthButtons && (
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="px-4 py-2 text-[14px] font-medium text-white hover:text-gray-300 transition-colors"
            >
              Login
            </button>
            <button
              onClick={onSignup}
              className="px-4 py-2 text-[14px] font-semibold bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
            >
              Sign up
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col px-5 pt-6 pb-6 relative">
        {/* Gradient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[260px] bg-gradient-to-t from-purple-600/50 via-blue-500/25 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col">
          <h1 className="text-[32px] leading-[1.2] font-bold tracking-tight mb-3 text-center">
            Build a business<br />
            landing page with AI
          </h1>

          <p className="text-[15px] text-gray-400 leading-relaxed mb-6 text-center">
            Describe your business, choose a style, and generate a clean landing page in minutes.
          </p>

          <p className="text-[17px] font-bold text-white mb-4 text-center">
            What should we build, MARK?
          </p>

          {/* Input bar */}
          <div className="rounded-2xl bg-[#1a1a1a] border border-white/10 px-4 pt-4 pb-3 flex flex-col gap-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask NexoGen to make a do"
              rows={2}
              className="w-full bg-transparent text-[15px] text-white placeholder:text-gray-500 outline-none resize-none leading-relaxed"
            />
            {/* Bottom row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Plus size={20} />
                </button>
                <button className="flex items-center gap-1 text-[13px] font-medium text-gray-300 hover:text-white transition-colors">
                  Build
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Mic size={20} />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!hasText}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    hasText
                      ? 'bg-white hover:bg-gray-100'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp size={18} className={hasText ? 'text-black' : 'text-gray-400'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
