// pages/partners/PartnerDetailComprehensive.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Briefcase, FileText, CheckCircle,
  XCircle, User, Calendar, TrendingUp, Wallet, Star, Building2,
  Shield, AlertCircle, Ban, PlayCircle, Package, Clock, DollarSign,
  Users, Activity, CreditCard, Eye, TrendingDown, Filter, Search,
  Download, RefreshCw, BarChart3
} from 'lucide-react';
import axios from 'axios';

// ==================== CONFIGURATION ====================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ==================== TYPES ====================
interface User {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
}

interface Partner {
  id: string;
  user: User;
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
  background_check_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
  profile_completed: number;
}

interface ServiceArea {
  id: string;
  name: string;
  city: string;
  state: string;
  postal_codes: string[];
  is_active: boolean;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
}

interface BankAccount {
  id: string;
  account_holder_name: string;
  account_number_masked: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  is_verified: boolean;
  is_primary: boolean;
}

interface Document {
  id: string;
  document_type: string;
  verification_status: string;
  verified_at: string | null;
  verification_notes: string;
  created_at: string;
}

interface WalletData {
  balance: number;
  blocked_amount: number;
  available_balance: number;
  status: string;
  currency: string;
}

interface Stats {
  total_leads: number;
  completed_leads: number;
  cancelled_leads: number;
  in_progress_leads: number;
  revenue_generated: number;
  active_agents: number;
}

interface PartnerDetails {
  partner: Partner;
  service_areas: ServiceArea[];
  bank_accounts: BankAccount[];
  documents: Document[];
  wallet: WalletData;
  stats: Stats;
}

interface Lead {
  id: string;
  lead_number: string;
  status: string;
  status_display: string;
  customer_name: string;
  customer_phone: string;
  device_name: string;
  storage: string;
  color: string;
  estimated_price: number;
  calculated_price: number | null;
  quoted_price: number | null;
  final_price: number | null;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  pickup_date: string | null;
  pickup_time_slot: string;
}

interface Transaction {
  id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  status: string;
  description: string;
  reference_type: string;
  reference_id: string;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  employee_code: string;
  status: string;
  verification_status: string;
  is_available: boolean;
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  average_rating: number;
  created_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  agent_name: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface PerformanceData {
  period_days: number;
  date_from: string;
  date_to: string;
  leads: {
    total: number;
    completed: number;
    cancelled: number;
    in_progress: number;
    completion_rate: number;
  };
  revenue: {
    total: number;
    average_deal_value: number;
  };
  transactions: {
    total_credit: number;
    total_debit: number;
    transaction_count: number;
  };
  agents: {
    total_agents: number;
    active_agents: number;
    avg_agent_rating: number;
  };
  daily_breakdown: Array<{
    date: string;
    leads: number;
    completed: number;
    revenue: number;
  }>;
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
const PartnerService = {
  // NEW: Get comprehensive details
  getDetails: async (id: string): Promise<PartnerDetails> => {
    const response = await apiClient.get(`/admin/partners/${id}/details/`);
    return response.data;
  },

  // NEW: Get leads with filters
  getLeads: async (id: string, params: any = {}): Promise<{ count: number; results: Lead[] }> => {
    const response = await apiClient.get(`/admin/partners/${id}/leads/`, { params });
    return response.data;
  },

  // NEW: Get transactions
  getTransactions: async (id: string, params: any = {}): Promise<{ count: number; results: Transaction[] }> => {
    const response = await apiClient.get(`/admin/partners/${id}/transactions/`, { params });
    return response.data;
  },

  // NEW: Get agents
  getAgents: async (id: string): Promise<{ count: number; results: Agent[] }> => {
    const response = await apiClient.get(`/admin/partners/${id}/agents/`);
    return response.data;
  },

  // NEW: Get activity
  getActivity: async (id: string, params: any = {}): Promise<{ count: number; results: Activity[] }> => {
    const response = await apiClient.get(`/admin/partners/${id}/activity/`, { params });
    return response.data;
  },

  // NEW: Get performance metrics
  getPerformance: async (id: string, days: number = 30): Promise<PerformanceData> => {
    const response = await apiClient.get(`/admin/partners/${id}/performance/`, { params: { days } });
    return response.data;
  },

  approvePartner: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/partners/${id}/approve/`);
  },

  rejectPartner: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`/admin/partners/${id}/reject/`, { reason });
  },

  suspendPartner: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`/admin/partners/${id}/suspend/`, { reason });
  },

  activatePartner: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/partners/${id}/activate/`);
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

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// ==================== COMPONENTS ====================
const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  title?: string;
}> = ({ children, className = '', title }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const Badge: React.FC<{ 
  status: string; 
  children: React.ReactNode;
}> = ({ status, children }) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    active: 'bg-blue-100 text-blue-800',
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
    in_progress: 'bg-blue-100 text-blue-800',
    credit: 'bg-emerald-100 text-emerald-800',
    debit: 'bg-red-100 text-red-800',
    booked: 'bg-blue-100 text-blue-800',
    partner_assigned: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {children}
    </span>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}> = ({ icon, label, value, subtitle, color = 'blue' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    yellow: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600">Loading data...</p>
    </div>
  </div>
);

const Alert: React.FC<{ 
  type: 'success' | 'error' | 'warning'; 
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  const types = {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle },
    error: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: XCircle },
    warning: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: AlertCircle },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.text} border ${config.border} rounded-lg p-4 flex items-center justify-between mb-6`}>
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{message}</span>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <XCircle size={18} />
      </button>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const PartnerDetailComprehensive: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [details, setDetails] = useState<PartnerDetails | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsCount, setLeadsCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'wallet' | 'agents' | 'activity' | 'performance'>('overview');
  const [loadingTab, setLoadingTab] = useState(false);

  // Filters
  const [leadFilters, setLeadFilters] = useState({ status: 'all', search: '' });
  const [txnFilters, setTxnFilters] = useState({ type: 'all' });
  const [performanceDays, setPerformanceDays] = useState(30);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  
  // Filters

  useEffect(() => {
    if (id) loadPartnerDetails(id);
  }, [id]);

  useEffect(() => {
    if (!id || !details) return;
    
    if (activeTab === 'leads' && leads.length === 0) loadLeads(id);
    else if (activeTab === 'wallet' && transactions.length === 0) loadTransactions(id);
    else if (activeTab === 'agents' && agents.length === 0) loadAgents(id);
    else if (activeTab === 'activity' && activities.length === 0) loadActivity(id);
    else if (activeTab === 'performance' && !performance) loadPerformance(id);
  }, [activeTab, id, details]);

  useEffect(() => {
    if (activeTab === 'leads' && id) {
      loadLeads(id);
    }
  }, [leadFilters]);

  useEffect(() => {
    if (activeTab === 'wallet' && id) {
      loadTransactions(id);
    }
  }, [txnFilters]);

  useEffect(() => {
    if (activeTab === 'performance' && id) {
      loadPerformance(id);
    }
  }, [performanceDays]);

  const loadPartnerDetails = async (partnerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PartnerService.getDetails(partnerId);
      setDetails(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load partner details');
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async (partnerId: string) => {
    setLoadingTab(true);
    try {
      const params: any = { page_size: 100 };
      if (leadFilters.status !== 'all') params.status = leadFilters.status;
      if (leadFilters.search) params.search = leadFilters.search;
      
      const data = await PartnerService.getLeads(partnerId, params);
      setLeads(data.results);
      setLeadsCount(data.count);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const loadTransactions = async (partnerId: string) => {
    setLoadingTab(true);
    try {
      const params: any = { page_size: 100 };
      if (txnFilters.type !== 'all') params.transaction_type = txnFilters.type;
      
      const data = await PartnerService.getTransactions(partnerId, params);
      setTransactions(data.results);
      setTransactionsCount(data.count);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTab(false);
    }
  };

// Similar for loadAgents, loadActivity, loadPerformance

  const loadAgents = async (partnerId: string) => {
    setLoadingTab(true);
    try {
      const data = await PartnerService.getAgents(partnerId);
      setAgents(data.results);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const loadActivity = async (partnerId: string) => {
    setLoadingTab(true);
    try {
      const data = await PartnerService.getActivity(partnerId, { page_size: 100 });
      setActivities(data.results);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const loadPerformance = async (partnerId: string) => {
    setLoadingTab(true);
    try {
      const data = await PartnerService.getPerformance(partnerId, performanceDays);
      setPerformance(data);
    } catch (err) {
      console.error('Failed to load performance:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const showAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleApprove = async () => {
    if (!id || !confirm('Approve this partner?')) return;
    try {
      await PartnerService.approvePartner(id);
      showAlert('success', 'Partner approved successfully');
      loadPartnerDetails(id);
    } catch (err: any) {
      showAlert('error', err.response?.data?.error || 'Failed to approve partner');
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = prompt('Enter rejection reason (minimum 10 characters):');
    if (!reason || reason.trim().length < 10) {
      showAlert('warning', 'Rejection reason must be at least 10 characters');
      return;
    }
    try {
      await PartnerService.rejectPartner(id, reason.trim());
      showAlert('success', 'Partner rejected');
      setTimeout(() => navigate('/admin/partners'), 2000);
    } catch (err: any) {
      showAlert('error', err.response?.data?.error || 'Failed to reject partner');
    }
  };

  const handleSuspend = async () => {
    if (!id) return;
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;
    try {
      await PartnerService.suspendPartner(id, reason.trim());
      showAlert('success', 'Partner suspended');
      loadPartnerDetails(id);
    } catch (err: any) {
      showAlert('error', err.response?.data?.error || 'Failed to suspend partner');
    }
  };

  const handleActivate = async () => {
    if (!id || !confirm('Activate this partner?')) return;
    try {
      await PartnerService.activatePartner(id);
      showAlert('success', 'Partner activated');
      loadPartnerDetails(id);
    } catch (err: any) {
      showAlert('error', err.response?.data?.error || 'Failed to activate partner');
    }
  };

  if (loading) return <Loader />;

  if (error || !details) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Partner not found'}</p>
          <button
            onClick={() => navigate('/admin/partners')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  const { partner, service_areas, bank_accounts, documents, wallet, stats } = details;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/partners')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{partner.business_name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Partner ID: {partner.id.slice(0, 8)}... • Joined {formatDate(partner.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge status={partner.status}>{partner.status}</Badge>
            {partner.user.kyc_status === 'verified' && (
              <Badge status="verified">KYC Verified</Badge>
            )}
            {partner.is_available && (
              <Badge status="active">Available</Badge>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <StatCard
                icon={<Package size={24} />}
                label="Total Leads"
                value={stats.total_leads}
                subtitle={`${stats.completed_leads} completed`}
                color="blue"
              />
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <StatCard
                icon={<TrendingUp size={24} />}
                label="Success Rate"
                // FIX APPLIED HERE: Convert to Number first
                value={`${(Number(partner.completion_rate) || 0).toFixed(1)}%`}
                subtitle={`${stats.in_progress_leads} in progress`}
                color="green"
              />
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <StatCard
                icon={<Star size={24} />}
                label="Average Rating"
                // FIX APPLIED HERE: Convert to Number first
                value={(Number(partner.average_rating) || 0).toFixed(1)}
                subtitle="From customers"
                color="yellow"
              />
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <StatCard
                icon={<Wallet size={24} />}
                label="Wallet Balance"
                value={formatCurrency(wallet.balance)}
                subtitle={formatCurrency(wallet.available_balance) + ' available'}
                color="purple"
              />
            </div>
          </Card>
        </div>

        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            {['overview', 'leads', 'wallet', 'agents', 'activity', 'performance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content - Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Overview content from earlier... */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Information Card */}
              <Card title="Business Information">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Business Type</p>
                      <p className="font-semibold capitalize text-gray-900">{partner.business_type}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Business Name</p>
                      <p className="font-semibold text-gray-900">{partner.business_name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Background Check</p>
                      <Badge status={partner.background_check_status}>
                        {partner.background_check_status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Partner Score</p>
                      <p className="font-semibold text-gray-900">{partner.partner_score}/100</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Contact Information Card */}
              <Card title="Contact Information">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Owner Name</p>
                      <p className="font-semibold text-gray-900">
                        {partner.user.name || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-semibold text-gray-900">{partner.user.phone}</p>
                    </div>
                  </div>

                  {partner.user.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-semibold text-gray-900">{partner.user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">KYC Status</p>
                      <Badge status={partner.user.kyc_status}>
                        {partner.user.kyc_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Service Areas Card */}
              <Card title={`Service Areas (${service_areas.length})`}>
                <div className="p-6">
                  {service_areas.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No service areas configured</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {service_areas.map((area) => (
                        <div
                          key={area.id}
                          className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900">
                                {area.name || `${area.city}, ${area.state}`}
                              </p>
                              <Badge status={area.is_active ? 'active' : 'suspended'}>
                                {area.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Radius: {area.radius_km}km • {area.city}, {area.state}
                            </p>
                            {area.postal_codes.length > 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                Pincodes: {area.postal_codes.slice(0, 5).join(', ')}
                                {area.postal_codes.length > 5 && ` +${area.postal_codes.length - 5} more`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Bank Accounts Card */}
              <Card title={`Bank Accounts (${bank_accounts.length})`}>
                <div className="p-6">
                  {bank_accounts.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No bank accounts added</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bank_accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900">
                                {account.bank_name}
                              </p>
                              <div className="flex gap-2">
                                {account.is_primary && (
                                  <Badge status="active">Primary</Badge>
                                )}
                                {account.is_verified && (
                                  <Badge status="verified">Verified</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {account.account_holder_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Account: {account.account_number_masked} • IFSC: {account.ifsc_code}
                            </p>
                            {account.branch_name && (
                              <p className="text-sm text-gray-500">
                                Branch: {account.branch_name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Documents Card */}
              <Card title={`Documents (${documents.length})`}>
                <div className="p-6">
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No documents uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <FileText className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 capitalize">
                                {doc.document_type.replace('_', ' ')}
                              </p>
                              <Badge status={doc.verification_status}>
                                {doc.verification_status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Uploaded: {formatDate(doc.created_at)}
                            </p>
                            {doc.verified_at && (
                              <p className="text-sm text-gray-600">
                                Verified: {formatDate(doc.verified_at)}
                              </p>
                            )}
                            {doc.verification_notes && (
                              <p className="text-sm text-gray-500 mt-1">
                                Note: {doc.verification_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Account Status Card */}
              <Card title="Account Status">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Partner Status</span>
                    <Badge status={partner.status}>{partner.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Availability</span>
                    <Badge status={partner.is_available ? 'active' : 'suspended'}>
                      {partner.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">KYC Status</span>
                    <Badge status={partner.user.kyc_status}>
                      {partner.user.kyc_status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Background Check</span>
                    <Badge status={partner.background_check_status}>
                      {partner.background_check_status}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Profile Completion Card */}
              <Card title="Profile Completion">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {partner.profile_completed}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        partner.profile_completed >= 80 ? 'bg-emerald-600' :
                        partner.profile_completed >= 50 ? 'bg-amber-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${partner.profile_completed}%` }}
                    />
                  </div>
                </div>
              </Card>

              {/* Service Details Card */}
              <Card title="Service Details">
                <div className="p-6 space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Service Radius</p>
                    <p className="font-semibold text-gray-900">{partner.service_radius_km} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price Range</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(partner.price_range_min)} - {formatCurrency(partner.price_range_max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Areas</p>
                    <p className="font-semibold text-gray-900">{service_areas.length} configured</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Agents</p>
                    <p className="font-semibold text-gray-900">{stats.active_agents}</p>
                  </div>
                </div>
              </Card>

              {/* Important Dates Card */}
              <Card title="Important Dates">
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Joined</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(partner.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(partner.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Actions Card */}
              <Card title="Actions">
                <div className="p-6 space-y-3">
                  {partner.status === 'pending' && (
                    <>
                      <button
                        onClick={handleApprove}
                        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Approve Partner
                      </button>
                      <button
                        onClick={handleReject}
                        className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        Reject Partner
                      </button>
                    </>
                  )}
                  {partner.status === 'approved' && (
                    <button
                      onClick={handleSuspend}
                      className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Ban size={18} />
                      Suspend Partner
                    </button>
                  )}
                  {partner.status === 'suspended' && (
                    <button
                      onClick={handleActivate}
                      className="w-full px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlayCircle size={18} />
                      Activate Partner
                    </button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* LEADS TAB - Continue in next part due to character limit */}
        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <Card title={`Leads (${leadsCount})`}>
            {/* Filters */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex gap-4">
                <select
                  value={leadFilters.status}
                  onChange={(e) => setLeadFilters({ ...leadFilters, status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <input
                  type="text"
                  value={leadFilters.search}
                  onChange={(e) => setLeadFilters({ ...leadFilters, search: e.target.value })}
                  placeholder="Search leads..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Leads Table */}
            <div className="p-6">
              {loadingTab ? (
                <TabLoader />
              ) : leads.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No leads found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">Lead #</th>
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">Device</th>
                        <th className="px-4 py-3 text-left">Price</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs">{lead.lead_number}</td>
                          <td className="px-4 py-3">
                            <div>{lead.customer_name}</div>
                            <div className="text-xs text-gray-500">{lead.customer_phone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div>{lead.device_name}</div>
                            <div className="text-xs text-gray-500">
                              {lead.storage} {lead.color && `• ${lead.color}`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {lead.final_price ? (
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(lead.final_price)}
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                {formatCurrency(lead.estimated_price)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={lead.status}>{lead.status_display}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(lead.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Wallet Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="p-6">
                  <p className="text-sm text-gray-500">Total Balance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(wallet.balance)}
                  </p>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">
                    {formatCurrency(wallet.available_balance)}
                  </p>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <p className="text-sm text-gray-500">Blocked</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {formatCurrency(wallet.blocked_amount)}
                  </p>
                </div>
              </Card>
            </div>

            {/* Transactions */}
            <Card title={`Transactions (${transactionsCount})`}>
              {/* Filter */}
              <div className="p-6 border-b border-gray-100">
                <select
                  value={txnFilters.type}
                  onChange={(e) => setTxnFilters({ type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credit Only</option>
                  <option value="debit">Debit Only</option>
                </select>
              </div>

              {/* Table */}
              <div className="p-6">
                {loadingTab ? (
                  <TabLoader />
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            txn.transaction_type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {txn.transaction_type === 'credit' ? (
                              <TrendingUp className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{txn.description}</p>
                            <p className="text-sm text-gray-500">{formatDateTime(txn.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            txn.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {txn.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Balance: {formatCurrency(txn.balance_after)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* AGENTS TAB */}
        {activeTab === 'agents' && (
          <Card title={`Agents (${agents.length})`}>
            <div className="p-6">
              {loadingTab ? (
                <TabLoader />
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No agents found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{agent.name}</p>
                          <p className="text-sm text-gray-500">{agent.phone}</p>
                          <p className="text-xs text-gray-400">Code: {agent.employee_code}</p>
                        </div>
                        <Badge status={agent.status}>{agent.status}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Assignments</p>
                          <p className="text-sm font-bold text-gray-900">{agent.total_assignments}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-sm font-bold text-emerald-600">{agent.completed_assignments}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Success</p>
                          <p className="text-sm font-bold text-blue-600">
                            {agent.completion_rate.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold">{agent.average_rating.toFixed(1)}</span>
                        </div>
                        {agent.is_available && (
                          <Badge status="active">Available</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <Card title={`Activity Logs (${activities.length})`}>
            <div className="p-6">
              {loadingTab ? (
                <TabLoader />
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No activity logs found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Activity className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500">{activity.agent_name}</p>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-500">{formatDateTime(activity.created_at)}</p>
                        </div>
                        {Object.keys(activity.metadata).length > 0 && (
                          <p className="text-xs text-gray-400 mt-2">
                            {JSON.stringify(activity.metadata)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && performance && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <select
                value={performanceDays}
                onChange={(e) => setPerformanceDays(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <div className="p-6">
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {performance.leads.total}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {performance.leads.completed} completed
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">
                    {performance.leads.completion_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {performance.leads.in_progress} in progress
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {formatCurrency(performance.revenue.total)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Avg: {formatCurrency(performance.revenue.average_deal_value)}
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <p className="text-sm text-gray-500">Active Agents</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {performance.agents.active_agents}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    of {performance.agents.total_agents} total
                  </p>
                </div>
              </Card>
            </div>

            {/* Daily Breakdown */}
            <Card title="Daily Breakdown (Last 7 Days)">
              <div className="p-6">
                <div className="space-y-3">
                  {performance.daily_breakdown.map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{formatDate(day.date)}</p>
                        <p className="text-sm text-gray-500">
                          {day.completed}/{day.leads} leads completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{formatCurrency(day.revenue)}</p>
                        <p className="text-xs text-gray-500">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDetailComprehensive;