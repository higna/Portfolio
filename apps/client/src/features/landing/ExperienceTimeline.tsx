import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import api from '../../lib/api';

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  description: string[];
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export default function ExperienceTimeline() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/portfolio/experiences')
      .then((res) => setExperiences(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const SkeletonItem = ({ isLeft }: { isLeft: boolean }) => (
    <div
      className={`relative flex flex-col md:flex-row items-start mb-12 md:mb-16 pl-8 md:pl-0 ${
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      <div className="md:hidden absolute left-0 top-6 -translate-x-1/2 z-10">
        <div className="w-3 h-3 rounded-full bg-base-300 animate-pulse" />
      </div>

      <div className="md:w-1/2 flex md:justify-end md:pr-10 mb-2 md:mb-0">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-300/40 ${isLeft ? 'md:ml-auto' : 'md:mr-auto'}`}>
          <div className="h-3 w-20 bg-base-300 rounded animate-pulse" />
        </div>
      </div>

      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10">
        <div className="w-4 h-4 rounded-full bg-base-300 animate-pulse" />
      </div>

      <div className="md:w-1/2 md:pl-10 w-full">
        <div className="bg-base-100 rounded-xl p-6 shadow-sm border border-base-300/40">
          <div className="h-6 w-3/4 bg-base-300 rounded animate-pulse mb-3" />
          <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-base-300 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-base-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-base-200 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-16 font-['Cormorant_Garamond'] text-base-content"
        >
          Professional Experience
        </motion.h2>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-base-300/60 -translate-x-1/2" />
          <div className="md:hidden absolute left-4 top-6 bottom-6 w-px bg-base-300/60" />

          {loading ? (
            <>
              <SkeletonItem isLeft={true} />
              <SkeletonItem isLeft={false} />
              <SkeletonItem isLeft={true} />
            </>
          ) : experiences.length === 0 ? (
            <div className="text-center py-16 text-base-content/50">
              No experience entries yet.
            </div>
          ) : (
            experiences.map((exp, index) => {
              const isLeft = index % 2 === 0;
              const start = formatDate(exp.startDate);
              const end = exp.endDate ? formatDate(exp.endDate) : 'Present';

              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-10%' }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                  className={`relative flex flex-col md:flex-row items-start mb-12 md:mb-16 pl-8 md:pl-0 ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div className="md:hidden absolute left-0 top-6 -translate-x-1/2 z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                      className={`w-3 h-3 rounded-full border-2 border-primary bg-base-100 shadow-sm ${
                        exp.isCurrent ? 'ring-2 ring-primary/30' : ''
                      }`}
                    />
                  </div>

                  <div className="md:w-1/2 flex md:justify-end md:pr-10 mb-2 md:mb-0">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-base-300/40 text-base-content/70 ${
                        isLeft ? 'md:ml-auto' : 'md:mr-auto'
                      }`}
                    >
                      <span>{start} — {end}</span>
                      {exp.isCurrent && (
                        <span className="relative flex items-center gap-1 text-primary">
                          <span className="relative flex w-2 h-2">
                            <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-60 animate-ping" />
                            <span className="relative inline-flex w-2 h-2 rounded-full bg-primary" />
                          </span>
                          Now
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                      className={`w-4 h-4 rounded-full border-2 border-primary bg-base-100 shadow-sm ${
                        exp.isCurrent ? 'ring-2 ring-primary/30' : ''
                      }`}
                    />
                  </div>

                  <div className="md:w-1/2 md:pl-10 w-full">
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="bg-base-100 rounded-xl p-6 shadow-sm border border-base-300/40 hover:shadow-md hover:border-base-300/60 transition-all duration-300"
                    >
                      <h3 className="text-xl font-bold font-['Cormorant_Garamond'] text-base-content">
                        {exp.jobTitle}
                      </h3>
                      <p className="text-primary text-sm font-medium mb-4">{exp.company}</p>
                      <ul className="space-y-2">
                        {exp.description.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm text-base-content/70">
                            <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}