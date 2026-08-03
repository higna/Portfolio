import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Mail, ArrowUp } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-linear-to-b from-base-100 to-base-200 border-t border-base-content/10">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/projects"
              className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors"
            >
              Projects
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://linkedin.com/in/hector-ignatius"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 hover:scale-110"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/higna"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 hover:scale-110"
              aria-label="GitHub"
            >
              <FaGithub className="w-4 h-4" />
            </a>
            <a
              href="mailto:higboko@gmail.com"
              className="p-2 rounded-full text-base-content/60 hover:text-primary hover:bg-base-200 transition-all duration-200 hover:scale-110"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs text-base-content">
            Hector Igna‑Igboko &copy; {currentYear}. All rights reserved.
          </p>
          <p className="text-xs text-base-content/30">
            Built with Postgress, React, Nest, NodeJS
          </p>
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-content shadow-lg hover:shadow-xl transition-all duration-300 ${
          showBackToTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </footer>
  );
}
