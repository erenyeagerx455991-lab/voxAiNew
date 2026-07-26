import { useState, useEffect } from 'react';
import { Search, Plus, MessageSquare, MoreHorizontal, Trash2, Pencil, FileCode2, Activity, Cloud, CloudOff } from 'lucide-react';
import type { Chat } from '../lib/types';
import { listProjects } from '../services/projectService';
import type { ProjectMeta } from '../services/projectService';
import { supabase } from '../lib/supabase';

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

function healthColor(score: number | null | undefined): string {
  if (score == null) return 'from-gray-700 to-gray-800';
  if (score >= 90) return 'from-emerald-900/60 to-emerald-800/40';
  if (score >= 70) return 'from-blue-900/60 to-blue-800/40';
  if (score >= 50) return 'from-amber-900/60 to-amber-800/40';
  return 'from-red-900/50 to-red-800/30';
}

function healthBadgeColor(score: number | null | undefined): string {
  if (score == null) return 'text-gray-400 bg-gray-800';
  if (score >= 90) return 'text-emerald-400 bg-emerald-900/60';
  if (score >= 70) return 'text-blue-400 bg-blue-900/60';
  if (score >= 50) return 'text-amber-400 bg-amber-900/60';
  return 'text-red-400 bg-red-900/60';
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

  // Project metadata from backend (file count, health score, cloud-saved status)
  const [projectMeta, setProjectMeta] = useState<Record<string, ProjectMeta>>({});
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchMeta() {
      setMetaLoading(true);
      try {
        // userId is derived server-side from the request context.
        const projects = await listProjects();
        if (cancelled) return;
        const map: Record<string, ProjectMeta> = {};
        for (const p of projects) map[p.chatId] = p;
        setProjectMeta(map);
      } catch { /* ignore */ } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }
    void fetchMeta();
    return () => { cancelled = true; };
  }, [chats.length]);

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
    <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8 bg-white dark:bg-[#181817]">
      <h1 className="text-2xl font-bold text-black dark:text-white mb-5">All projects</h1>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-3">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search for a project"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Create button */}
      <button
        onClick={onCreateProject}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors mb-6"
      >
        <Plus size={16} />
        Create project
      </button>

      {/* Summary bar */}
      {chats.length > 0 && (
        <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{chats.length} project{chats.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          {metaLoading ? (
            <span className="animate-pulse">Syncing…</span>
          ) : (
            <span className="flex items-center gap-1">
              {Object.keys(projectMeta).length > 0 ? (
                <><Cloud size={12} className="text-blue-400" /> {Object.keys(projectMeta).length} cloud-saved</>
              ) : (
                <><CloudOff size={12} /> Local only</>
              )}
            </span>
          )}
        </div>
      )}

      {/* Empty state */}
      {chats.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <MessageSquare size={24} className="text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No projects yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Start building with AI on the home page</p>
        </div>
      )}

      {chats.length > 0 && filtered.length === 0 && (
        <div className="text-center pt-8">
          <p className="text-sm text-gray-400 dark:text-gray-500">No projects match "{search}"</p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((chat) => {
            const meta = projectMeta[chat.id];
            const isSaved = !!meta;

            return (
              <div key={chat.id} className="relative group">
                <button
                  onClick={() => onOpenProject(chat.id)}
                  className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div
                    className={`w-full aspect-[4/3] bg-gradient-to-br ${isSaved ? healthColor(meta?.healthScore) : 'from-gray-700 to-gray-800'} flex flex-col items-center justify-center gap-1.5 relative`}
                  >
                    <FileCode2
                      size={28}
                      className={isSaved ? 'text-white/40' : 'text-gray-600'}
                      strokeWidth={1.5}
                    />
                    {/* Badges row */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 flex-wrap">
                      {meta?.fileCount != null && meta.fileCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/30 text-white/70 backdrop-blur-sm">
                          <FileCode2 size={9} />
                          {meta.fileCount} files
                        </span>
                      )}
                      {meta?.healthScore != null && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md backdrop-blur-sm ${healthBadgeColor(meta.healthScore)}`}>
                          <Activity size={9} />
                          {meta.healthScore}
                        </span>
                      )}
                      {isSaved && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-blue-900/50 text-blue-300 backdrop-blur-sm">
                          <Cloud size={9} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title + date */}
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
                        className="w-full text-sm font-medium text-black dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 outline-none"
                      />
                    ) : (
                      <p className="text-sm font-medium text-black dark:text-white truncate">{chat.title}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {timeAgo(meta?.updatedAt ?? chat.updated_at ?? chat.created_at)}
                    </p>
                  </div>
                </button>

                {/* ⋯ Context menu */}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                    }}
                    className="w-7 h-7 rounded-lg bg-white/80 dark:bg-[#181817]/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-900"
                  >
                    <MoreHorizontal size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  {menuOpenId === chat.id && (
                    <div
                      className="absolute right-0 top-8 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 py-1 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => startRename(chat)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Pencil size={14} /> Rename
                      </button>
                      <button
                        onClick={() => { onDeleteChat(chat.id); setMenuOpenId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
