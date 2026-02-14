import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, Phone, Mail, User as UserIcon, 
    ChevronLeft, ChevronRight,
    Loader2, CheckCircle, XCircle, 
    MoreHorizontal, Copy, Wallet, TrendingUp, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// --- TYPES ---

// Matches your new backend response structure exactly
interface Customer {
    id: string;
    phone: string;
    email: string | null;
    name: string;
    role: string;
    created_at: string;
    updated_at: string;
    
    // Auth/Verification
    is_phone_verified: boolean;
    is_email_verified: boolean;
    // These might be missing in current JSON, kept optional just in case
    is_active?: boolean;
    kyc_status?: string; 

    // Financials (Now available!)
    wallet_balance: number;
    total_spent: number;
    total_leads: number;
    completed_leads: number;
    device_binding_id?: string;
}

interface APIResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Customer[];
}

interface FilterOptions {
    page: number;
    page_size: number;
    search: string;
    role: string;
}

// --- API CLIENT ---
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// --- HELPER COMPONENTS ---

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="text-gray-400 hover:text-emerald-600 transition-colors p-1" title="Copy ID">
            {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
    );
};

// --- MAIN COMPONENT ---

const CustomersList = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    
    const [filters, setFilters] = useState<FilterOptions>({
        page: 1,
        page_size: 10,
        search: '',
        role: 'consumer' // Fixed role as per your requirement
    });

    const loadCustomers = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Clean up params (remove empty search to avoid backend issues)
            const params: any = { ...filters };
            if (!params.search) delete params.search;

            const response = await apiClient.get<APIResponse>('/accounts/users/', { params });
            
            // Handle the new structure: { data: { results: [...], count: 25 } }
            if (response.data && Array.isArray(response.data.results)) {
                setCustomers(response.data.results);
                setTotal(response.data.count || 0);
            } else {
                // Fallback if structure changes unexpectedly
                setCustomers([]);
                setTotal(0);
                console.warn('Unexpected API response structure', response.data);
            }

        } catch (err: any) {
            console.error("Fetch error:", err);
            setError("Failed to load customer data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, [filters.page]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.search !== '' || filters.page !== 1) {
                // Reset to page 1 on search change
                setFilters(prev => ({ ...prev, page: 1 })); 
                loadCustomers();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const totalPages = Math.ceil(total / filters.page_size) || 1;

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 font-sans text-slate-800">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Consumers</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {total} Total
                        </span>
                        Manage registered users and their wallets
                    </p>
                </div>
                <button 
                    onClick={() => loadCustomers()} 
                    className="p-2.5 text-slate-500 hover:bg-slate-50 hover:text-emerald-600 rounded-lg transition-all border border-transparent hover:border-slate-200"
                >
                    <Loader2 size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, phone, or email..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                        value={filters.search}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                    <XCircle size={16} />
                    {error}
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 min-w-[240px]">Consumer Profile</th>
                                <th className="px-6 py-4">Leads Stats</th>
                                <th className="px-6 py-4">Financials</th>
                                <th className="px-6 py-4">Verification</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-10 bg-slate-100 rounded-full inline-block mr-3 align-middle"></div><div className="h-4 w-32 bg-slate-100 rounded inline-block align-middle"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : customers.length > 0 ? (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                                        
                                        {/* Profile */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Link to={`/users/${customer.id}`} className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-100 shadow-sm">
                                                    {(customer.name?.[0] || customer.phone?.[0] || '?').toUpperCase()}
                                                </Link>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">
                                                        {customer.name || <span className="text-slate-400 italic">No Name</span>}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                                                        <Phone size={12} />
                                                        {customer.phone}
                                                    </div>
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                            <Mail size={12} />
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Leads Stats */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed</div>
                                                    <div className="font-semibold text-slate-900">
                                                        {customer.completed_leads} 
                                                        <span className="text-slate-400 font-normal text-xs ml-1">/ {customer.total_leads} Total</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Financials - NEW DATA! */}
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Wallet size={14} className="text-emerald-500" />
                                                    <span className="text-slate-600">Wallet:</span>
                                                    <span className="font-semibold text-slate-900">{formatCurrency(customer.wallet_balance)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <TrendingUp size={12} className="text-slate-400" />
                                                    <span>Spent: {formatCurrency(customer.total_spent)}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Verification */}
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <span 
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                                                        customer.is_phone_verified 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                    }`}
                                                >
                                                    {customer.is_phone_verified ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                    Phone
                                                </span>
                                                <span 
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                                                        customer.is_email_verified 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}
                                                >
                                                    {customer.is_email_verified ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                    Email
                                                </span>
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">
                                                {new Date(customer.created_at).toLocaleDateString(undefined, {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
                                                ID: {customer.id.substring(0, 8)}
                                                <CopyButton text={customer.id} />
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                            <UserIcon size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-slate-900 font-medium">No consumers found</p>
                                        <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                            Showing <span className="font-medium">{((filters.page - 1) * filters.page_size) + 1}</span> to <span className="font-medium">{Math.min(filters.page * filters.page_size, total)}</span> of <span className="font-medium">{total}</span> results
                        </p>
                        <div className="flex gap-2">
                            <button 
                                disabled={filters.page <= 1}
                                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                disabled={filters.page >= totalPages}
                                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomersList;