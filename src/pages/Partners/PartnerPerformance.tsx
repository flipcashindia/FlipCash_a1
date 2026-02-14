// pages/partners/PartnerPerformance.tsx - COMPLETE UPDATED VERSION
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Star, TrendingUp, Eye } from 'lucide-react';
import axios from 'axios';

// ==================== CONFIGURATION ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ==================== TYPES ====================
interface Partner {
  id: string;
  user: {
    name: string;
  };
  business_name: string;
  average_rating: number;
  total_leads_completed: number;
  completion_rate: number;
  service_radius_km: number;
}

interface ServiceArea {
  id: string;
  city: string;
  state: string;
}

interface PartnerWithStats extends Partner {
  service_areas_count: number;
  total_revenue: number;
}

interface PartnersResponse {
  count: number;
  results: Partner[];
}

// ==================== API CLIENT ====================
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ==================== API SERVICE ====================
const PartnersService = {
  getPartners: async (): Promise<PartnersResponse> => {
    const response = await apiClient.get('/admin/partners/', {
      params: {
        status: 'approved',
        page_size: 100,
        ordering: '-average_rating'
      }
    });
    return response.data;
  },
};

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (amount: number = 0): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

const getRankBadgeColor = (rank: number): string => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
  if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
  if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
  return 'bg-gray-200';
};

// Change 'JSX.Element' to 'React.ReactElement'
const getRankIcon = (rank: number): React.ReactElement | null => {
  if (rank <= 3) {
    return <Trophy className="w-4 h-4 text-white" />;
  }
  return null;
};

// ==================== COMPONENTS ====================
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ 
  children, 
  className = '', 
  title 
}) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
}> = ({ label, value, subtitle }) => (
  <Card>
    <div className="p-6">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </Card>
);

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading performance data...</p>
    </div>
  </div>
);

const LeaderboardRow: React.FC<{
  partner: Partner;
  rank: number;
  onClick: () => void;
}> = ({ partner, rank, onClick }) => {
  const badgeColor = getRankBadgeColor(rank);
  const icon = getRankIcon(rank);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className={`w-12 h-12 rounded-full ${badgeColor} flex items-center justify-center flex-shrink-0`}>
          {icon || <span className="text-lg font-bold text-gray-600">{rank}</span>}
        </div>

        {/* Partner Info */}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{partner.business_name}</h4>
          <p className="text-sm text-gray-500">
            {partner.user.name} • Radius: {partner.service_radius_km}km
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 flex-shrink-0">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-gray-900">{partner.average_rating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Rating</p>
          </div>

          <div className="text-center">
            <p className="font-bold text-emerald-600">{formatNumber(partner.total_leads_completed)}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>

          <div className="text-center">
            <p className="font-bold text-blue-600">{partner.completion_rate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Success Rate</p>
          </div>

          <div className="text-center">
            <button
              onClick={onClick}
              className="px-4 py-2 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <Eye size={14} />
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const PartnerPerformance: React.FC = () => {
  const navigate = useNavigate();
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'completed' | 'success_rate'>('rating');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PartnersService.getPartners();
      setPartners(data.results || []);
    } catch (err: any) {
      console.error('Failed to load partners:', err);
      setError(err.response?.data?.error || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPartners}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Sort partners
  const sortedPartners = [...partners].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.average_rating - a.average_rating;
      case 'completed':
        return b.total_leads_completed - a.total_leads_completed;
      case 'success_rate':
        return b.completion_rate - a.completion_rate;
      default:
        return 0;
    }
  });

  // Get top performers for insights
  const topRated = [...partners]
    .sort((a, b) => b.average_rating - a.average_rating)
    .slice(0, 5);

  const mostProductive = [...partners]
    .sort((a, b) => b.total_leads_completed - a.total_leads_completed)
    .slice(0, 5);

  const bestSuccessRate = [...partners]
    .filter(p => p.total_leads_completed >= 5)
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .slice(0, 5);

  // Calculate overall stats
  const totalPartners = partners.length;
  const activePartners = partners.length;
  const avgRating = partners.length > 0 
    ? partners.reduce((sum, p) => sum + p.average_rating, 0) / partners.length 
    : 0;
  const totalCompleted = partners.reduce((sum, p) => sum + p.total_leads_completed, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/partners')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Partner Performance</h1>
              <p className="text-sm text-gray-500 mt-1">Top performing partners leaderboard</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            label="Total Partners" 
            value={totalPartners}
          />
          <StatCard 
            label="Active Partners" 
            value={activePartners}
          />
          <StatCard 
            label="Avg Rating" 
            value={avgRating.toFixed(1)}
            subtitle="Across all partners"
          />
          <StatCard 
            label="Total Completed" 
            value={formatNumber(totalCompleted)}
            subtitle="All time"
          />
        </div>

        {/* Leaderboard */}
        <Card>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="rating">Highest Rating</option>
                <option value="completed">Most Completed</option>
                <option value="success_rate">Best Success Rate</option>
              </select>
            </div>
          </div>

          <div>
            {sortedPartners.slice(0, 20).map((partner, index) => (
              <LeaderboardRow
                key={partner.id}
                partner={partner}
                rank={index + 1}
                onClick={() => navigate(`/partners/${partner.id}`)}
              />
            ))}
          </div>
        </Card>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Rated */}
          <Card title="Top Rated">
            <div className="p-6">
              <div className="space-y-4">
                {topRated.map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{partner.business_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold">{partner.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Most Productive */}
          <Card title="Most Productive">
            <div className="p-6">
              <div className="space-y-4">
                {mostProductive.map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{partner.business_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-emerald-600">
                        {formatNumber(partner.total_leads_completed)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Best Success Rate */}
          <Card title="Best Success Rate">
            <div className="p-6">
              <div className="space-y-4">
                {bestSuccessRate.map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{partner.business_name}</p>
                        <p className="text-xs text-gray-500">{partner.total_leads_completed} leads</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-600">
                        {partner.completion_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PartnerPerformance;