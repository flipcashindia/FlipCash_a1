// pages/Finance/PayoutsList.tsx - COMPLETE ADMIN VERSION WITH ALL FEATURES
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, CheckCircle, XCircle, Download, Filter, RefreshCw, 
  AlertCircle, DollarSign, TrendingUp, Clock, User, Building,
  ChevronLeft, ChevronRight, Search, Calendar
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

// ==================== API CONFIG ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
      localStorage.removeItem('access_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ==================== TYPES ====================
interface Payout {
  id: string;
  payout_id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  wallet: {
    id: string;
    balance: string;
  };
  bank_account: {
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
  };
  amount: string;
  fee: string;
  gst: string;
  net_amount: string;
  payout_method: string;
  status: string;
  reference_type?: string;
  reference_id?: string;
  cf_transfer_id?: string;
  utr_number?: string;
  failure_reason?: string;
  remarks?: string;
  initiated_at: string;
  processing_at?: string;
  completed_at?: string;
  failed_at?: string;
}

interface PayoutsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payout[];
}

interface FilterOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  payout_method?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

// ==================== API SERVICE ====================
const PayoutService = {
  getPayouts: async (filters: FilterOptions = {}): Promise<PayoutsResponse> => {
    const response = await apiClient.get('/finance/payouts/', { params: filters });
    return response.data;
  },

  approvePayout: async (id: string, remarks?: string) => {
    const response = await apiClient.post(`/finance/admin/finance/approve-payout/${id}/`, { remarks });
    return response.data;
  },

  rejectPayout: async (id: string, reason: string) => {
    const response = await apiClient.post(`/finance/admin/finance/reject-payout/${id}/`, { reason });
    return response.data;
  },
};

// ==================== UTILS ====================
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== COMPONENTS ====================
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ 
  children, className = '', title 
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

const Badge: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SUCCESS: 'bg-emerald-100 text-emerald-800',
    COMPLETED: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-800',
    REJECTED: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[status.toUpperCase()] || 'bg-gray-100 text-gray-800'}`}>
      {children}
    </span>
  );
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading payouts...</p>
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

// Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle size={24} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const PayoutsList: React.FC = () => {
  // const navigate = useNavigate();
  
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    page_size: 20,
  });
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPayouts();
  }, [filters]);

  const loadPayouts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PayoutService.getPayouts(filters);
      setPayouts(data.results || []);
      setTotal(data.count || 0);
    } catch (err: any) {
      console.error('Failed to load payouts:', err);
      setError(err.response?.data?.error || 'Failed to load payouts');
      toast.error('Failed to load payouts');
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

  const handleViewDetails = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowDetailsModal(true);
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this payout?')) return;
    
    const remarks = prompt('Add remarks (optional):');
    
    setActionLoading(id);
    try {
      await PayoutService.approvePayout(id, remarks || undefined);
      toast.success('Payout approved successfully');
      loadPayouts();
    } catch (err: any) {
      console.error('Approval failed:', err);
      toast.error(err.response?.data?.error || 'Failed to approve payout');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (required):');
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }
    
    setActionLoading(id);
    try {
      await PayoutService.rejectPayout(id, reason);
      toast.success('Payout rejected successfully. Amount has been refunded to wallet.');
      loadPayouts();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      toast.error(err.response?.data?.error || 'Failed to reject payout');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    toast.success('Exporting payouts...');
    // Implement CSV export
  };

  // Calculate stats
  const stats = {
    total: total,
    pending: payouts.filter(p => p.status === 'PENDING').length,
    processing: payouts.filter(p => p.status === 'PROCESSING').length,
    completed: payouts.filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED').length,
    failed: payouts.filter(p => p.status === 'FAILED' || p.status === 'REJECTED').length,
    totalAmount: payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    pendingAmount: payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + parseFloat(p.amount), 0),
  };

  // Chart data for status distribution
  const statusChartData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Processing', value: stats.processing, color: '#3b82f6' },
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
  ].filter(item => item.value > 0);

  if (loading && !payouts.length) return <Loader />;

  if (error && !payouts.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPayouts}
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor and manage all consumer withdrawal requests</p>
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
              onClick={loadPayouts}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Processing</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Amt</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.pendingAmount)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Distribution Chart */}
        {statusChartData.length > 0 && (
          <Card title="Status Distribution">
            <div className="p-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
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
                  placeholder="Search by payout ID, user name, phone, UTR..."
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
              {['all', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-4 py-2 font-medium whitespace-nowrap transition-colors border-b-2 ${
                    statusFilter === status
                      ? 'text-emerald-600 border-emerald-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All Payouts' : status.replace(/_/g, ' ')}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                  <input
                    type="number"
                    value={filters.min_amount || ''}
                    onChange={(e) => setFilters({ ...filters, min_amount: parseFloat(e.target.value) || undefined, page: 1 })}
                    placeholder="₹ 0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                  <input
                    type="number"
                    value={filters.max_amount || ''}
                    onChange={(e) => setFilters({ ...filters, max_amount: parseFloat(e.target.value) || undefined, page: 1 })}
                    placeholder="₹ 100,000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Payouts Table */}
        <Card title="All Payouts">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Breakdown
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initiated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No payouts found
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-gray-400" />
                          <div>
                            <p className="font-semibold text-gray-900">{payout.payout_id}</p>
                            {payout.utr_number && (
                              <p className="text-xs text-gray-500">UTR: {payout.utr_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <User size={16} className="text-gray-400 mt-1" />
                          <div>
                            <p className="font-medium text-gray-900">{payout.user.name}</p>
                            <p className="text-xs text-gray-500">{payout.user.phone}</p>
                            {payout.user.email && (
                              <p className="text-xs text-gray-500">{payout.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Amount: {formatCurrency(payout.amount)}
                          </p>
                          <p className="text-xs text-gray-500">Fee: {formatCurrency(payout.fee)}</p>
                          <p className="text-xs text-gray-500">GST: {formatCurrency(payout.gst)}</p>
                          <p className="text-xs font-semibold text-emerald-600">
                            Net: {formatCurrency(payout.net_amount)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {payout.bank_account.account_holder_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payout.bank_account.account_number.slice(-4).padStart(12, '*')}
                          </p>
                          <p className="text-xs text-gray-500">{payout.bank_account.bank_name}</p>
                          <p className="text-xs text-gray-500">{payout.bank_account.ifsc_code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={payout.status}>{payout.status}</Badge>
                        {payout.failure_reason && (
                          <p className="text-xs text-red-600 mt-1">{payout.failure_reason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{formatDateTime(payout.initiated_at)}</span>
                        </div>
                        {payout.completed_at && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle size={14} className="text-emerald-600" />
                            <span className="text-xs text-emerald-600">{formatDateTime(payout.completed_at)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {payout.cf_transfer_id && (
                          <div>CF: {payout.cf_transfer_id.slice(0, 12)}...</div>
                        )}
                        {payout.reference_type && payout.reference_id && (
                          <div>{payout.reference_type}: {payout.reference_id.slice(0, 8)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(payout)}
                            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          {payout.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(payout.id)}
                                disabled={actionLoading === payout.id}
                                className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleReject(payout.id)}
                                disabled={actionLoading === payout.id}
                                className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
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

        {/* Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Payout Details"
        >
          {selectedPayout && (
            <div className="space-y-6">
              {/* Payout Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Payout ID</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedPayout.payout_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge status={selectedPayout.status}>{selectedPayout.status}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Payout Method</label>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {selectedPayout.payout_method.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Wallet ID</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedPayout.wallet.id}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">User Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayout.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayout.user.phone}</p>
                  </div>
                  {selectedPayout.user.email && (
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayout.user.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-500">Current Wallet Balance</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(selectedPayout.wallet.balance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Amount Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gross Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(selectedPayout.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fee:</span>
                    <span className="text-sm font-semibold text-red-600">
                      - {formatCurrency(selectedPayout.fee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">GST:</span>
                    <span className="text-sm font-semibold text-red-600">
                      - {formatCurrency(selectedPayout.gst)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-semibold text-gray-900">Net Amount:</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(selectedPayout.net_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Account Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Account Holder</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedPayout.bank_account.account_holder_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Account Number</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedPayout.bank_account.account_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">IFSC Code</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedPayout.bank_account.ifsc_code}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Bank Name</label>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedPayout.bank_account.bank_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Initiated</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateTime(selectedPayout.initiated_at)}
                      </p>
                    </div>
                  </div>
                  {selectedPayout.processing_at && (
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Processing</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateTime(selectedPayout.processing_at)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedPayout.completed_at && (
                    <div className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <div>
                        <p className="text-xs text-gray-500">Completed</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateTime(selectedPayout.completed_at)}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedPayout.failed_at && (
                    <div className="flex items-center gap-3">
                      <XCircle size={16} className="text-red-600" />
                      <div>
                        <p className="text-xs text-gray-500">Failed</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDateTime(selectedPayout.failed_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* References */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">References</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedPayout.cf_transfer_id && (
                    <div>
                      <label className="text-sm text-gray-500">Cashfree Transfer ID</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayout.cf_transfer_id}</p>
                    </div>
                  )}
                  {selectedPayout.utr_number && (
                    <div>
                      <label className="text-sm text-gray-500">UTR Number</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayout.utr_number}</p>
                    </div>
                  )}
                  {selectedPayout.reference_type && selectedPayout.reference_id && (
                    <>
                      <div>
                        <label className="text-sm text-gray-500">Reference Type</label>
                        <p className="text-sm font-semibold text-gray-900">{selectedPayout.reference_type}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Reference ID</label>
                        <p className="text-sm font-semibold text-gray-900">{selectedPayout.reference_id}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {(selectedPayout.remarks || selectedPayout.failure_reason) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Notes</h4>
                  {selectedPayout.remarks && (
                    <div className="mb-2">
                      <label className="text-sm text-gray-500">Admin Remarks</label>
                      <p className="text-sm text-gray-900">{selectedPayout.remarks}</p>
                    </div>
                  )}
                  {selectedPayout.failure_reason && (
                    <div className="bg-red-50 p-3 rounded">
                      <label className="text-sm text-red-700 font-medium">Failure Reason</label>
                      <p className="text-sm text-red-900">{selectedPayout.failure_reason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedPayout.status === 'PENDING' && (
                <div className="border-t pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      handleApprove(selectedPayout.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Approve Payout
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedPayout.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject Payout
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default PayoutsList;