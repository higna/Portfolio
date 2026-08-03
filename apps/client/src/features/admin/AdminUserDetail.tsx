import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Trash2, Key, User } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/dashboard/users')} className="btn btn-ghost btn-sm gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      <div className="card bg-base-100 border border-base-content/10 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="avatar placeholder">
            <div className="bg-neutral text-neutral-content rounded-full w-16 h-16">
              {user.picture ? (
                <img src={user.picture} alt={user.fullName || ''} className="rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.fullName || 'Unnamed User'}</h2>
            <div className="flex items-center gap-1 text-sm text-base-content/60">
              <Mail className="w-4 h-4" />
              {user.email}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-base-content/50">Role</p>
            <span className={`badge badge-sm ${user.role === 'SUPERADMIN' ? 'badge-primary' : 'badge-ghost'}`}>
              {user.role}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-base-content/50">Provider</p>
            <p className="text-sm capitalize">{user.authProvider}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-base-content/50">Verified</p>
            <span className={`badge badge-sm ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
              {user.isVerified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-base-content/50">Joined</p>
            <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <button onClick={() => setResetPassword(!resetPassword)} className="btn btn-outline gap-2">
            <Key className="w-4 h-4" /> Reset Password
          </button>
          <button onClick={handleDelete} className="btn btn-error btn-outline gap-2">
            <Trash2 className="w-4 h-4" /> Delete User
          </button>
        </div>

        {resetPassword && (
          <div className="mt-6 space-y-3 p-4 bg-base-200 rounded-lg">
            <p className="text-sm font-medium">Set a new password for this user:</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="input input-bordered w-full"
            />
            <div className="flex gap-2">
              <button onClick={handleResetPassword} className="btn btn-primary btn-sm">Save Password</button>
              <button onClick={() => setResetPassword(false)} className="btn btn-ghost btn-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}