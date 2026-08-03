import { useNavigate } from 'react-router-dom';
import {
  User, LogIn, UserPlus, LayoutDashboard, LogOut,
  FolderKanban, Mail, Wrench, Briefcase,
  Award,
  GraduationCap,
  FolderGit,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';

const logger = createLogger('UserDropdown');

export default function UserDropdown({ transparent = false }: { transparent?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const triggerClass = transparent
    ? 'btn btn-ghost btn-circle text-white hover:text-[#D4AF37]'
    : 'btn btn-ghost btn-circle';

  // ---------- Guest menu ----------
  if (!user) {
    return (
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className={triggerClass}>
          <User className="w-5 h-5" />
        </label>
        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44 mt-2 z-50">
          <li>
            <button onClick={() => { logger.log('Navigate to login'); navigate('/login'); }}>
              <LogIn className="w-4 h-4" /> Login
            </button>
          </li>
          <li>
            <button onClick={() => { logger.log('Navigate to signup'); navigate('/signup'); }}>
              <UserPlus className="w-4 h-4" /> Sign Up
            </button>
          </li>
          <li className="menu-divider" />
          <li>
            <button onClick={() => navigate('/projects')}>
              <FolderKanban className="w-4 h-4" /> Projects
            </button>
          </li>
          <li>
            <button onClick={() => navigate('/contact')}>
              <Mail className="w-4 h-4" /> Contact
            </button>
          </li>
        </ul>
      </div>
    );
  }

  // ---------- Authenticated menu ----------
  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className={`${triggerClass} avatar placeholder`}>
        {user.picture ? (
          <div className="w-10 h-10 rounded-full">
            <img src={user.picture} alt={user.fullName || 'User'} className="rounded-full" />
          </div>
        ) : (
          <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 flex items-center justify-center">
            <span className="text-lg">{initials}</span>
          </div>
        )}
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-2 z-50">
        {user.fullName && (
          <li className="menu-title">
            <span>Hello, {user.fullName}</span>
          </li>
        )}

        {/* Dashboard – all roles */}
        <li>
          <button onClick={() => { logger.log('Navigate to dashboard'); navigate('/dashboard'); }}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => { logger.log('Navigate to profile'); navigate('/dashboard/profile'); }}>
            <User className="w-4 h-4" /> Profile
          </button>
        </li>

        {/* Superadmin quick links */}
        {user.role === 'SUPERADMIN' && (
          <>
            <li>
              <button onClick={() => navigate('/dashboard/certifications')}>
                <Award className="w-4 h-4" /> Certification
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/dashboard/education')}>
                <GraduationCap className="w-4 h-4" /> Education
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/dashboard/experience')}>
                <Briefcase className="w-4 h-4" /> Experience
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/dashboard/skills')}>
                <Wrench className="w-4 h-4" /> Skills
              </button>
            </li>
            <li>
              <button onClick={() => navigate('/dashboard/projects')}>
                <FolderGit className="w-4 h-4" /> Projects
              </button>
            </li>
          </>
        )}

        <li className="menu-divider" />

        {/* Public links – visible to all logged‑in users */}
        <li>
          <button onClick={() => navigate('/projects')}>
            <FolderKanban className="w-4 h-4" /> Projects
          </button>
        </li>
        <li>
          <button onClick={() => navigate('/contact')}>
            <Mail className="w-4 h-4" /> Contact
          </button>
        </li>

        <li className="menu-divider" />

        <li>
          <button onClick={() => { logger.log('Logout'); logout(); }}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </li>
      </ul>
    </div>
  );
}