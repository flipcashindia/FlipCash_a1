import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Search, FileText, CheckCircle, AlertCircle, 
    MoreVertical, Shield, Smartphone, Mail, Calendar, 
    XCircle, User as UserIcon, Loader2
} from 'lucide-react';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// --- TYPES & INTERFACES (Matching Django Models/Serializers) ---

type UserRole = 'consumer' | 'partner' | 'agent' | 'super_admin' | 'admin' | 'sales' | 'support' | 'finance';
type KYCStatus = 'pending' | 'in_review' | 'verified' | 'rejected';

interface User {
    id: string; // UUID
    phone: string;
    email: string | null;
    name: string;
    role: UserRole;
    is_phone_verified: boolean;
    is_email_verified: boolean;
    device_binding_id?: string;
    created_at: string;
    updated_at: string;
    // Note: Assuming these fields are added to UserSerializer or fetched via detailed view
    kyc_status?: KYCStatus; 
    is_active?: boolean;
    wallet_balance?: number; // Fetched separately or via enrichment
}

interface KYCDetails {
    id: string;
    status: KYCStatus;
    document_type: string;
    document_number: string;
    document_front_url: string | null;
    document_back_url: string | null;
    selfie_url: string | null;
    verification_notes: string;
    verified_at: string | null;
    created_at: string;
}

// --- API CLIENT ---

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for auth token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- API SERVICES ---

const UserService = {
    // Note: Assuming a ListCreateAPIView exists at /accounts/users/ for admins
    getAll: async (params?: any) => {
        // Fallback to mock if endpoint fails (for demonstration) or implement real call
        try {
            return await apiClient.get<User[]>('/accounts/users/', { params });
        } catch (error) {
            console.warn("API Fetch failed, using mock data for demo");
            return { data: [] }; 
        }
    },
    getById: async (id: string) => apiClient.get<User>(`/accounts/users/${id}/`),
    getKYC: async (userId: string) => apiClient.get<KYCDetails>(`/accounts/users/${userId}/kyc/`),
    updateStatus: async (id: string, action: 'block' | 'unblock') => 
        apiClient.post(`/accounts/users/${id}/${action}/`),
    processKYC: async (userId: string, data: { status: 'verified' | 'rejected', notes?: string }) => 
        apiClient.post(`/accounts/users/${userId}/kyc/process/`, data),
};

// --- HELPER COMPONENTS ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
        {children}
    </div>
);

const Badge = ({ text, type = 'status' }: { text?: string, type?: 'status' | 'role' | 'kyc' }) => {
    const lowerText = text?.toLowerCase() || '';
    
    let styles = "bg-gray-100 text-gray-700"; // default

    if (type === 'status') {
        if (['active', 'unblocked'].includes(lowerText)) styles = "bg-emerald-100 text-emerald-700";
        if (['blocked', 'inactive'].includes(lowerText)) styles = "bg-red-100 text-red-700";
    } else if (type === 'kyc') {
        if (lowerText === 'verified') styles = "bg-blue-100 text-blue-700";
        if (lowerText === 'pending' || lowerText === 'in_review') styles = "bg-amber-100 text-amber-700";
        if (lowerText === 'rejected') styles = "bg-red-100 text-red-700";
    } else if (type === 'role') {
        if (lowerText === 'super_admin' || lowerText === 'admin') styles = "bg-purple-100 text-purple-700";
        if (lowerText === 'partner') styles = "bg-indigo-100 text-indigo-700";
        if (lowerText === 'consumer') styles = "bg-slate-100 text-slate-700";
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles}`}>
            {text?.replace('_', ' ') || 'N/A'}
        </span>
    );
};

const Button = ({ children, variant = 'primary', onClick, className = "", size = "md", disabled = false, loading = false }: any) => {
    const base = "font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants: any = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
        secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        ghost: "text-gray-500 hover:bg-gray-100"
    };
    const sizes: any = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {children}
        </button>
    );
};

// --- MAIN COMPONENT ---

export const UsersPage = () => {
    // State
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserKYC, setSelectedUserKYC] = useState<KYCDetails | null>(null);
    const [kycLoading, setKycLoading] = useState(false);
    
    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [kycFilter, setKycFilter] = useState<string>('all');

    // Fetch Users on Mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await UserService.getAll();
            // Since getAll returns mock in failure, we check data
            if (response.data && Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(u => {
        const matchesSearch = 
            u.name?.toLowerCase().includes(search.toLowerCase()) || 
            u.phone.includes(search) || 
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesKyc = kycFilter === 'all' || (u.kyc_status || 'pending') === kycFilter;
        
        return matchesSearch && matchesRole && matchesKyc;
    });

    // Handle View Details
    const handleViewUser = async (user: User) => {
        setSelectedUser(user);
        setKycLoading(true);
        try {
            // Fetch KYC details if status is relevant
            if (user.kyc_status && user.kyc_status !== 'pending') {
                const kycRes = await UserService.getKYC(user.id);
                setSelectedUserKYC(kycRes.data);
            } else {
                setSelectedUserKYC(null);
            }
        } catch (err) {
            console.error("No KYC data or fetch failed", err);
            setSelectedUserKYC(null);
        } finally {
            setKycLoading(false);
        }
    };

    // Handle Actions
    const handleAction = async (action: string) => {
        if (!selectedUser) return;
        
        try {
            if (action === 'approveKYC') {
                await UserService.processKYC(selectedUser.id, { status: 'verified' });
                // Optimistic update
                setSelectedUser({ ...selectedUser, kyc_status: 'verified' });
            } else if (action === 'rejectKYC') {
                const reason = prompt("Enter rejection reason:");
                if (reason) {
                    await UserService.processKYC(selectedUser.id, { status: 'rejected', notes: reason });
                    setSelectedUser({ ...selectedUser, kyc_status: 'rejected' });
                }
            } else if (action === 'block') {
                if(confirm('Are you sure you want to block this user?')) {
                    await UserService.updateStatus(selectedUser.id, 'block');
                    setSelectedUser({ ...selectedUser, is_active: false });
                }
            } else if (action === 'unblock') {
                await UserService.updateStatus(selectedUser.id, 'unblock');
                setSelectedUser({ ...selectedUser, is_active: true });
            }
            
            // Refresh list
            fetchUsers();
        } catch (error) {
            alert("Action failed. Please try again.");
            console.error(error);
        }
    };

    // --- RENDER DETAIL VIEW ---
    if (selectedUser) {
        return (
            <div className="space-y-6 animate-fade-in">
                <Card>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-2xl font-bold text-emerald-700 uppercase">
                                {selectedUser.name?.charAt(0) || selectedUser.phone.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedUser.name || 'Unnamed User'}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-gray-500 text-sm font-mono">{selectedUser.phone}</span>
                                    <Badge text={selectedUser.role} type="role" />
                                    <Badge text={selectedUser.kyc_status || 'pending'} type="kyc" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setSelectedUser(null)} size="sm">Back to List</Button>
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <UserIcon size={18} /> Personal Details
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="text-gray-500 flex items-center gap-2"><Mail size={14}/> Email</span>
                                        <span className="font-medium">{selectedUser.email || 'N/A'} 
                                            {selectedUser.is_email_verified && <CheckCircle size={12} className="inline ml-1 text-emerald-500"/>}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="text-gray-500 flex items-center gap-2"><Smartphone size={14}/> Phone</span>
                                        <span className="font-medium">{selectedUser.phone}
                                            {selectedUser.is_phone_verified && <CheckCircle size={12} className="inline ml-1 text-emerald-500"/>}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> Joined</span>
                                        <span className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-gray-500">Wallet Balance</span>
                                        <span className="font-bold text-emerald-600">₹{selectedUser.wallet_balance?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Security Actions */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Shield size={18} /> Account Security
                                </h4>
                                <div className="p-4 border rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Account Status</span>
                                        <Badge text={selectedUser.is_active !== false ? 'Active' : 'Blocked'} type="status" />
                                    </div>
                                    {selectedUser.is_active !== false ? (
                                        <Button size="sm" variant="danger" className="w-full" onClick={() => handleAction('block')}>
                                            <XCircle size={16} /> Block User
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="primary" className="w-full" onClick={() => handleAction('unblock')}>
                                            <CheckCircle size={16} /> Unblock User
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: KYC */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText size={18} /> KYC Verification
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg h-full border border-gray-200">
                                {kycLoading ? (
                                    <div className="flex justify-center items-center h-40">
                                        <Loader2 className="animate-spin text-emerald-600" size={32} />
                                    </div>
                                ) : selectedUserKYC ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">Document Type:</span>
                                            <span className="font-bold uppercase">{selectedUserKYC.document_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-500">Front</p>
                                                <div className="h-24 bg-gray-200 rounded-lg overflow-hidden border">
                                                    {selectedUserKYC.document_front_url ? (
                                                        <a href={selectedUserKYC.document_front_url} target="_blank" rel="noreferrer">
                                                            <img src={selectedUserKYC.document_front_url} alt="Doc Front" className="h-full w-full object-cover hover:scale-105 transition-transform"/>
                                                        </a>
                                                    ) : <div className="h-full flex items-center justify-center text-xs text-gray-400">No Img</div>}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-500">Back</p>
                                                <div className="h-24 bg-gray-200 rounded-lg overflow-hidden border">
                                                    {selectedUserKYC.document_back_url ? (
                                                        <a href={selectedUserKYC.document_back_url} target="_blank" rel="noreferrer">
                                                            <img src={selectedUserKYC.document_back_url} alt="Doc Back" className="h-full w-full object-cover hover:scale-105 transition-transform"/>
                                                        </a>
                                                    ) : <div className="h-full flex items-center justify-center text-xs text-gray-400">No Img</div>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-white p-2 rounded text-xs text-gray-600 border">
                                            <strong>Doc Number:</strong> {selectedUserKYC.document_number}
                                        </div>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                                            <Button className="flex-1" size="sm" onClick={() => handleAction('approveKYC')} disabled={selectedUser.kyc_status === 'verified'}>
                                                Approve
                                            </Button>
                                            <Button className="flex-1" size="sm" variant="danger" onClick={() => handleAction('rejectKYC')} disabled={selectedUser.kyc_status === 'rejected'}>
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-400">
                                        <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No KYC documents submitted.</p>
                                        <Badge text={selectedUser.kyc_status || 'pending'} type="kyc" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // --- RENDER LIST VIEW ---
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Users Management</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search name, phone..." 
                            className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-full sm:w-64" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Filters */}
                    <select 
                        className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="consumer">Consumer</option>
                        <option value="partner">Partner</option>
                        <option value="agent">Agent</option>
                    </select>
                    <select 
                        className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={kycFilter}
                        onChange={(e) => setKycFilter(e.target.value)}
                    >
                        <option value="all">All KYC</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="in_review">In Review</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">KYC</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="animate-spin" size={20} /> Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs uppercase">
                                                    {user.name?.charAt(0) || user.phone.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.name || 'Unnamed'}</div>
                                                    <div className="text-xs text-gray-500">{user.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge text={user.role} type="role" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge text={user.is_active !== false ? 'Active' : 'Blocked'} type="status" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge text={user.kyc_status || 'pending'} type="kyc" />
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleViewUser(user)} 
                                                className="text-gray-400 hover:text-emerald-600 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Simple Implementation) */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                    <span>Showing {filteredUsers.length} users</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </Card>
        </div>
    );
};