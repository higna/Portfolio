import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Home } from 'lucide-react';
import { createLogger } from '../../lib/logger';

const logger = createLogger('AuthLayout');

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  const handleToggleTheme = () => {
    toggleTheme();
    logger.log(`Theme toggled from ${theme}`);
  };

  return (
    <div className="min-h-screen">
      {/* Fixed top bar – transparent normally, dark background on hover */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="btn btn-ghost btn-sm gap-2 text-amber-300 hover:text-amber-200 hover:bg-black/30 hover:backdrop-blur-sm"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <button
          onClick={handleToggleTheme}
          className="btn btn-ghost btn-sm btn-circle text-amber-300 hover:text-amber-200 hover:bg-black/30 hover:backdrop-blur-sm"
          aria-label="Toggle theme"
        >
          {theme === 'bumblebee' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      <Outlet />
    </div>
  );
}