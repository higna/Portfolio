import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  ArrowLeft,
  Search,
  X,
  Sparkles,
  FolderKanban,
} from "lucide-react";
import { FiGithub } from "react-icons/fi";
import { motion, useMotionValue, useSpring } from "framer-motion";
import api from "../../lib/api";
import { createLogger } from "../../lib/logger";
import { formatCategoryLabel } from "../../common/utils/category";
import localProjectsData from "./localProjects.json";

const logger = createLogger("ProjectsPage");

interface Project {
  id: string;
  title: string;
  slug?: string;
  description: string;
  techStack: string[];
  liveUrl?: string | null;
  githubUrl?: string | null;
  imageUrl?: string | null;
  isLocal?: boolean;
  link?: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
}

const SkeletonCard = () => (
  <div className="bg-base-100 rounded-2xl overflow-hidden shadow-sm border border-base-300 animate-pulse">
    <div className="h-48 bg-base-300" />
    <div className="p-5 space-y-3">
      <div className="h-6 w-3/4 bg-base-300 rounded" />
      <div className="h-3 w-full bg-base-300 rounded" />
      <div className="h-3 w-5/6 bg-base-300 rounded" />
      <div className="flex gap-1 mt-2">
        <div className="h-4 w-12 bg-base-300 rounded" />
        <div className="h-4 w-14 bg-base-300 rounded" />
        <div className="h-4 w-10 bg-base-300 rounded" />
      </div>
    </div>
  </div>
);

export default function ProjectsPage() {
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const slowX = useSpring(mouseX, { stiffness: 30, damping: 40 });
  const slowY = useSpring(mouseY, { stiffness: 30, damping: 40 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseX.set(x * 8);
      mouseY.set(y * 8);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, skillsRes] = await Promise.all([
          api.get("/portfolio/projects"),
          api.get("/portfolio/skills"),
        ]);
        setDbProjects(projectsRes.data);
        setSkills(skillsRes.data);
        logger.log("Projects and skills loaded");
      } catch (err) {
        logger.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const allProjects = useMemo(() => {
    return [...dbProjects, ...localProjectsData] as Project[];
  }, [dbProjects]);

  const skillsByCategory = useMemo(() => {
    const map: Record<string, string[]> = {};
    skills.forEach((s) => {
      const cat = s.category || "OTHER";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s.name);
    });
    return map;
  }, [skills]);

  const categories = useMemo(
    () => Object.keys(skillsByCategory).sort(),
    [skillsByCategory],
  );

  const filteredProjects = useMemo(() => {
    let result = allProjects;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.techStack.some((tech) => tech.toLowerCase().includes(query)),
      );
    }

    if (selectedCategories.length > 0) {
      const allowedSkills = new Set<string>();
      selectedCategories.forEach((cat) => {
        (skillsByCategory[cat] || []).forEach((skill) => allowedSkills.add(skill));
      });
      result = result.filter((p) =>
        p.techStack.some((tech) => allowedSkills.has(tech)),
      );
    }

    return result;
  }, [allProjects, searchQuery, selectedCategories, skillsByCategory]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const selectAll = () => setSelectedCategories([]);
  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero */}
      <div
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative h-[55vh] min-h-90 overflow-hidden flex items-center -mt-16 bg-black"
      >
        <motion.div
          className="absolute inset-0 bg-cover bg-bottom opacity-80"
          style={{
            backgroundImage: "url('/hero2.png')",
            x: slowX,
            y: slowY,
            scale: 1.15,
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-[#D4AF37] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#D4AF37] font-mono text-xs sm:text-sm tracking-[0.3em] mb-3">
              MY WORK
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-['Cormorant_Garamond']">
              Projects
            </h1>
            <p className="text-lg text-white/80 max-w-xl">
              Explore a selection of my recent work across different domains
            </p>
            <div className="h-px w-24 bg-[#D4AF37] mt-6" />
          </motion.div>
        </div>
      </div>

      {/* Filter bar with horizontal scrollable pills and multi‑select */}
      <div className="sticky top-16 z-40 bg-base-100/80 backdrop-blur-md border-b border-base-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-10 pr-8 rounded-xl bg-base-100 focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-full md:flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 pb-1">
                <button
                  onClick={selectAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategories.length === 0
                      ? "bg-primary text-primary-content shadow"
                      : "bg-base-200 text-base-content hover:bg-base-300"
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  All
                </button>

                {categories.map((cat) => {
                  const isActive = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-primary text-primary-content shadow"
                          : "bg-base-200 text-base-content hover:bg-base-300"
                      }`}
                    >
                      {formatCategoryLabel(cat)}
                    </button>
                  );
                })}

                {(selectedCategories.length > 0 || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap text-error bg-error/10 hover:bg-error/20 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {!loading && (
              <div className="ml-auto text-sm text-base-content/60 whitespace-nowrap">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Grid */}
      <div className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!loading && filteredProjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <FolderKanban className="w-12 h-12 text-base-content/30 mx-auto mb-4" />
              <p className="text-xl text-base-content/60">
                {searchQuery || selectedCategories.length > 0
                  ? "No projects match your current filters."
                  : "No projects found."}
              </p>
              <button onClick={clearFilters} className="btn btn-ghost mt-4 text-primary">
                Clear all filters
              </button>
            </motion.div>
          )}

          {!loading && filteredProjects.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="group bg-base-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-base-200 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="relative h-44 bg-linear-to-br from-primary/10 to-secondary/10 overflow-hidden">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FolderKanban className="w-12 h-12 text-primary/30 group-hover:scale-110 transition-transform" />
                      </div>
                    )}

                    {project.isLocal && (
                      <span className="absolute top-3 left-3 badge badge-sm bg-[#D4AF37] text-[#0B0A08] border-none font-semibold">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Local Tool
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-base-content/70 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="badge badge-outline badge-xs text-base-content/70"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="badge badge-outline badge-xs">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      {project.isLocal ? (
                        <Link
                          to={project.link || "#"}
                          className="btn btn-sm btn-primary gap-1.5"
                        >
                          Open Tool
                        </Link>
                      ) : (
                        <>
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary gap-1.5"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Live
                            </a>
                          )}
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-ghost gap-1.5 hover:bg-base-200"
                            >
                              <FiGithub className="w-4 h-4" />
                              Code
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}