import { Menu } from 'lucide-react';
import type { Profile } from '../lib/types';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  profile: Profile | null;
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4.75C6 3.784 7.088 3.23 7.862 3.79l11.166 7.942a1.25 1.25 0 0 1 0 2.036L7.862 21.71C7.088 22.27 6 21.716 6 20.75V4.75Z" />
    </svg>
  );
}

export default function Header({ onMenuClick, title }: HeaderProps) {
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
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-gray-800 transition-colors -mr-1"
          aria-label="Preview"
        >
          <PlayIcon />
          Preview
        </button>
      </div>
    </header>
  );
}
