import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ExternalLink, FolderGit2 } from "lucide-react";
import { FiGithub } from "react-icons/fi";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { createLogger } from "../../lib/logger";

const logger = createLogger("AdminProjects");

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  order: number;
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    techStack: "",
    liveUrl: "",
    githubUrl: "",
    imageUrl: "",
    isFeatured: false,
    order: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api
      .get("/portfolio/projects")
      .then((res) => {
        setProjects(res.data);
        logger.log("Projects loaded");
      })
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      description: "",
      techStack: "",
      liveUrl: "",
      githubUrl: "",
      imageUrl: "",
      isFeatured: false,
      order: 0,
    });
    setImagePreview(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description,
      techStack: project.techStack.join(", "),
      liveUrl: project.liveUrl || "",
      githubUrl: project.githubUrl || "",
      imageUrl: project.imageUrl || "",
      isFeatured: project.isFeatured,
      order: project.order,
    });
    setImagePreview(project.imageUrl || null);
    setShowForm(true);
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/portfolio/upload-project-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        techStack: form.techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await api.put(`/portfolio/projects/${editingId}`, payload);
        toast.success("Project updated");
      } else {
        await api.post("/portfolio/projects", payload);
        toast.success("Project added");
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
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/portfolio/projects/${id}`);
      toast.success("Project deleted");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
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
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Manage your portfolio projects
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
              <FolderGit2 className="w-5 h-5 text-primary" />
              {editingId ? "Edit Project" : "Add Project"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Title</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="input input-bordered w-full"
                  required
                  placeholder="My Awesome Project"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Slug</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="input input-bordered w-full"
                  required
                  placeholder="my-awesome-project"
                />
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="textarea textarea-bordered w-full h-24"
                  required
                  placeholder="A short description of the project..."
                />
              </div>
              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">
                    Tech Stack (comma separated)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.techStack}
                  onChange={(e) =>
                    setForm({ ...form, techStack: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="React, TypeScript, NestJS"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Live URL</span>
                </label>
                <input
                  type="url"
                  value={form.liveUrl}
                  onChange={(e) =>
                    setForm({ ...form, liveUrl: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="https://..."
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">GitHub URL</span>
                </label>
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={(e) =>
                    setForm({ ...form, githubUrl: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Order</span>
                </label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm({ ...form, order: Number(e.target.value) })
                  }
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <span className="label-text font-medium">Featured</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                  />
                </label>
              </div>

              {/* Image upload */}
              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Project Image</span>
                </label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-24 bg-base-200 rounded-lg overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-base-content/40">
                        No image
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input file-input-bordered file-input-sm w-full"
                    />
                    {uploading && (
                      <span className="loading loading-spinner loading-xs mt-1"></span>
                    )}
                    <p className="text-xs text-base-content/50 mt-1">
                      Image will be uploaded to Cloudinary automatically
                    </p>
                  </div>
                </div>
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
                disabled={submitting || uploading}
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
                    <FolderGit2 className="w-4 h-4 text-primary" /> Project
                  </div>
                </th>
                <th>Tech Stack</th>
                <th>Featured</th>
                <th className="text-center">Links</th>
                <th className="w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-base-content/40">
                      <FolderGit2 className="w-10 h-10" />
                      <p className="text-sm">No projects yet</p>
                      <button
                        onClick={handleAddNew}
                        className="btn btn-ghost btn-sm text-primary"
                      >
                        <Plus className="w-4 h-4" /> Add your first project
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <tr
                    key={project.id}
                    className="hover:bg-base-200/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
                          {project.imageUrl ? (
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FolderGit2 className="w-4 h-4 text-base-content/40" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {project.title}
                          </div>
                          <div className="text-xs text-base-content/50">
                            {project.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {project.techStack.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="badge badge-outline badge-xs"
                          >
                            {t}
                          </span>
                        ))}
                        {project.techStack.length > 3 && (
                          <span className="badge badge-outline badge-xs">
                            +{project.techStack.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {project.isFeatured ? (
                        <span className="badge badge-primary badge-sm">
                          Featured
                        </span>
                      ) : (
                        <span className="badge badge-ghost badge-sm">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-center gap-1">
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs btn-square hover:scale-110 transition-transform"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs btn-square hover:scale-110 transition-transform"
                          >
                            <FiGithub className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(project)}
                          className="btn btn-ghost btn-xs btn-square hover:scale-110 transition-transform"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
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
