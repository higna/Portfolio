import { useState, useEffect } from 'react';
import { Pencil, Trash2, Award, Plus } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { createLogger } from '../../lib/logger';
import { useDashboardBannerAction } from '../../common/components/DashboardBannerAction';

const logger = createLogger('AdminCertifications');

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string | null;
  order: number;
}

export default function AdminCertifications() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', issuer: '', date: '', url: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/portfolio/certifications')
      .then((res) => {
        setCertifications(res.data);
        logger.log('Certifications loaded');
      })
      .catch(() => toast.error('Failed to load certifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', issuer: '', date: '', url: '' });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm({ name: '', issuer: '', date: '', url: '' });
    setShowForm(true);
  };

  const handleEdit = (cert: Certification) => {
    setEditingId(cert.id);
    setForm({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.date ? cert.date.substring(0, 10) : '',
      url: cert.url || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/portfolio/certifications/${editingId}`, form);
        toast.success('Certification updated');
      } else {
        await api.post('/portfolio/certifications', form);
        toast.success('Certification added');
      }
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this certification?')) return;
    try {
      await api.delete(`/portfolio/certifications/${id}`);
      toast.success('Certification deleted');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  useDashboardBannerAction('Add certification', handleAddNew);

  return (
    <div className="relative max-w-screen-2xl w-full space-y-6">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <p className="text-sm text-base-content/55">
        Certifications are ordered by date, newest first. The position number
        updates automatically when a date changes.
      </p>

      {/* Form */}
      {showForm && (
        <div className="animate-slide-down">
          <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-content/10 shadow-lg p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />
            <h3 className="font-semibold text-lg">{editingId ? 'Edit Certification' : 'Add Certification'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Certification Name</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="e.g. AWS Solutions Architect"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Issuer</span></label>
                <input
                  type="text"
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Amazon Web Services"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Date</span></label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">URL (optional)</span></label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="btn btn-ghost btn-sm">Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-xs"></span> : editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-base-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th className="w-20">Order</th>
                <th>Certification</th>
                <th>Issuer</th>
                <th>Date</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-base-content/40">
                      <Award className="w-10 h-10" />
                      <p className="text-sm">No certifications yet</p>
                      <button onClick={handleAddNew} className="btn btn-ghost btn-sm text-primary">
                        <Plus className="w-4 h-4" /> Add your first certification
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                [...certifications]
                  .sort((a, b) => {
                    const dateOrder = b.date.localeCompare(a.date);
                    return dateOrder || a.order - b.order;
                  })
                  .map((cert, index) => (
                  <tr key={cert.id} className="hover:bg-base-200/50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
                    <td>
                      <span
                        className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                        aria-label={`Position ${index + 1}`}
                        title={`Position ${index + 1}, ordered by date`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="font-medium text-sm">{cert.name}</div>
                          {cert.url && (
                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                              View credential
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{cert.issuer}</td>
                    <td className="text-sm text-base-content/70">{formatDate(cert.date)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(cert)} className="btn btn-ghost btn-xs btn-square hover:scale-110 transition-transform">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cert.id)} className="btn btn-ghost btn-xs btn-square text-error hover:scale-110 transition-transform">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
