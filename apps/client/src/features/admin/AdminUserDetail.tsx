import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Mail,
  Shield,
  Trash2,
  UserRound,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useDashboardBannerAction } from '../../common/components/DashboardBannerAction';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  authProvider: string;
  isVerified: boolean;
  createdAt: string;
  picture?: string | null;
}

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetPassword, setResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/users/${id}`)
      .then((res) => setUser(res.data))
      .catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      navigate('/dashboard/users');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put(`/users/${id}/password`, { newPassword });
      toast.success('Password reset successfully');
      setResetPassword(false);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  useDashboardBannerAction('Back to users', () => navigate('/dashboard/users'), ArrowLeft);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-base-content/60">User not found.</p>
      </div>
    );
  }

  const joinedAt = new Date(user.createdAt);

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-5">
      <section className="overflow-hidden rounded-3xl border border-base-content/10 bg-base-100 shadow-sm">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="avatar placeholder">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              {user.picture ? (
                <img src={user.picture} alt={user.fullName || ''} className="rounded-2xl object-cover" />
              ) : (
                <span className="text-2xl font-bold">{user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Account overview</p>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight">
              {user.fullName || 'Unnamed user'}
            </h2>
            <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-base-content/55">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span className={`badge badge-sm gap-1.5 py-3 ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
              <span className={`size-1.5 rounded-full ${user.isVerified ? 'bg-success-content' : 'bg-warning-content'}`} />
              {user.isVerified ? 'Verified' : 'Verification pending'}
            </span>
            <span className={`badge badge-sm py-3 ${user.role === 'SUPERADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
              {user.role}
            </span>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-base-content/10 bg-base-100 p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold">Account information</h3>
                <p className="text-xs text-base-content/45">Identity and sign-in details</p>
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-base-200/45 p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-base-content/45">Full name</dt>
                <dd className="mt-1 text-sm font-medium">{user.fullName || 'Not provided'}</dd>
              </div>
              <div className="rounded-xl bg-base-200/45 p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-base-content/45">Email address</dt>
                <dd className="mt-1 break-all text-sm font-medium">{user.email}</dd>
              </div>
              <div className="rounded-xl bg-base-200/45 p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-base-content/45">Sign-in provider</dt>
                <dd className="mt-1 text-sm font-medium capitalize">{user.authProvider || 'Unknown'}</dd>
              </div>
              <div className="rounded-xl bg-base-200/45 p-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[.12em] text-base-content/45">Account created</dt>
                <dd className="mt-1 text-sm font-medium">
                  {Number.isNaN(joinedAt.getTime()) ? 'Unknown' : joinedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-base-content/10 bg-base-100 p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-secondary/10 text-secondary">
                <Activity className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold">Account activity</h3>
                <p className="text-xs text-base-content/45">Available account timeline</p>
              </div>
            </div>
            <div className="relative ml-2 border-l border-base-content/10 pl-5">
              <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-success ring-4 ring-success/10" />
              <p className="text-sm font-medium">Account created</p>
              <p className="mt-1 text-xs text-base-content/50">
                {Number.isNaN(joinedAt.getTime()) ? 'Creation date unavailable' : joinedAt.toLocaleString()}
              </p>
            </div>
            <p className="mt-4 rounded-xl border border-base-content/5 bg-base-200/35 p-3 text-xs leading-relaxed text-base-content/50">
              Further sign-in and usage events are not available in this account view.
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-base-content/10 bg-base-100 p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-warning/10 text-warning">
                <Shield className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold">Access & security</h3>
                <p className="text-xs text-base-content/45">Permissions and account status</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-base-200/45 p-3">
                <span className="text-xs text-base-content/55">Workspace role</span>
                <span className={`badge badge-sm ${user.role === 'SUPERADMIN' ? 'badge-primary' : 'badge-ghost'}`}>{user.role}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-base-200/45 p-3">
                <span className="flex items-center gap-2 text-xs text-base-content/55"><CheckCircle2 className="size-4" /> Email status</span>
                <span className={`text-xs font-semibold ${user.isVerified ? 'text-success' : 'text-warning'}`}>{user.isVerified ? 'Verified' : 'Pending'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-base-200/45 p-3">
                <span className="flex items-center gap-2 text-xs text-base-content/55"><CalendarDays className="size-4" /> Member since</span>
                <span className="text-xs font-medium">{Number.isNaN(joinedAt.getTime()) ? '—' : joinedAt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-base-content/10 bg-base-100 p-5 shadow-sm sm:p-6">
            <h3 className="font-semibold">Administrative actions</h3>
            <p className="mt-1 text-xs text-base-content/45">Changes affect this user’s account access.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => setResetPassword(!resetPassword)} className="btn btn-outline btn-sm justify-start gap-2">
                <KeyRound className="size-4" /> Reset password
              </button>
              <button onClick={handleDelete} className="btn btn-error btn-outline btn-sm justify-start gap-2">
                <Trash2 className="size-4" /> Delete user
              </button>
            </div>
            {resetPassword && (
              <div className="mt-4 space-y-3 rounded-xl border border-base-content/10 bg-base-200/40 p-4">
                <p className="text-sm font-medium">Set a new password</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="input input-bordered input-sm w-full"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setResetPassword(false)} className="btn btn-ghost btn-xs">Cancel</button>
                  <button onClick={handleResetPassword} className="btn btn-primary btn-xs">Save password</button>
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}