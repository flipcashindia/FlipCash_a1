// pages/Finance/FinanceDashboard.tsx - COMPLETE ADMIN FINANCE DASHBOARD
import React, { useEffect, useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, Briefcase, 
  CreditCard, AlertCircle, RefreshCw, Download, Calendar
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

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
interface FinanceOverview {
  wallets: {
    total: number;
    users: number;
    partners: number;
    total_balance: string;
    user_balance: string;
    partner_balance: string;
  };
  transactions: {
    total_count: number;
    total_credits: string;
    total_debits: string;
    net_flow: string;
    today_count: number;
  };
  payouts: {
    total_count: number;
    pending_count: number;
    approved_count: number;
    total_amount: string;
    pending_amount: string;
  };
  payments: {
    total_count: number;
    successful_count: number;
    total_amount: string;
  };
  category_breakdown: Array<{
    category: string;
    total: string;
    count: number;
  }>;
  today_activity: {
    transactions_count: number;
    credits: string;
    debits: string;
    payouts_initiated: number;
    payments_received: number;
  };
}

// ==================== API SERVICE ====================
const FinanceService = {
  getOverview: async (): Promise<FinanceOverview> => {
    const response = await apiClient.get('finance/admin/finance/overview/');
    return response.data;
  },
};

// ==================== UTILS ====================
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
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
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red';
}> = ({ title, value, icon, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp size={16} className="text-emerald-600" />
                ) : (
                  <TrendingDown size={16} className="text-red-600" />
                )}
                <span className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {trend.value}%
                </span>
                <span className="text-xs text-gray-500">vs last period</span>
              </div>
            )}
          </div>
          <div className={`w-14 h-14 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading finance dashboard...</p>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const FinanceDashboard: React.FC = () => {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await FinanceService.getOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to load overview:', err);
      setError(err.response?.data?.error || 'Failed to load finance overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error || !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Failed to load data'}</p>
          <button
            onClick={loadOverview}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const categoryChartData = overview.category_breakdown.slice(0, 6).map(item => ({
    name: item.category.replace(/_/g, ' '),
    value: parseFloat(item.total),
    count: item.count,
  }));

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Complete financial overview and analytics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadOverview}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Balance"
            value={formatCurrency(overview.wallets.total_balance)}
            icon={<DollarSign size={28} />}
            color="green"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Transactions"
            value={overview.transactions.total_count.toLocaleString()}
            icon={<CreditCard size={28} />}
            color="blue"
          />
          <StatCard
            title="Pending Payouts"
            value={overview.payouts.pending_count}
            icon={<AlertCircle size={28} />}
            color="amber"
          />
          <StatCard
            title="Today's Activity"
            value={overview.today_activity.transactions_count}
            icon={<TrendingUp size={28} />}
            color="purple"
          />
        </div>

        {/* Wallet Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="User Wallets">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">{overview.wallets.users} wallets</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(overview.wallets.user_balance)}</p>
              <p className="text-sm text-gray-500 mt-2">Total consumer balance</p>
            </div>
          </Card>

          <Card title="Partner Wallets">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Briefcase size={24} className="text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">{overview.wallets.partners} wallets</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(overview.wallets.partner_balance)}</p>
              <p className="text-sm text-gray-500 mt-2">Total partner balance</p>
            </div>
          </Card>

          <Card title="Net Flow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp size={24} className="text-emerald-600" />
                </div>
                <span className="text-xs text-gray-500">Credits - Debits</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(overview.transactions.net_flow)}</p>
              <p className="text-sm text-gray-500 mt-2">Overall net flow</p>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown Pie Chart */}
          {/* Category Breakdown Pie Chart */}
          <Card title="Transaction Categories">
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // Added explicit types here 👇
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Credits vs Debits */}
          <Card title="Credits vs Debits">
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Credits</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(overview.transactions.total_credits)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Debits</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(overview.transactions.total_debits)}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { name: 'Credits', amount: parseFloat(overview.transactions.total_credits) },
                    { name: 'Debits', amount: parseFloat(overview.transactions.total_debits) },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Payout Summary */}
        <Card title="Payout Summary">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Payouts</p>
                <p className="text-2xl font-bold text-gray-900">{overview.payouts.total_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{overview.payouts.pending_count}</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(overview.payouts.pending_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Approved</p>
                <p className="text-2xl font-bold text-emerald-600">{overview.payouts.approved_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.payouts.total_amount)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Activity */}
        <Card title="Today's Activity">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="text-xl font-bold text-gray-900">{overview.today_activity.transactions_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(overview.today_activity.credits)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Debits</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(overview.today_activity.debits)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payouts</p>
                  <p className="text-xl font-bold text-gray-900">{overview.today_activity.payouts_initiated}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payments</p>
                  <p className="text-xl font-bold text-gray-900">{overview.today_activity.payments_received}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Category Breakdown Table */}
        <Card title="Top Transaction Categories">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.category_breakdown.map((category, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {category.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(category.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{category.count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(parseFloat(category.total) / category.count)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;