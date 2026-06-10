import { useState } from 'react';
import { Search, Plus, MessageSquare, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import type { Chat } from '../lib/types';

interface ProjectsViewProps {
  chats: Chat[];
  onOpenProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return 'Yesterday';
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProjectsView({
  chats,
  onOpenProject,
  onCreateProject,
  onDeleteChat,
  onRenameChat,
}: ProjectsViewProps) {
  const [search, setSearch] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const startRename = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
    setMenuOpenId(null);
  };

  const submitRename = (id: string) => {
    if (editTitle.trim()) onRenameChat(id, editTitle.trim());
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8">
      {/* Title */}
      <h1 className="text-2xl font-bold text-black mb-5">All projects</h1>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 mb-3">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search for a project"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Create project button — full width */}
      <button
        onClick={onCreateProject}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors mb-6"
      >
        <Plus size={16} />
        Create project
      </button>

      {/* Empty state */}
      {chats.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <MessageSquare size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1">No projects yet</p>
          <p className="text-sm text-gray-400">Start building with AI on the home page</p>
        </div>
      )}

      {/* No search results */}
      {chats.length > 0 && filtered.length === 0 && (
        <div className="text-center pt-8">
          <p className="text-sm text-gray-400">No projects match "{search}"</p>
        </div>
      )}

      {/* Project grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((chat) => (
            <div key={chat.id} className="relative group">
              <button
                onClick={() => onOpenProject(chat.id)}
                className="w-full text-left rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
              >
                {/* Preview area */}
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <MessageSquare size={28} className="text-gray-300" strokeWidth={1.5} />
                </div>
                {/* Info */}
                <div className="px-3 py-2.5">
                  {editingId === chat.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => submitRename(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(chat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full text-sm font-medium text-black bg-white border border-gray-300 rounded px-1 outline-none"
                    />
                  ) : (
                    <p className="text-sm font-medium text-black truncate">{chat.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(chat.updated_at || chat.created_at)}</p>
                </div>
              </button>

              {/* Three-dot menu */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                  }}
                  className="w-7 h-7 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <MoreHorizontal size={14} className="text-gray-600" />
                </button>
                {menuOpenId === chat.id && (
                  <div
                    className="absolute right-0 top-8 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => startRename(chat)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={14} />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        onDeleteChat(chat.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
