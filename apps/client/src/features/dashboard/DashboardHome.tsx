import { useAuth } from '../../context/AuthContext';
import { AdminDashboardHome } from '../admin';

export default function DashboardHome() {
  const { user } = useAuth();
  return user?.role === 'SUPERADMIN' ? <AdminDashboardHome /> : <UserDashboardHome />;
}

// Placeholder user dashboard (will be built later)
function UserDashboardHome() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Welcome</h2>
      <p className="text-base-content/60">Your personal dashboard will be here.</p>
    </div>
  );
}