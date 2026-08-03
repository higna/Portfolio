import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { User, Camera, Save, Lock, Eye, EyeOff, Phone, Link, Globe, FileText, Loader2 } from 'lucide-react';

const logger = createLogger('ProfilePage');

interface PublicProfile {
  fullName: string;
  phone: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  professionalSummary: string | null;
  languages: string[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'SUPERADMIN';

  const [accountForm, setAccountForm] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.picture ?? null);

  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password change fields
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
  logger.log('ProfilePage mounted');
}, []);

  useEffect(() => {
    if (isSuperadmin) {
      setPublicLoading(true);
      api.get('/portfolio/profile')
        .then((res) => setPublicProfile(res.data))
        .catch(() => toast.error('Failed to load public profile'))
        .finally(() => setPublicLoading(false));
    }
  }, [isSuperadmin]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let pictureUrl = user?.picture || null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await api.post('/auth/upload-avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        pictureUrl = uploadRes.data.url;
      }

      await api.put('/users/me', { fullName: accountForm.fullName, picture: pictureUrl });

      if (isSuperadmin && publicProfile) {
        await api.put('/portfolio/profile', publicProfile);
      }

      toast.success('Profile updated');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
      toast.error('Please fill all fields correctly');
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/users/me/password', { currentPassword, newPassword });
      toast.success('Password changed');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold tracking-tight">{isSuperadmin ? 'Profile Settings' : 'My Profile'}</h2>

      {/* Avatar & Identity */}
      <div className="card bg-base-100 border border-base-content/10 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative avatar cursor-pointer group" onClick={() => document.getElementById('profileFileInput')?.click()}>
            <div className="w-24 h-24 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="object-cover w-full h-full" />
              ) : (
                <div className="bg-neutral/20 w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-base-content/30" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input id="profileFileInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold">{accountForm.fullName || 'Your Name'}</h3>
            <p className="text-sm text-base-content/60">{user?.email}</p>
            <p className="text-xs text-base-content/40 mt-1">Click avatar to change photo</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="card bg-base-100 border border-base-content/10 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-base-content/10 pb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Account Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Full Name</span></label>
            <input type="text" value={accountForm.fullName} onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })} className="input input-bordered w-full" placeholder="Your full name" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Email</span></label>
            <input type="email" value={accountForm.email} disabled className="input input-bordered w-full opacity-60" />
            <label className="label"><span className="label-text-alt text-base-content/50">Email cannot be changed</span></label>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="card bg-base-100 border border-base-content/10 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-base-content/10 pb-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Password</h3>
          </div>
          <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="btn btn-ghost btn-sm">
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Current Password</span></label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input input-bordered w-full" />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">New Password</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input input-bordered w-full pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Confirm New Password</span></label>
              <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="input input-bordered w-full" />
            </div>
            <button onClick={handlePasswordChange} className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </button>
          </div>
        )}
      </div>

      {/* Superadmin Public Profile */}
      {isSuperadmin && (
        <div className="card bg-base-100 border border-base-content/10 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-base-content/10 pb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Public Portfolio Details</h3>
          </div>
          {publicLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-base-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-base-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : publicProfile ? (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium"><Phone className="w-4 h-4 inline mr-2 text-base-content/50" />Phone</span></label>
                <input type="text" value={publicProfile.phone || ''} onChange={(e) => setPublicProfile({ ...publicProfile, phone: e.target.value })} className="input input-bordered w-full" placeholder="+234..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium"><Link className="w-4 h-4 inline mr-2 text-base-content/50" />LinkedIn</span></label>
                  <input type="url" value={publicProfile.linkedinUrl || ''} onChange={(e) => setPublicProfile({ ...publicProfile, linkedinUrl: e.target.value })} className="input input-bordered w-full" placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium"><Link className="w-4 h-4 inline mr-2 text-base-content/50" />GitHub</span></label>
                  <input type="url" value={publicProfile.githubUrl || ''} onChange={(e) => setPublicProfile({ ...publicProfile, githubUrl: e.target.value })} className="input input-bordered w-full" placeholder="https://github.com/..." />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-medium"><Globe className="w-4 h-4 inline mr-2 text-base-content/50" />Portfolio URL</span></label>
                  <input type="url" value={publicProfile.portfolioUrl || ''} onChange={(e) => setPublicProfile({ ...publicProfile, portfolioUrl: e.target.value })} className="input input-bordered w-full" placeholder="https://yourportfolio.com" />
                </div>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium"><FileText className="w-4 h-4 inline mr-2 text-base-content/50" />Professional Summary</span></label>
                <textarea value={publicProfile.professionalSummary || ''} onChange={(e) => setPublicProfile({ ...publicProfile, professionalSummary: e.target.value })} className="textarea textarea-bordered w-full h-28" placeholder="Brief overview of your professional background..." />
              </div>
            </div>
          ) : (
            <p className="text-sm text-error">Failed to load public profile.</p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary gap-2 min-w-35">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}