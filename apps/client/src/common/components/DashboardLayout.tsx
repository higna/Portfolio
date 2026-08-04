import { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  MessageCircle,
  Wrench,
  Briefcase,
  BookOpen,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  X,
  QrCode,
  ScanLine,
  FileText,
  User,
  Users,
  Award,
  GraduationCap,
  FolderGit2,
  Download,
  Cog,
  BriefcaseConveyorBeltIcon,
} from 'lucide-react';
import { createLogger } from '../../lib/logger';
import Navbar from './Navbar';
import Footer from './Footer';

const logger = createLogger('DashboardLayout');

interface NavItem {
  label: string;
  path?: string;
  icon: React.ComponentType<any>;
  subItems?: NavItem[];
  roles?: string[];
  external?: boolean;
}

const getNavConfig = (role: string): NavItem[] => {
  const config: NavItem[] = [];

  if (role === 'SUPERADMIN') {
    config.push({
      label: 'Admin',
      icon: LayoutDashboard,
      subItems: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/dashboard/users', label: 'Users', icon: Users },
        { path: `${import.meta.env.VITE_API_URL || 'http://localhost:2500'}`, label: 'API Docs', icon: FileText, external: true },
      ],
    });
    config.push({
      label: 'Portfolio',
      icon: BookOpen,
      subItems: [
        { path: '/dashboard/profile', label: 'Profile', icon: User },
        { path: '/dashboard/certifications', label: 'Certifications', icon: Award },
        { path: '/dashboard/education', label: 'Education', icon: GraduationCap },
        { path: '/dashboard/experience', label: 'Experience', icon: Briefcase },
        { path: '/dashboard/projects', label: 'Projects', icon: FolderGit2 },
        { path: '/dashboard/skills', label: 'Skills', icon: Wrench },
      ],
    });
    config.push({
      label: 'Data Engineering',
      icon: Database,
      subItems: [
        { path: '/dashboard/data/download', label: 'Download', icon: Download },
        { path: '/dashboard/data/pipeline', label: 'Pipeline', icon: Cog },
      ],
    });
    config.push({ path: '/projects', label: 'Projects', icon: BriefcaseConveyorBeltIcon });
    config.push({ path: '/dashboard/chat', label: 'AI Chat Bot', icon: MessageCircle });
    config.push({
      label: 'PDF Tools',
      icon: FileText,
      subItems: [
        { path: '/dashboard/pdf/merge', label: 'Merge PDFs', icon: FileText },
        { path: '/dashboard/pdf/images-to-pdf', label: 'Images to PDF', icon: FileText },
      ],
    });
    config.push({
      label: 'Barcode Tools',
      icon: QrCode,
      subItems: [
        { path: '/dashboard/barcode/generator', label: 'Generator', icon: QrCode },
        { path: '/dashboard/barcode/interpreter', label: 'Interpreter', icon: ScanLine },
      ],
    });
  } else {
    // User dashboard
    config.push({ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
    config.push({ path: '/dashboard/profile', label: 'Profile', icon: User });
    config.push({ path: '/projects', label: 'Projects', icon: BriefcaseConveyorBeltIcon });
    config.push({ path: '/dashboard/chat', label: 'AI Chat Bot', icon: MessageCircle });
    config.push({
      label: 'PDF Tools',
      icon: FileText,
      subItems: [
        { path: '/dashboard/pdf/merge', label: 'Merge PDFs', icon: FileText },
        { path: '/dashboard/pdf/images-to-pdf', label: 'Images to PDF', icon: FileText },
      ],
    });
    config.push({
      label: 'Barcode Tools',
      icon: QrCode,
      subItems: [
        { path: '/dashboard/barcode/generator', label: 'Generator', icon: QrCode },
        { path: '/dashboard/barcode/interpreter', label: 'Interpreter', icon: ScanLine },
      ],
    });
  }

  return config;
};

const NavItem = ({
  item,
  collapsed,
  closeMobile,
}: {
  item: NavItem;
  collapsed: boolean;
  closeMobile?: () => void;
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const isChildActive = hasSubItems
    ? item.subItems!.some((sub) => location.pathname === sub.path)
    : false;
  const isActive = item.path ? location.pathname === item.path : isChildActive;

  useEffect(() => {
    if (hasSubItems && isChildActive) setIsOpen(true);
  }, [isChildActive, hasSubItems]);

  const handleClick = () => {
    if (hasSubItems) {
      setIsOpen(!isOpen);
    } else if (closeMobile) {
      closeMobile();
    }
  };

  const linkClasses = `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-primary/10 text-primary shadow-sm'
      : 'text-base-content/70 hover:bg-base-200 hover:text-primary hover:translate-x-1'
  }`;

  const Icon = item.icon;

  if (item.path && !hasSubItems) {
    // If it has an external flag, render an anchor tag
    if (item.external) {
      return (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={linkClasses}
          title={collapsed ? item.label : undefined}
        >
          <Icon
            className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
              isActive ? 'scale-110' : 'group-hover:scale-110'
            }`}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </a>
      );
    }
    return (
      <Link
        to={item.path}
        onClick={handleClick}
        className={linkClasses}
        title={collapsed ? item.label : undefined}
      >
        <Icon
          className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
            isActive ? 'scale-110' : 'group-hover:scale-110'
          }`}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <div onClick={handleClick} className={`${linkClasses} cursor-pointer`}>
        <Icon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </div>

      {!collapsed && hasSubItems && (
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen
              ? 'grid-rows-[1fr] opacity-100 mt-1'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden flex flex-col gap-1 pl-9 pr-2">
            {item.subItems!.map((sub) => {
              if (sub.external) {
                return (
                  <a
                    key={sub.path}
                    href={sub.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobile}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 hover:translate-x-1 text-base-content/60 hover:text-primary hover:bg-base-200"
                  >
                    {sub.icon && <sub.icon className="w-4 h-4" />}
                    {sub.label}
                  </a>
                );
              }
              return (
                <Link
                  key={sub.path}
                  to={sub.path!}
                  onClick={closeMobile}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 hover:translate-x-1 ${
                    location.pathname === sub.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-base-content/60 hover:text-primary hover:bg-base-200'
                  }`}
                >
                  {sub.icon && <sub.icon className="w-4 h-4" />}
                  {sub.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const role = user?.role || 'USER';

  const navItems = useMemo(() => getNavConfig(role), [role]);

  useEffect(() => {
    logger.log(`Dashboard mounted for role: ${role}`);
  }, [role]);

  const handleLogout = () => {
    logger.log('Logout from dashboard');
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <Navbar />

      <div className="flex flex-1 pt-16">
        {/* Desktop sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-base-100/90 backdrop-blur-lg border-r border-base-content/10 transition-all duration-300 z-20 sticky top-16 h-[calc(100vh-4rem)] ${
            collapsed ? 'w-20' : 'w-70'
          }`}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3.5 top-6 z-50 flex items-center justify-center w-7 h-7 rounded-full bg-base-100 border border-base-content/15 shadow-md text-base-content/60 hover:text-primary hover:border-primary/30 hover:scale-110 transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 translate-x-px" />
            ) : (
              <ChevronLeft className="w-4 h-4 -translate-x-px" />
            )}
          </button>

          <div
            className={`flex items-center h-16 border-b border-base-content/5 transition-all duration-300 ${
              collapsed ? 'justify-center px-0' : 'px-4'
            }`}
          >
            {!collapsed && (
              <span className="font-extrabold text-lg tracking-tight text-base-content">
                Menu
              </span>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
            {navItems.map((item, idx) => (
              <NavItem key={idx} item={item} collapsed={collapsed} />
            ))}
          </nav>

          <div className="p-4 border-t border-base-content/5 space-y-2">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm w-full justify-start gap-2"
            >
              {theme === 'bumblebee' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
              <span className={collapsed ? 'hidden' : ''}>
                {theme === 'bumblebee' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm w-full justify-start gap-2 text-error"
            >
              <LogOut className="w-4 h-4" />
              <span className={collapsed ? 'hidden' : ''}>Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile floating toggle button */}
        <div className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn btn-ghost btn-sm btn-circle bg-base-100/80 backdrop-blur shadow-md border border-base-content/10"
            aria-label="Open menu"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile custom sidebar */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-72 bg-base-100 shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-4 border-b border-base-content/5 flex items-center gap-3">
                <h2 className="text-xl font-bold text-base-content">Menu</h2>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-ghost btn-circle btn-sm ml-auto"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 overflow-y-auto space-y-1">
                {navItems.map((item, idx) => (
                  <NavItem
                    key={idx}
                    item={item}
                    collapsed={false}
                    closeMobile={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
              <div className="p-4 border-t border-base-content/5 space-y-2">
                <button
                  onClick={toggleTheme}
                  className="btn btn-ghost btn-sm w-full justify-start gap-2"
                >
                  {theme === 'bumblebee' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  {theme === 'bumblebee' ? 'Dark Mode' : 'Light Mode'}
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm w-full justify-start gap-2 text-error"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}