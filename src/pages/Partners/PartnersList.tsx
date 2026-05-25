// pages/Partners/PartnersList.tsx - FINAL VERSION WITH ALL WORKING ACTIONS
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, MapPin, Search, Filter, ChevronLeft, ChevronRight, Star, Phone, Mail, TrendingUp } from 'lucide-react';
import axios from 'axios';

// ==================== CONFIGURATION ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ==================== TYPES ====================
interface Partner {
  id: string;
  user: {
    id: string;
    phone: string;
    email: string | null;
    name: string;
  };
  business_name: string;
  business_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  service_radius_km: number;
  price_range_min: number;
  price_range_max: number;
  partner_score: number;
  completion_rate: number;
  average_rating: number;
  total_leads_completed: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  profile_completed: number;
}

interface FilterOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  ordering?: string;
}

interface PartnersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Partner[];
}

// ==================== API CLIENT ====================
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ==================== API SERVICE ====================
const PartnersService = {
  getPartners: async (filters: FilterOptions = {}): Promise<PartnersResponse> => {
    const response = await apiClient.get('/admin/partners/', { params: filters });
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

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ==================== COMPONENTS ====================
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ 
  status: string; 
  children: React.ReactNode;
  className?: string;
}> = ({ status, children, className = '' }) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'} ${className}`}>
      {children}
    </span>
  );
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading partners...</p>
    </div>
  </div>
);

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <span className="px-4 py-2 text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const PartnersList: React.FC = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: 20,
    ordering: '-created_at'
  });
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPartners();
  }, [filters]);

  const loadPartners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PartnersService.getPartners(filters);
      setPartners(data.results || []);
      setTotal(data.count || 0);
    } catch (err: any) {
      console.error('Failed to load partners:', err);
      setError(err.response?.data?.error || 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchQuery, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    if (status === 'all') {
      const { status: _, ...rest } = filters;
      setFilters({ ...rest, page: 1 });
    } else {
      setFilters({ ...filters, status, page: 1 });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const totalPages = Math.ceil(total / (filters.page_size || 20));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Action Buttons */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partners</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all partner accounts</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/partners/pending-approvals')}
              className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2 border border-amber-200"
            >
              <Filter size={18} />
              Pending Approvals
            </button>
            <button
              onClick={() => navigate('/partners/performance')}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 border border-emerald-200"
            >
              <TrendingUp size={18} />
              Performance
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Total Partners</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Active Partners</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {partners.filter(p => p.status === 'approved').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {partners.filter(p => p.status === 'pending').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900 mt-2 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                {partners.length > 0 
                  ? (partners.reduce((sum, p) => sum + p.average_rating, 0) / partners.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="p-6 space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search partners by name, phone, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {['all', 'approved', 'pending', 'rejected', 'suspended'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-4 py-2 font-medium capitalize transition-colors border-b-2 ${
                    statusFilter === status
                      ? 'text-emerald-600 border-emerald-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Partners Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No partners found
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{partner.business_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{partner.business_type}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-900">
                            <Phone size={14} className="text-gray-400" />
                            <span>{partner.user.phone}</span>
                          </div>
                          {partner.user.email && (
                            <div className="flex items-center gap-2 text-gray-600 text-xs">
                              <Mail size={14} className="text-gray-400" />
                              <span>{partner.user.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-900">
                          <MapPin size={14} className="text-gray-400" />
                          <span>Radius: {partner.service_radius_km}km</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(partner.price_range_min)} - {formatCurrency(partner.price_range_max)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-gray-900 font-medium">
                            {partner.total_leads_completed} completed
                          </p>
                          {/* FIX APPLIED HERE: Converted to Number first */}
                          <p className="text-xs text-gray-500">
                            {(Number(partner.completion_rate) || 0).toFixed(1)}% success rate
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {/* FIX APPLIED HERE: Converted to Number first */}
                          <span className="font-semibold text-gray-900">
                            {(Number(partner.average_rating) || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <Badge status={partner.status}>
                            {partner.status}
                          </Badge>
                          {partner.is_available && (
                            <Badge status="active">Available</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/partners/${partner.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <Pagination
              currentPage={filters.page || 1}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={filters.page_size || 20}
              onPageChange={handlePageChange}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default PartnersList;