import { useState } from 'react';
import { ArrowLeft, ChevronDown, Check, Lock, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

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

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[13px] text-gray-400 dark:text-gray-500 mb-3">{children}</p>
  );
}

function Divider() {
  return <div className="h-px bg-gray-200 dark:bg-gray-800 mx-5" />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] overflow-hidden mb-8">
      {children}
    </div>
  );
}

function RowToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="px-5 py-5 flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-[15px] font-semibold text-black dark:text-white mb-1">{label}</p>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0 mt-1">
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

const AI_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
];

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const [themeDropOpen, setThemeDropOpen] = useState(false);
  const [modelDropOpen, setModelDropOpen] = useState(false);

  // Appearance & Notifications
  const [tokenUsage, setTokenUsage] = useState(() =>
    localStorage.getItem('setting_tokenUsage') === 'true'
  );
  const [soundNotif, setSoundNotif] = useState(() =>
    localStorage.getItem('setting_soundNotif') !== 'false'
  );

  // AI Settings
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem('setting_aiModel') || 'llama-3.3-70b-versatile'
  );
  const [responseQuality, setResponseQuality] = useState<'fast' | 'best'>(() =>
    (localStorage.getItem('setting_responseQuality') as 'fast' | 'best') || 'best'
  );

  // Editor Settings
  const [autoSave, setAutoSave] = useState(() =>
    localStorage.getItem('setting_autoSave') !== 'false'
  );
  const [splitScreen, setSplitScreen] = useState(() =>
    localStorage.getItem('setting_splitScreen') === 'true'
  );

  // Account
  const [changePwStatus, setChangePwStatus] = useState<'' | 'sending' | 'sent' | 'error'>('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'' | 'deleting' | 'error'>('');

  const persist = (key: string, value: string) => localStorage.setItem(key, value);

  const handleTokenUsage = (v: boolean) => { setTokenUsage(v); persist('setting_tokenUsage', String(v)); };
  const handleSoundNotif = (v: boolean) => { setSoundNotif(v); persist('setting_soundNotif', String(v)); };
  const handleAutoSave = (v: boolean) => { setAutoSave(v); persist('setting_autoSave', String(v)); };
  const handleSplitScreen = (v: boolean) => { setSplitScreen(v); persist('setting_splitScreen', String(v)); };

  const handleModelSelect = (value: string) => {
    setSelectedModel(value);
    persist('setting_aiModel', value);
    setModelDropOpen(false);
  };

  const handleQualityToggle = (q: 'fast' | 'best') => {
    setResponseQuality(q);
    persist('setting_responseQuality', q);
  };

  const handleChangePassword = async () => {
    setChangePwStatus('sending');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No email');
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      setChangePwStatus('sent');
    } catch {
      setChangePwStatus('error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleteStatus('deleting');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) throw error;
      await supabase.auth.signOut();
    } catch {
      setDeleteStatus('error');
      setDeleteConfirm(false);
    }
  };

  const selectedModelLabel = AI_MODELS.find((m) => m.value === selectedModel)?.label ?? selectedModel;
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
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">General Settings</h1>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
          Manage your preferences for appearance, notifications, and default editor behavior.
        </p>

        {/* ── Appearance & Notifications ── */}
        <SectionLabel>Appearance and notifications</SectionLabel>
        <Card>
          {/* Theme */}
          <div className="px-5 py-5 flex items-start justify-between gap-4 relative">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">Theme</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Sets the interface to light mode or dark mode.
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
              {themeDropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setThemeDropOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+6px)] w-36 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                    {(['light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTheme(t); setThemeDropOpen(false); }}
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
          <Divider />
          <RowToggle
            label="Display token usage in chat"
            description="Always shows monthly token balance above the chatbox when you're in a project."
            checked={tokenUsage}
            onChange={handleTokenUsage}
          />
          <Divider />
          <RowToggle
            label="Sound notification"
            description="Plays a chime when the AI finishes responding. Only works in your active browser tab."
            checked={soundNotif}
            onChange={handleSoundNotif}
          />
        </Card>

        {/* ── AI Settings ── */}
        <SectionLabel>AI Settings</SectionLabel>
        <Card>
          {/* Model selector */}
          <div className="px-5 py-5 flex items-start justify-between gap-4 relative">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">AI Model</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Choose which language model powers your AI responses.
              </p>
            </div>
            <div className="relative shrink-0 mt-0.5">
              <button
                onClick={() => setModelDropOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-[14px] font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#333] transition-colors min-w-[140px] justify-between"
              >
                <span className="truncate max-w-[110px]">{selectedModelLabel}</span>
                <ChevronDown size={14} className="text-gray-400 shrink-0" />
              </button>
              {modelDropOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setModelDropOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                    {AI_MODELS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => handleModelSelect(m.value)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-[14px] text-left transition-colors ${
                          selectedModel === m.value
                            ? 'bg-gray-100 dark:bg-gray-700 font-semibold text-black dark:text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {m.label}
                        {selectedModel === m.value && <Check size={14} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <Divider />
          {/* Response quality toggle */}
          <div className="px-5 py-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">Response quality</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Fast prioritizes speed; Best prioritizes accuracy and depth.
              </p>
            </div>
            <div className="shrink-0 mt-0.5">
              <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {(['fast', 'best'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQualityToggle(q)}
                    className={`px-4 py-2 text-[13px] font-medium transition-colors ${
                      responseQuality === q
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#333]'
                    }`}
                  >
                    {q === 'fast' ? 'Fast' : 'Best'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ── Editor ── */}
        <SectionLabel>Editor</SectionLabel>
        <Card>
          <RowToggle
            label="Auto-save"
            description="Automatically saves your project as you work, so you never lose progress."
            checked={autoSave}
            onChange={handleAutoSave}
          />
          <Divider />
          <RowToggle
            label="Split screen preview"
            description="Shows the live preview panel side-by-side with your workspace."
            checked={splitScreen}
            onChange={handleSplitScreen}
          />
        </Card>

        {/* ── Account ── */}
        <SectionLabel>Account</SectionLabel>
        <Card>
          {/* Change password */}
          <div className="px-5 py-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">Change password</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {changePwStatus === 'sent'
                  ? 'Reset link sent to your email!'
                  : changePwStatus === 'error'
                  ? 'Failed to send reset email. Try again.'
                  : "We'll send a password reset link to your email address."}
              </p>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changePwStatus === 'sending' || changePwStatus === 'sent'}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2a2a2a] text-[14px] font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-0.5"
            >
              <Lock size={14} className="text-gray-400" />
              {changePwStatus === 'sending' ? 'Sending…' : changePwStatus === 'sent' ? 'Sent!' : 'Change'}
            </button>
          </div>
          <Divider />
          {/* Delete account */}
          <div className="px-5 py-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-black dark:text-white mb-1">Delete account</p>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {deleteConfirm
                  ? 'Are you sure? This will permanently delete your account and all data.'
                  : deleteStatus === 'error'
                  ? 'Something went wrong. Please try again.'
                  : 'Permanently deletes your account and all associated data. This cannot be undone.'}
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteStatus === 'deleting'}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-colors mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                deleteConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600 border border-red-500'
                  : 'border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'
              }`}
            >
              <Trash2 size={14} />
              {deleteStatus === 'deleting' ? 'Deleting…' : deleteConfirm ? 'Confirm delete' : 'Delete'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
