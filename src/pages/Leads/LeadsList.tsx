// pages/Leads/LeadsList.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight,
  MapPin, Calendar, DollarSign, Flag, AlertCircle, UserCheck, Package,
  Phone, Mail, TrendingUp, Users, Clock, CheckCircle, Smartphone
} from 'lucide-react';
import axios from 'axios';

// ==================== CONFIGURATION ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ==================== TYPES ====================
// UPDATED: Matches AdminLeadListSerializer flat structure
interface Lead {
  id: string;
  lead_number: string;
  status: string;
  status_display: string;
  
  // Flattened User Info
  user_name: string;
  user_phone: string;
  user_email?: string;
  
  // Flattened Device Info
  device_name: string;
  brand_name: string;
  
  // Flattened Partner Info
  assigned_partner_name?: string;
  
  // Pricing
  estimated_price: string;
  final_price?: string;
  
  // Meta
  is_urgent: boolean;
  is_flagged: boolean;
  flag_reason?: string;
  created_at: string;
  
  // Schedule
  preferred_date?: string;
  preferred_time_slot?: string;
  pickup_date_display?: string; // Serializer sends this
  
  // Optional/Missing fields (Safeguarded)
  device_condition?: string;
  pickup_address?: {
    city: string;
    state: string;
  };
  current_agent?: {
    name: string;
    phone: string;
    employee_code: string;
  };
}

interface FilterOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  partner?: string;
  date_from?: string;
  date_to?: string;
  min_price?: number;
  max_price?: number;
  is_urgent?: boolean;
  is_flagged?: boolean;
  ordering?: string;
}

interface LeadsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Lead[];
}

interface Stats {
  total_leads: number; // Updated to match backend
  today: number;
  urgent_leads: number; // Updated to match backend
  flagged_leads: number; // Updated to match backend
  assigned_leads: number; // Updated to match backend
  unassigned_leads: number; // Updated to match backend
  by_status: Record<string, number>;
}

// ==================== API CLIENT ====================
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Handle token refresh logic here
      console.warn("Unauthorized - Redirecting to login");
    }
    return Promise.reject(error);
  }
);

// ==================== API SERVICE ====================
const LeadsService = {
  getLeads: async (filters: FilterOptions = {}): Promise<LeadsResponse> => {
    // Corrected URL: Added trailing slash to prevent 301 redirects
    const response = await apiClient.get('/admin/leads/', { params: filters });
    return response.data;
  },

  getStats: async (): Promise<Stats> => {
    const response = await apiClient.get('/admin/leads/stats/');
    return response.data;
  },

  exportCSV: async (filters: FilterOptions = {}) => {
    const response = await apiClient.get('/admin/leads/export/', {
      params: { ...filters, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },
};

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (amount: string | number | undefined): string => {
  if (amount === undefined || amount === null) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ==================== COMPONENTS ====================
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
  const statusColors: Record<string, string> = {
    booked: 'bg-blue-100 text-blue-800',
    partner_assigned: 'bg-purple-100 text-purple-800',
    en_route: 'bg-indigo-100 text-indigo-800',
    checked_in: 'bg-cyan-100 text-cyan-800',
    inspecting: 'bg-amber-100 text-amber-800',
    offer_made: 'bg-blue-100 text-blue-800',
    negotiating: 'bg-orange-100 text-orange-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-gray-100 text-gray-800',
    disputed: 'bg-red-100 text-red-800',
  };

  const normalizedStatus = status?.toLowerCase() || '';
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800'}`}>
      {children}
    </span>
  );
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading leads...</p>
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
        Showing <span className="font-medium">{Math.max(0, startItem)}</span> to{' '}
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
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
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
const LeadsList: React.FC = () => {
  const navigate = useNavigate();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    page_size: 20,
    ordering: '-created_at',
  });
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadLeads();
    loadStats();
  }, [filters]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await LeadsService.getLeads(filters);
      setLeads(data.results || []);
      setTotal(data.count || 0);
    } catch (err: any) {
      console.error('Failed to load leads:', err);
      // Don't show error if it's just empty
      if (err.response?.status !== 404) {
          setError(err.response?.data?.error || 'Failed to load leads');
      } else {
          setLeads([]);
          setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await LeadsService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await LeadsService.exportCSV(filters);
      downloadBlob(blob, `leads_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export leads');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !leads.length) return <Loader />;

  const totalPages = Math.ceil(total / (filters.page_size || 20));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all customer leads</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => { loadLeads(); loadStats(); }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Stats Cards - Updated to match new API structure */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_leads}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.today}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Urgent</p>
                    <p className="text-2xl font-bold text-red-600">{stats.urgent_leads}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Flag className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Flagged</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.flagged_leads}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.assigned_leads}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unassigned</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.unassigned_leads}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters Card */}
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
                  placeholder="Search by lead number, customer name, phone, device..."
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
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
              {['all', 'BOOKED', 'PARTNER_ASSIGNED', 'EN_ROUTE', 'CHECKED_IN', 'INSPECTING', 'COMPLETED', 'CANCELLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 ${
                    statusFilter === status
                      ? 'text-emerald-600 border-emerald-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All Leads' : status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                  <input
                    type="number"
                    value={filters.min_price || ''}
                    onChange={(e) => setFilters({ ...filters, min_price: parseInt(e.target.value) || undefined, page: 1 })}
                    placeholder="₹ 0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    value={filters.max_price || ''}
                    onChange={(e) => setFilters({ ...filters, max_price: parseInt(e.target.value) || undefined, page: 1 })}
                    placeholder="₹ 100,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Leads Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner & Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Schedule
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
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {error || "No leads found"}
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{lead.lead_number}</p>
                            <p className="text-xs text-gray-500">{formatDateTime(lead.created_at)}</p>
                            <div className="flex gap-1 mt-1">
                              {lead.is_urgent && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded">URGENT</span>
                              )}
                              {lead.is_flagged && (
                                <Flag size={14} className="text-amber-600" fill="currentColor" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-gray-900">{lead.user_phone || 'N/A'}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{lead.user_name || 'Guest'}</p>
                          {lead.user_email && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Mail size={12} className="text-gray-400" />
                              <span>{lead.user_email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                             <Smartphone className="w-4 h-4 text-gray-400" />
                             <p className="font-semibold text-gray-900">
                                {lead.brand_name} {lead.device_name}
                             </p>
                          </div>
                          {lead.device_condition && (
                             <p className="text-xs text-gray-500 capitalize ml-5">{lead.device_condition}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(lead.estimated_price)}
                          </p>
                          {lead.final_price && (
                            <p className="text-xs text-emerald-600 font-medium">
                              Final: {formatCurrency(lead.final_price)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {lead.assigned_partner_name ? (
                            <div>
                              <div className="flex items-center gap-1">
                                <UserCheck size={14} className="text-purple-600" />
                                <p className="text-sm font-medium text-gray-900">{lead.assigned_partner_name}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">No partner assigned</p>
                          )}
                          
                          {/* Checked safely for current_agent */}
                          {lead.current_agent && (
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1">
                                <Users size={14} className="text-blue-600" />
                                <p className="text-sm font-medium text-blue-900">{lead.current_agent.name}</p>
                              </div>
                              <p className="text-xs text-gray-500">Agent: {lead.current_agent.employee_code}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {/* Checked safely for pickup_address */}
                          {lead.pickup_address && (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-gray-400" />
                              <span className="text-xs text-gray-900">
                                {lead.pickup_address.city}, {lead.pickup_address.state}
                              </span>
                            </div>
                          )}
                          {(lead.pickup_date_display || lead.preferred_date) && (
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-xs text-gray-900">{lead.pickup_date_display || lead.preferred_date}</span>
                            </div>
                          )}
                          {lead.preferred_time_slot && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-xs text-gray-900">{lead.preferred_time_slot}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={lead.status}>{lead.status_display}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
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

export default LeadsList;



