import { Menu } from 'lucide-react';
import type { Profile } from '../lib/types';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  profile: Profile | null;
  onPreview?: () => void;
  hasCode?: boolean;
  showPreview?: boolean;
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4.75C6 3.784 7.088 3.23 7.862 3.79l11.166 7.942a1.25 1.25 0 0 1 0 2.036L7.862 21.71C7.088 22.27 6 21.716 6 20.75V4.75Z" />
    </svg>
  );
}

export default function Header({ onMenuClick, title, onPreview, hasCode, showPreview }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-gray-900/80 md:bg-[#2d2d2d]/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 md:border-white/8">
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 md:hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.5} className="text-gray-700 dark:text-gray-300 md:text-gray-300" />
        </button>

        <h1 className="text-[15px] font-semibold text-black dark:text-white md:text-white truncate">{title}</h1>

        {showPreview ? (
          <button
            onClick={onPreview}
            disabled={!hasCode}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all -mr-1 ${
              hasCode
                ? 'bg-black dark:bg-white md:bg-indigo-600 md:hover:bg-indigo-500 text-white dark:text-black md:text-white cursor-pointer'
                : 'bg-gray-100 dark:bg-gray-800 md:bg-white/10 text-gray-400 dark:text-gray-600 md:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="Preview"
          >
            <PlayIcon />
            Preview
          </button>
        ) : (
          <div className="w-[84px]" />
        )}
      </div>
    </header>
  );
}
