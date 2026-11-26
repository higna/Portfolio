import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  FileText,
  Image as ImageIcon,
  User as UserIcon,
  ChevronRight,
  Plus,
  CheckCircle,
  Circle,
  Sparkles,
  UploadCloud,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';

const CommandPalette = lazy(() => import('../../common/components/CommandPalette'));

const logger = createLogger('UserDashboardHome');

interface UserStats {
  conversations: number;
  messages: number;
}

interface ActivityData {
  recentChats: {
    id: string;
    conversationId: string;
    userMessage: string;
    createdAt: string;
  }[];
}

interface ToolUsage {
  [key: string]: { lastUsed: string; count: number };
}

/* ---------- Helpers ---------- */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = value;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(from + (to - from) * progress));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{display}</>;
}

/* ---------- Tool Card ---------- */
function ToolCard({ tool, usage, index, onOpen }: { tool: any; usage: ToolUsage; index: number; onOpen: (path: string) => void }) {
  const usageInfo = usage[tool.path];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
    >
      <div className={`absolute inset-0 bg-linear-to-br ${tool.gradient} opacity-0 group-hover:opacity-20 transition-opacity`} />
      <div className="p-5 relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl bg-base-200/60 ${tool.color}`}>
            <tool.icon className="w-6 h-6" />
          </div>
          <ChevronRight className="w-5 h-5 text-base-content/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
        <h3 className="font-semibold mt-4">{tool.label}</h3>
        <p className="text-sm text-base-content/60 mt-1 flex-1">{tool.description}</p>
        {usageInfo && (
          <div className="mt-3 flex items-center justify-between text-xs text-base-content/50">
            <span>Used {usageInfo.count} time{usageInfo.count !== 1 ? 's' : ''}</span>
            <span>Last: {new Date(usageInfo.lastUsed).toLocaleDateString()}</span>
          </div>
        )}
        <button onClick={() => onOpen(tool.path)} className="mt-4 btn btn-sm btn-primary w-full">
          Open
        </button>
      </div>
    </motion.div>
  );
}

/* ---------- Onboarding Checklist ---------- */
function OnboardingChecklist({ stats, usage }: { stats: UserStats | null; usage: ToolUsage }) {
  const { user } = useAuth();
  const items = [
    { label: 'Complete your profile', done: Boolean(user?.fullName && user?.picture) },
    { label: 'Start a chat with AI', done: Boolean(stats?.conversations && stats.conversations > 0) },
    { label: 'Try PDF Merger', done: Boolean(usage['/dashboard/pdf/merge']?.count > 0) },
  ];
  const completed = items.filter((i) => i.done).length;
  const total = items.length;

  return (
    <div className="rounded-3xl border border-base-content/10 bg-base-100 p-5 shadow-sm sm:p-6">
      <div>
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Getting started
        </h3>
        <p className="mt-1 text-xs text-base-content/55">A few steps to get more from your workspace.</p>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {item.done ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <Circle className="w-4 h-4 text-base-content/30" />
            )}
            <span className={item.done ? 'text-base-content/50 line-through' : ''}>{item.label}</span>
          </div>
        ))}
      </div>
      <progress className="progress progress-primary mt-4" value={completed} max={total}></progress>
      <p className="text-xs text-base-content/50 mt-1">{completed}/{total} completed</p>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function UserDashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [usage, setUsage] = useState<ToolUsage>({});
  const [paletteOpen, setPaletteOpen] = useState(false);

  const tools = [
    {
      label: 'AI Chat',
      description: 'Chat with the AI assistant, ask for CV, or get project info.',
      icon: MessageCircle,
      path: '/dashboard/chat',
      color: 'text-primary',
      gradient: 'from-primary/20 to-transparent',
    },
    {
      label: 'PDF Merger',
      description: 'Combine multiple PDF files into one document.',
      icon: FileText,
      path: '/dashboard/pdf/merge',
      color: 'text-secondary',
      gradient: 'from-secondary/20 to-transparent',
    },
    {
      label: 'Image to PDF',
      description: 'Convert images into a single PDF file.',
      icon: ImageIcon,
      path: '/dashboard/pdf/images-to-pdf',
      color: 'text-accent',
      gradient: 'from-accent/20 to-transparent',
    },
  ];

  /* Ctrl+K command palette */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    ...tools.map((t) => ({ label: t.label, action: () => navigate(t.path) })),
    { label: 'Edit Profile', action: () => navigate('/dashboard/profile') },
    { label: 'View Projects', action: () => navigate('/projects') },
    { label: 'New Chat', action: () => navigate('/dashboard/chat') },
  ];

  /* Usage tracking from localStorage */
  useEffect(() => {
    const stored = localStorage.getItem('toolUsage');
    if (stored) setUsage(JSON.parse(stored));
  }, []);

  const recordToolUsage = useCallback((path: string) => {
    const now = new Date().toISOString();
    setUsage((prev) => {
      const current = prev[path] || { lastUsed: now, count: 0 };
      const updated = {
        ...prev,
        [path]: { lastUsed: now, count: current.count + 1 },
      };
      localStorage.setItem('toolUsage', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleOpenTool = useCallback(
    (path: string) => {
      recordToolUsage(path);
      navigate(path);
    },
    [recordToolUsage, navigate]
  );

  /* Load stats and activity */
  useEffect(() => {
    api.get('/dashboard/user-stats')
      .then((res) => setStats(res.data))
      .catch(() => logger.warn('Failed to load user stats'));

    api.get('/dashboard/user-activity')
      .then((res) => setActivity(res.data))
      .catch(() => logger.warn('Failed to load user activity'));
  }, []);

  const profileCompletion = Math.min(
    100,
    [
      user?.fullName ? 25 : 0,
      user?.picture ? 25 : 0,
      user?.email ? 25 : 0,
      user?.authProvider ? 25 : 0,
    ].reduce((a, b) => a + b, 0)
  );

  const missingProfileItems = [
    !user?.fullName && 'Full name',
    !user?.picture && 'Profile picture',
    !user?.email && 'Email',
    !user?.authProvider && 'Auth provider',
  ].filter(Boolean) as string[];

  const quickActions = [
    { label: 'New Chat', icon: Plus, action: () => handleOpenTool('/dashboard/chat') },
    { label: 'Upload PDF', icon: UploadCloud, action: () => handleOpenTool('/dashboard/pdf/merge') },
    { label: 'Convert Image', icon: ImageIcon, action: () => handleOpenTool('/dashboard/pdf/images-to-pdf') },
    { label: 'Edit Profile', icon: UserIcon, action: () => navigate('/dashboard/profile') },
  ];

  const recommendation = useCallback(() => {
    const usedPaths = Object.keys(usage).filter((p) => usage[p]?.count > 0);
    if (usedPaths.length === 0) return null;

    const mostUsed = usedPaths.reduce((a, b) =>
      usage[a].count > usage[b].count ? a : b
    );
    const allPaths = tools.map((t) => t.path);
    const unused = allPaths.filter((p) => !usedPaths.includes(p));

    if (!unused.length) return null;

    const tool = tools.find((t) => t.path === unused[0]);
    return `You frequently use ${tools.find((t) => t.path === mostUsed)?.label} – try ${tool?.label} for quick tasks.`;
  }, [usage, tools]);

  return (
    <div className="relative mx-auto w-full max-w-screen-2xl space-y-5">
      <header className="relative overflow-hidden rounded-3xl border border-warning/20 bg-[#10100e] px-5 py-5 text-white shadow-xl shadow-base-content/5 sm:px-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-32 size-72 rounded-full border border-warning/10" />
        <div aria-hidden="true" className="pointer-events-none absolute right-20 -top-24 size-56 rounded-full border border-warning/10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-warning/[0.06] to-transparent" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="avatar">
              <div className="w-16 h-16 rounded-2xl ring-2 ring-warning/70 overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user.fullName || ''} />
                ) : (
                  <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-2xl font-bold">
                    {user?.fullName?.charAt(0) ||
                      user?.email?.charAt(0)?.toUpperCase() || (
                        <UserIcon className="w-8 h-8" />
                      )}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-warning">Your workspace</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.email}
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Pick up where you left off.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button onClick={() => handleOpenTool('/dashboard/chat')} className="btn btn-warning btn-sm gap-2">
              <Plus className="w-4 h-4" /> New Chat
            </button>
            <button onClick={() => navigate('/dashboard/profile')} className="btn btn-sm gap-2 border-white/25 bg-white/5 text-white hover:bg-white/15">
              <UserIcon className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-base-content/10 bg-base-100 p-3 shadow-sm">
        <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[.16em] text-base-content/45">Quick actions</div>
        <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button key={action.label} onClick={action.action} className="btn btn-sm gap-2 border-base-content/10 bg-base-200/50 hover:border-primary/25 hover:bg-primary/5">
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="group flex items-center gap-4 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[.14em] text-base-content/50">Conversations</p>
            <p className="text-2xl font-semibold tabular-nums text-primary mt-0.5">
              <Counter value={stats?.conversations ?? 0} />
            </p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="p-3 rounded-xl bg-secondary/10 text-secondary shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[.14em] text-base-content/50">Messages</p>
            <p className="text-2xl font-semibold tabular-nums text-secondary mt-0.5">
              <Counter value={stats?.messages ?? 0} />
            </p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="p-3 rounded-xl bg-accent/10 text-accent shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[.14em] text-base-content/50">Tools Available</p>
            <p className="text-2xl font-semibold tabular-nums text-accent mt-0.5">{tools.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        {/* Profile Completion */}
        <div className="flex flex-col items-center rounded-3xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
          <div className="radial-progress text-primary" style={{ "--value": profileCompletion, "--size": "6rem", "--thickness": "0.5rem" } as React.CSSProperties}>
            <span className="text-xl font-bold">{profileCompletion}%</span>
          </div>
          <h3 className="font-semibold mt-4">Profile Completion</h3>
          <p className="text-xs text-base-content/50 text-center mt-1">
            {profileCompletion < 100
              ? `Complete your profile to get the most out of the platform. Missing: ${missingProfileItems.join(', ') || 'Nothing'}`
              : 'Your profile is complete. Well done!'}
          </p>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="btn btn-sm btn-primary mt-4 w-full gap-2"
          >
            <UserIcon className="w-4 h-4" /> Complete Profile
          </button>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist stats={stats} usage={usage} />

        {/* Activity Feed */}
        <div className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-bold flex items-center gap-2 text-base-content mb-4">
            <Clock className="w-5 h-5 text-base-content/50" /> Recent Activity
          </h3>
          {activity?.recentChats?.length ? (
            <ul className="space-y-3">
              {activity.recentChats.slice(0, 3).map((chat) => (
                <li key={chat.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                  <MessageCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{chat.userMessage}</p>
                    <p className="text-xs text-base-content/50">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {chat.conversationId && (
                    <button
                      onClick={() => navigate(`/dashboard/chat?conversationId=${chat.conversationId}`)}
                      className="btn btn-ghost btn-xs gap-1 shrink-0"
                    >
                      Resume <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-base-content/50">No recent activity yet.</p>
          )}
        </div>
      </div>

      {/* Tools Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, idx) => (
            <ToolCard
              key={tool.path}
              tool={tool}
              usage={usage}
              index={idx}
              onOpen={handleOpenTool}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Recommendation */}
      {recommendation() && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm text-base-content/70 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {recommendation()}
          </p>
        </div>
      )}

      {/* Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      </Suspense>
    </div>
  );
}
