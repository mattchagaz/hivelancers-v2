import { useAuth } from '../../../contexts/authContextStore';
import FreelancerDashboard from './FreelancerDashboard';
import ClientDashboard from './ClientDashboard';

function Dashboard() {
  const { user } = useAuth();
  const isClient = user?.userType === 'CLIENT';

  return isClient ? <ClientDashboard /> : <FreelancerDashboard />;
}

export default Dashboard;
