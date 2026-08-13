import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Wrench, Award, Briefcase, Clock, ArrowRight, Plus,
  User, Download, X, Activity as ActivityIcon, Settings2,
  FolderKanban, GraduationCap, Workflow, Zap, ShieldCheck,
  Server, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';
import toast from 'react-hot-toast';

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
  users: any[];
  projects: any[];
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
    <div className="card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md p-5 animate-pulse">
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

function QuickAddModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<'skill' | 'certification' | 'project'>('skill');
  const [form, setForm] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (type === 'skill') {
        await api.post('/portfolio/skills', {
          name: form.name,
          category: form.category || 'OTHER',
          proficiency: Number(form.proficiency || 3),
        });
      } else if (type === 'certification') {
        await api.post('/portfolio/certifications', {
          name: form.name,
          issuer: form.issuer,
          date: form.date || new Date().toISOString(),
          order: 0,
        });
      } else {
        await api.post('/portfolio/projects', {
          title: form.title,
          slug: form.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: form.description || '',
          techStack: (form.techStack || '').split(',').map((t: string) => t.trim()).filter(Boolean),
          liveUrl: form.liveUrl || null,
          githubUrl: form.githubUrl || null,
          isFeatured: Boolean(form.isFeatured),
          order: 0,
        });
      }
      toast.success(`${type} added successfully`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Quick Add</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="tabs tabs-boxed mb-4">
          {(['skill', 'certification', 'project'] as const).map((t) => (
            <button
              key={t}
              className={`tab tab-sm ${type === t ? 'tab-active' : ''}`}
              onClick={() => { setType(t); setForm({}); }}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {type === 'skill' && (
            <>
              <input placeholder="Skill name" required className="input input-bordered w-full"
                value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Category (e.g. PROGRAMMING)" className="input input-bordered w-full"
                value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <input type="number" min={1} max={5} placeholder="Proficiency (1-5)" className="input input-bordered w-full"
                value={form.proficiency || ''} onChange={(e) => setForm({ ...form, proficiency: e.target.value })} />
            </>
          )}
          {type === 'certification' && (
            <>
              <input placeholder="Certification name" required className="input input-bordered w-full"
                value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Issuer" required className="input input-bordered w-full"
                value={form.issuer || ''} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
              <input type="date" className="input input-bordered w-full"
                value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </>
          )}
          {type === 'project' && (
            <>
              <input placeholder="Project title" required className="input input-bordered w-full"
                value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea placeholder="Description" className="textarea textarea-bordered w-full"
                value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input placeholder="Tech stack (comma separated)" className="input input-bordered w-full"
                value={form.techStack || ''} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
              <input placeholder="Live URL" className="input input-bordered w-full"
                value={form.liveUrl || ''} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} />
              <input placeholder="GitHub URL" className="input input-bordered w-full"
                value={form.githubUrl || ''} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="checkbox checkbox-sm"
                  checked={Boolean(form.isFeatured)} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                <span>Featured project</span>
              </label>
            </>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
              {submitting ? <span className="loading loading-spinner"></span> : 'Save'}
            </button>
          </div>
        </form>
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
    { label: 'Users', count: stats?.users ?? 0, icon: Users, path: '/dashboard/users', color: 'text-blue-500' },
    { label: 'Skills', count: stats?.skills ?? 0, icon: Wrench, path: '/dashboard/skills', color: 'text-purple-500' },
    { label: 'Certifications', count: stats?.certifications ?? 0, icon: Award, path: '/dashboard/certifications', color: 'text-amber-500' },
    { label: 'Projects', count: stats?.projects ?? 0, icon: Briefcase, path: '/dashboard/projects', color: 'text-emerald-500' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative max-w-7xl w-full space-y-8">
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Hero Header */}
      <div className="card bg-gradient-to-br from-base-100 to-base-200 border border-base-content/10 shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="avatar">
              <div className="w-16 h-16 rounded-2xl ring-2 ring-primary/30 overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user.fullName || ''} />
                ) : (
                  <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-2xl font-bold">
                    {user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-base-content">
                {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.email}
              </h1>
              <p className="text-base-content/60 mt-1 flex items-center gap-2">
                <span className="badge badge-primary badge-sm">{user?.role}</span>
                <span className="text-sm">Here's what's happening today.</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowQuickAdd(true)} className="btn btn-primary btn-sm gap-2 shadow-md hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" /> Quick Add
            </button>
            <button onClick={handleExportAll} className="btn btn-outline btn-sm gap-2">
              <Download className="w-4 h-4" /> Export All
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
          : statCards.map((card) => (
              <Link
                key={card.label}
                to={card.path}
                className="group card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-base-content/50">{card.label}</p>
                    <p className={`text-3xl font-semibold mt-1 ${card.color}`}>
                      <Counter value={card.count} />
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-base-200/60 group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed (larger column) */}
        <div className="lg:col-span-2 card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md p-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-base-content mb-4">
            <ActivityIcon className="w-5 h-5 text-base-content/50" /> Activity Feed
          </h3>
          <div className="space-y-6">
            {stats?.recentUsers && stats.recentUsers.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-base-content/50 mb-3">New Users</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {stats.recentUsers.map((u) => (
                    <div key={u.id} className="avatar placeholder" title={u.email}>
                      <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content">
                        {u.picture ? <img src={u.picture} alt="" /> : (u.fullName?.charAt(0) || u.email.charAt(0).toUpperCase())}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activity?.projects && activity.projects.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-base-content/50 mb-3">Recent Projects</p>
                <ul className="space-y-3">
                  {activity.projects.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                      <span className="truncate flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                        {p.title}
                      </span>
                      <span className="text-xs text-base-content/40 shrink-0">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(!stats?.recentUsers?.length && !activity?.projects?.length) && (
              <div className="text-center text-base-content/40 py-6">
                <Clock className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No activity yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick Links + System Status */}
        <div className="space-y-6">
          <div className="card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-base-content mb-4">
              <ArrowRight className="w-5 h-5 text-base-content/50" /> Quick Links
            </h3>
            <div className="space-y-2">
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
                  className="btn btn-ghost btn-sm w-full justify-start gap-2 hover:bg-primary/5"
                >
                  <link.icon className="w-4 h-4" /> {link.label}
                </Link>
              ))}
              <button onClick={() => setShowQuickAdd(true)} className="btn btn-ghost btn-sm w-full justify-start gap-2 hover:bg-primary/5">
                <Plus className="w-4 h-4" /> Quick Add
              </button>
              <button onClick={handleExportAll} className="btn btn-ghost btn-sm w-full justify-start gap-2 hover:bg-primary/5">
                <Download className="w-4 h-4" /> Export CV Seed & Users
              </button>
            </div>
          </div>

          <div className="card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md p-6">
            <h4 className="text-sm font-semibold text-base-content/70 flex items-center gap-2 mb-4">
              <Workflow className="w-4 h-4 text-primary" /> Pipeline Status
            </h4>
            <div className="space-y-3">
              {Object.keys(pipelineStatus).length === 0 ? (
                <p className="text-sm text-base-content/40">No pipeline runs recorded yet.</p>
              ) : (
                Object.entries(pipelineStatus).map(([script, info]) => (
                  <div key={script} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{script}</span>
                    <span className={`badge badge-sm ${info.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                      {info.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Health Card */}
          <div className="card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md p-6">
            <h4 className="text-sm font-semibold text-base-content/70 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> System Health
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Server className="w-4 h-4" /> API Server</span>
                <span className="badge badge-success badge-sm gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Automation Scripts</span>
                <span className="badge badge-success badge-sm gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Pending Alerts</span>
                <span className="badge badge-ghost badge-sm">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} />}
    </div>
  );
}