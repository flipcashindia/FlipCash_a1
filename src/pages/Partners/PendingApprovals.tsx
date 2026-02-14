// pages/partners/PendingApprovals.tsx - COMPLETE UPDATED VERSION
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Eye, Clock, TrendingUp } from 'lucide-react';
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
  status: 'pending';
  service_radius_km: number;
  profile_completed: number;
  created_at: string;
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
  getPendingApprovals: async (): Promise<PartnersResponse> => {
    const response = await apiClient.get('/admin/partners/pending_approvals/');
    return response.data;
  },

  approvePartner: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/partners/${id}/approve/`);
  },

  rejectPartner: async (id: string, reason: string): Promise<void> => {
    await apiClient.post(`/admin/partners/${id}/reject/`, { reason });
  },
};

// ==================== HELPER FUNCTIONS ====================
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDaysSince = (dateString: string): number => {
  const then = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - then.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

const Badge: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {children}
    </span>
  );
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading pending approvals...</p>
    </div>
  </div>
);

const Alert: React.FC<{ 
  type: 'success' | 'error' | 'warning'; 
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  const types = {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    error: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  };

  const config = types[type];

  return (
    <div className={`${config.bg} ${config.text} border ${config.border} rounded-lg p-4 flex items-center justify-between mb-6`}>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <XCircle size={18} />
      </button>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const PendingApprovals: React.FC = () => {
  const navigate = useNavigate();
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await PartnersService.getPendingApprovals();
      setPartners(data.results || []);
    } catch (err: any) {
      console.error('Failed to load pending approvals:', err);
      setError(err.response?.data?.error || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this partner?')) return;
    
    setProcessingId(id);
    try {
      await PartnersService.approvePartner(id);
      showAlert('success', 'Partner approved successfully');
      await loadPendingApprovals();
    } catch (err: any) {
      showAlert('error', err.response?.data?.error || 'Failed to approve partner');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (minimum 10 characters):');
    if (!reason || reason.trim().length < 10) {
      showAlert('warning', 'Rejection reason must be at least 10 characters');
      return;
    }

    setProcessingId(id);
    try {
      await PartnersService.rejectPartner(id, reason.trim());
      showAlert('success', 'Partner rejected');
      await loadPendingApprovals();
    } catch (err: any) {
      showAlert('error', err.response?.data?.error || 'Failed to reject partner');
    } finally {
      setProcessingId(null);
    }
  };

  const showAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPendingApprovals}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const urgentCount = partners.filter(p => getDaysSince(p.created_at) > 7).length;
  const completeProfilesCount = partners.filter(p => p.profile_completed >= 80).length;

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
              onClick={() => navigate('/partners')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
              <p className="text-sm text-gray-500 mt-1">Review and approve partner applications</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pending</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">{partners.length}</p>
                </div>
                <Clock className="w-12 h-12 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Waiting {'>'} 7 Days</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{urgentCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Urgent</p>
                </div>
                <TrendingUp className="w-12 h-12 text-red-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Complete Profiles</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">{completeProfilesCount}</p>
                  <p className="text-xs text-gray-400 mt-1">≥80% complete</p>
                </div>
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Partners List */}
        <Card title={`Pending Applications (${partners.length})`}>
          {partners.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500" />
              <p className="text-xl font-semibold text-gray-900 mb-2">All caught up!</p>
              <p className="text-gray-500">No pending partner approvals at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Service Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {partners.map((partner) => {
                    const daysSince = getDaysSince(partner.created_at);
                    const isUrgent = daysSince > 7;

                    return (
                      <tr 
                        key={partner.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          isUrgent ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{partner.business_name}</p>
                            <p className="text-xs text-gray-500 capitalize">{partner.business_type}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-gray-900">{partner.user.phone}</p>
                            {partner.user.email && (
                              <p className="text-xs text-gray-500">{partner.user.email}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Owner: {partner.user.name || 'Not provided'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">Radius: {partner.service_radius_km}km</p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-900">{formatDate(partner.created_at)}</p>
                            <p className={`text-xs ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {daysSince} days ago
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">
                                {partner.profile_completed}%
                              </span>
                            </div>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  partner.profile_completed >= 80 ? 'bg-emerald-600' :
                                  partner.profile_completed >= 50 ? 'bg-amber-600' :
                                  'bg-red-600'
                                }`}
                                style={{ width: `${partner.profile_completed}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/partners/${partner.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleApprove(partner.id)}
                              disabled={processingId === partner.id}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(partner.id)}
                              disabled={processingId === partner.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PendingApprovals;