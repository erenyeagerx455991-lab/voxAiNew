import { useState, useEffect } from 'react';
import { Users, MessageSquare, AudioWaveform, Mic, Zap, CreditCard, BarChart3, Loader2 } from 'lucide-react';
import { getAdminStats } from '../services/adminService';
import type { AdminStats } from '../services/adminService';

export default function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users },
        { label: 'Total Chats', value: stats.totalChats, icon: MessageSquare },
        { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare },
        { label: 'TTS Generations', value: stats.totalTtsGenerations, icon: AudioWaveform },
        { label: 'Voice Models', value: stats.totalVoiceModels, icon: Mic },
        { label: 'Credits Used', value: stats.creditsUsed, icon: Zap },
        { label: 'Active Subs', value: stats.activeSubscriptions, icon: CreditCard },
      ]
    : [];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-1">Admin Dashboard</h2>
          <p className="text-sm text-gray-400">Platform analytics and management overview.</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="p-4 rounded-2xl border border-gray-200 bg-white"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Icon size={16} className="text-gray-600" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-black">{card.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'View Users', icon: Users },
                  { label: 'View Usage', icon: BarChart3 },
                  { label: 'Manage Plans', icon: CreditCard },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Distribution */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Plan Distribution</h3>
              <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                <div className="space-y-3">
                  {[
                    { plan: 'Free', pct: 70, color: 'bg-gray-300' },
                    { plan: 'Pro', pct: 22, color: 'bg-gray-600' },
                    { plan: 'Premium', pct: 8, color: 'bg-black' },
                  ].map((item) => (
                    <div key={item.plan}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">{item.plan}</span>
                        <span className="text-xs text-gray-400">{item.pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
