import { useRef } from "react";
import { Link } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowDown, MessageCircle } from "lucide-react";

const typingSequence = [
  "Full‑Stack Developer",
  2000,
  "Data Engineer",
  2000,
  "Automation Architect",
  2000,
  "AI Integrator",
  4000,
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const slowX = useSpring(mouseX, { stiffness: 30, damping: 40 });
  const slowY = useSpring(mouseY, { stiffness: 30, damping: 40 });
  const fastX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const fastY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (rect) {
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseX.set(x * 10);
      mouseY.set(y * 10);
    }
  };

  const scrollToProjects = () => {
    const target = document.getElementById("projects");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative h-[80vh] min-h-120 overflow-hidden flex items-center -mt-16 bg-black"
    >
      {/* Background image – full height, anchored bottom right */}
      <motion.div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url('/hero.png')",
          backgroundSize: "auto 100%",
          backgroundPosition: "right bottom",
          x: slowX,
          y: slowY,
          willChange: "transform",
        }}
      />

      <div className="absolute inset-0 bg-linear-to-r from-[#0B0A08] via-[#0B0A08]/80 to-transparent md:via-[#0B0A08]/60" />
      <div className="absolute inset-0 bg-linear-to-t from-[#0B0A08]/40 via-transparent to-transparent" />

      <motion.div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          x: fastX,
          y: fastY,
          willChange: "transform",
        }}
      />

      <motion.div
        className="absolute pointer-events-none z-5"
        style={{
          x: fastX,
          y: fastY,
          left: "10%",
          top: "20%",
          width: "40px",
          height: "40px",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          borderRadius: "50%",
        }}
      />
      <motion.div
        className="absolute pointer-events-none z-5"
        style={{
          x: slowX,
          y: slowY,
          right: "15%",
          bottom: "25%",
          width: "20px",
          height: "20px",
          background: "rgba(212, 175, 55, 0.15)",
          rotate: "45deg",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[320px] sm:max-w-xl mx-auto sm:mx-0 text-center sm:text-left"
        >
          <div className="sm:hidden mb-6 flex justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-[#D4AF37] overflow-hidden">
              <img
                src="/dp.png"
                alt="Hector Igna-Igboko"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <p className="text-[#D4AF37] font-mono text-xs sm:text-sm tracking-[0.3em] mb-3">
            HELLO, I&rsquo;M
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 font-['Cormorant_Garamond'] leading-tight">
            Hector Igna‑Igboko
          </h1>

          <div className="h-px w-24 bg-[#D4AF37] mb-4 mx-auto sm:mx-0" />

          <div className="text-xl sm:text-2xl lg:text-3xl min-h-10 mb-4">
            <TypeAnimation
              sequence={typingSequence}
              wrapper="span"
              speed={50}
              repeat={Infinity}
              className="text-[#F2C94C] font-mono font-medium"
              cursor={true}
            />
          </div>

          <p className="text-white/70 text-sm sm:text-base mb-8">
            Crafting intelligent solutions with code, data, and automation. I
            build full‑stack applications, data pipelines, and AI‑powered tools.
          </p>

          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <motion.button
              onClick={scrollToProjects}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(212,175,55,0.3)",
              }}
              whileTap={{ scale: 0.98 }}
              className="btn bg-[#D4AF37] hover:bg-[#F2C94C] text-[#0B0A08] font-semibold tracking-wide border-none"
            >
              See My Work <ArrowDown className="w-4 h-4 ml-2" />
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/contact"
                className="btn btn-outline border-[#D4AF37]/50 text-white hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] font-normal tracking-wide"
              >
                Get In Touch <MessageCircle className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#stats"
        aria-label="Scroll to stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 4, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.5 },
          y: { delay: 1, duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#D4AF37]/70 hover:text-[#D4AF37] z-20"
      >
        <ArrowDown className="w-5 h-5" />
      </motion.a>
    </section>
  );
}