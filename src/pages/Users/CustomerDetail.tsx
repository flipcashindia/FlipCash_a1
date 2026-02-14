import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, User, Mail, Phone, Wallet, ShoppingBag,
    TrendingUp, TrendingDown, CheckCircle,
    XCircle, AlertCircle, FileText, Eye, Ban,
    Shield, ChevronRight, Activity, Package
} from 'lucide-react';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// --- TYPES ---
interface Customer {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: 'consumer';
    is_active: boolean;
    kyc_status: 'pending' | 'in_review' | 'verified' | 'rejected';
    is_phone_verified: boolean;
    is_email_verified: boolean;
    created_at: string;
    updated_at: string;
    device_binding_id?: string;
}

interface WalletData {
    balance: number;
    currency: string;
    status: string;
    available_balance?: number;
    blocked_balance?: number;
}

interface LeadSummary {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    description?: string;
    category?: string;
}

interface Lead {
    id: string;
    lead_number: string;
    device_name: string;
    variant: string | null;
    status: string;
    status_display: string;
    estimated_price: number | null;
    quoted_price: number | null;
    final_price: number | null;
    created_at: string;
    assigned_at: string | null;
    completed_at: string | null;
    partner_name: string | null;
    pickup_date: string | null;
    pickup_time_slot: string | null;
}

interface CustomerDetails {
    user: Customer;
    wallet: WalletData | null;
    leads_summary: LeadSummary | null;
    recent_transactions: Transaction[];
}

interface LeadsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Lead[];
}

// --- API CLIENT ---
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

// --- API SERVICE ---
const CustomerService = {
    getDetails: async (id: string): Promise<CustomerDetails> => {
        const response = await apiClient.get(`/accounts/users/${id}/details/`);
        return response.data.data;
    },
    
    getLeads: async (id: string, status?: string): Promise<LeadsResponse> => {
        const params = status ? { status } : {};
        const response = await apiClient.get(`/accounts/users/${id}/leads/`, { params });
        return response.data;
    },
    
    block: async (id: string): Promise<void> => {
        await apiClient.post(`/accounts/users/${id}/block/`);
    },
    
    unblock: async (id: string): Promise<void> => {
        await apiClient.post(`/accounts/users/${id}/unblock/`);
    }
};

// --- HELPER COMPONENTS ---
const Card = ({ children, className = "", title }: { 
    children: React.ReactNode; 
    className?: string;
    title?: string;
}) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
        {title && (
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </div>
);

const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color = 'blue',
    subtitle 
}: { 
    icon: any; 
    label: string; 
    value: string | number;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray';
    subtitle?: string;
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-emerald-100 text-emerald-600',
        yellow: 'bg-amber-100 text-amber-600',
        purple: 'bg-purple-100 text-purple-600',
        red: 'bg-red-100 text-red-600',
        gray: 'bg-gray-100 text-gray-600'
    };

    return (
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
                <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
};

const Badge = ({ 
    status, 
    type = 'status' 
}: { 
    status: string | boolean; 
    type?: 'status' | 'kyc' | 'transaction' | 'lead';
}) => {
    let styles = "bg-gray-100 text-gray-700";
    let label = String(status);

    if (type === 'status') {
        if (status) {
            styles = "bg-emerald-100 text-emerald-700";
            label = "Active";
        } else {
            styles = "bg-red-100 text-red-700";
            label = "Blocked";
        }
    } else if (type === 'kyc') {
        const statusStr = String(status);
        if (statusStr === 'verified') {
            styles = "bg-blue-100 text-blue-700";
            label = "Verified";
        } else if (statusStr === 'pending') {
            styles = "bg-amber-100 text-amber-700";
            label = "Pending";
        } else if (statusStr === 'in_review') {
            styles = "bg-purple-100 text-purple-700";
            label = "In Review";
        } else if (statusStr === 'rejected') {
            styles = "bg-red-100 text-red-700";
            label = "Rejected";
        }
    } else if (type === 'transaction') {
        const statusStr = String(status).toLowerCase();
        if (statusStr === 'completed' || statusStr === 'success') {
            styles = "bg-emerald-100 text-emerald-700";
            label = "Completed";
        } else if (statusStr === 'pending') {
            styles = "bg-amber-100 text-amber-700";
            label = "Pending";
        } else if (statusStr === 'failed') {
            styles = "bg-red-100 text-red-700";
            label = "Failed";
        }
    } else if (type === 'lead') {
        const statusStr = String(status).toLowerCase();
        if (statusStr === 'completed') {
            styles = "bg-emerald-100 text-emerald-700";
        } else if (statusStr === 'cancelled') {
            styles = "bg-red-100 text-red-700";
        } else if (statusStr === 'in_progress') {
            styles = "bg-blue-100 text-blue-700";
        } else {
            styles = "bg-gray-100 text-gray-700";
        }
        label = statusStr.replace('_', ' ');
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles}`}>
            {label}
        </span>
    );
};

const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// --- MAIN COMPONENT ---
const CustomerDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [details, setDetails] = useState<CustomerDetails | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'leads'>('overview');
    
    // Leads state
    const [leads, setLeads] = useState<Lead[]>([]);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [leadsError, setLeadsError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        if (id) {
            loadCustomerDetails();
        }
    }, [id]);

    // Load leads when switching to leads tab
    useEffect(() => {
        if (activeTab === 'leads' && id && !leads.length && !leadsLoading) {
            loadLeads();
        }
    }, [activeTab, id]);

    // Reload leads when status filter changes
    useEffect(() => {
        if (activeTab === 'leads' && id) {
            loadLeads();
        }
    }, [statusFilter]);

    const loadCustomerDetails = async () => {
        if (!id) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const data = await CustomerService.getDetails(id);
            setDetails(data);
        } catch (err: any) {
            console.error('Failed to load customer details:', err);
            setError(err.response?.data?.error || 'Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    const loadLeads = async () => {
        if (!id) return;
        
        setLeadsLoading(true);
        setLeadsError(null);
        
        try {
            const filterStatus = statusFilter === 'all' ? undefined : statusFilter;
            const response = await CustomerService.getLeads(id, filterStatus);
            setLeads(response.results || []);
        } catch (err: any) {
            console.error('Failed to load leads:', err);
            setLeadsError(err.response?.data?.error || 'Failed to load leads');
        } finally {
            setLeadsLoading(false);
        }
    };

    const handleBlock = async () => {
        if (!id || !details) return;
        
        if (!confirm(`Are you sure you want to block ${details.user.name || details.user.phone}?`)) {
            return;
        }
        
        try {
            await CustomerService.block(id);
            alert('Customer blocked successfully');
            loadCustomerDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to block customer');
        }
    };

    const handleUnblock = async () => {
        if (!id || !details) return;
        
        if (!confirm(`Are you sure you want to unblock ${details.user.name || details.user.phone}?`)) {
            return;
        }
        
        try {
            await CustomerService.unblock(id);
            alert('Customer unblocked successfully');
            loadCustomerDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to unblock customer');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading customer details...</p>
                </div>
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <p className="text-lg text-gray-900 mb-2">Failed to load customer</p>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => navigate('/admin/customers')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Back to Customers
                    </button>
                </div>
            </div>
        );
    }

    const { user, wallet, leads_summary, recent_transactions } = details;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/customers')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {user.name || 'Unnamed User'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Customer ID: {user.id.slice(0, 8)}... • Joined {formatDate(user.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge status={user.is_active} type="status" />
                        {user.is_active ? (
                            <button
                                onClick={handleBlock}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <Ban size={18} />
                                Block Customer
                            </button>
                        ) : (
                            <button
                                onClick={handleUnblock}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Unblock Customer
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <StatCard
                            icon={Wallet}
                            label="Wallet Balance"
                            value={formatCurrency(wallet?.balance || 0)}
                            color="purple"
                            subtitle={wallet?.status || 'N/A'}
                        />
                    </Card>
                    
                    <Card>
                        <StatCard
                            icon={ShoppingBag}
                            label="Total Leads"
                            value={leads_summary?.total || 0}
                            color="blue"
                            subtitle={`${leads_summary?.completed || 0} completed`}
                        />
                    </Card>
                    
                    <Card>
                        <StatCard
                            icon={Activity}
                            label="In Progress"
                            value={leads_summary?.in_progress || 0}
                            color="yellow"
                            subtitle={`${leads_summary?.pending || 0} pending`}
                        />
                    </Card>
                    
                    <Card>
                        <StatCard
                            icon={XCircle}
                            label="Cancelled"
                            value={leads_summary?.cancelled || 0}
                            color="red"
                            subtitle="All time"
                        />
                    </Card>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-4 border-b-2 transition-colors ${
                                activeTab === 'overview'
                                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`pb-4 border-b-2 transition-colors ${
                                activeTab === 'transactions'
                                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => setActiveTab('leads')}
                            className={`pb-4 border-b-2 transition-colors ${
                                activeTab === 'leads'
                                    ? 'border-emerald-600 text-emerald-600 font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Leads
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Contact Information */}
                            <Card title="Contact Information">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <User size={20} className="text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Full Name</p>
                                            <p className="font-semibold text-gray-900">
                                                {user.name || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Phone size={20} className="text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Phone Number</p>
                                            <p className="font-semibold text-gray-900">{user.phone}</p>
                                            {user.is_phone_verified && (
                                                <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                                    <CheckCircle size={12} /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Mail size={20} className="text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Email Address</p>
                                            <p className="font-semibold text-gray-900">
                                                {user.email || 'Not provided'}
                                            </p>
                                            {user.email && user.is_email_verified && (
                                                <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                                    <CheckCircle size={12} /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Shield size={20} className="text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">KYC Status</p>
                                            <Badge status={user.kyc_status} type="kyc" />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Wallet Details */}
                            {wallet && (
                                <Card title="Wallet Details">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                                            <div>
                                                <p className="text-sm text-gray-600">Current Balance</p>
                                                <p className="text-3xl font-bold text-gray-900">
                                                    {formatCurrency(wallet.balance)}
                                                </p>
                                            </div>
                                            <Wallet size={48} className="text-purple-600 opacity-20" />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Available</p>
                                                <p className="text-lg font-semibold text-emerald-600">
                                                    {formatCurrency(wallet.available_balance || wallet.balance)}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500">Blocked</p>
                                                <p className="text-lg font-semibold text-red-600">
                                                    {formatCurrency(wallet.blocked_balance || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Recent Transactions */}
                            <Card title="Recent Transactions">
                                {recent_transactions && recent_transactions.length > 0 ? (
                                    <div className="space-y-3">
                                        {recent_transactions.slice(0, 5).map((txn) => (
                                            <div
                                                key={txn.id}
                                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        txn.type === 'credit' 
                                                            ? 'bg-emerald-100 text-emerald-600'
                                                            : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {txn.type === 'credit' ? (
                                                            <TrendingUp size={20} />
                                                        ) : (
                                                            <TrendingDown size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {txn.category || txn.type}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDateTime(txn.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${
                                                        txn.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                    </p>
                                                    <Badge status={txn.status} type="transaction" />
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <button
                                            onClick={() => setActiveTab('transactions')}
                                            className="w-full py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            View All Transactions
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                                        <p>No transactions yet</p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Account Status */}
                            <Card title="Account Status">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Account Status</span>
                                        <Badge status={user.is_active} type="status" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Phone Verified</span>
                                        <Badge status={user.is_phone_verified} type="status" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Email Verified</span>
                                        <Badge status={user.is_email_verified} type="status" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">KYC Status</span>
                                        <Badge status={user.kyc_status} type="kyc" />
                                    </div>
                                </div>
                            </Card>

                            {/* Leads Summary */}
                            {leads_summary && (
                                <Card title="Leads Summary">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <span className="text-sm font-medium text-blue-900">Total Leads</span>
                                            <span className="text-xl font-bold text-blue-600">
                                                {leads_summary.total}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Completed</span>
                                            <span className="font-semibold text-emerald-600">
                                                {leads_summary.completed}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">In Progress</span>
                                            <span className="font-semibold text-blue-600">
                                                {leads_summary.in_progress}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Pending</span>
                                            <span className="font-semibold text-amber-600">
                                                {leads_summary.pending}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                            <span className="text-sm text-gray-600">Cancelled</span>
                                            <span className="font-semibold text-red-600">
                                                {leads_summary.cancelled}
                                            </span>
                                        </div>
                                        
                                        <button
                                            onClick={() => setActiveTab('leads')}
                                            className="w-full mt-2 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            View All Leads
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </Card>
                            )}

                            {/* Account Info */}
                            <Card title="Account Information">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Customer ID</span>
                                        <span className="font-mono text-xs font-semibold">
                                            {user.id.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Role</span>
                                        <span className="font-semibold capitalize">{user.role}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-600">Joined Date</span>
                                        <span className="font-semibold">{formatDate(user.created_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600">Last Updated</span>
                                        <span className="font-semibold">{formatDate(user.updated_at)}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <Card title="All Transactions">
                        {recent_transactions && recent_transactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Date & Time</th>
                                            <th className="px-6 py-3 text-left">Type</th>
                                            <th className="px-6 py-3 text-left">Category</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                            <th className="px-6 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recent_transactions.map((txn) => (
                                            <tr key={txn.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {formatDateTime(txn.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {txn.type === 'credit' ? (
                                                            <TrendingUp size={16} className="text-emerald-600" />
                                                        ) : (
                                                            <TrendingDown size={16} className="text-red-600" />
                                                        )}
                                                        <span className="capitalize">{txn.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 capitalize">
                                                    {txn.category || 'N/A'}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${
                                                    txn.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge status={txn.status} type="transaction" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No transactions found</p>
                                <p className="text-sm mt-1">This customer hasn't made any transactions yet</p>
                            </div>
                        )}
                    </Card>
                )}

                {activeTab === 'leads' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <Card>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Customer Leads ({leads_summary?.total || 0})
                                </h3>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="booked">Booked</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </Card>

                        {/* Leads Table */}
                        <Card>
                            {leadsLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading leads...</p>
                                </div>
                            ) : leadsError ? (
                                <div className="text-center py-12 text-red-600">
                                    <AlertCircle size={48} className="mx-auto mb-4" />
                                    <p>{leadsError}</p>
                                </div>
                            ) : leads.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Lead #</th>
                                                <th className="px-6 py-3 text-left">Device</th>
                                                <th className="px-6 py-3 text-left">Created</th>
                                                <th className="px-6 py-3 text-left">Pickup</th>
                                                <th className="px-6 py-3 text-left">Partner</th>
                                                <th className="px-6 py-3 text-right">Estimated</th>
                                                <th className="px-6 py-3 text-right">Final Price</th>
                                                <th className="px-6 py-3 text-center">Status</th>
                                                <th className="px-6 py-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {leads.map((lead) => (
                                                <tr key={lead.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-mono text-xs font-semibold text-gray-900">
                                                            {lead.lead_number}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {lead.device_name}
                                                            </p>
                                                            {lead.variant && (
                                                                <p className="text-xs text-gray-500">
                                                                    {lead.variant}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                        {formatDate(lead.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {lead.pickup_date ? (
                                                            <div>
                                                                <p className="text-gray-900">
                                                                    {formatDate(lead.pickup_date)}
                                                                </p>
                                                                {lead.pickup_time_slot && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {lead.pickup_time_slot}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">Not set</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {lead.partner_name ? (
                                                            <span className="text-gray-900">{lead.partner_name}</span>
                                                        ) : (
                                                            <span className="text-gray-400">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {lead.estimated_price ? (
                                                            <span className="font-medium text-gray-900">
                                                                {formatCurrency(lead.estimated_price)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {lead.final_price ? (
                                                            <span className="font-bold text-emerald-600">
                                                                {formatCurrency(lead.final_price)}
                                                            </span>
                                                        ) : lead.quoted_price ? (
                                                            <span className="font-medium text-blue-600">
                                                                {formatCurrency(lead.quoted_price)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge status={lead.status} type="lead" />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => window.open(`/admin/leads/${lead.id}`, '_blank')}
                                                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-emerald-600"
                                                            title="View Lead Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Package size={64} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">No leads found</p>
                                    <p className="text-sm mt-1">
                                        {statusFilter !== 'all' 
                                            ? `No ${statusFilter} leads for this customer`
                                            : 'This customer hasn\'t created any leads yet'}
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetail;