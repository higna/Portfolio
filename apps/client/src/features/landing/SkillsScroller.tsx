import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Code2,
  Wrench,
  Database,
  Cloud,
  Cpu,
  BarChart3,
  Palette,
  Workflow,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import api from '../../lib/api';
import { formatCategoryLabel } from '../../common/utils/category';

/* ------------------------------------------------------------------ */
/*  Skill interface – category is a free‑form string                   */
/* ------------------------------------------------------------------ */
interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number; // 1–5
}

/* ------------------------------------------------------------------ */
/*  Map a category string to a colour, icon, and display label         */
/* ------------------------------------------------------------------ */
function getCategoryMeta(category: string): {
  icon: LucideIcon;
  color: string;
  label: string;
} {
  const cat = category.toUpperCase();
  const label = formatCategoryLabel(category);

  if (cat.includes('LANG')) return { icon: Code2, color: 'text-primary', label };
  if (cat.includes('FRAME')) return { icon: Workflow, color: 'text-secondary', label };
  if (cat.includes('DATA') || cat.includes('AI')) return { icon: Database, color: 'text-accent', label };
  if (cat.includes('CLOUD') || cat.includes('DEVOPS')) return { icon: Cloud, color: 'text-info', label };
  if (cat.includes('AUTOMATION')) return { icon: Cpu, color: 'text-success', label };
  if (cat.includes('COLLECTION')) return { icon: BarChart3, color: 'text-warning', label };
  if (cat.includes('DESIGN') || cat.includes('CMS')) return { icon: Palette, color: 'text-error', label };

  return { icon: Wrench, color: 'text-base-content', label };
}

/* ------------------------------------------------------------------ */
/*  Proficiency label + badge                                         */
/* ------------------------------------------------------------------ */
const proficiencyLevels = ['Beginner', 'Familiar', 'Intermediate', 'Advanced', 'Expert'] as const;

function ProficiencyBadge({ level }: { level: number }) {
  const label = proficiencyLevels[level - 1] || 'Beginner';
  const colorMap: Record<string, string> = {
    Beginner: 'badge-outline opacity-70',
    Familiar: 'badge-info badge-outline',
    Intermediate: 'badge-warning badge-outline',
    Advanced: 'badge-primary badge-outline',
    Expert: 'badge-success badge-outline',
  };
  return (
    <span className={`badge badge-sm ${colorMap[label] || 'badge-ghost'}`}>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                   */
/* ------------------------------------------------------------------ */
function SkeletonCard() {
  return (
    <div className="card bg-base-100 border border-base-300/40 p-5 animate-pulse">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="h-5 w-3/4 bg-base-300 rounded mb-2" />
          <div className="h-3 w-1/2 bg-base-300 rounded" />
        </div>
        <div className="h-5 w-16 bg-base-300 rounded" />
      </div>
      <div className="mt-4">
        <div className="w-full h-1.5 bg-base-300 rounded-full overflow-hidden">
          <div className="h-full bg-base-300" style={{ width: '60%' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <div className="h-3 w-16 bg-base-300 rounded" />
          <div className="h-3 w-12 bg-base-300 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function SkillsScroller() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);

  const INITIAL_DISPLAY_COUNT = 9; // 3 rows x 3 columns

  useEffect(() => {
    api
      .get('/portfolio/skills')
      .then((res) => setSkills(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Group skills by category */
  const grouped = useMemo(() => {
    return skills.reduce<Record<string, Skill[]>>((acc, skill) => {
      const cat = skill.category || 'OTHER';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    }, {});
  }, [skills]);

  /* Sorted category keys */
  const categories = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  /* Filtered skills for the active tab */
  const filteredSkills = useMemo(() => {
    if (activeCategory === 'all') return skills;
    return grouped[activeCategory] || [];
  }, [activeCategory, skills, grouped]);

  /* Reset showAll when category changes */
  useEffect(() => {
    setShowAll(false);
  }, [activeCategory]);

  /* Determine visible skills */
  const visibleSkills = showAll
    ? filteredSkills
    : filteredSkills.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = filteredSkills.length > INITIAL_DISPLAY_COUNT;

  /* Convert proficiency 1‑5 to percentage for the progress bar */
  const proficiencyPercent = (level: number) => (level / 5) * 100;

  return (
    <section className="py-20 bg-base-200/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-4 font-['Cormorant_Garamond'] text-base-content"
        >
          Technologies & Skills
        </motion.h2>
        <p className="text-center text-base-content/60 mb-12 max-w-xl mx-auto">
          A curated list of tools and technologies I work with, organised by proficiency.
        </p>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && skills.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
            <Wrench className="w-12 h-12 mb-4" />
            <p className="text-lg">No skills data available.</p>
          </div>
        )}

        {/* Skills display */}
        {!loading && skills.length > 0 && (
          <>
            {/* Category tabs */}
            <div className="tabs tabs-boxed justify-center mb-10 bg-base-100/50 p-1 rounded-box shadow-sm max-w-2xl mx-auto flex-wrap">
              <button
                className={`tab tab-sm sm:tab-md ${activeCategory === 'all' ? 'tab-active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All
              </button>
              {categories.map((cat) => {
                const { icon: Icon, label } = getCategoryMeta(cat);
                return (
                  <button
                    key={cat}
                    className={`tab tab-sm sm:tab-md gap-1 ${activeCategory === cat ? 'tab-active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* No skills in active category */}
            {filteredSkills.length === 0 ? (
              <p className="text-center text-base-content/50 py-12">
                No skills in this category.
              </p>
            ) : (
              <>
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                  {visibleSkills.map((skill, index) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-5%' }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="card bg-base-100 border border-base-300/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="card-body p-5">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-semibold text-base-content">{skill.name}</h4>
                            <p className="text-xs text-base-content/50 mt-0.5">
                              {getCategoryMeta(skill.category).label}
                            </p>
                          </div>
                          <ProficiencyBadge level={skill.proficiency} />
                        </div>

                        <div className="mt-4">
                          <div className="w-full bg-base-300/50 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${proficiencyPercent(skill.proficiency)}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 + 0.1 }}
                            />
                          </div>
                          <div className="flex justify-between mt-1.5 text-xs text-base-content/40">
                            <span>Proficiency</span>
                            <span>{proficiencyLevels[skill.proficiency - 1]}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* View All / Show Less button */}
                {hasMore && !showAll && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setShowAll(true)}
                      className="btn btn-outline gap-2"
                    >
                      View All Skills <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {showAll && hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setShowAll(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}