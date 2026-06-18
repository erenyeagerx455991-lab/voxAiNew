// ── V6.4.1: Validation Harness ────────────────────────────────────────────────
// Defines controlled failure scenarios for stress-testing the V6.4 repair loop.
// Each scenario is intentionally broken in a specific way.
// The harness proves: Build Failure → Classify → Repair → Rebuild → Pass

export type TestCategory =
  | 'import'
  | 'typescript'
  | 'jsx'
  | 'route'
  | 'dependency'
  | 'runtime'
  | 'mixed';

export interface TestScenario {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  // Broken App.tsx content (entry point that will fail to build)
  brokenApp: string;
  // Extra files needed (support files that are intentionally absent or wrong)
  extraFiles?: Array<{ name: string; relPath: string; content: string }>;
  // Expected error category after classification
  expectedCategory: string;
  // Tags for stress-test mixing
  tags: string[];
}

export interface TestRunResult {
  scenario: TestScenario;
  firstBuildPassed: boolean;      // true = not actually broken (bug in scenario)
  finalPassed: boolean;
  repairAttempts: number;
  firstBuildErrorCategory: string;
  buildTimeMs: number;
  repairTimeMs: number;
  totalTimeMs: number;
  qualityScore: number;           // 0–100
  failureReason?: string;
}

export interface CategoryStats {
  total: number;
  passed: number;
  repairTriggered: number;
  repairSucceeded: number;
  avgRepairPasses: number;
  avgBuildMs: number;
  successRate: number;
}

export interface ValidationReport {
  runAt: string;
  totalTests: number;
  firstPassPassed: number;        // passed without repair (bad: means not actually broken)
  repairTriggered: number;
  repairSucceeded: number;
  repairFailed: number;
  repairSuccessRate: number;
  avgRepairPasses: number;
  avgBuildMs: number;
  avgRepairMs: number;
  worstBuildMs: number;
  categoryBreakdown: Partial<Record<TestCategory, CategoryStats>>;
  results: TestRunResult[];
}

// ── Phase 2: Import Failure Scenarios ────────────────────────────────────────

export const IMPORT_SCENARIOS: TestScenario[] = [
  {
    id: 'import-01',
    name: 'Missing UI component',
    category: 'import',
    description: 'App imports Navbar that does not exist',
    expectedCategory: 'import',
    tags: ['import', 'component'],
    brokenApp: `
import React from 'react';
import Navbar from './Navbar';
import { Users, Settings, BarChart2 } from 'lucide-react';

const stats = [
  { label: 'Revenue', value: '$48K' },
  { label: 'Users', value: '1,234' },
  { label: 'Orders', value: '567' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-3 gap-6">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl p-6 shadow">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'import-02',
    name: 'Missing custom hook',
    category: 'import',
    description: 'App imports useAuth hook that does not exist',
    expectedCategory: 'import',
    tags: ['import', 'hook'],
    brokenApp: `
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LogIn, LogOut, User } from 'lucide-react';

export default function App() {
  const { user, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-80">
        <div className="flex items-center gap-3 mb-6">
          <User size={24} className="text-indigo-600" />
          <h1 className="text-xl font-bold">Auth Demo</h1>
        </div>
        {user ? (
          <div>
            <p className="text-gray-700 mb-4">Signed in as <strong>{user.email}</strong></p>
            <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        ) : (
          <button onClick={login} className="flex items-center gap-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
            <LogIn size={16} /> Sign In
          </button>
        )}
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'import-03',
    name: 'Missing data service',
    category: 'import',
    description: 'App imports fetchUsers from a service that does not exist',
    expectedCategory: 'import',
    tags: ['import', 'service'],
    brokenApp: `
import React, { useEffect, useState } from 'react';
import { fetchUsers, deleteUser } from './services/userService';
import { Trash2, Search } from 'lucide-react';

interface User { id: number; name: string; email: string; role: string; }

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow mb-6">
          <Search size={16} className="text-gray-400" />
          <input className="flex-1 outline-none text-sm" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." />
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between px-6 py-4 border-b last:border-0">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <button onClick={() => deleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'import-04',
    name: 'Missing layout component',
    category: 'import',
    description: 'App imports MainLayout which does not exist',
    expectedCategory: 'import',
    tags: ['import', 'layout'],
    brokenApp: `
import React from 'react';
import MainLayout from './layouts/MainLayout';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { month: 'Jan', revenue: 4000, costs: 2400 },
  { month: 'Feb', revenue: 3000, costs: 1398 },
  { month: 'Mar', revenue: 5000, costs: 3200 },
  { month: 'Apr', revenue: 4500, costs: 2800 },
];

export default function App() {
  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Revenue Overview</h1>
        <div className="bg-white rounded-xl p-6 shadow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#6366f1" name="Revenue" />
              <Bar dataKey="costs" fill="#f59e0b" name="Costs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}
`.trim(),
  },
  {
    id: 'import-05',
    name: 'Missing context provider',
    category: 'import',
    description: 'App imports ThemeProvider that does not exist',
    expectedCategory: 'import',
    tags: ['import', 'context'],
    brokenApp: `
import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Sun, Moon, Bell, Search } from 'lucide-react';

function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
        <Search size={16} className="text-gray-400" />
        <input className="bg-transparent outline-none text-sm w-40" placeholder="Search..." />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100"><Bell size={18} /></button>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Header />
        <main className="p-8">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
        </main>
      </div>
    </ThemeProvider>
  );
}
`.trim(),
  },
];

// ── Phase 3: TypeScript / Syntax Failure Scenarios ────────────────────────────

export const TYPESCRIPT_SCENARIOS: TestScenario[] = [
  {
    id: 'ts-01',
    name: 'Adjacent JSX roots',
    category: 'typescript',
    description: 'Return has two adjacent root JSX elements (no fragment)',
    expectedCategory: 'jsx',
    tags: ['typescript', 'jsx', 'syntax'],
    brokenApp: `
import React, { useState } from 'react';
import { ShoppingCart, Star } from 'lucide-react';

interface Product { id: number; name: string; price: number; rating: number; }
const products: Product[] = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, rating: 4.5 },
  { id: 2, name: 'Smart Watch', price: 199.99, rating: 4.8 },
];

export default function App() {
  const [cart, setCart] = useState<Product[]>([]);
  return (
    <header className="bg-white shadow px-8 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">ShopAI</h1>
      <div className="flex items-center gap-2">
        <ShoppingCart size={20} />
        <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {cart.length}
        </span>
      </div>
    </header>
    <main className="max-w-4xl mx-auto p-8 grid grid-cols-2 gap-6">
      {products.map(p => (
        <div key={p.id} className="bg-white rounded-xl p-6 shadow">
          <h3 className="font-semibold">{p.name}</h3>
          <div className="flex items-center gap-1 my-2">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span className="text-sm">{p.rating}</span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="font-bold">\${p.price}</span>
            <button onClick={() => setCart(c => [...c, p])} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Add</button>
          </div>
        </div>
      ))}
    </main>
  );
}
`.trim(),
  },
  {
    id: 'ts-02',
    name: 'Unclosed JSX tag in return',
    category: 'typescript',
    description: 'Return value has an unclosed <div> tag',
    expectedCategory: 'jsx',
    tags: ['typescript', 'jsx', 'syntax'],
    brokenApp: `
import React, { useState } from 'react';
import { Users, Search, Filter } from 'lucide-react';

interface Contact { id: number; name: string; email: string; status: 'active' | 'inactive'; }
const contacts: Contact[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', status: 'inactive' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', status: 'active' },
];

export default function App() {
  const [q, setQ] = useState('');
  const list = contacts.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h1 className="font-bold flex items-center gap-2 mb-6"><Users size={18} />CRM Pro</h1>
      </aside>
      <main className="flex-1 p-8">
        <div className="flex items-center gap-3 mb-6 bg-white rounded-xl px-4 py-2 shadow">
          <Search size={16} className="text-gray-400" />
          <input className="flex-1 outline-none text-sm" value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." />
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {list.map(c => (
            <div key={c.id} className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-gray-500">{c.email}</p>
              </div>
              <span className={\`px-2 py-1 rounded-full text-xs \${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}\`}>
                {c.status}
              </span>
          ))}
        </div>
      </main>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'ts-03',
    name: 'Invalid template literal (unclosed)',
    category: 'typescript',
    description: 'Template literal is not closed properly',
    expectedCategory: 'typescript',
    tags: ['typescript', 'syntax'],
    brokenApp: `
import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; text: string; }
const GREETING = \`Welcome to AI Assistant — powered by NexoGen v6.4;

export default function App() {
  const [msgs, setMsgs] = useState<Message[]>([{ role: 'assistant', text: GREETING }]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m,
      { role: 'user', text: input },
      { role: 'assistant', text: \`I received: \${input}. This is a demo response.\` },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="font-semibold flex items-center gap-2"><Bot size={18} className="text-indigo-400" />AI Chat</h1>
      </header>
      <main className="flex-1 p-6 flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {msgs.map((m, i) => (
          <div key={i} className={\`flex gap-3 \${m.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            {m.role === 'assistant' && <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0"><Bot size={14}/></div>}
            <div className={\`px-4 py-2 rounded-2xl max-w-sm text-sm \${m.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800'}\`}>{m.text}</div>
          </div>
        ))}
      </main>
      <footer className="border-t border-gray-800 p-4 flex gap-3 max-w-2xl mx-auto w-full">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} className="flex-1 bg-gray-800 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Type..." />
        <button onClick={send} className="px-4 py-2 bg-indigo-600 rounded-xl"><Send size={16}/></button>
      </footer>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'ts-04',
    name: 'Missing closing brace in JSX map',
    category: 'typescript',
    description: 'JSX .map() callback is missing a closing parenthesis',
    expectedCategory: 'jsx',
    tags: ['typescript', 'jsx', 'syntax'],
    brokenApp: `
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const metrics = [
  { name: 'Page Views', value: '128K', change: '+12%', color: 'bg-indigo-500' },
  { name: 'Unique Visitors', value: '43K', change: '+8%', color: 'bg-purple-500' },
  { name: 'Bounce Rate', value: '42%', change: '-3%', color: 'bg-emerald-500' },
  { name: 'Avg Session', value: '3m 12s', change: '+5%', color: 'bg-amber-500' },
];

const chartData = [
  { day: 'Mon', views: 4200 }, { day: 'Tue', views: 5100 }, { day: 'Wed', views: 4800 },
  { day: 'Thu', views: 6200 }, { day: 'Fri', views: 5800 }, { day: 'Sat', views: 3900 },
  { day: 'Sun', views: 4100 },
];

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.name} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className={\`w-2 h-2 rounded-full \${m.color} mb-3\`} />
            <p className="text-sm text-gray-400">{m.name}</p>
            <p className="text-2xl font-bold mt-1">{m.value}</p>
            <p className="text-sm text-emerald-400 mt-1">{m.change}</p>
          </div>
        }
      </div>
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Page Views — This Week</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none' }} />
            <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'ts-05',
    name: 'Broken destructuring syntax',
    category: 'typescript',
    description: 'Object destructuring has invalid syntax (missing comma)',
    expectedCategory: 'typescript',
    tags: ['typescript', 'syntax'],
    brokenApp: `
import React, { useState useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

type NotifType = 'success' | 'error' | 'warning' | 'info';
interface Notification { id: number; type: NotifType; message: string; }

const ICONS = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info };
const COLORS = { success: 'text-green-500', error: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-500' };
const BG = { success: 'bg-green-50 border-green-200', error: 'bg-red-50 border-red-200', warning: 'bg-amber-50 border-amber-200', info: 'bg-blue-50 border-blue-200' };

export default function App() {
  const [notifs, setNotifs] = useState<Notification[]>([
    { id: 1, type: 'success', message: 'Profile updated successfully.' },
    { id: 2, type: 'error', message: 'Failed to save changes.' },
    { id: 3, type: 'warning', message: 'Your session expires in 5 minutes.' },
    { id: 4, type: 'info', message: 'New feature available in settings.' },
  ]);

  const dismiss = (id: number) => setNotifs(n => n.filter(x => x.id !== id));

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-3">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Notifications</h1>
        {notifs.map(n => {
          const Icon = ICONS[n.type];
          return (
            <div key={n.id} className={\`flex items-start gap-3 p-4 rounded-xl border \${BG[n.type]}\`}>
              <Icon size={18} className={COLORS[n.type]} />
              <p className="flex-1 text-sm text-gray-700">{n.message}</p>
              <button onClick={() => dismiss(n.id)} className="text-gray-400 hover:text-gray-600"><XCircle size={16}/></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`.trim(),
  },
];

// ── Phase 4: JSX Failure Scenarios ────────────────────────────────────────────

export const JSX_SCENARIOS: TestScenario[] = [
  {
    id: 'jsx-01',
    name: 'Unclosed div tag',
    category: 'jsx',
    description: 'Outer <div> wrapper is never closed',
    expectedCategory: 'jsx',
    tags: ['jsx', 'syntax'],
    brokenApp: `
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface Post { id: number; author: string; avatar: string; content: string; likes: number; }
const posts: Post[] = [
  { id: 1, author: 'Alice Chen', avatar: 'A', content: 'Just shipped our biggest feature yet! 🚀 Excited to see how users respond.', likes: 142 },
  { id: 2, author: 'Bob Kumar', avatar: 'B', content: 'Building in public is the best decision I ever made. Community feedback is gold.', likes: 89 },
  { id: 3, author: 'Carol Smith', avatar: 'C', content: 'Hot take: simplicity > complexity, always. The best code is the code you don\'t write.', likes: 203 },
];

export default function App() {
  const [liked, setLiked] = useState<Set<number>>(new Set());

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-gray-950/90 backdrop-blur z-10">
        <h1 className="text-xl font-bold">Feed</h1>
      </header>
      <main className="max-w-xl mx-auto py-6 flex flex-col gap-4 px-4">
        {posts.map(p => (
          <div key={p.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">{p.avatar}</div>
              <span className="font-medium">{p.author}</span>
            </div>
            <p className="text-gray-200 mb-4 text-sm leading-relaxed">{p.content}</p>
            <div className="flex items-center gap-5 text-gray-400 text-sm">
              <button onClick={() => setLiked(s => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                className={\`flex items-center gap-1.5 \${liked.has(p.id) ? 'text-pink-500' : ''}\`}>
                <Heart size={15} className={liked.has(p.id) ? 'fill-current' : ''} />
                {p.likes + (liked.has(p.id) ? 1 : 0)}
              </button>
              <button className="flex items-center gap-1.5"><MessageCircle size={15} />Reply</button>
              <button className="flex items-center gap-1.5"><Share2 size={15} />Share</button>
              <button className="ml-auto"><Bookmark size={15} /></button>
            </div>
          </div>
        ))}
      </main>
`.trim(),
  },
  {
    id: 'jsx-02',
    name: 'Invalid JSX attribute syntax',
    category: 'jsx',
    description: 'JSX element has malformed attribute (missing closing brace)',
    expectedCategory: 'jsx',
    tags: ['jsx', 'syntax'],
    brokenApp: `
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Globe } from 'lucide-react';

const plans = [
  { name: 'Starter', price: 9, features: ['5 Projects', '10GB Storage', 'Basic Analytics', 'Email Support'] },
  { name: 'Pro', price: 29, features: ['Unlimited Projects', '100GB Storage', 'Advanced Analytics', 'Priority Support', 'Custom Domain'], popular: true },
  { name: 'Enterprise', price: 99, features: ['Everything in Pro', 'SSO', 'SLA 99.9%', 'Dedicated Manager', 'Custom Integrations'] },
];

export default function App() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white py-20 px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4">Simple Pricing</h1>
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="text-sm text-gray-400">Monthly</span>
          <button onClick={() => setAnnual(a => !a)} className={\`relative w-12 h-6 rounded-full transition-colors \${annual ? 'bg-indigo-600' : 'bg-gray-700'}\`}>
            <div className={\`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform \${annual ? 'translate-x-7' : 'translate-x-1'}\`} />
          </button>
          <span className="text-sm text-gray-400">Annual <span className="text-green-400">-20%</span></span>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {plans.map(plan => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -4 }}
              className={\`p-6 rounded-2xl border \${plan.popular ? 'border-indigo-500 bg-indigo-950/30' : 'border-gray-800 bg-gray-900'}\`
            >
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-3xl font-bold my-3">\${annual ? Math.round(plan.price * 0.8) : plan.price}<span className="text-base font-normal text-gray-400">/mo</span></p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-300"><Check size={14} className="text-green-400" />{f}</li>)}
              </ul>
              <button className={\`w-full py-2.5 rounded-xl text-sm font-medium \${plan.popular ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-gray-800 hover:bg-gray-700'}\`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'jsx-03',
    name: 'Self-closing tag used as container',
    category: 'jsx',
    description: '<div /> used as self-closing but child elements follow it',
    expectedCategory: 'jsx',
    tags: ['jsx', 'syntax'],
    brokenApp: `
import React, { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';

interface Task { id: number; text: string; done: boolean; priority: 'low' | 'medium' | 'high'; }

const PRIORITY_COLORS = { low: 'bg-gray-100 text-gray-600', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Review Q4 metrics', done: false, priority: 'high' },
    { id: 2, text: 'Update onboarding flow', done: true, priority: 'medium' },
    { id: 3, text: 'Write API documentation', done: false, priority: 'low' },
  ]);
  const [input, setInput] = useState('');

  const add = () => {
    if (!input.trim()) return;
    setTasks(t => [...t, { id: Date.now(), text: input, done: false, priority: 'medium' }]);
    setInput('');
  };

  const toggle = (id: number) => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const remove = (id: number) => setTasks(t => t.filter(x => x.id !== id));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border w-full max-w-md p-6" />
        <h1 className="text-xl font-bold mb-5">Tasks</h1>
        <div className="flex gap-2 mb-6">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            className="flex-1 border rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-400" placeholder="New task..." />
          <button onClick={add} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500"><Plus size={18}/></button>
        </div>
        <ul className="flex flex-col gap-2">
          {tasks.map(t => (
            <li key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
              <button onClick={() => toggle(t.id)} className={\`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 \${t.done ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}\`}>
                {t.done && <Check size={12} className="text-white" />}
              </button>
              <span className={\`flex-1 text-sm \${t.done ? 'line-through text-gray-400' : 'text-gray-700'}\`}>{t.text}</span>
              <span className={\`text-xs px-2 py-0.5 rounded-full \${PRIORITY_COLORS[t.priority]}\`}>{t.priority}</span>
              <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={14}/></button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'jsx-04',
    name: 'Mismatched JSX closing tag',
    category: 'jsx',
    description: 'Opening <section> closed with </div>',
    expectedCategory: 'jsx',
    tags: ['jsx', 'syntax'],
    brokenApp: `
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Check } from 'lucide-react';

const features = [
  { icon: Star, title: 'AI-Powered', desc: 'Generate entire websites from a single prompt using state-of-the-art AI.' },
  { icon: Check, title: 'Production Ready', desc: 'Every project ships with TypeScript, routing, and clean component architecture.' },
  { icon: ArrowRight, title: 'Lightning Fast', desc: 'From prompt to deployed site in under 60 seconds.' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full border-b bg-white/90 backdrop-blur z-50 px-8 py-4 flex items-center justify-between">
        <div className="font-bold text-lg">NexoGen</div>
        <button className="px-5 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800">Get Started</button>
      </nav>
      <section className="pt-32 pb-24 px-8 max-w-4xl mx-auto text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl font-bold tracking-tight mb-6">
          Build websites at the speed of thought
        </motion.h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          NexoGen turns your ideas into production-ready React apps in seconds.
        </p>
        <button className="flex items-center gap-2 mx-auto px-8 py-4 bg-black text-white rounded-full text-lg hover:bg-gray-900">
          Start Building <ArrowRight size={20} />
        </button>
      </div>
      <section className="py-24 bg-gray-50 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white p-8 rounded-2xl border hover:shadow-md transition-shadow">
              <Icon size={24} className="text-indigo-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'jsx-05',
    name: 'JSX inside string context',
    category: 'jsx',
    description: 'JSX expression missing closing brace in ternary',
    expectedCategory: 'jsx',
    tags: ['jsx', 'syntax'],
    brokenApp: `
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

type Mode = 'login' | 'signup';

export default function App() {
  const [mode, setMode] = useState<Mode>('login');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {mode === 'login' ? 'Welcome back!' : 'Join us today.'}
        </p>
        <div className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
              <User size={16} className="text-gray-400" />
              <input className="flex-1 outline-none text-sm" placeholder="Full name" value={form.name} onChange={update('name')} />
            </div>
          )}
          <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
            <Mail size={16} className="text-gray-400" />
            <input className="flex-1 outline-none text-sm" type="email" placeholder="Email" value={form.email} onChange={update('email')} />
          </div>
          <div className="flex items-center gap-3 border rounded-xl px-4 py-3">
            <Lock size={16} className="text-gray-400" />
            <input className="flex-1 outline-none text-sm" type={show ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={update('password')} />
            <button onClick={() => setShow(s => !s)} className="text-gray-400">
              {show ? <EyeOff size={16} /> : <Eye size={16}
            </button>
          </div>
          <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 mt-2">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <button onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')} className="text-indigo-600 hover:underline">
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
`.trim(),
  },
];

// ── Phase 5: Route Failure Scenarios ─────────────────────────────────────────

export const ROUTE_SCENARIOS: TestScenario[] = [
  {
    id: 'route-01',
    name: 'Route uses undefined Dashboard',
    category: 'route',
    description: '<Route> element imports Dashboard that does not exist',
    expectedCategory: 'import',
    tags: ['route', 'import'],
    brokenApp: `
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100">
        <aside className="w-56 bg-gray-900 text-white p-6 flex flex-col gap-2">
          <div className="text-lg font-bold mb-6">AppPro</div>
          {[
            { to: '/', label: 'Dashboard' },
            { to: '/analytics', label: 'Analytics' },
            { to: '/settings', label: 'Settings' },
          ].map(item => (
            <Link key={item.to} to={item.to} className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
`.trim(),
  },
  {
    id: 'route-02',
    name: 'createBrowserRouter with missing components',
    category: 'route',
    description: 'createBrowserRouter references HomePage and NotFound which are not imported',
    expectedCategory: 'import',
    tags: ['route', 'import'],
    brokenApp: `
import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '*', element: <NotFound /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
`.trim(),
  },
  {
    id: 'route-03',
    name: 'Nested routes with missing Outlet page',
    category: 'route',
    description: 'Nested route uses ProfilePage and BillingPage which do not exist',
    expectedCategory: 'import',
    tags: ['route', 'import', 'nested'],
    brokenApp: `
import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import ProfilePage from './pages/Profile';
import BillingPage from './pages/Billing';
import SecurityPage from './pages/Security';

function SettingsLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <nav className="w-48 bg-white border-r p-6 flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">Settings</h2>
        {[
          { to: '/settings/profile', label: 'Profile' },
          { to: '/settings/billing', label: 'Billing' },
          { to: '/settings/security', label: 'Security' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">{item.label}</Link>
        ))}
      </nav>
      <div className="flex-1 p-8"><Outlet /></div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/settings" element={<SettingsLayout />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="security" element={<SecurityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
`.trim(),
  },
  {
    id: 'route-04',
    name: 'Route with guard component missing',
    category: 'route',
    description: 'PrivateRoute and PublicRoute guard components not imported',
    expectedCategory: 'import',
    tags: ['route', 'import', 'guard'],
    brokenApp: `
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './guards/PrivateRoute';
import PublicRoute from './guards/PublicRoute';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border w-80">
        <h1 className="text-xl font-bold mb-6">Sign In</h1>
        <input className="w-full border rounded-xl px-4 py-2.5 text-sm mb-3 outline-none" placeholder="Email" />
        <input className="w-full border rounded-xl px-4 py-2.5 text-sm mb-4 outline-none" type="password" placeholder="Password" />
        <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm">Sign In</button>
      </div>
    </div>
  );
}

function ProtectedPage() {
  return <div className="p-8"><h1 className="text-2xl font-bold">Protected Content</h1><p className="text-gray-500 mt-2">You are authenticated.</p></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/app" element={<PrivateRoute><ProtectedPage /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
`.trim(),
  },
  {
    id: 'route-05',
    name: 'Routes without BrowserRouter wrapper',
    category: 'route',
    description: '<Routes> used without any Router context (missing BrowserRouter)',
    expectedCategory: 'import',
    tags: ['route', 'context'],
    brokenApp: `
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AdminPanel from './admin/AdminPanel';
import UserDashboard from './user/UserDashboard';

function Nav() {
  return (
    <nav className="bg-gray-900 text-white px-8 py-4 flex gap-6">
      <span className="font-bold text-lg">AppBase</span>
      <Link to="/admin" className="text-gray-300 hover:text-white text-sm">Admin</Link>
      <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm">Dashboard</Link>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
    </div>
  );
}
`.trim(),
  },
];

// ── Phase 6: Dependency Failure Scenarios ─────────────────────────────────────

export const DEPENDENCY_SCENARIOS: TestScenario[] = [
  {
    id: 'dep-01',
    name: 'Imports react-helmet (not installed)',
    category: 'dependency',
    description: 'App imports react-helmet which is not in node_modules',
    expectedCategory: 'import',
    tags: ['dependency', 'package'],
    brokenApp: `
import React from 'react';
import { Helmet } from 'react-helmet';
import { Globe, Lock, Bell } from 'lucide-react';

export default function App() {
  return (
    <>
      <Helmet>
        <title>My SaaS App</title>
        <meta name="description" content="The best SaaS app ever built." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="bg-white rounded-xl shadow-sm border divide-y max-w-2xl">
          {[
            { icon: Globe, label: 'General', desc: 'Manage your account settings' },
            { icon: Bell, label: 'Notifications', desc: 'Configure notification preferences' },
            { icon: Lock, label: 'Security', desc: 'Password and 2FA settings' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 p-5 hover:bg-gray-50 cursor-pointer">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Icon size={18} className="text-indigo-600" /></div>
              <div><p className="font-medium">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
`.trim(),
  },
  {
    id: 'dep-02',
    name: 'Imports styled-components (not installed)',
    category: 'dependency',
    description: 'App imports styled-components which is not in node_modules',
    expectedCategory: 'import',
    tags: ['dependency', 'package'],
    brokenApp: `
import React, { useState } from 'react';
import styled from 'styled-components';
import { Star } from 'lucide-react';

const Card = styled.div\`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
\`;

const Button = styled.button<{ $primary?: boolean }>\`
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  background: \${p => p.$primary ? '#6366f1' : '#f3f4f6'};
  color: \${p => p.$primary ? 'white' : '#374151'};
  border: none;
  cursor: pointer;
\`;

const products = [
  { id: 1, name: 'Wireless Earbuds', price: 59.99, rating: 4.7 },
  { id: 2, name: 'Mechanical Keyboard', price: 89.99, rating: 4.8 },
];

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {products.map(p => (
          <Card key={p.id}>
            <div style={{ height: 120, background: '#f3f4f6', borderRadius: 8, marginBottom: 16 }} />
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{p.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
              <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
              <span style={{ fontSize: 13, color: '#6b7280' }}>{p.rating}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>\${p.price}</strong>
              <Button $primary>Add to Cart</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'dep-03',
    name: 'Imports @tanstack/react-table (not installed)',
    category: 'dependency',
    description: 'App imports from @tanstack/react-table which is not in node_modules',
    expectedCategory: 'import',
    tags: ['dependency', 'package'],
    brokenApp: `
import React, { useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Employee { id: number; name: string; department: string; salary: number; status: string; }
const employees: Employee[] = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 95000, status: 'Active' },
  { id: 2, name: 'Bob Kumar', department: 'Design', salary: 78000, status: 'Active' },
  { id: 3, name: 'Carol Smith', department: 'Marketing', salary: 65000, status: 'Leave' },
];

export default function App() {
  const table = useReactTable({
    data: employees,
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'salary', header: 'Salary', cell: info => \`\$\${info.getValue<number>().toLocaleString()}\` },
      { accessorKey: 'status', header: 'Status' },
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Team Overview</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>{hg.headers.map(h => <th key={h.id} className="px-6 py-3 text-left font-medium text-gray-500">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
            ))}
          </thead>
          <tbody>{table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-b last:border-0 hover:bg-gray-50">
              {row.getVisibleCells().map(cell => <td key={cell.id} className="px-6 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'dep-04',
    name: 'Imports react-hot-toast (not installed)',
    category: 'dependency',
    description: 'App imports toast from react-hot-toast which is not installed',
    expectedCategory: 'import',
    tags: ['dependency', 'package'],
    brokenApp: `
import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Save, RefreshCw } from 'lucide-react';

export default function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    if (!name || !email) {
      toast.error('Please fill in all fields.');
    } else {
      toast.success('Profile saved successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Toaster position="top-right" />
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-md">
        <h1 className="text-xl font-bold mb-6">Profile Settings</h1>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400" placeholder="john@example.com" />
          </div>
          <button onClick={save} disabled={loading} className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 disabled:opacity-50">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'dep-05',
    name: 'Imports react-spring (not installed)',
    category: 'dependency',
    description: 'App imports useSpring from react-spring which is not installed',
    expectedCategory: 'import',
    tags: ['dependency', 'package'],
    brokenApp: `
import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { ArrowRight, Zap } from 'lucide-react';

export default function App() {
  const [active, setActive] = useState(false);

  const spring = useSpring({
    opacity: active ? 1 : 0.4,
    transform: active ? 'scale(1.05)' : 'scale(1)',
    config: { tension: 280, friction: 60 },
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8">
      <animated.div style={spring} className="bg-gray-900 border border-gray-700 rounded-2xl p-10 text-center max-w-sm">
        <Zap size={40} className="text-indigo-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Animated Card</h1>
        <p className="text-gray-400 text-sm">Powered by react-spring physics.</p>
      </animated.div>
      <button onClick={() => setActive(a => !a)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-500">
        Toggle Animation <ArrowRight size={16} />
      </button>
    </div>
  );
}
`.trim(),
  },
];

// ── Phase 7: Runtime / Export Failure Scenarios ───────────────────────────────

export const RUNTIME_SCENARIOS: TestScenario[] = [
  {
    id: 'rt-01',
    name: 'Missing default export',
    category: 'runtime',
    description: 'App function is declared but not exported as default',
    expectedCategory: 'build',
    tags: ['runtime', 'export'],
    brokenApp: `
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const weekData = [
  { day: 'Mon', tasks: 8 }, { day: 'Tue', tasks: 12 }, { day: 'Wed', tasks: 6 },
  { day: 'Thu', tasks: 15 }, { day: 'Fri', tasks: 11 }, { day: 'Sat', tasks: 3 }, { day: 'Sun', tasks: 1 },
];

function App() {
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const total = weekData.reduce((s, d) => s + d.tasks, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">Productivity</h1>
      <p className="text-gray-400 mb-8">{total} tasks completed this week</p>
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Daily Tasks</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weekData} onClick={d => setActiveDay(d?.activeLabel ?? null)}>
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
            <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {activeDay && <p className="text-center text-sm text-indigo-400 mt-3">Selected: {activeDay}</p>}
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'rt-02',
    name: 'Only named export (no default)',
    category: 'runtime',
    description: 'Component exported as named export, not default',
    expectedCategory: 'build',
    tags: ['runtime', 'export'],
    brokenApp: `
import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Starter', price: 0,
    features: ['3 Projects', '1GB Storage', 'Community Support'],
    unavailable: ['Analytics', 'Custom Domain', 'SSO'],
  },
  {
    name: 'Pro', price: 29,
    features: ['Unlimited Projects', '50GB Storage', 'Priority Support', 'Analytics'],
    unavailable: ['Custom Domain', 'SSO'],
  },
];

export const App = () => (
  <div className="min-h-screen bg-white py-20 px-8">
    <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
    <p className="text-gray-600 text-center mb-12">Start for free. Scale as you grow.</p>
    <div className="max-w-3xl mx-auto grid grid-cols-2 gap-6">
      {plans.map((plan, i) => (
        <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
          className="border rounded-2xl p-8 hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
          <p className="text-3xl font-bold mb-6">{plan.price === 0 ? 'Free' : \`\$\${plan.price}/mo\`}</p>
          <ul className="space-y-2.5 mb-6">
            {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-sm"><Check size={15} className="text-green-500"/>{f}</li>)}
            {plan.unavailable.map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-300"><X size={15} className="text-gray-300"/>{f}</li>)}
          </ul>
          <button className={\`w-full py-2.5 rounded-xl text-sm font-medium \${plan.price === 0 ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-900'}\`}>
            {plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
          </button>
        </motion.div>
      ))}
    </div>
  </div>
);
`.trim(),
  },
  {
    id: 'rt-03',
    name: 'Component returns nothing (no return statement)',
    category: 'runtime',
    description: 'App function body has no return — exports undefined',
    expectedCategory: 'build',
    tags: ['runtime', 'export'],
    brokenApp: `
import React, { useEffect, useRef } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 1,
        color: ['#6366f1', '#8b5cf6', '#a78bfa'][Math.floor(Math.random() * 3)],
      });
    }

    let animId: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(3,7,18,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  // missing: return (<canvas ref={canvasRef} className="block w-full h-screen bg-gray-950" />);
}
`.trim(),
  },
  {
    id: 'rt-04',
    name: 'Import from non-existent local module',
    category: 'runtime',
    description: 'App imports multiple non-existent local modules',
    expectedCategory: 'import',
    tags: ['runtime', 'import'],
    brokenApp: `
import React, { useState } from 'react';
import { useNotifications } from './store/notifications';
import { usePermissions } from './store/permissions';
import { formatRelativeTime } from './lib/dateUtils';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function App() {
  const { notifications, markRead, clearAll } = useNotifications();
  const { canManage } = usePermissions();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto pt-16 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2"><Bell size={20} className="text-indigo-600" />Notifications</h1>
          {canManage && (
            <button onClick={clearAll} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <Trash2 size={14} />Clear all
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {notifications.map(n => (
            <div key={n.id} className={\`bg-white rounded-xl p-4 border flex gap-3 \${n.read ? 'opacity-60' : ''}\`}>
              <div className={\`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 \${n.read ? 'bg-gray-300' : 'bg-indigo-500'}\`} />
              <div className="flex-1">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
              </div>
              {!n.read && (
                <button onClick={() => markRead(n.id)} className="text-gray-300 hover:text-indigo-500"><Check size={16}/></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`.trim(),
  },
  {
    id: 'rt-05',
    name: 'Invalid syntax — stray token in function body',
    category: 'runtime',
    description: 'Function body has a stray semicolon creating a syntax error',
    expectedCategory: 'typescript',
    tags: ['runtime', 'syntax'],
    brokenApp: `
import React, { useState, useCallback } from 'react';
import { Search, Filter, Download } from 'lucide-react';

interface Row { id: number; name: string; value: number; category: string; trend: 'up' | 'down'; }
const ROWS: Row[] = [
  { id: 1, name: 'North America', value: 128430, category: 'Region', trend: 'up' },
  { id: 2, name: 'Europe', value: 89210, category: 'Region', trend: 'down' },
  { id: 3, name: 'Asia Pacific', value: 214560, category: 'Region', trend: 'up' },
  { id: 4, name: 'Latin America', value: 34890, category: 'Region', trend: 'up' },
];

export default function App() {;
  const [q, setQ] = useState('');
  const filtered = ROWS.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));
  const total = ROWS.reduce((s, r) => s + r.value, 0);

  const exportCSV = useCallback(() => {
    const csv = ['Name,Value,Category,Trend', ...filtered.map(r => \`\${r.name},\${r.value},\${r.category},\${r.trend}\`)].join('\\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'data.csv'; a.click();
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Data Explorer</h1>
            <p className="text-sm text-gray-500 mt-1">Total: {total.toLocaleString()} across {ROWS.length} entries</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-100"><Download size={15}/>Export CSV</button>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border mb-4">
          <Search size={16} className="text-gray-400" />
          <input className="flex-1 outline-none text-sm" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter rows..." />
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>
            <th className="px-6 py-3 text-left text-gray-500 font-medium">Name</th>
            <th className="px-6 py-3 text-right text-gray-500 font-medium">Value</th>
            <th className="px-6 py-3 text-left text-gray-500 font-medium">Trend</th>
          </tr></thead>
          <tbody>{filtered.map(r => <tr key={r.id} className="border-b last:border-0">
            <td className="px-6 py-4 font-medium">{r.name}</td>
            <td className="px-6 py-4 text-right">{r.value.toLocaleString()}</td>
            <td className="px-6 py-4"><span className={\`text-xs px-2 py-1 rounded-full \${r.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>{r.trend === 'up' ? '↑' : '↓'}</span></td>
          </tr>)}</tbody></table>
        </div>
      </div>
    </div>
  );
}
`.trim(),
  },
];

// ── Full scenario catalogue ───────────────────────────────────────────────────

export const ALL_SCENARIOS: TestScenario[] = [
  ...IMPORT_SCENARIOS,
  ...TYPESCRIPT_SCENARIOS,
  ...JSX_SCENARIOS,
  ...ROUTE_SCENARIOS,
  ...DEPENDENCY_SCENARIOS,
  ...RUNTIME_SCENARIOS,
];

/** Generate additional mixed stress scenarios by combining two broken patterns */
export function generateMixedScenarios(count: number): TestScenario[] {
  const base = ALL_SCENARIOS;
  const mixed: TestScenario[] = [];

  for (let i = 0; i < count; i++) {
    const a = base[i % base.length]!;
    const b = base[(i + 7) % base.length]!;

    // Combine: take broken code from one, add a second error on top
    mixed.push({
      id: `mixed-${String(i + 1).padStart(2, '0')}`,
      name: `Mixed: ${a.category} + ${b.category}`,
      category: 'mixed',
      description: `Combines ${a.name} with ${b.name} error pattern`,
      expectedCategory: 'import',
      tags: ['mixed', a.category, b.category],
      brokenApp: a.brokenApp,   // Use first scenario's broken app (already fails)
    });
  }

  return mixed;
}

/** Pick N random scenarios from the full catalogue */
export function pickScenarios(n: number, includeExtra = true): TestScenario[] {
  const mixed = includeExtra ? generateMixedScenarios(20) : [];
  const all = [...ALL_SCENARIOS, ...mixed];
  // Deterministic shuffle for reproducibility
  const shuffled = all.sort((a, b) => (a.id > b.id ? 1 : -1));
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
