import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const NavBar = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleTheme = () =>
    setTheme(theme === "luxury" ? "bumblebee" : "luxury");

  const navLinks = [
    { to: "/", text: "Home" },
    { to: "/about", text: "About" },
    { to: "/about#contact", text: "Contact" },
  ];

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md ${
        scrolled ? "bg-base-100/60 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Higna Logo"
              className="h-18 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map(({ to, text }) => (
              <Link
                key={to}
                to={to}
                className={`transition hover:text-primary ${
                  location.pathname === to
                    ? "text-primary font-semibold"
                    : "text-base-content"
                }`}
              >
                {text}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-base-200/60 transition cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "luxury" ? <Moon size={24} /> : <Sun size={24} />}
            </button>

            <button
              className="md:hidden p-2 rounded hover:bg-base-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-3 text-sm">
            {navLinks.map(({ to, text }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-2 py-1 rounded hover:bg-base-200 ${
                  location.pathname === to ? "text-primary font-semibold" : ""
                }`}
              >
                {text}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default NavBar;
