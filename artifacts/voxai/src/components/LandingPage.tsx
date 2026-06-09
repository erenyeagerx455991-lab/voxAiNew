import { Sparkles, Plus, Mic, ArrowUp, ChevronDown } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function LandingPage({ onLogin, onSignup }: LandingPageProps) {
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
      <main className="flex-1 flex flex-col px-5 pt-10 pb-6 relative">
        {/* Gradient glow at bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[260px] bg-gradient-to-t from-purple-600/50 via-blue-500/25 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col">
          {/* Heading */}
          <h1 className="text-[32px] leading-[1.2] font-bold tracking-tight mb-3">
            Build a business<br />
            landing page with AI
          </h1>

          {/* Sub heading */}
          <p className="text-[15px] text-gray-400 leading-relaxed mb-6">
            Describe your business, choose a style, and generate a clean landing page in minutes.
          </p>

          {/* Bold prompt line */}
          <p className="text-[17px] font-bold text-white mb-4">
            What should we build, MARK?
          </p>

          {/* Input bar */}
          <div className="rounded-2xl bg-[#1a1a1a] border border-white/10 px-4 pt-4 pb-3 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Ask NexoGen to make a do"
              className="w-full bg-transparent text-[15px] text-white placeholder:text-gray-500 outline-none"
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
                  onClick={onSignup}
                  className="w-9 h-9 rounded-full bg-gray-500 hover:bg-gray-400 flex items-center justify-center transition-colors"
                >
                  <ArrowUp size={18} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
