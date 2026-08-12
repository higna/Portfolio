import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Copy, LayoutGrid } from 'lucide-react';

interface CampaignTemplate {
  id: string;
  title: string;
  flyerUrl: string;
  photoBox: any;
  nameConfig: any;
  createdAt?: string;
}

export default function CampaignList() {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/campaign/templates')
      .then(res => setTemplates(res.data))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/campaign/template/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/campaign/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
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
          <h2 className="text-2xl font-bold tracking-tight">Campaign DP Templates</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Manage your personalised flyer templates
          </p>
        </div>
        <Link to="/dashboard/campaign/create" className="btn btn-primary gap-2 shadow-sm hover:shadow-md transition-all">
          <Plus className="w-4 h-4" /> Create New
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card bg-base-100 border border-base-content/10 shadow-sm animate-pulse">
              <div className="h-44 bg-base-300 rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-base-300 rounded w-2/3" />
                <div className="flex justify-end gap-2">
                  <div className="h-8 bg-base-300 rounded w-16" />
                  <div className="h-8 bg-base-300 rounded w-14" />
                  <div className="h-8 bg-base-300 rounded w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-base-content/40">
          <LayoutGrid className="w-12 h-12 mb-4" />
          <p className="text-lg">No templates yet</p>
          <Link to="/dashboard/campaign/create" className="btn btn-ghost text-primary mt-4">
            <Plus className="w-4 h-4" /> Create your first template
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map(tpl => (
            <div
              key={tpl.id}
              className="group card bg-base-100 border border-base-content/10 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <figure className="relative h-44 bg-base-200 overflow-hidden">
                <img
                  src={tpl.flyerUrl}
                  alt={tpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </figure>
              <div className="card-body p-4 space-y-3">
                <h3 className="card-title text-base font-semibold group-hover:text-primary transition-colors">
                  {tpl.title}
                </h3>
                <div className="card-actions justify-end gap-1">
                  <button
                    onClick={() => copyLink(tpl.id)}
                    className="btn btn-ghost btn-xs gap-1.5 hover:bg-primary/10"
                    title="Copy public link"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/campaign/edit/${tpl.id}`)}
                    className="btn btn-ghost btn-xs gap-1.5 hover:bg-primary/10"
                    title="Edit template"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="btn btn-ghost btn-xs gap-1.5 text-error hover:bg-error/10"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}