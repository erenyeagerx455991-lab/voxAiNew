import { useState } from 'react';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPageProps {
  onClose: () => void;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
        checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const [themeDropOpen, setThemeDropOpen] = useState(false);
  const [tokenUsage, setTokenUsage] = useState(() =>
    localStorage.getItem('setting_tokenUsage') === 'true'
  );
  const [soundNotif, setSoundNotif] = useState(() =>
    localStorage.getItem('setting_soundNotif') !== 'false'
  );

  const handleTokenUsage = (v: boolean) => {
    setTokenUsage(v);
    localStorage.setItem('setting_tokenUsage', String(v));
  };

  const handleSoundNotif = (v: boolean) => {
    setSoundNotif(v);
    localStorage.setItem('setting_soundNotif', String(v));
  };

  const themeLabel = theme === 'dark' ? 'Dark' : 'Light';

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0f0f0f] flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="px-5 pb-10">
        {/* Title */}
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          General Settings
        </h1>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          Manage your preferences for appearance, notifications, and default editor behavior.
        </p>

        {/* Section header */}
        <p className="text-[13px] text-gray-400 dark:text-gray-500 mb-3">
          Appearance and notifications
        </p>

        {/* Settings card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] overflow-hidden">

          {/* Theme row */}
          <div className="px-5 py-5 flex items-start justify-between gap-4 relative">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">Theme</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Sets the interface to light mode, dark mode, or to match your device setting.
              </p>
            </div>
            <div className="relative shrink-0 mt-0.5">
              <button
                onClick={() => setThemeDropOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-[14px] font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#333] transition-colors min-w-[100px] justify-between"
              >
                {themeLabel}
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {/* Dropdown */}
              {themeDropOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setThemeDropOpen(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+6px)] w-36 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                    {(['light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTheme(t);
                          setThemeDropOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-[14px] text-left transition-colors ${
                          theme === t
                            ? 'bg-gray-100 dark:bg-gray-700 font-semibold text-black dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {t === 'light' ? 'Light' : 'Dark'}
                        {theme === t && <Check size={14} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800 mx-5" />

          {/* Display token usage */}
          <div className="px-5 py-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">
                Display token usage in chat
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Always shows monthly token balance above the chatbox when you're in a project.
              </p>
            </div>
            <div className="shrink-0 mt-1">
              <Toggle checked={tokenUsage} onChange={handleTokenUsage} />
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800 mx-5" />

          {/* Sound notification */}
          <div className="px-5 py-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">
                Sound notification
              </p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Plays a chime when the AI finishes responding. Only works in your active browser tab.
              </p>
            </div>
            <div className="shrink-0 mt-1">
              <Toggle checked={soundNotif} onChange={handleSoundNotif} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
