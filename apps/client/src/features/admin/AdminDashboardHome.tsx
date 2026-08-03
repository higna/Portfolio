import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Wrench, Award, Briefcase, Clock, ArrowRight, Plus, User } from 'lucide-react';
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
}

/* ------------------------------------------------------------------ */
/*  Tiny animated counter (no framer‑motion dependency needed)         */
/* ------------------------------------------------------------------ */
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const duration = 800; // ms
    const start = performance.now();
    const from = 0;
    const to = value;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(from + (to - from) * progress));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{display}</>;
}

/* ------------------------------------------------------------------ */
/*  Shimmer skeleton for stat cards                                    */
/* ------------------------------------------------------------------ */
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

export default function AdminDashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => {
        setStats(res.data);
        logger.log('Admin stats loaded');
      })
      .catch((err) => {
        toast.error('Failed to load dashboard stats');
        logger.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="avatar">
            <div className="w-14 h-14 rounded-full ring-2 ring-primary/30 overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user.fullName || ''} />
              ) : (
                <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-xl font-bold">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
                </div>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.email}
            </h1>
            <p className="text-base-content/60 mt-1 flex items-center gap-2">
              Here's the platform overview.
              <span className="badge badge-primary badge-sm">{user?.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
          : statCards.map((card) => (
              <Link
                key={card.label}
                to={card.path}
                className="group card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md hover:shadow-lg transition-all p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-base-content/50">{card.label}</p>
                    <p className={`text-3xl font-semibold mt-1 ${card.color}`}>
                      <Counter value={card.count} />
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-base-200/60 group-hover:bg-primary/10 transition-colors">
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {/* Two columns: Global Activity & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Activity */}
        <div className="card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md p-5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-base-content mb-4">
            <Clock className="w-5 h-5 text-base-content/50" /> Global Activity
          </h3>
          <div className="text-center text-base-content/40 py-8">
            <Clock className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Activity feed coming soon.</p>
            <p className="text-xs mt-1">Recent user registrations, project updates, etc.</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card bg-base-100/40 backdrop-blur-md border border-base-content/10 shadow-md p-5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-base-content mb-4">
            <ArrowRight className="w-5 h-5 text-base-content/50" /> Quick Links
          </h3>
          <div className="space-y-3">
            <Link to="/dashboard/skills" className="btn btn-ghost btn-sm w-full justify-start gap-2">
              <Plus className="w-4 h-4" /> Add New Skill
            </Link>
            <Link to="/dashboard/projects" className="btn btn-ghost btn-sm w-full justify-start gap-2">
              <Plus className="w-4 h-4" /> Add New Project
            </Link>
            <Link to="/dashboard/certifications" className="btn btn-ghost btn-sm w-full justify-start gap-2">
              <Plus className="w-4 h-4" /> Add New Certification
            </Link>
            <Link to="/dashboard/data/extraction" className="btn btn-ghost btn-sm w-full justify-start gap-2">
              <Plus className="w-4 h-4" /> Run Data Extraction
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}