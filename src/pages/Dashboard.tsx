import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/LoadingSkeleton';
import ContributorDashboard from './dashboards/ContributorDashboard';
import ExpertDashboard from './dashboards/ExpertDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function Dashboard() {
  const { profile, loading, user } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (profile?.role === 'admin') return <AdminDashboard />;
  if (profile?.role === 'expert') return <ExpertDashboard />;
  return <ContributorDashboard />;
}
