import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { createLogger } from '../../lib/logger';

const logger = createLogger('AdminSkills');

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
}

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: '',
    proficiency: 3,
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/portfolio/skills')
      .then((res) => {
        setSkills(res.data);
        logger.log('Skills loaded');
      })
      .catch(() => toast.error('Failed to load skills'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Extract unique existing categories for suggestions
  const existingCategories = useMemo(() => {
    const cats = new Set(skills.map((s) => s.category));
    return Array.from(cats).sort();
  }, [skills]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', category: '', proficiency: 3 });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm({ name: '', category: '', proficiency: 3 });
    setShowForm(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingId(skill.id);
    setForm({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/portfolio/skills/${editingId}`, form);
        toast.success('Skill updated');
      } else {
        await api.post('/portfolio/skills', form);
        toast.success('Skill added');
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
    if (!confirm('Delete this skill?')) return;
    try {
      await api.delete(`/portfolio/skills/${id}`);
      toast.success('Skill deleted');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getProficiencyLabel = (level: number): string => {
    if (level === 5) return 'Expert';
    if (level === 4) return 'Advanced';
    if (level === 3) return 'Intermediate';
    if (level === 2) return 'Basic';
    return 'Beginner';
  };

  const getProficiencyColor = (level: number): string => {
    if (level >= 5) return 'badge-success';
    if (level === 4) return 'badge-primary';
    if (level === 3) return 'badge-warning';
    return 'badge-ghost';
  };

  return (
    <div className="relative max-w-6xl w-full space-y-6">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
          <p className="text-sm text-base-content/60 mt-1">Manage your technical skills and proficiency levels</p>
        </div>
        <button onClick={handleAddNew} className="btn btn-primary btn-sm gap-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="animate-slide-down">
          <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-content/10 shadow-lg p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              {editingId ? 'Edit Skill' : 'Add Skill'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Skill Name</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input input-bordered w-full"
                  required
                  placeholder="React"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Category</span></label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  list="category-suggestions"
                  className="input input-bordered w-full"
                  placeholder="e.g. Programming"
                  required
                />
                <datalist id="category-suggestions">
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text font-medium">Proficiency (1-5)</span></label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form.proficiency}
                    onChange={(e) => setForm({ ...form, proficiency: Number(e.target.value) })}
                    className="range range-primary range-sm flex-1"
                  />
                  <span className="badge badge-sm font-mono">{form.proficiency}</span>
                </div>
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
          {Array.from({ length: 5 }).map((_, i) => (
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
                    <Wrench className="w-4 h-4 text-primary" /> Name
                  </div>
                </th>
                <th>Category</th>
                <th>Proficiency</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-base-content/40">
                      <Wrench className="w-10 h-10" />
                      <p className="text-sm">No skills yet</p>
                      <button onClick={handleAddNew} className="btn btn-ghost btn-sm text-primary">
                        <Plus className="w-4 h-4" /> Add your first skill
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                skills.map((skill, index) => (
                  <tr
                    key={skill.id}
                    className="hover:bg-base-200/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-sm">{skill.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline badge-sm">{skill.category}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-base-300 rounded-full h-1.5">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`badge badge-sm ${getProficiencyColor(skill.proficiency)}`}>
                          {getProficiencyLabel(skill.proficiency)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(skill)}
                          className="btn btn-ghost btn-xs btn-square hover:scale-110 transition-transform"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(skill.id)}
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