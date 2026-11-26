import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Wrench, Award, Briefcase, ArrowRight, Plus,
  User, Download, Activity as ActivityIcon,
  FolderKanban, GraduationCap, Workflow, Zap, ShieldCheck,
  Server, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';
import toast from 'react-hot-toast';
import KeepAliveAdminCard from './KeepAliveAdminCard';

const DashboardAnalytics = lazy(() => import('./DashboardAnalytics'));
const QuickAddModal = lazy(() => import('./QuickAddModal'));

const logger = createLogger('AdminDashboard');

interface DashboardStats {
  users: number;
  skills: number;
  certifications: number;
  projects: number;
  recentUsers: {
    id: string;
    email: string;
    fullName: string | null;
    picture: string | null;
    createdAt: string;
  }[];
}

interface ActivityData {
  users: DashboardStats['recentUsers'];
  projects: {
    id: string;
    title: string;
    updatedAt: string;
  }[];
}

type PipelineStatusMap = Record<string, { status: 'success' | 'failed'; time: string }>;

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

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-base-content/10 bg-base-100 p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-base-300 rounded w-20" />
          <div className="h-8 bg-base-300 rounded w-16 mt-1" />
        </div>
        <div className="w-10 h-10 bg-base-300 rounded-full" />
      </div>
    </div>
  );
}

export default function AdminDashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatusMap>({});
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, statusRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activity'),
          api.get('/pipeline/status'),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
        setPipelineStatus((statusRes.data as PipelineStatusMap) || {});
        logger.log('Admin dashboard data loaded');
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err));
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:2500'}/dashboard/events?token=${token}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pipeline.status') {
        setPipelineStatus((prev) => ({
          ...prev,
          [data.payload.scriptName]: {
            status: data.payload.status,
            time: data.payload.time,
          },
        }));
      }
    };
    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => eventSource.close();
  }, []);

  const handleExportAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:2500'}/dashboard/export-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dashboard-backup.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export data');
    }
  };

  const statCards = [
    { label: 'Users', count: stats?.users ?? 0, icon: Users, path: '/dashboard/users', color: 'text-primary' },
    { label: 'Skills', count: stats?.skills ?? 0, icon: Wrench, path: '/dashboard/skills', color: 'text-secondary' },
    { label: 'Certifications', count: stats?.certifications ?? 0, icon: Award, path: '/dashboard/certifications', color: 'text-warning' },
    { label: 'Projects', count: stats?.projects ?? 0, icon: Briefcase, path: '/dashboard/projects', color: 'text-success' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-warning">Administrator workspace</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.email}
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Your portfolio at a glance. Here’s what needs your attention.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button onClick={() => setShowQuickAdd(true)} className="btn btn-warning btn-sm gap-2">
              <Plus className="w-4 h-4" /> Quick Add
            </button>
            <button onClick={handleExportAll} className="btn btn-sm gap-2 border-white/20 bg-white/5 text-white hover:bg-white/15">
              <Download className="w-4 h-4" /> Export All
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
          : statCards.map((card) => (
              <Link
                key={card.label}
                to={card.path}
                className="group card rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className={`grid size-10 shrink-0 place-items-center rounded-xl bg-base-200/70 transition-colors group-hover:bg-primary/10`}>
                    <card.icon className={`size-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[.14em] text-base-content/50">{card.label}</p>
                    <p className={`mt-0.5 text-2xl font-semibold tabular-nums ${card.color}`}>
                      <Counter value={card.count} />
                    </p>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      <Suspense fallback={<div className="h-72 skeleton animate-pulse rounded-xl" />}>
        <DashboardAnalytics />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-base-content/5 px-5 py-4">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-base-content">
                <ActivityIcon className="size-4 text-primary" /> Recent activity
              </h3>
              <p className="mt-0.5 text-xs text-base-content/45">Latest updates across your workspace</p>
            </div>
            <span className="badge badge-ghost badge-sm">Latest</span>
          </div>
          <div className="grid sm:grid-cols-2">
            <div className="border-b border-base-content/5 p-4 sm:border-b-0 sm:border-r">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-base-content/45">New users</p>
              </div>
              <ul className="divide-y divide-base-content/5">
                {(activity?.users ?? stats?.recentUsers ?? []).slice(0, 3).map((registeredUser) => (
                  <li key={registeredUser.id} className="flex min-w-0 items-center gap-2.5 py-2.5">
                    <div className="avatar placeholder">
                      <div className="size-8 rounded-full bg-neutral text-xs text-neutral-content">
                        {registeredUser.picture
                          ? <img src={registeredUser.picture} alt="" />
                          : (registeredUser.fullName?.charAt(0) || registeredUser.email.charAt(0).toUpperCase())}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{registeredUser.fullName || registeredUser.email}</p>
                      <p className="truncate text-[10px] text-base-content/45">{registeredUser.email}</p>
                    </div>
                    <time className="shrink-0 text-[10px] text-base-content/40">
                      {new Date(registeredUser.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </time>
                  </li>
                ))}
                {!activity?.users?.length && !stats?.recentUsers?.length && (
                  <li className="py-6 text-center text-xs text-base-content/45">No recent registrations.</li>
                )}
              </ul>
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-base-content/45">Project updates</p>
                <Link to="/dashboard/projects" className="text-[11px] font-medium text-primary hover:underline">View all</Link>
              </div>
              <ul className="divide-y divide-base-content/5">
                {(activity?.projects ?? []).slice(0, 3).map((project) => (
                  <li key={project.id} className="flex min-w-0 items-center gap-2.5 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FolderKanban className="size-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-xs font-medium">{project.title}</p>
                    <time className="shrink-0 text-[10px] text-base-content/40">
                      {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </time>
                  </li>
                ))}
                {!activity?.projects?.length && (
                  <li className="py-6 text-center text-xs text-base-content/45">No project updates.</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-base-content">
            <ArrowRight className="w-5 h-5 text-base-content/50" /> Quick Links
          </h3>
          <div className="grid grid-cols-2 gap-1">
            {[
              { to: '/dashboard/skills', icon: Wrench, label: 'Add New Skill' },
              { to: '/dashboard/projects', icon: FolderKanban, label: 'Add New Project' },
              { to: '/dashboard/certifications', icon: Award, label: 'Add New Certification' },
              { to: '/dashboard/education', icon: GraduationCap, label: 'Add Education' },
              { to: '/dashboard/experience', icon: Briefcase, label: 'Add Experience' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="btn btn-ghost btn-sm min-w-0 justify-start gap-2 px-2 text-xs hover:bg-primary/5"
              >
                <link.icon className="size-4 shrink-0" /> <span className="truncate">{link.label.replace('Add New ', '')}</span>
              </Link>
            ))}
            <button onClick={() => setShowQuickAdd(true)} className="btn btn-ghost btn-sm min-w-0 justify-start gap-2 px-2 text-xs hover:bg-primary/5">
              <Plus className="size-4 shrink-0" /> <span className="truncate">Quick Add</span>
            </button>
            <button onClick={handleExportAll} className="btn btn-ghost btn-sm min-w-0 justify-start gap-2 px-2 text-xs hover:bg-primary/5">
              <Download className="size-4 shrink-0" /> <span className="truncate">Export All</span>
            </button>
          </div>
        </section>

        <KeepAliveAdminCard />

        <section className="rounded-2xl border border-base-content/10 bg-base-100 p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-base-content">
            <ShieldCheck className="size-4 text-success" /> System status
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-base-content/45">
                <Workflow className="size-3.5 text-primary" /> Pipeline
              </h4>
              <div className="space-y-2">
                {Object.keys(pipelineStatus).length === 0 ? (
                  <p className="text-xs text-base-content/40">No pipeline runs recorded yet.</p>
                ) : (
                  Object.entries(pipelineStatus).map(([script, info]) => (
                    <div key={script} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium">{script}</span>
                      <span className={`badge badge-sm ${info.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                        {info.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-base-content/45">
                <ActivityIcon className="size-3.5 text-success" /> Services
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><Server className="size-3.5" /> API Server</span>
                  <span className="badge badge-success badge-sm gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Operational
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><Zap className="size-3.5" /> Automation</span>
                  <span className="badge badge-success badge-sm gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><AlertTriangle className="size-3.5" /> Pending alerts</span>
                  <span className="badge badge-ghost badge-sm">0</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showQuickAdd && (
        <Suspense fallback={null}>
          <QuickAddModal onClose={() => setShowQuickAdd(false)} />
        </Suspense>
      )}
    </div>
  );
}
