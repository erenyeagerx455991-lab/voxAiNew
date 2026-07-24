import { MessageSquare, FolderOpen, Plus, X, Trash2, Pencil, LogOut, Shield, Home, Settings } from 'lucide-react';
import { useState } from 'react';
import type { View, Chat } from '../hooks/useAppStore';
import type { Profile } from '../lib/types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  view: View;
  onViewChange: (view: View) => void;
  chats: Chat[];
  activeChatId: string | null;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  profile: Profile | null;
  onSignOut: () => void;
  onGoHome: () => void;
  onOpenSettings: () => void;
}

const navItems: { id: View; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'Workspace', icon: MessageSquare },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
];

export default function Sidebar({
  open,
  onClose,
  view,
  onViewChange,
  chats,
  activeChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  profile,
  onSignOut,
  onGoHome,
  onOpenSettings,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNavClick = (id: View) => {
    onViewChange(id);
    onClose();
  };

  const startRename = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const submitRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-[300px] bg-white dark:bg-[#181817] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-lg font-semibold tracking-tight text-black dark:text-white">Vx</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} strokeWidth={1.5} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-3">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-black dark:text-white"
          >
            <Plus size={16} strokeWidth={2} />
            New chat
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 pt-4 pb-2">
          <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Features
          </p>

          {/* Home button inside Features */}
          <button
            onClick={() => { onGoHome(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Home size={18} strokeWidth={1.5} />
            Home
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
              </button>
            );
          })}

          {profile?.subscription_plan === 'premium' && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                view === 'admin'
                  ? 'bg-black dark:bg-white text-white dark:text-black font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Shield size={18} strokeWidth={1.5} />
              Admin Dashboard
            </button>
          )}
        </nav>

        {/* Recent Chats */}
        {chats.length > 0 && (
          <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
            <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Recents
            </p>
            <div className="space-y-0.5">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center rounded-xl transition-colors ${
                    activeChatId === chat.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {editingId === chat.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-black dark:text-white"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => { onChatSelect(chat.id); onViewChange('chat'); onClose(); }}
                      className={`flex-1 text-left px-3 py-2.5 text-sm truncate ${
                        activeChatId === chat.id
                          ? 'font-medium text-black dark:text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {chat.title}
                    </button>
                  )}
                  <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startRename(chat)}
                      className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Pencil size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => onDeleteChat(chat.id)}
                      className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Profile & Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          {profile && (
            <div className="px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-semibold">
                {(profile.name || profile.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black dark:text-white truncate">
                  {profile.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">{profile.credits} credits</p>
              </div>
              <button
                onClick={() => { onOpenSettings(); onClose(); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Settings"
              >
                <Settings size={16} className="text-gray-400" />
              </button>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut size={16} className="text-gray-400" />
              </button>
            </div>
          )}
          <div className="px-5 py-3">
            <p className="text-xs text-gray-400 dark:text-gray-600">Vx &middot; Premium AI Platform</p>
          </div>
        </div>
      </aside>
    </>
  );
}
