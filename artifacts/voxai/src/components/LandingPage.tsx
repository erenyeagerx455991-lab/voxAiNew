import { useState } from 'react';
import { Sparkles, Plus, Mic, ArrowUp, ChevronDown } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
  onSubmit: (text: string) => void;
}

export default function LandingPage({ onLogin, onSignup, onSubmit }: LandingPageProps) {
  const [text, setText] = useState('');
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
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Sparkles size={16} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="text-[18px] font-bold tracking-tight">NexoGen</span>
        </div>
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
