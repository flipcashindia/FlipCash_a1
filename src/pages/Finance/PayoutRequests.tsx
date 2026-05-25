// pages/Finance/PayoutRequests.tsx - COMPLETE ADMIN VERSION (Pending Queue)
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, User, Building } from 'lucide-react';
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

// ==================== TYPES ====================
interface PendingPayout {
  id: string;
  payout_id: string;
  user: {
    name: string;
    phone: string;
  };
  amount: string;
  fee: string;
  gst: string;
  net_amount: string;
  bank_account: {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    ifsc_code: string;
  };
  initiated_at: string;
  status: string;
}

// ==================== UTILS ====================
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

const getTimeSinceInitiated = (dateString: string): string => {
  const now = new Date();
  const initiated = new Date(dateString);
  const diffMs = now.getTime() - initiated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getSLAStatus = (dateString: string): 'normal' | 'warning' | 'critical' => {
  const now = new Date();
  const initiated = new Date(dateString);
  const diffHours = (now.getTime() - initiated.getTime()) / (1000 * 60 * 60);
  
  if (diffHours > 24) return 'critical';
  if (diffHours > 12) return 'warning';
  return 'normal';
};

// ==================== COMPONENTS ====================
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, className = '' 
}) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ type: 'normal' | 'warning' | 'critical' }> = ({ type }) => {
  const config = {
    normal: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'On Time' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Review Soon' },
    critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'Overdue' },
  };
  
  const { bg, text, label } = config[type];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// ==================== MAIN COMPONENT ====================
const PayoutRequests: React.FC = () => {
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPendingPayouts();
  }, []);

  const loadPendingPayouts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/finance/payouts/', {
        params: { status: 'PENDING', page_size: 100 }
      });
      setPayouts(response.data.results || []);
    } catch (error) {
      toast.error('Failed to load pending payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this payout request?')) return;
    
    const remarks = prompt('Add remarks (optional):');
    
    setActionLoading(id);
    try {
      await apiClient.post(`/finance/admin/finance/approve-payout/${id}/`, { remarks });
      toast.success('Payout approved successfully');
      loadPendingPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve payout');
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
      await apiClient.post(`/finance/admin/finance/reject-payout/${id}/`, { reason });
      toast.success('Payout rejected. Amount refunded to wallet.');
      loadPendingPayouts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject payout');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayouts.size === 0) {
      toast.error('No payouts selected');
      return;
    }
    
    if (!confirm(`Approve ${selectedPayouts.size} selected payouts?`)) return;
    
    const remarks = prompt('Add remarks for all (optional):');
    
    setLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of Array.from(selectedPayouts)) {
      try {
        await apiClient.post(`/finance/admin/finance/approve-payout/${id}/`, { remarks });
        successCount++;
      } catch (error) {
        failCount++;
      }
    }
    
    toast.success(`Approved ${successCount} payouts${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setSelectedPayouts(new Set());
    loadPendingPayouts();
    setLoading(false);
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedPayouts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPayouts(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedPayouts.size === payouts.length) {
      setSelectedPayouts(new Set());
    } else {
      setSelectedPayouts(new Set(payouts.map(p => p.id)));
    }
  };

  if (loading && payouts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const criticalPayouts = payouts.filter(p => getSLAStatus(p.initiated_at) === 'critical');
  const warningPayouts = payouts.filter(p => getSLAStatus(p.initiated_at) === 'warning');
  const totalAmount = payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Payout Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Quick approval queue</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadPendingPayouts}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
            {selectedPayouts.size > 0 && (
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Approve Selected ({selectedPayouts.size})
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{payouts.length}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overdue (&gt;24h)</p>
                  <p className="text-2xl font-bold text-red-600">{criticalPayouts.length}</p>
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
                  <p className="text-sm text-gray-500">Warning (&gt;12h)</p>
                  <p className="text-2xl font-bold text-amber-600">{warningPayouts.length}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payouts Queue */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Approval Queue</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPayouts.size === payouts.length && payouts.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Select All</span>
              </label>
            </div>

            <div className="space-y-4">
              {payouts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500" />
                  <p>No pending payout requests</p>
                </div>
              ) : (
                payouts
                  .sort((a, b) => {
                    // Sort by SLA status (critical first)
                    const slaA = getSLAStatus(a.initiated_at);
                    const slaB = getSLAStatus(b.initiated_at);
                    const priority = { critical: 0, warning: 1, normal: 2 };
                    return priority[slaA] - priority[slaB];
                  })
                  .map((payout) => {
                    const slaStatus = getSLAStatus(payout.initiated_at);
                    const isSelected = selectedPayouts.has(payout.id);
                    
                    return (
                      <div
                        key={payout.id}
                        className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                          slaStatus === 'critical' ? 'border-red-300 bg-red-50' :
                          slaStatus === 'warning' ? 'border-amber-300 bg-amber-50' :
                          'border-gray-200'
                        } ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(payout.id)}
                            className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          
                          <div className="flex-1 grid grid-cols-6 gap-4">
                            {/* User Info */}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">User</p>
                              <div className="flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{payout.user.name}</p>
                                  <p className="text-xs text-gray-500">{payout.user.phone}</p>
                                </div>
                              </div>
                            </div>

                            {/* Amount */}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Amount</p>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(payout.amount)}</p>
                              <p className="text-xs text-gray-500">Net: {formatCurrency(payout.net_amount)}</p>
                            </div>

                            {/* Bank Details */}
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500 mb-1">Bank Account</p>
                              <p className="text-sm font-medium text-gray-900">{payout.bank_account.account_holder_name}</p>
                              <p className="text-xs text-gray-500">
                                {payout.bank_account.account_number.slice(-4).padStart(12, '*')} - {payout.bank_account.bank_name}
                              </p>
                            </div>

                            {/* Time & SLA */}
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Initiated</p>
                              <p className="text-sm text-gray-900">{getTimeSinceInitiated(payout.initiated_at)}</p>
                              <div className="mt-1">
                                <Badge type={slaStatus} />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(payout.id)}
                                disabled={actionLoading === payout.id}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm flex items-center gap-1"
                              >
                                <CheckCircle size={14} />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(payout.id)}
                                disabled={actionLoading === payout.id}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm flex items-center gap-1"
                              >
                                <XCircle size={14} />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PayoutRequests;