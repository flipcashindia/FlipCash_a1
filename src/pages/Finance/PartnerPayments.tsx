// pages/Finance/PartnerPayments.tsx - COMPLETE PARTNER TOP-UP MANAGEMENT
import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Download, RefreshCw, Eye, CheckCircle, Clock,
  XCircle, AlertCircle, DollarSign, TrendingUp, Building, Calendar
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
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

// ==================== TYPES ====================
interface PartnerPayment {
  id: string;
  cf_order_id: string;
  cf_payment_id?: string;
  payment_session_id: string;
  wallet: {
    id: string;
    owner_id: string;
  };
  partner: {
    id: string;
    business_name: string;
    owner_name: string;
    phone: string;
  };
  transaction?: {
    id: string;
    transaction_id: string;
  };
  order_amount: string;
  order_currency: string;
  payment_status: string;
  payment_method?: string;
  customer_id: string;
  customer_phone: string;
  customer_email?: string;
  customer_name: string;
  payment_link?: string;
  bank_reference?: string;
  metadata?: any;
  created_at: string;
  paid_at?: string;
}

interface PaymentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PartnerPayment[];
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
    PAID: 'bg-emerald-100 text-emerald-800',
    SUCCESS: 'bg-emerald-100 text-emerald-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-amber-100 text-amber-800',
    FAILED: 'bg-red-100 text-red-800',
    USER_DROPPED: 'bg-gray-100 text-gray-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[status.toUpperCase()] || 'bg-gray-100 text-gray-800'}`}>
      {children}
    </span>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
};

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
        <div className="relative bg-white rounded-lg max-w-3xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
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
const PartnerPayments: React.FC = () => {
  const [payments, setPayments] = useState<PartnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 20,
    search: '',
    payment_status: '',
    payment_method: '',
    date_from: '',
    date_to: '',
  });
  const [total, setTotal] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<PartnerPayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/finance/payments/', { params: filters });
      setPayments(response.data.results || []);
      setTotal(response.data.count || 0);
    } catch (error) {
      toast.error('Failed to load partner payments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (payment: PartnerPayment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  // Calculate stats
  const stats = {
    total: total,
    successful: payments.filter(p => p.payment_status === 'PAID' || p.payment_status === 'SUCCESS').length,
    pending: payments.filter(p => p.payment_status === 'PENDING' || p.payment_status === 'ACTIVE').length,
    failed: payments.filter(p => p.payment_status === 'FAILED' || p.payment_status === 'USER_DROPPED').length,
    totalAmount: payments
      .filter(p => p.payment_status === 'PAID' || p.payment_status === 'SUCCESS')
      .reduce((sum, p) => sum + parseFloat(p.order_amount), 0),
  };

  // Chart data - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayPayments = payments.filter(p => {
      const paymentDate = new Date(p.created_at).toISOString().split('T')[0];
      return paymentDate === date && (p.payment_status === 'PAID' || p.payment_status === 'SUCCESS');
    });
    
    return {
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      amount: dayPayments.reduce((sum, p) => sum + parseFloat(p.order_amount), 0),
      count: dayPayments.length,
    };
  });

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Payments (Wallet Top-ups)</h1>
            <p className="text-sm text-gray-500 mt-1">Track all partner wallet recharge transactions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Filters
            </button>
            <button
              onClick={loadPayments}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw size={18} />
            </button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Payments"
            value={stats.total}
            icon={<CreditCard size={24} />}
            color="blue"
          />
          <StatCard
            title="Successful"
            value={stats.successful}
            icon={<CheckCircle size={24} />}
            color="green"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock size={24} />}
            color="amber"
          />
          <StatCard
            title="Total Amount"
            value={formatCurrency(stats.totalAmount)}
            icon={<DollarSign size={24} />}
            color="purple"
          />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card title="Payment Trend (Last 7 Days)">
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'amount') return formatCurrency(value);
                      return value;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Amount (₹)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Filters */}
        {showFilters && (
          <Card title="Filters">
            <div className="p-6 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  placeholder="Order ID, partner name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.payment_status}
                  onChange={(e) => setFilters({ ...filters, payment_status: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="FAILED">Failed</option>
                  <option value="USER_DROPPED">User Dropped</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Payments Table */}
        <Card title="All Partner Payments">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initiated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No partner payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payment.cf_order_id}</p>
                            {payment.cf_payment_id && (
                              <p className="text-xs text-gray-500">{payment.cf_payment_id.slice(0, 12)}...</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payment.partner.business_name}</p>
                            <p className="text-xs text-gray-500">{payment.partner.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.order_amount)}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {payment.payment_method?.replace(/_/g, ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={payment.payment_status}>{payment.payment_status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paid_at ? formatDateTime(payment.paid_at) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
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
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-700">
              Showing {Math.min((filters.page - 1) * filters.page_size + 1, total)} to{' '}
              {Math.min(filters.page * filters.page_size, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-4 py-2 text-sm bg-white border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= Math.ceil(total / filters.page_size)}
                className="px-4 py-2 text-sm bg-white border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </Card>

        {/* Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Payment Details"
        >
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Order ID</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedPayment.cf_order_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Payment ID</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedPayment.cf_payment_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Session ID</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedPayment.payment_session_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <Badge status={selectedPayment.payment_status}>{selectedPayment.payment_status}</Badge>
                </div>
              </div>

              {/* Partner Info */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Partner Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Business Name</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayment.partner.business_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Owner Name</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayment.partner.owner_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayment.partner.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Partner ID</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedPayment.partner.id}</p>
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Amount Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Order Amount:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(selectedPayment.order_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Currency:</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedPayment.order_currency}</span>
                  </div>
                  {selectedPayment.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {selectedPayment.payment_method.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Info */}
              {selectedPayment.transaction && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Transaction Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Transaction ID</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayment.transaction.transaction_id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Wallet ID</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedPayment.wallet.id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Initiated</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDateTime(selectedPayment.created_at)}</p>
                    </div>
                  </div>
                  {selectedPayment.paid_at && (
                    <div className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <div>
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDateTime(selectedPayment.paid_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Reference */}
              {selectedPayment.bank_reference && (
                <div className="border-t pt-4">
                  <label className="text-sm text-gray-500">Bank Reference</label>
                  <p className="text-sm font-semibold text-gray-900">{selectedPayment.bank_reference}</p>
                </div>
              )}

              {/* Payment Link */}
              {selectedPayment.payment_link && (
                <div className="border-t pt-4">
                  <label className="text-sm text-gray-500 mb-2 block">Payment Link</label>
                  <a
                    href={selectedPayment.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 hover:text-emerald-700 break-all"
                  >
                    {selectedPayment.payment_link}
                  </a>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default PartnerPayments;