// pages/dashboard/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ShoppingBag, TrendingUp, DollarSign, 
  UserCheck, AlertCircle, Ticket, Package 
} from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Loader } from '../../components/UI/Loader';
import { StatCard } from '../../components/Shared/statCard';
import { dashboardService } from '../../services/dashboard.service';
import { type DashboardStats } from '../../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">Dashboard</h1>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.total_leads}
          icon={ShoppingBag}
          color="blue"
          subtitle={`${stats.leads_today} today`}
          onClick={() => navigate('/leads')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Active Leads"
          value={stats.active_leads}
          icon={TrendingUp}
          color="green"
          subtitle={`${stats.completed_leads} completed`}
          onClick={() => navigate('/leads')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Total Partners"
          value={stats.total_partners}
          icon={UserCheck}
          color="purple"
          subtitle={`${stats.active_partners} active`}
          onClick={() => navigate('/partners')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={Users}
          color="yellow"
          subtitle={`${stats.new_users_today} new today`}
          onClick={() => navigate('/users')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Approvals"
          value={stats.pending_approval}
          icon={AlertCircle}
          color="orange"
          onClick={() => navigate('/partners/pending-approvals')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Open Tickets"
          value={stats.open_tickets}
          icon={Ticket}
          color="red"
          onClick={() => navigate('/operations/tickets')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Pending Disputes"
          value={stats.pending_disputes}
          icon={Package}
          color="pink"
          onClick={() => navigate('/operations/disputes')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
        <StatCard
          title="Revenue (Month)"
          value={`₹${stats.revenue_month}`}
          icon={DollarSign}
          color="green"
          subtitle={`₹${stats.revenue_today} today`}
          onClick={() => navigate('/finance')}
          className="cursor-pointer hover:shadow-lg transition-shadow"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity">
          <div className="p-4 text-center text-gray-500">
            Activity chart will be displayed here
          </div>
        </Card>

        <Card title="Lead Status Distribution">
          <div className="p-4 text-center text-gray-500">
            Status distribution chart will be displayed here
          </div>
        </Card>
      </div>
    </div>
  );
}