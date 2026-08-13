import { useAuth } from '../../context/AuthContext';
import { AdminDashboardHome } from '../admin';
import UserDashboardHome from './UserDashboardHome';

export default function DashboardHome() {
  const { user } = useAuth();
  return user?.role === 'SUPERADMIN' ? <AdminDashboardHome /> : <UserDashboardHome />;
}