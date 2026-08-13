import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import { createLogger } from '../../lib/logger';

const logger = createLogger('Certifications');

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string | null;
}

export default function Certifications() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/portfolio/certifications')
      .then((res) => {
        setCertifications(res.data);
        logger.log('Certifications loaded');
      })
      .catch(() => logger.warn('Could not load certifications'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });

  return (
    <section className="relative py-16 bg-base-100 overflow-hidden">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-10 font-['Cormorant_Garamond'] text-base-content"
        >
          Certifications
        </motion.h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="card bg-base-100 border border-base-content/10 shadow-sm p-5 animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-base-300" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-base-300 rounded w-3/4" />
                    <div className="h-3 bg-base-300 rounded w-1/2" />
                    <div className="h-3 bg-base-300 rounded w-1/3" />
                  </div>
                </div>
                <div className="mt-3 h-8 bg-base-300 rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : certifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
            <Award className="w-12 h-12 mb-4" />
            <p className="text-lg">No certifications available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="group card bg-base-100 border border-base-content/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 relative overflow-hidden"
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                      {cert.name}
                    </h3>
                    <p className="text-xs text-base-content/60 mt-1">{cert.issuer}</p>
                    <p className="text-xs text-base-content/40 mt-0.5">
                      {formatDate(cert.date)}
                    </p>
                  </div>
                </div>

                {cert.url && (
                  <div className="card-actions mt-4 justify-end">
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-xs gap-1 text-primary hover:bg-primary/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Credential
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}