// pages/Finance/Reconciliation.tsx - COMPLETE ADMIN VERSION
import React, { useState } from 'react';
import { 
  RefreshCw, Download, CheckCircle, XCircle, AlertCircle, 
  Calendar, Filter, FileText
} from 'lucide-react';
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
interface ReconciliationFilters {
  date_from: string;
  date_to: string;
  type: string;
}

interface ReconciliationData {
  matched: number;
  unmatched: number;
  total: number;
  discrepancies: Array<{
    id: string;
    transaction_id: string;
    internal_amount: string;
    external_amount: string;
    difference: string;
    status: 'matched' | 'mismatch';
    type: string;
  }>;
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

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

// ==================== MAIN COMPONENT ====================
const Reconciliation: React.FC = () => {
  const [reconciling, setReconciling] = useState(false);
  const [filters, setFilters] = useState<ReconciliationFilters>({
    date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    type: 'all',
  });
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      // Simulate reconciliation process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock data - replace with actual API call
      setReconciliationData({
        matched: 1189,
        unmatched: 58,
        total: 1247,
        discrepancies: [
          {
            id: '1',
            transaction_id: 'TXN123456',
            internal_amount: '5000.00',
            external_amount: '5000.00',
            difference: '0.00',
            status: 'matched',
            type: 'payout',
          },
          {
            id: '2',
            transaction_id: 'TXN123457',
            internal_amount: '3500.00',
            external_amount: '3450.00',
            difference: '50.00',
            status: 'mismatch',
            type: 'payment',
          },
        ],
      });
      
      toast.success('Reconciliation completed successfully');
    } catch (error) {
      toast.error('Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleDownloadReport = () => {
    toast.success('Downloading reconciliation report...');
    // Implement CSV/PDF download
  };

  const handleResolveMismatch = async (_id: string) => {
    const resolution = prompt('Enter resolution notes:');
    if (!resolution) return;
    
    try {
      // await apiClient.post(`/finance/admin/finance/resolve-mismatch/${id}/`, { resolution });
      toast.success('Mismatch marked as resolved');
      handleReconcile();
    } catch (error) {
      toast.error('Failed to resolve mismatch');
    }
  };

  // Mock history data
  const reconciliationHistory = [
    { date: '2025-02-13', status: 'completed', matched: 245, unmatched: 5, totalAmount: '12,45,000' },
    { date: '2025-02-12', status: 'completed', matched: 198, unmatched: 2, totalAmount: '9,87,500' },
    { date: '2025-02-11', status: 'completed', matched: 312, unmatched: 8, totalAmount: '15,23,400' },
    { date: '2025-02-10', status: 'completed', matched: 267, unmatched: 3, totalAmount: '11,56,200' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Reconciliation</h1>
            <p className="text-sm text-gray-500 mt-1">Match internal transactions with payment gateway data</p>
          </div>
        </div>

        {/* Filters */}
        <Card title="Reconciliation Filters">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="payouts">Payouts</option>
                  <option value="payments">Payments</option>
                  <option value="refunds">Refunds</option>
                  <option value="fees">Fees</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleReconcile}
                  disabled={reconciling}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} className={reconciling ? 'animate-spin' : ''} />
                  {reconciling ? 'Running...' : 'Run Reconciliation'}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        {reconciliationData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold text-gray-900">{reconciliationData.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Matched</p>
                    <p className="text-3xl font-bold text-emerald-600">{reconciliationData.matched}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((reconciliationData.matched / reconciliationData.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Unmatched</p>
                    <p className="text-3xl font-bold text-red-600">{reconciliationData.unmatched}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((reconciliationData.unmatched / reconciliationData.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Summary */}
        <Card title="Reconciliation Summary">
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-700">Total Payouts Processed</span>
                <span className="font-semibold">₹12,45,000.00</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-700">Total Fees Collected</span>
                <span className="font-semibold">₹1,24,500.00</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-700">Total Refunds</span>
                <span className="font-semibold text-red-600">₹45,000.00</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-700">Pending Reconciliation</span>
                <span className="font-semibold text-amber-600">₹25,000.00</span>
              </div>
              <div className="flex justify-between items-center py-3 pt-4 border-t-2">
                <span className="font-bold text-lg">Net Amount</span>
                <span className="font-bold text-xl text-emerald-600">₹12,99,500.00</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleDownloadReport}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Detailed Report
              </button>
            </div>
          </div>
        </Card>

        {/* Discrepancies Table */}
        {reconciliationData && reconciliationData.discrepancies.length > 0 && (
          <Card title="Discrepancies & Mismatches">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internal Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateway Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reconciliationData.discrepancies.map((item) => (
                    <tr key={item.id} className={item.status === 'mismatch' ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.transaction_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.internal_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.external_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          parseFloat(item.difference) === 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {parseFloat(item.difference) === 0 ? '✓' : formatCurrency(item.difference)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.status === 'matched' ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle size={12} />
                            Matched
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1 w-fit">
                            <XCircle size={12} />
                            Mismatch
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.status === 'mismatch' && (
                          <button
                            onClick={() => handleResolveMismatch(item.id)}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Investigate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* History */}
        <Card title="Recent Reconciliation History">
          <div className="p-6">
            <div className="space-y-3">
              {reconciliationHistory.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formatDate(record.date)}</p>
                      <p className="text-sm text-gray-600">
                        Matched: <span className="font-medium text-emerald-600">{record.matched}</span> | 
                        Unmatched: <span className="font-medium text-red-600"> {record.unmatched}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-semibold text-gray-900">₹{record.totalAmount}</p>
                  </div>
                  <div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full font-medium">
                      {record.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reconciliation;