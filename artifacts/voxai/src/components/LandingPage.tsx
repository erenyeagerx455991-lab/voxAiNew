import { Sparkles, MessageSquare, Mic, Zap, Menu } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function LandingPage({ onLogin, onSignup }: LandingPageProps) {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 z-10">
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center">
              <Sparkles size={16} className="text-black" strokeWidth={1.5} />
            </div>
            <span className="text-[17px] font-semibold tracking-tight">VoxAI</span>
          </div>
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center relative">
        {/* Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-[220px] rounded-full bg-gradient-to-t from-purple-600/40 via-blue-500/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm">
          <h1 className="text-[34px] leading-[1.2] font-bold tracking-tight mb-3">
            Chat smarter,<br />
            speak naturally.
          </h1>
          <p className="text-[15px] text-gray-400 leading-relaxed mb-8">
            Premium AI chat with built-in text-to-speech and custom voice creation — all in one place.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {[
              { icon: <MessageSquare size={13} />, label: 'AI Chat' },
              { icon: <Mic size={13} />, label: 'Text to Speech' },
              { icon: <Zap size={13} />, label: 'Voice Cloning' },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-[13px] text-gray-300 border border-white/10"
              >
                {icon}
                {label}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onSignup}
              className="w-full py-3.5 rounded-2xl bg-white text-black text-[15px] font-semibold hover:bg-gray-100 transition-colors"
            >
              Get started free
            </button>
            <button
              onClick={onLogin}
              className="w-full py-3.5 rounded-2xl bg-white/10 text-white text-[15px] font-medium border border-white/10 hover:bg-white/15 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </main>

      <div className="px-6 py-4 text-center z-10">
        <p className="text-xs text-gray-600">VoxAI &middot; Premium AI Platform</p>
      </div>
    </div>
  );
}
