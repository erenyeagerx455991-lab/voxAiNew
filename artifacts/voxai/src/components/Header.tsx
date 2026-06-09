import { Menu, Share2, Zap } from 'lucide-react';
import type { Profile } from '../lib/types';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  profile: Profile | null;
}

export default function Header({ onMenuClick, title, profile }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <h1 className="text-[15px] font-semibold text-black truncate">{title}</h1>
        <div className="flex items-center gap-1">
          {profile && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-xs text-gray-500 font-medium">
              <Zap size={12} strokeWidth={2} />
              {profile.credits}
            </div>
          )}
          <button className="p-2 -mr-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Share">
            <Share2 size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
