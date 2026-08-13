import { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface QuickAddModalProps {
  onClose: () => void;
}

export default function QuickAddModal({ onClose }: QuickAddModalProps) {
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent" />
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