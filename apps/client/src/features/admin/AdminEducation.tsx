import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { createLogger } from '../../lib/logger';

const logger = createLogger('AdminEducation');

interface Education {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string | null;
  grade: string | null;
  order: number;
}

export default function AdminEducation() {
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    degree: '',
    institution: '',
    startDate: '',
    endDate: '',
    grade: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/portfolio/educations')
      .then((res) => {
        setEducations(res.data);
        logger.log('Educations loaded');
      })
      .catch(() => toast.error('Failed to load educations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ degree: '', institution: '', startDate: '', endDate: '', grade: '' });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm({ degree: '', institution: '', startDate: '', endDate: '', grade: '' });
    setShowForm(true);
  };

  const handleEdit = (edu: Education) => {
    setEditingId(edu.id);
    setForm({
      degree: edu.degree,
      institution: edu.institution,
      startDate: edu.startDate ? edu.startDate.substring(0, 10) : '',
      endDate: edu.endDate ? edu.endDate.substring(0, 10) : '',
      grade: edu.grade || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/portfolio/educations/${editingId}`, form);
        toast.success('Education updated');
      } else {
        await api.post('/portfolio/educations', form);
        toast.success('Education added');
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
    if (!confirm('Delete this education entry?')) return;
    try {
      await api.delete(`/portfolio/educations/${id}`);
      toast.success('Education deleted');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="relative max-w-6xl w-full space-y-6">
      {/* Subtle dot pattern background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Education</h2>
          <p className="text-sm text-base-content/60 mt-1">Manage your academic background</p>
        </div>
        <button onClick={handleAddNew} className="btn btn-primary btn-sm gap-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="animate-slide-down">
          <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-content/10 shadow-lg p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {editingId ? 'Edit Education' : 'Add Education'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control sm:col-span-2">
                <label className="label"><span className="label-text font-medium">Degree</span></label>
                <input
                  type="text"
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="e.g. B.Sc. Computer Science"
                  required
                />
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label"><span className="label-text font-medium">Institution</span></label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="University of Lagos"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Start Date</span></label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">End Date</span></label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Grade (optional)</span></label>
                <input
                  type="text"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="First Class Honours"
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

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-base-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" /> Degree
                  </div>
                </th>
                <th>Institution</th>
                <th>Period</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {educations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-base-content/40">
                      <GraduationCap className="w-10 h-10" />
                      <p className="text-sm">No education entries yet</p>
                      <button onClick={handleAddNew} className="btn btn-ghost btn-sm text-primary">
                        <Plus className="w-4 h-4" /> Add your first education
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                educations.map((edu, index) => (
                  <tr
                    key={edu.id}
                    className="hover:bg-base-200/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="font-medium text-sm">{edu.degree}</div>
                          {edu.grade && (
                            <span className="text-xs text-base-content/50">{edu.grade}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{edu.institution}</td>
                    <td className="text-sm text-base-content/70">
                      {formatDate(edu.startDate)} — {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(edu)}
                          className="btn btn-ghost btn-xs btn-square hover:scale-110 transition-transform"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(edu.id)}
                          className="btn btn-ghost btn-xs btn-square text-error hover:scale-110 transition-transform"
                        >
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