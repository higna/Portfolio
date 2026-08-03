import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background image with dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-bottom"
        style={{ backgroundImage: "url('/cta.png')" }}
      />
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <p className="text-[#D4AF37] font-mono text-xs tracking-[0.3em] uppercase">
            Let's Work Together
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-['Cormorant_Garamond']">
            Ready to Bring Your Vision to Life?
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Let's collaborate and create something extraordinary together. Get in touch today to discuss your project.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/contact"
            className="btn bg-[#D4AF37] hover:bg-[#F2C94C] text-[#0B0A08] font-semibold gap-2 rounded-full px-8"
          >
            <Mail size={18} />
            Contact Me
          </Link>
          <Link
            to="/projects"
            className="btn btn-outline border-white/30 text-white hover:bg-white/10 hover:border-white gap-2 rounded-full px-8"
          >
            Explore Projects
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}