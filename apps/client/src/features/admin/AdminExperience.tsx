import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { createLogger } from "../../lib/logger";

const logger = createLogger("AdminExperience");

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  description: string[];
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  order: number;
}

export default function AdminExperience() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    jobTitle: "",
    company: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api
      .get("/portfolio/experiences")
      .then((res) => {
        setExperiences(res.data);
        logger.log("Experiences loaded");
      })
      .catch(() => toast.error("Failed to load experiences"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      jobTitle: "",
      company: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm({
      jobTitle: "",
      company: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    });
    setShowForm(true);
  };

  const handleEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setForm({
      jobTitle: exp.jobTitle,
      company: exp.company,
      description: exp.description.join("\n"),
      startDate: exp.startDate ? exp.startDate.substring(0, 10) : "",
      endDate: exp.endDate ? exp.endDate.substring(0, 10) : "",
      isCurrent: exp.isCurrent,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        description: form.description
          .split("\n")
          .filter((line) => line.trim() !== ""),
        endDate: form.endDate || null,
      };
      if (editingId) {
        await api.put(`/portfolio/experiences/${editingId}`, payload);
        toast.success("Experience updated");
      } else {
        await api.post("/portfolio/experiences", payload);
        toast.success("Experience added");
      }
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;
    try {
      await api.delete(`/portfolio/experiences/${id}`);
      toast.success("Experience deleted");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <div className="relative max-w-6xl w-full space-y-6">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Experience</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Manage your professional work history
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn btn-primary btn-sm gap-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="animate-slide-down">
          <form
            onSubmit={handleSubmit}
            className="card bg-base-100 border border-base-content/10 shadow-lg p-6 space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              {editingId ? "Edit Experience" : "Add Experience"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Job Title</span>
                </label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) =>
                    setForm({ ...form, jobTitle: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                  placeholder="Senior Developer"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Company</span>
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  className="input input-bordered w-full"
                  required
                  placeholder="Acme Corp"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Start Date</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">End Date</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="input input-bordered w-full"
                  disabled={form.isCurrent}
                />
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label cursor-pointer justify-start gap-4">
                  <span className="label-text font-medium">
                    Currently working here
                  </span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form.isCurrent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isCurrent: e.target.checked,
                        endDate: e.target.checked ? "" : form.endDate,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">
                    Description (one bullet point per line)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="textarea textarea-bordered h-24 w-full"
                  placeholder="• Designed and developed..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-base-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-content/10 bg-base-100 shadow-sm">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Job Title
                  </div>
                </th>
                <th>Company</th>
                <th>Period</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiences.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-base-content/40">
                      <Briefcase className="w-10 h-10" />
                      <p className="text-sm">No experience entries yet</p>
                      <button
                        onClick={handleAddNew}
                        className="btn btn-ghost btn-sm text-primary"
                      >
                        <Plus className="w-4 h-4" /> Add your first experience
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                experiences.map((exp, index) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-base-200/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="font-medium text-sm">
                            {exp.jobTitle}
                          </div>
                          {exp.description.length > 0 && (
                            <span className="text-xs text-base-content/50 line-clamp-1">
                              {exp.description[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{exp.company}</td>
                    <td className="text-sm text-base-content/70">
                      {formatDate(exp.startDate)} —{" "}
                      {exp.endDate ? formatDate(exp.endDate) : "Present"}
                      {exp.isCurrent && (
                        <span className="badge badge-primary badge-xs ml-2">
                          Current
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="btn btn-ghost btn-xs btn-square hover:scale-110 transition-transform"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
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
