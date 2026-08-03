import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, animate } from 'framer-motion';
import { Briefcase, FolderGit2, Wrench, Award } from 'lucide-react';
import { createLogger } from '../../lib/logger';
import api from '../../lib/api';

const logger = createLogger('MetricsCounter');

interface Metric {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}

const FALLBACK_METRICS: Metric[] = [
  { icon: <Briefcase className="w-5 h-5" />, label: 'Years Experience', value: 5, suffix: '+' },
  { icon: <FolderGit2 className="w-5 h-5" />, label: 'Projects', value: 9, suffix: '+' },
  { icon: <Wrench className="w-5 h-5" />, label: 'Technologies', value: 20, suffix: '+' },
  { icon: <Award className="w-5 h-5" />, label: 'Certifications', value: 7 },
];

function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      if (ref.current) ref.current.textContent = `${value}${suffix ?? ''}`;
      return;
    }
    const controls = animate(count, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = `${Math.round(latest)}${suffix ?? ''}`;
      },
    });
    return () => controls.stop();
  }, [isInView, value, suffix, reduceMotion, count]);

  return <span ref={ref}>0{suffix ?? ''}</span>;
}

export default function MetricsCounter() {
  const [metrics, setMetrics] = useState<Metric[]>(FALLBACK_METRICS);

  // Fetch real data, silently keep the fallback numbers on failure
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [expRes, projRes, skillRes, certRes] = await Promise.all([
          api.get('/portfolio/experiences'),
          api.get('/portfolio/projects'),
          api.get('/portfolio/skills'),
          api.get('/portfolio/certifications'),
        ]);
        setMetrics([
          { icon: <Briefcase className="w-5 h-5" />, label: 'Years Experience', value: expRes.data?.length || 5, suffix: '+' },
          { icon: <FolderGit2 className="w-5 h-5" />, label: 'Projects', value: projRes.data?.length || 9, suffix: '+' },
          { icon: <Wrench className="w-5 h-5" />, label: 'Technologies', value: skillRes.data?.length || 20, suffix: '+' },
          { icon: <Award className="w-5 h-5" />, label: 'Certifications', value: certRes.data?.length || 7 },
        ]);
        logger.log('Metrics data loaded');
      } catch (err) {
        logger.log('Metrics fetch failed, using fallback numbers', err);
        // metrics state already holds FALLBACK_METRICS
      }
    };
    fetchData();
  }, []);

  return (
    <section id="stats" className="relative py-10 sm:py-12 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-base-300/60">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex flex-col items-center justify-center text-center px-4 py-6"
            >
              <div className="text-primary mb-2">{metric.icon}</div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-base-content">
                <Counter value={metric.value} suffix={metric.suffix} />
              </div>
              <div className="mt-1 text-xs sm:text-sm text-base-content/60">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}