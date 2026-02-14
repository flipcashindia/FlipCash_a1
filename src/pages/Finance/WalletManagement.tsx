// pages/Finance/WalletManagement.tsx - COMPLETE ADMIN VERSION
import React, { useState } from 'react';
import { 
  Wallet, Plus, Minus, Search, RefreshCw, Eye, Users, 
  Building, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
interface WalletDetails {
  wallet: {
    id: string;
    owner_type: string;
    owner_id: string;
    balance: string;
    currency: string;
    status: string;
    daily_withdrawal_limit: string;
    min_balance: string;
    created_at: string;
  };
  statistics: {
    total_transactions: number;
    total_credits: string;
    total_debits: string;
    net_flow: string;
  };
  category_breakdown: Array<{
    category: string;
    total: string;
    count: number;
  }>;
  recent_activity: Array<{
    date: string;
    credits: string;
    debits: string;
  }>;
  recent_transactions: any[];
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
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 z-10">
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const WalletManagement: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'credit' | 'debit'>('credit');
  const [walletId, setWalletId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('adjustment');
  const [loading, setLoading] = useState(false);
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);

  const handleSearch = async () => {
    if (!searchQuery) {
      toast.error('Please enter wallet ID or user identifier');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/finance/admin/finance/wallets/${searchQuery}/details/`);
      setWalletDetails(response.data);
      setWalletId(response.data.wallet.id);
      toast.success('Wallet loaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load wallet');
      setWalletDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletId || !amount || !description) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const endpoint = modalType === 'credit' ? 'credit-wallet' : 'debit-wallet';
      await apiClient.post(`/finance/admin/finance/${endpoint}/${walletId}/`, {
        amount: parseFloat(amount),
        description,
        category
      });
      
      toast.success(`Wallet ${modalType}ed successfully`);
      setShowModal(false);
      setAmount('');
      setDescription('');
      handleSearch(); // Reload wallet details
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${modalType} wallet`);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: 'credit' | 'debit') => {
    if (!walletDetails) {
      toast.error('Please load a wallet first');
      return;
    }
    setModalType(type);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
            <p className="text-sm text-gray-500 mt-1">Search and manage user and partner wallets</p>
          </div>
        </div>

        {/* Search Section */}
        <Card title="Search Wallet">
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter wallet ID, user ID, user phone, or partner ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Search size={20} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </Card>

        {/* Wallet Details */}
        {walletDetails && (
          <>
            {/* Wallet Info Card */}
            <Card title="Wallet Information">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {walletDetails.wallet.owner_type === 'user' ? (
                          <Users className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Building className="w-5 h-5 text-purple-600" />
                        )}
                        <span className="text-sm text-gray-500 uppercase font-medium">
                          {walletDetails.wallet.owner_type} Wallet
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-emerald-600 mt-1">
                        {formatCurrency(walletDetails.wallet.balance)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Current Balance</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openModal('credit')}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Credit
                    </button>
                    <button
                      onClick={() => openModal('debit')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <Minus size={18} />
                      Debit
                    </button>
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {walletDetails.wallet.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Daily Limit</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(walletDetails.wallet.daily_withdrawal_limit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Min Balance</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(walletDetails.wallet.min_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(walletDetails.wallet.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {walletDetails.statistics.total_transactions}
                      </p>
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
                      <p className="text-sm text-gray-500">Total Credits</p>
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(walletDetails.statistics.total_credits)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Debits</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(walletDetails.statistics.total_debits)}
                      </p>
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
                      <p className="text-sm text-gray-500">Net Flow</p>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(walletDetails.statistics.net_flow)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Balance History Chart */}
            {walletDetails.recent_activity.length > 0 && (
              <Card title="Balance History (Last 30 Days)">
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={walletDetails.recent_activity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="credits" 
                        stroke="#10b981" 
                        name="Credits"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="debits" 
                        stroke="#ef4444" 
                        name="Debits"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Category Breakdown */}
            <Card title="Transaction Categories">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {walletDetails.category_breakdown.map((cat, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {cat.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(cat.total)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {cat.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(parseFloat(cat.total) / cat.count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card title="Recent Transactions">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {walletDetails.recent_transactions.map((txn: any) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            txn.transaction_type === 'credit' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {txn.transaction_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${
                            txn.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {txn.transaction_type === 'credit' ? '+' : '-'}
                            {formatCurrency(txn.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {txn.category.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {txn.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(txn.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Credit/Debit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${modalType === 'credit' ? 'Credit' : 'Debit'} Wallet`}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="adjustment">Adjustment</option>
                <option value="bonus">Bonus</option>
                <option value="refund">Refund</option>
                <option value="penalty">Penalty</option>
                <option value="correction">Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Preview */}
            {amount && walletDetails && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-semibold">{formatCurrency(walletDetails.wallet.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{modalType === 'credit' ? 'Adding:' : 'Deducting:'}</span>
                    <span className={`font-semibold ${modalType === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {modalType === 'credit' ? '+' : '-'}{formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-900 font-medium">New Balance:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(
                        parseFloat(walletDetails.wallet.balance) + 
                        (modalType === 'credit' ? parseFloat(amount) : -parseFloat(amount))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Confirm ${modalType === 'credit' ? 'Credit' : 'Debit'}`}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default WalletManagement;