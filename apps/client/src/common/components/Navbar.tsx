import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  User,
  Menu,
  X,
  LogOut,
  FolderKanban,
  Mail,
  Wrench,
  Briefcase,
  Award,
  GraduationCap,
  FolderGit,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { createLogger } from "../../lib/logger";
import UserDropdown from "./UserDropdown";
import NotificationBell from "./NotificationBell";

const logger = createLogger("Navbar");

interface NavLink {
  label: string;
  path: string;
}

const navLinks: NavLink[] = [
  { label: "Home", path: "/" },
  { label: "Chat", path: "/chat" },
  { label: "Analytics", path: "/analytics" },
  { label: "Sandbox", path: "/sandbox" },
];

function ThemeToggle({
  theme,
  onToggle,
  transparent,
}: {
  theme: string;
  onToggle: () => void;
  transparent: boolean;
}) {
  const iconColor = transparent
    ? "text-white hover:text-[#D4AF37]"
    : "text-base-content";

  return (
    <button
      onClick={onToggle}
      className={`btn btn-ghost btn-circle ${iconColor}`}
      aria-label={`Switch to ${theme === "bumblebee" ? "dark" : "light"} mode`}
    >
      {theme === "bumblebee" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}

export default function Navbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const rafId = useRef<number | null>(null);

  const isActive = useCallback(
    (path: string) =>
      path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(path),
    [location.pathname],
  );

  useEffect(() => {
    const updateScrollState = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrolledPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrolled(scrollTop > 10);
      setProgress(scrolledPercent);
      rafId.current = null;
    };

    const handleScroll = () => {
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(updateScrollState);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollState();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (sidebarOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        return;
      }
      if (e.key === "Tab" && sidebarPanelRef.current) {
        const focusable = sidebarPanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const firstFocusable = sidebarPanelRef.current?.querySelector<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    firstFocusable?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logger.log("User logged out");
    logout();
    navigate("/");
    setSidebarOpen(false);
  };

  const closeSidebar = () => setSidebarOpen(false);

  const isHomeTransparent = location.pathname === "/" && !scrolled;

  const navbarBg = isHomeTransparent
    ? "bg-transparent"
    : scrolled
      ? "bg-base-300/80 backdrop-blur-lg shadow-sm"
      : "bg-base-100/80 backdrop-blur-sm";

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-primary z-50 transition-all duration-150 motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-hidden="true"
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 motion-reduce:transition-none ${navbarBg}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="text-xl font-bold text-primary tracking-tight rounded"
              aria-label="Home"
            >
              HECTOR
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive(link.path) ? "page" : undefined}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-primary after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-4 after:bg-primary after:rounded-full"
                      : isHomeTransparent
                        ? "text-white/70 hover:text-[#D4AF37]"
                        : "text-base-content/70 hover:text-base-content"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side: theme + notifications + user (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle
                theme={theme}
                onToggle={toggleTheme}
                transparent={isHomeTransparent}
              />
              {user && <NotificationBell />}
              <UserDropdown transparent={isHomeTransparent} />
            </div>

            {/* Mobile header: theme + notifications + menu */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle
                theme={theme}
                onToggle={toggleTheme}
                transparent={isHomeTransparent}
              />
              {user && <NotificationBell />}
              <button
                ref={menuButtonRef}
                onClick={() => setSidebarOpen(true)}
                className={`btn btn-ghost btn-circle ${
                  isHomeTransparent
                    ? "text-white hover:text-[#D4AF37]"
                    : "text-base-content"
                }`}
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
                aria-controls="mobile-sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      <div
        id="mobile-sidebar"
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 motion-reduce:transition-none ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <div
          ref={sidebarPanelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`absolute right-0 top-0 h-full w-64 bg-base-100 shadow-2xl flex flex-col p-6 transition-transform duration-300 motion-reduce:transition-none ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            onClick={closeSidebar}
            className="btn btn-ghost btn-circle self-end mb-4"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User greeting */}
          <div className="flex flex-col items-center gap-2 mb-6">
            {user ? (
              <>
                {user.picture ? (
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-full">
                      <img src={user.picture} alt={user.fullName || "User"} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral text-neutral-content rounded-full w-16 h-16 flex items-center justify-center text-2xl">
                    {user.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium truncate max-w-50">
                  {user.fullName ? `Hello, ${user.fullName}` : user.email}
                </span>
              </>
            ) : (
              <div className="bg-neutral/20 rounded-full w-16 h-16 flex items-center justify-center">
                <User className="w-8 h-8 text-neutral" />
              </div>
            )}
          </div>

          {/* Main navigation */}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-base-content/50 mb-2 px-4">
              Navigate
            </p>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeSidebar}
                  aria-current={isActive(link.path) ? "page" : undefined}
                  className={`px-4 py-3 rounded-btn text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-base-200"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Superadmin quick links */}
          {user?.role === "SUPERADMIN" && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-base-content/50 mb-2 px-4">
                Admin
              </p>
              <nav className="flex flex-col gap-1">
                <Link
                  to="/dashboard/certifications"
                  onClick={closeSidebar}
                  className="px-4 py-3 rounded-btn text-sm font-medium hover:bg-base-200 transition-colors flex items-center gap-2"
                >
                  <Award className="w-4 h-4" /> Certifications
                </Link>
                <Link
                  to="/dashboard/education"
                  onClick={closeSidebar}
                  className="px-4 py-3 rounded-btn text-sm font-medium hover:bg-base-200 transition-colors flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" /> Education
                </Link>
                <Link
                  to="/dashboard/experience"
                  onClick={closeSidebar}
                  className="px-4 py-3 rounded-btn text-sm font-medium hover:bg-base-200 transition-colors flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" /> Experience
                </Link>
                <Link
                  to="/dashboard/skills"
                  onClick={closeSidebar}
                  className="px-4 py-3 rounded-btn text-sm font-medium hover:bg-base-200 transition-colors flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" /> Skills
                </Link>
                <Link
                  to="/dashboard/projects"
                  onClick={closeSidebar}
                  className="px-4 py-3 rounded-btn text-sm font-medium hover:bg-base-200 transition-colors flex items-center gap-2"
                >
                  <FolderGit className="w-4 h-4" /> Projects
                </Link>
              </nav>
            </div>
          )}

          {/* Public links */}
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-base-content/50 mb-2 px-4">
              Links
            </p>
            <nav className="flex flex-col gap-1">
              <Link
                to="/projects"
                onClick={closeSidebar}
                className="px-4 py-3 rounded-btn text-sm font-medium hover:bg-base-200 transition-colors flex items-center gap-2"
              >
                <FolderKanban className="w-4 h-4" /> Projects
              </Link>
              <Link
                to="/contact"
                onClick={closeSidebar}
                className="px-4 py-3 rounded-btn text-sm font-medium hover:bg-base-200 transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" /> Contact
              </Link>
            </nav>
          </div>

          {/* Auth actions */}
          <div className="mt-auto space-y-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-error w-full"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeSidebar}
                  className="btn btn-primary w-full"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={closeSidebar}
                  className="btn btn-outline w-full"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
