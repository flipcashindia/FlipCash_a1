// // pages/partners/PartnerDetail.tsx
// // Original rich layout PRESERVED + Edit, Delete, Document Verify/Reject, Status Modals ADDED
// import React, { useEffect, useState, useCallback, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   ArrowLeft, Phone, Mail, MapPin, Briefcase, FileText, CheckCircle,
//   XCircle, User, Calendar, TrendingUp, Star, Building2, Shield,
//   AlertCircle, Ban, PlayCircle, Package, Clock, DollarSign, Users,
//   Activity, CreditCard, TrendingDown, RefreshCw, BarChart3, Wallet,
//   Pencil, Trash2, Save, X, Loader2, ShieldCheck, ShieldAlert, ExternalLink,
//   ChevronLeft, ChevronRight,
// } from 'lucide-react';
// import axios from 'axios';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface PartnerUser { id: string; phone: string; email: string | null; name: string; kyc_status: string; }
// interface Partner {
//   id: string; user: PartnerUser; business_name: string; business_type: string;
//   status: 'pending' | 'approved' | 'rejected' | 'suspended';
//   service_radius_km: number; price_range_min: number; price_range_max: number;
//   partner_score: number; completion_rate: number; average_rating: number;
//   total_leads_completed: number; is_available: boolean;
//   background_check_status: string; profile_completed: number;
//   profile_image_url: string | null; created_at: string; updated_at: string;
// }
// interface PartnerStats {
//   leads: { total: number; completed: number; cancelled: number; in_progress: number; revenue: number };
//   wallet: { balance: number; available_balance: number };
//   active_agents: number; partner_score: number; average_rating: number;
//   completion_rate: number; total_leads_completed: number;
// }
// interface ServiceArea { id: string; name: string; city: string; state: string; postal_codes: string[]; is_active: boolean; center_latitude: number; center_longitude: number; radius_km: number; priority: number; }
// interface BankAccount { id: string; account_holder_name: string; account_number_masked: string; ifsc_code: string; bank_name: string; branch_name: string; account_type: string; is_primary: boolean; is_verified: boolean; created_at: string; }
// interface Document { id: string; document_type: string; document_type_display: string; document_url: string | null; verification_status: string; verification_notes: string; verified_by: string | null; verified_at: string | null; created_at: string; updated_at: string; }
// interface Lead { id: string; lead_number: string; status: string; status_display: string; customer_name: string; customer_phone: string; device_name: string; storage: string; color: string; estimated_price: number; calculated_price: number | null; quoted_price: number | null; final_price: number | null; created_at: string; assigned_at: string | null; completed_at: string | null; pickup_date: string | null; pickup_time_slot: string; }
// interface Transaction { id: string; transaction_type: 'credit' | 'debit'; amount: number; balance_after: number; status: string; description: string; reference_type: string; reference_id: string; created_at: string; }
// interface Agent { id: string; name: string; phone: string; email: string | null; employee_code: string; status: string; verification_status: string; is_available: boolean; total_assignments: number; completed_assignments: number; completion_rate: number; average_rating: number; created_at: string; }
// interface ActivityLog { id: string; activity_type: string; description: string; agent_name: string; metadata: Record<string, any>; created_at: string; }
// interface Performance { period_days: number; date_from: string; date_to: string; leads: { total: number; completed: number; cancelled: number; in_progress: number; completion_rate: number }; revenue: { total: number; average_deal_value: number }; transactions: { total_credit: number; total_debit: number; transaction_count: number }; agents: { total_agents: number; active_agents: number; avg_agent_rating: number }; daily_breakdown: Array<{ date: string; leads: number; completed: number; revenue: number }>; }
// interface WalletSnap { balance: number; blocked_amount: number; available_balance: number; status: string; currency: string; }
// interface EditForm { business_name: string; service_radius_km: string; price_range_min: string; price_range_max: string; is_available: boolean; background_check_status: string; status: string; user_name: string; user_email: string; user_kyc_status: string; }

// type Tab = 'overview' | 'leads' | 'wallet' | 'agents' | 'activity' | 'performance';
// type StatusAction = 'approve' | 'reject' | 'suspend' | 'activate';
// type AlertType = 'success' | 'error' | 'warning';

// // ── API ───────────────────────────────────────────────────────────────────────
// const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
// api.interceptors.request.use((c) => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
// api.interceptors.response.use((r) => r, (e) => { if (e.response?.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/admin/login'; } return Promise.reject(e); });

// // ── Helpers ───────────────────────────────────────────────────────────────────
// const fmt   = (n = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
// const fmtD  = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// const fmtDT = (s: string) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
// const LEAD_CLR: Record<string, string> = { completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800', booked: 'bg-blue-100 text-blue-800', in_progress: 'bg-blue-100 text-blue-800', visit_scheduled: 'bg-purple-100 text-purple-800', partner_assigned: 'bg-purple-100 text-purple-800' };

// // ══════════════════════════════════════════════════════════════════════════════
// //  SHARED UI COMPONENTS  (preserved from original)
// // ══════════════════════════════════════════════════════════════════════════════

// const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
//   <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
//     {title && <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-lg font-semibold text-gray-900">{title}</h3></div>}
//     {children}
//   </div>
// );

// const Badge: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
//   const colors: Record<string, string> = {
//     pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800',
//     active: 'bg-blue-100 text-blue-800', verified: 'bg-green-100 text-green-800',
//     rejected: 'bg-red-100 text-red-800', suspended: 'bg-gray-100 text-gray-800',
//     completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800',
//     in_progress: 'bg-blue-100 text-blue-800', credit: 'bg-emerald-100 text-emerald-800',
//     debit: 'bg-red-100 text-red-800', booked: 'bg-blue-100 text-blue-800',
//     partner_assigned: 'bg-purple-100 text-purple-800', inactive: 'bg-gray-100 text-gray-600',
//   };
//   return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{children}</span>;
// };

// const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subtitle?: string; color?: string }> =
//   ({ icon, label, value, subtitle, color = 'blue' }) => {
//   const cls: Record<string, string> = { blue: 'bg-blue-100 text-blue-600', green: 'bg-emerald-100 text-emerald-600', yellow: 'bg-amber-100 text-amber-600', purple: 'bg-purple-100 text-purple-600', red: 'bg-red-100 text-red-600' };
//   return (
//     <div className="flex items-center gap-4">
//       <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${cls[color]}`}>{icon}</div>
//       <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value}</p>{subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}</div>
//     </div>
//   );
// };

// // ── Alert banner (preserved from original + auto-dismiss) ─────────────────────
// const AlertBanner: React.FC<{ type: AlertType; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
//   const cfg = {
//     success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', Icon: CheckCircle },
//     error:   { bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-200',     Icon: XCircle },
//     warning: { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   Icon: AlertCircle },
//   }[type];
//   return (
//     <div className={`${cfg.bg} ${cfg.text} border ${cfg.border} rounded-lg p-4 flex items-center justify-between mb-6`}>
//       <div className="flex items-center gap-3"><cfg.Icon size={20} /><span className="font-medium">{message}</span></div>
//       <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XCircle size={18} /></button>
//     </div>
//   );
// };

// const Loader: React.FC = () => (
//   <div className="flex items-center justify-center min-h-screen">
//     <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" /><p className="mt-4 text-gray-600">Loading…</p></div>
//   </div>
// );

// const TabLoader: React.FC = () => (
//   <div className="flex items-center justify-center py-12">
//     <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /><p className="mt-2 text-sm text-gray-600">Loading data…</p></div>
//   </div>
// );

// const Pager: React.FC<{ page: number; total: number; pages: number; size: number; onChange: (p: number) => void }> = ({ page, total, pages, size, onChange }) => (
//   <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
//     <p className="text-sm text-gray-600">{(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}</p>
//     <div className="flex items-center gap-2">
//       <button onClick={() => onChange(page - 1)} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white"><ChevronLeft size={14} />Prev</button>
//       <span className="text-sm text-gray-600">{page}/{pages}</span>
//       <button onClick={() => onChange(page + 1)} disabled={page >= pages} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white">Next<ChevronRight size={14} /></button>
//     </div>
//   </div>
// );

// // ══════════════════════════════════════════════════════════════════════════════
// //  NEW: Status action modal (replaces browser prompt/confirm)
// // ══════════════════════════════════════════════════════════════════════════════
// const StatusModal: React.FC<{ action: StatusAction | null; name: string; onClose: () => void; onConfirm: (r?: string) => Promise<void> }> =
//   ({ action, name, onClose, onConfirm }) => {
//   const [reason, setReason] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);
//   useEffect(() => { setReason(''); setErr(null); }, [action]);
//   if (!action) return null;
//   const needsReason = action === 'reject' || action === 'suspend';
//   const cfg = {
//     approve:  { title: 'Approve Partner',   btn: 'Approve',    cls: 'bg-emerald-600 hover:bg-emerald-700', head: 'bg-emerald-50 border-emerald-100', Icon: CheckCircle, iconCls: 'text-emerald-600' },
//     reject:   { title: 'Reject Partner',    btn: 'Reject',     cls: 'bg-red-600 hover:bg-red-700',         head: 'bg-red-50 border-red-100',         Icon: XCircle,     iconCls: 'text-red-600' },
//     suspend:  { title: 'Suspend Partner',   btn: 'Suspend',    cls: 'bg-orange-600 hover:bg-orange-700',   head: 'bg-orange-50 border-orange-100',   Icon: Ban,         iconCls: 'text-orange-600' },
//     activate: { title: 'Reactivate Partner', btn: 'Reactivate', cls: 'bg-blue-600 hover:bg-blue-700',      head: 'bg-blue-50 border-blue-100',       Icon: PlayCircle,  iconCls: 'text-blue-600' },
//   }[action];
//   const run = async () => {
//     if (needsReason && !reason.trim()) { setErr('Reason is required.'); return; }
//     setLoading(true); setErr(null);
//     try { await onConfirm(needsReason ? reason : undefined); onClose(); }
//     catch (e: any) { setErr(e.response?.data?.error || e.response?.data?.detail || 'Action failed.'); setLoading(false); }
//   };
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
//       <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
//         <div className={`px-6 py-5 border-b ${cfg.head} flex items-center gap-3`}>
//           <div className={`w-10 h-10 rounded-full ${cfg.head} flex items-center justify-center`}><cfg.Icon size={20} className={cfg.iconCls} /></div>
//           <div><h3 className="font-bold text-gray-900 text-lg">{cfg.title}</h3><p className="text-sm text-gray-600">{name}</p></div>
//         </div>
//         <div className="px-6 py-5">
//           {needsReason
//             ? <><p className="text-sm text-gray-600 mb-2">Reason (required):</p><textarea value={reason} onChange={e => { setReason(e.target.value); setErr(null); }} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-500" /></>
//             : <p className="text-sm text-gray-600">{action === 'approve' ? 'This will grant full platform access to this partner.' : 'This will restore access to this partner.'}</p>}
//           {err && <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={13} />{err}</p>}
//         </div>
//         <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
//           <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancel</button>
//           <button onClick={run} disabled={loading || (needsReason && !reason.trim())} className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${cfg.cls}`}>
//             {loading && <Loader2 size={13} className="animate-spin" />}{cfg.btn}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ══════════════════════════════════════════════════════════════════════════════
// //  NEW: Delete confirm modal
// // ══════════════════════════════════════════════════════════════════════════════
// const DeleteModal: React.FC<{ open: boolean; name: string; onClose: () => void; onConfirm: () => Promise<void> }> =
//   ({ open, name, onClose, onConfirm }) => {
//   const [typed, setTyped] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);
//   useEffect(() => { setTyped(''); setErr(null); }, [open]);
//   if (!open) return null;
//   const confirmed = typed.trim().toLowerCase() === 'delete';
//   const run = async () => {
//     setLoading(true); setErr(null);
//     try { await onConfirm(); }
//     catch (e: any) { setErr(e.response?.data?.detail || 'Delete failed.'); setLoading(false); }
//   };
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
//       <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
//         <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-center gap-3">
//           <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div>
//           <div><h3 className="font-bold text-gray-900">Delete Partner</h3><p className="text-sm text-gray-600">{name}</p></div>
//         </div>
//         <div className="px-6 py-5 space-y-4">
//           <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800"><p className="font-semibold mb-1">⚠ Irreversible action</p><p>Permanently deletes the partner account, all documents, service areas, bank accounts and the owner user account.</p></div>
//           <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Type <span className="font-mono text-red-600">delete</span> to confirm</label><input value={typed} onChange={e => setTyped(e.target.value)} placeholder="delete" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400" /></div>
//           {err && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{err}</p>}
//         </div>
//         <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
//           <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
//           <button onClick={run} disabled={loading || !confirmed} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
//             {loading && <Loader2 size={13} className="animate-spin" />}<Trash2 size={13} />Delete Permanently
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ══════════════════════════════════════════════════════════════════════════════
// //  NEW: Inline edit form (Overview tab)
// // ══════════════════════════════════════════════════════════════════════════════
// const EditPartnerForm: React.FC<{ partner: Partner; onSave: (p: Partner) => void; onCancel: () => void }> =
//   ({ partner, onCancel, onSave }) => {
//   const [form, setForm] = useState<EditForm>({
//     business_name: partner.business_name,
//     service_radius_km: String(partner.service_radius_km),
//     price_range_min: String(partner.price_range_min),
//     price_range_max: String(partner.price_range_max),
//     is_available: partner.is_available,
//     background_check_status: partner.background_check_status,
//     status: partner.status,
//     user_name: partner.user.name,
//     user_email: partner.user.email || '',
//     user_kyc_status: partner.user.kyc_status,
//   });
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500';
//   const sel = `${inp} bg-white`;

//   const handleSave = async () => {
//     setLoading(true); setErr(null);
//     try {
//       const { data } = await api.patch(`/admin/partners/${partner.id}/`, {
//         business_name: form.business_name,
//         service_radius_km: Number(form.service_radius_km),
//         price_range_min: Number(form.price_range_min),
//         price_range_max: Number(form.price_range_max),
//         is_available: form.is_available,
//         background_check_status: form.background_check_status,
//         status: form.status,
//         user: { name: form.user_name, email: form.user_email || null, kyc_status: form.user_kyc_status },
//       });
//       onSave(data.partner);
//     } catch (e: any) { setErr(e.response?.data?.detail || e.response?.data?.error || 'Save failed.'); }
//     finally { setLoading(false); }
//   };

//   const set = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
//     setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

//   return (
//     <Card>
//       <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50 flex items-center justify-between">
//         <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Pencil size={17} className="text-emerald-600" />Edit Partner</h3>
//         <div className="flex gap-2">
//           <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"><X size={14} />Cancel</button>
//           <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
//             {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{loading ? 'Saving…' : 'Save Changes'}
//           </button>
//         </div>
//       </div>
//       <div className="p-6 space-y-5">
//         {err && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle size={14} />{err}</div>}

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//           <div className="space-y-4">
//             <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Owner Account</p>
//             <div><label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label><input value={form.user_name} onChange={set('user_name')} className={inp} /></div>
//             <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email</label><input value={form.user_email} onChange={set('user_email')} type="email" className={inp} /></div>
//             <div><label className="block text-xs font-semibold text-gray-700 mb-1">KYC Status</label>
//               <select value={form.user_kyc_status} onChange={set('user_kyc_status')} className={sel}>
//                 {['pending', 'in_review', 'verified', 'rejected'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
//               </select>
//             </div>
//           </div>
//           <div className="space-y-4">
//             <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Business</p>
//             <div><label className="block text-xs font-semibold text-gray-700 mb-1">Business Name</label><input value={form.business_name} onChange={set('business_name')} className={inp} /></div>
//             <div><label className="block text-xs font-semibold text-gray-700 mb-1">Service Radius (km)</label><input value={form.service_radius_km} onChange={set('service_radius_km')} type="number" className={inp} /></div>
//             <div><label className="block text-xs font-semibold text-gray-700 mb-1">Price Range (₹)</label>
//               <div className="flex items-center gap-2"><input value={form.price_range_min} onChange={set('price_range_min')} type="number" placeholder="Min" className={inp} /><span className="text-gray-400">–</span><input value={form.price_range_max} onChange={set('price_range_max')} type="number" placeholder="Max" className={inp} /></div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-gray-100">
//           <div><label className="block text-xs font-semibold text-gray-700 mb-1">Partner Status</label>
//             <select value={form.status} onChange={set('status')} className={sel}>{['pending','approved','rejected','suspended'].map(s=><option key={s} value={s}>{s}</option>)}</select>
//           </div>
//           <div><label className="block text-xs font-semibold text-gray-700 mb-1">Background Check</label>
//             <select value={form.background_check_status} onChange={set('background_check_status')} className={sel}>{['pending','verified','rejected'].map(s=><option key={s} value={s}>{s}</option>)}</select>
//           </div>
//           <div><label className="block text-xs font-semibold text-gray-700 mb-1">Available for Leads</label>
//             <label className="flex items-center gap-2 mt-2 cursor-pointer">
//               <input type="checkbox" checked={form.is_available} onChange={set('is_available')} className="w-4 h-4 accent-emerald-600" />
//               <span className="text-sm text-gray-700">{form.is_available ? 'Yes — accepting leads' : 'No — unavailable'}</span>
//             </label>
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// };

// // ══════════════════════════════════════════════════════════════════════════════
// //  NEW: Document card with inline preview + verify / reject
// // ══════════════════════════════════════════════════════════════════════════════

// /** Guess whether a URL points to an image we can render inline. */
// const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp|tiff?)(\?.*)?$/i.test(url);

// const DocCard: React.FC<{ doc: Document; partnerId: string; onUpdated: (d: Document) => void }> =
//   ({ doc, partnerId, onUpdated }) => {
//   const [action, setAction]     = useState<'verify' | 'reject' | null>(null);
//   const [notes, setNotes]       = useState('');
//   const [loading, setLoading]   = useState(false);
//   const [err, setErr]           = useState<string | null>(null);
//   const [imgError, setImgError] = useState(false);
//   const [expanded, setExpanded] = useState(false);

//   const submit = async () => {
//     if (action === 'reject' && !notes.trim()) { setErr('Notes required for rejection.'); return; }
//     setLoading(true); setErr(null);
//     try {
//       const ep = action === 'verify' ? 'verify_document' : 'reject_document';
//       const { data } = await api.post(`/admin/partners/${partnerId}/${ep}/`, { document_id: doc.id, notes });
//       onUpdated({ ...doc, ...data.document });
//       setAction(null); setNotes('');
//     } catch (e: any) { setErr(e.response?.data?.error || 'Action failed.'); }
//     finally { setLoading(false); }
//   };

//   const st = doc.verification_status;
//   const borderCls = st === 'verified'
//     ? 'border-emerald-200'
//     : st === 'rejected'
//     ? 'border-red-200'
//     : 'border-amber-200';
//   const headerCls = st === 'verified'
//     ? 'bg-emerald-50'
//     : st === 'rejected'
//     ? 'bg-red-50'
//     : 'bg-amber-50';
//   const StatusIcon = st === 'verified' ? ShieldCheck : st === 'rejected' ? ShieldAlert : Shield;
//   const iconCls = st === 'verified' ? 'text-emerald-600' : st === 'rejected' ? 'text-red-600' : 'text-amber-500';

//   const showPreview = !!doc.document_url && !imgError && isImageUrl(doc.document_url);
//   const showFileLink = !!doc.document_url;

//   return (
//     <div className={`rounded-xl border ${borderCls} overflow-hidden bg-white shadow-sm`}>
//       {/* ── Header row ── */}
//       <div className={`flex items-start justify-between gap-3 px-4 py-3 ${headerCls}`}>
//         <div className="flex items-center gap-2 flex-1 min-w-0">
//           <StatusIcon size={16} className={`flex-shrink-0 ${iconCls}`} />
//           <div className="min-w-0">
//             <p className="font-semibold text-gray-900 capitalize text-sm">
//               {(doc.document_type_display || doc.document_type).replace(/_/g, ' ')}
//             </p>
//             <p className="text-xs text-gray-500 mt-0.5">Uploaded {fmtD(doc.created_at)}</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 flex-shrink-0">
//           <Badge status={st}>{st}</Badge>
//           {/* Always show Open button when URL exists, regardless of image/PDF */}
//           {showFileLink && (
//             <a
//               href={doc.document_url!}
//               target="_blank"
//               rel="noreferrer"
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               <ExternalLink size={12} /> Open File
//             </a>
//           )}
//         </div>
//       </div>

//       {/* ── Document preview ── */}
//       {doc.document_url ? (
//         <div className="border-t border-gray-100">
//           {showPreview ? (
//             /* Image preview with expand toggle */
//             <div className="relative bg-gray-100">
//               <img
//                 src={doc.document_url}
//                 alt={doc.document_type_display || doc.document_type}
//                 onError={() => setImgError(true)}
//                 className={`w-full object-contain transition-all duration-200 ${expanded ? 'max-h-[600px]' : 'max-h-52'}`}
//               />
//               <button
//                 onClick={() => setExpanded(e => !e)}
//                 className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 text-white text-xs rounded-lg hover:bg-black/80 transition-colors"
//               >
//                 {expanded ? 'Collapse' : 'Expand'}
//               </button>
//             </div>
//           ) : imgError || !isImageUrl(doc.document_url) ? (
//             /* Non-image file (PDF, doc, etc.) — show a prominent open panel */
//             <div className="flex flex-col items-center justify-center py-8 gap-3 bg-gray-50">
//               <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
//                 <FileText size={28} className="text-blue-600" />
//               </div>
//               <div className="text-center">
//                 <p className="text-sm font-medium text-gray-700">Document attached</p>
//                 <p className="text-xs text-gray-500 mt-0.5">Click below to open in a new tab</p>
//               </div>
//               <a
//                 href={doc.document_url}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow"
//               >
//                 <ExternalLink size={15} /> Open Document
//               </a>
//             </div>
//           ) : null}
//         </div>
//       ) : (
//         /* No file uploaded at all */
//         <div className="flex flex-col items-center justify-center py-8 gap-2 bg-gray-50 border-t border-gray-100">
//           <FileText size={28} className="text-gray-300" />
//           <p className="text-sm text-gray-500">No file uploaded</p>
//           <p className="text-xs text-gray-400">Partner hasn't submitted this document yet</p>
//         </div>
//       )}

//       {/* ── Meta + verification notes ── */}
//       <div className="px-4 py-3 border-t border-gray-100 space-y-1">
//         {doc.verified_at && (
//           <p className="text-xs text-gray-500">
//             {st === 'verified' ? '✓ Verified' : '✗ Reviewed'}: {fmtDT(doc.verified_at)}
//           </p>
//         )}
//         {doc.verification_notes && (
//           <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-1">
//             📝 {doc.verification_notes}
//           </p>
//         )}
//       </div>

//       {/* ── Inline verify / reject actions ── */}
//       <div className="px-4 pb-4 border-t border-gray-100 pt-3">
//         {action === null ? (
//           <div className="flex items-center gap-2">
//             {st !== 'verified' && (
//               <button onClick={() => setAction('verify')}
//                 className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
//                 <ShieldCheck size={14} /> Verify
//               </button>
//             )}
//             {st !== 'rejected' && (
//               <button onClick={() => setAction('reject')}
//                 className="flex items-center gap-1.5 px-4 py-2 border border-red-300 bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors">
//                 <ShieldAlert size={14} /> Reject
//               </button>
//             )}
//             {st === 'verified' && (
//               <p className="text-xs text-emerald-700 flex items-center gap-1">
//                 <ShieldCheck size={13} /> Verified — you can still reject if needed
//               </p>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-2">
//             {action === 'verify' ? (
//               <>
//                 <p className="text-xs font-semibold text-emerald-700">Confirm verification:</p>
//                 <input value={notes} onChange={e => setNotes(e.target.value)}
//                   placeholder="Optional notes…"
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
//               </>
//             ) : (
//               <>
//                 <p className="text-xs font-semibold text-red-700">Rejection reason (required):</p>
//                 <textarea value={notes} onChange={e => { setNotes(e.target.value); setErr(null); }}
//                   rows={2} placeholder="Why is this document rejected?"
//                   className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-400 bg-white" />
//               </>
//             )}
//             {err && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{err}</p>}
//             <div className="flex gap-2">
//               <button onClick={submit} disabled={loading || (action === 'reject' && !notes.trim())}
//                 className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${action === 'verify' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
//                 {loading && <Loader2 size={13} className="animate-spin" />}
//                 {action === 'verify' ? 'Confirm Verify' : 'Confirm Reject'}
//               </button>
//               <button onClick={() => { setAction(null); setNotes(''); setErr(null); }}
//                 className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ══════════════════════════════════════════════════════════════════════════════
// //  MAIN COMPONENT
// // ══════════════════════════════════════════════════════════════════════════════
// const PartnerDetail: React.FC = () => {
//   const { id }   = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   // ── Core state ───────────────────────────────────────────────────────────
//   const [partner, setPartner]         = useState<Partner | null>(null);
//   const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
//   const [walletSnap, setWalletSnap]   = useState<WalletSnap | null>(null);
//   const [loading, setLoading]         = useState(true);
//   const [error, setError]             = useState<string | null>(null);
//   const [alert, setAlert]             = useState<{ type: AlertType; message: string } | null>(null);
//   const [editing, setEditing]         = useState(false);
//   const [deleteOpen, setDeleteOpen]   = useState(false);
//   const [actionModal, setActionModal] = useState<StatusAction | null>(null);

//   // ── Tab state ───────────────────────────────────────────────────────────
//   const [activeTab, setActiveTab]     = useState<Tab>('overview');
//   const [loadingTab, setLoadingTab]   = useState(false);
//   const loadedTabs = useRef<Set<Tab>>(new Set());

//   // ── Overview data ───────────────────────────────────────────────────────
//   const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
//   const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
//   const [documents, setDocuments]       = useState<Document[]>([]);

//   // ── Leads ───────────────────────────────────────────────────────────────
//   const [leads, setLeads]           = useState<Lead[]>([]);
//   const [leadsCount, setLeadsCount] = useState(0);
//   const [leadPage, setLeadPage]     = useState(1);
//   const [leadPages, setLeadPages]   = useState(1);
//   const [leadFilters, setLeadFilters] = useState({ status: 'all', search: '' });

//   // ── Wallet / Transactions ───────────────────────────────────────────────
//   const [transactions, setTransactions]       = useState<Transaction[]>([]);
//   const [transactionsCount, setTxnCount]      = useState(0);
//   const [txnPage, setTxnPage]                 = useState(1);
//   const [txnPages, setTxnPages]               = useState(1);
//   const [txnFilters, setTxnFilters]           = useState({ type: 'all' });

//   // ── Agents / Activity / Performance ────────────────────────────────────
//   const [agents, setAgents]             = useState<Agent[]>([]);
//   const [activities, setActivities]     = useState<ActivityLog[]>([]);
//   const [actCount, setActCount]         = useState(0);
//   const [actPage, setActPage]           = useState(1);
//   const [actPages, setActPages]         = useState(1);
//   const [performance, setPerformance]   = useState<Performance | null>(null);
//   const [performanceDays, setPerfDays]  = useState(30);

//   // ── Helpers ──────────────────────────────────────────────────────────────
//   const showAlert = useCallback((type: AlertType, message: string) => {
//     setAlert({ type, message });
//     setTimeout(() => setAlert(null), 5000);
//   }, []);

//   // ── Load partner + stats ─────────────────────────────────────────────────
//   const loadPartner = useCallback(async () => {
//     if (!id) return;
//     setLoading(true); setError(null);
//     try {
//       const [pRes, sRes] = await Promise.all([
//         api.get<Partner>(`/admin/partners/${id}/`),
//         api.get<PartnerStats>(`/admin/partners/${id}/partner_stats/`),
//       ]);
//       setPartner(pRes.data);
//       setPartnerStats(sRes.data);
//       setWalletSnap({ balance: sRes.data.wallet.balance, blocked_amount: 0, available_balance: sRes.data.wallet.available_balance, status: 'active', currency: 'INR' });
//     } catch (e: any) { setError(e.response?.data?.detail || 'Failed to load partner.'); }
//     finally { setLoading(false); }
//   }, [id]);

//   useEffect(() => { loadPartner(); }, [loadPartner]);

//   // ── Overview sub-resources ────────────────────────────────────────────────
//   const loadOverview = useCallback(async () => {
//     if (!id || loadedTabs.current.has('overview')) return;
//     setLoadingTab(true);
//     try {
//       const [sa, ba, dc] = await Promise.all([
//         api.get<{ results: ServiceArea[] }>(`/admin/partners/${id}/service_areas/`),
//         api.get<{ results: BankAccount[] }>(`/admin/partners/${id}/bank_accounts/`),
//         api.get<{ results: Document[] }>(`/admin/partners/${id}/documents/`),
//       ]);
//       setServiceAreas(sa.data.results);
//       setBankAccounts(ba.data.results);
//       setDocuments(dc.data.results);
//       loadedTabs.current.add('overview');
//     } catch { } finally { setLoadingTab(false); }
//   }, [id]);

//   // ── Leads ─────────────────────────────────────────────────────────────────
//   const loadLeads = useCallback(async (page = 1) => {
//     if (!id) return;
//     setLoadingTab(true);
//     try {
//       const params: any = { page, page_size: 20 };
//       if (leadFilters.status !== 'all') params.status = leadFilters.status;
//       if (leadFilters.search) params.search = leadFilters.search;
//       const { data } = await api.get(`/admin/partners/${id}/leads/`, { params });
//       setLeads(data.results || []); setLeadsCount(data.count);
//       setLeadPage(data.page); setLeadPages(data.total_pages);
//     } catch { } finally { setLoadingTab(false); }
//   }, [id, leadFilters]);

//   // ── Transactions ──────────────────────────────────────────────────────────
//   const loadTransactions = useCallback(async (page = 1) => {
//     if (!id) return;
//     setLoadingTab(true);
//     try {
//       const params: any = { page, page_size: 20 };
//       if (txnFilters.type !== 'all') params.transaction_type = txnFilters.type;
//       const { data } = await api.get(`/admin/partners/${id}/transactions/`, { params });
//       setTransactions(data.results || []); setTxnCount(data.count);
//       setTxnPage(data.page); setTxnPages(data.total_pages);
//       // Fetch full wallet details on first load
//       if (!loadedTabs.current.has('wallet')) {
//         const wd = await api.get(`/admin/partners/${id}/wallet/`);
//         setWalletSnap(wd.data.wallet);
//         loadedTabs.current.add('wallet');
//       }
//     } catch { } finally { setLoadingTab(false); }
//   }, [id, txnFilters]);

//   // ── Agents ────────────────────────────────────────────────────────────────
//   const loadAgents = useCallback(async () => {
//     if (!id || loadedTabs.current.has('agents')) return;
//     setLoadingTab(true);
//     try {
//       const { data } = await api.get<{ results: Agent[] }>(`/admin/partners/${id}/agents/`);
//       setAgents(data.results); loadedTabs.current.add('agents');
//     } catch { } finally { setLoadingTab(false); }
//   }, [id]);

//   // ── Activity ──────────────────────────────────────────────────────────────
//   const loadActivity = useCallback(async (page = 1) => {
//     if (!id) return;
//     setLoadingTab(true);
//     try {
//       const { data } = await api.get(`/admin/partners/${id}/activity/`, { params: { page, page_size: 30 } });
//       setActivities(data.results || []); setActCount(data.count);
//       setActPage(data.page); setActPages(data.total_pages);
//     } catch { } finally { setLoadingTab(false); }
//   }, [id]);

//   // ── Performance ───────────────────────────────────────────────────────────
//   const loadPerformance = useCallback(async (days = performanceDays) => {
//     if (!id) return;
//     setLoadingTab(true);
//     try {
//       const { data } = await api.get<Performance>(`/admin/partners/${id}/performance/`, { params: { days } });
//       setPerformance(data);
//     } catch { } finally { setLoadingTab(false); }
//   }, [id, performanceDays]);

//   // ── Tab switch dispatcher ─────────────────────────────────────────────────
//   useEffect(() => {
//     switch (activeTab) {
//       case 'overview':    loadOverview();    break;
//       case 'leads':       loadLeads(1);      break;
//       case 'wallet':      loadTransactions(1); break;
//       case 'agents':      loadAgents();      break;
//       case 'activity':    loadActivity(1);   break;
//       case 'performance': loadPerformance(); break;
//     }
//   }, [activeTab]); // eslint-disable-line

//   useEffect(() => { if (activeTab === 'leads')       loadLeads(1); },       [leadFilters]); // eslint-disable-line
//   useEffect(() => { if (activeTab === 'wallet')      loadTransactions(1); }, [txnFilters]);  // eslint-disable-line
//   useEffect(() => { if (activeTab === 'performance') { loadedTabs.current.delete('performance'); loadPerformance(performanceDays); } }, [performanceDays]); // eslint-disable-line

//   // ── Status actions ────────────────────────────────────────────────────────
//   const handleStatusAction = async (reason?: string) => {
//     if (!id || !actionModal) throw new Error('No action');
//     const ep: Record<StatusAction, string> = {
//       approve:  `/admin/partners/${id}/approve/`,
//       reject:   `/admin/partners/${id}/reject/`,
//       suspend:  `/admin/partners/${id}/suspend/`,
//       activate: `/admin/partners/${id}/activate/`,
//     };
//     await api.post(ep[actionModal], reason ? { reason } : {});
//     showAlert('success', `Partner ${actionModal}d successfully.`);
//     loadPartner();
//   };

//   const handleDelete = async () => {
//     await api.delete(`/admin/partners/${id}/`);
//     navigate('/partners');
//   };

//   // ── Guard renders ─────────────────────────────────────────────────────────
//   if (loading) return <Loader />;
//   if (error || !partner) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center"><AlertCircle size={48} className="text-red-500 mx-auto mb-4" /><p className="text-red-600 mb-4">{error || 'Partner not found'}</p><button onClick={() => navigate('/partners')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Back to Partners</button></div>
//       </div>
//     );
//   }

//   // ── Computed values ───────────────────────────────────────────────────────
//   const stats = partnerStats ? {
//     total_leads:      partnerStats.leads.total,
//     completed_leads:  partnerStats.leads.completed,
//     cancelled_leads:  partnerStats.leads.cancelled,
//     in_progress_leads: partnerStats.leads.in_progress,
//     revenue_generated: partnerStats.leads.revenue,
//     active_agents:    partnerStats.active_agents,
//   } : { total_leads: 0, completed_leads: 0, cancelled_leads: 0, in_progress_leads: 0, revenue_generated: 0, active_agents: 0 };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <StatusModal action={actionModal} name={partner.business_name} onClose={() => setActionModal(null)} onConfirm={handleStatusAction} />
//       <DeleteModal open={deleteOpen} name={partner.business_name} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} />

//       <div className="max-w-7xl mx-auto space-y-6">
//         {/* Alert banner */}
//         {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

//         {/* ── Header ── */}
//         <div className="flex items-center justify-between flex-wrap gap-4">
//           <div className="flex items-center gap-4">
//             <button onClick={() => navigate('/partners')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft size={24} /></button>
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">{partner.business_name}</h1>
//               <p className="text-sm text-gray-500 mt-1">Partner ID: {partner.id.slice(0, 8)}… • Joined {fmtD(partner.created_at)}</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2 flex-wrap">
//             <Badge status={partner.status}>{partner.status}</Badge>
//             {partner.user.kyc_status === 'verified' && <Badge status="verified">KYC Verified</Badge>}
//             {partner.is_available && <Badge status="active">Available</Badge>}
//             <button onClick={loadPartner} className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors ml-2"><RefreshCw size={15} /></button>
//             {/* NEW: Edit + Delete buttons */}
//             {activeTab === 'overview' && !editing && (
//               <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><Pencil size={14} />Edit</button>
//             )}
//             <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"><Trash2 size={14} />Delete</button>
//           </div>
//         </div>

//         {/* ── Stats Overview (preserved from original) ── */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//           <Card><div className="p-6"><StatCard icon={<Package size={24} />} label="Total Leads" value={stats.total_leads} subtitle={`${stats.completed_leads} completed`} color="blue" /></div></Card>
//           <Card><div className="p-6"><StatCard icon={<TrendingUp size={24} />} label="Success Rate" value={`${(Number(partner.completion_rate) || 0).toFixed(1)}%`} subtitle={`${stats.in_progress_leads} in progress`} color="green" /></div></Card>
//           <Card><div className="p-6"><StatCard icon={<Star size={24} />} label="Average Rating" value={(Number(partner.average_rating) || 0).toFixed(1)} subtitle="From customers" color="yellow" /></div></Card>
//           <Card><div className="p-6"><StatCard icon={<Wallet size={24} />} label="Wallet Balance" value={fmt(walletSnap?.balance ?? 0)} subtitle={`${fmt(walletSnap?.available_balance ?? 0)} available`} color="purple" /></div></Card>
//         </div>

//         {/* ── Tabs (preserved from original) ── */}
//         <div className="border-b border-gray-200">
//           <div className="flex gap-8 overflow-x-auto">
//             {(['overview', 'leads', 'wallet', 'agents', 'activity', 'performance'] as Tab[]).map(tab => (
//               <button key={tab} onClick={() => { setActiveTab(tab); setEditing(false); }}
//                 className={`pb-4 border-b-2 transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'border-emerald-600 text-emerald-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
//                 {tab}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* ════════════════════════════════════════════════════════════════════
//             OVERVIEW TAB — two-column layout PRESERVED from original
//             NEW: edit form replaces left column when editing=true
//         ════════════════════════════════════════════════════════════════════ */}
//         {activeTab === 'overview' && (
//           <>
//             {editing ? (
//               <EditPartnerForm partner={partner} onSave={(p) => { setPartner(p); setEditing(false); showAlert('success', 'Partner updated successfully.'); }} onCancel={() => setEditing(false)} />
//             ) : (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* ── LEFT COLUMN ── */}
//                 <div className="lg:col-span-2 space-y-6">
//                   {loadingTab && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>}

//                   {/* Business Information */}
//                   <Card title="Business Information">
//                     <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div className="flex items-start gap-3"><Briefcase className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Business Type</p><p className="font-semibold capitalize text-gray-900">{partner.business_type || '—'}</p></div></div>
//                       <div className="flex items-start gap-3"><Building2 className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Business Name</p><p className="font-semibold text-gray-900">{partner.business_name}</p></div></div>
//                       <div className="flex items-start gap-3"><Shield className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Background Check</p><Badge status={partner.background_check_status}>{partner.background_check_status}</Badge></div></div>
//                       <div className="flex items-start gap-3"><DollarSign className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Partner Score</p><p className="font-semibold text-gray-900">{(Number(partner.partner_score) || 0).toFixed(1)}/100</p></div></div>
//                     </div>
//                   </Card>

//                   {/* Contact Information */}
//                   <Card title="Contact Information">
//                     <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div className="flex items-start gap-3"><User className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Owner Name</p><p className="font-semibold text-gray-900">{partner.user.name || 'Not provided'}</p></div></div>
//                       <div className="flex items-start gap-3"><Phone className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Phone Number</p><p className="font-semibold text-gray-900">{partner.user.phone}</p></div></div>
//                       {partner.user.email && <div className="flex items-start gap-3"><Mail className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Email Address</p><p className="font-semibold text-gray-900">{partner.user.email}</p></div></div>}
//                       <div className="flex items-start gap-3"><Shield className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">KYC Status</p><Badge status={partner.user.kyc_status}>{partner.user.kyc_status}</Badge></div></div>
//                     </div>
//                   </Card>

//                   {/* Service Areas */}
//                   <Card title={`Service Areas (${serviceAreas.length})`}>
//                     <div className="p-6">
//                       {serviceAreas.length === 0 ? <div className="text-center py-8"><MapPin size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No service areas configured</p></div>
//                         : <div className="space-y-4">{serviceAreas.map(area => (
//                           <div key={area.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                             <MapPin className="w-5 h-5 text-gray-400 mt-1" />
//                             <div className="flex-1">
//                               <div className="flex items-center justify-between"><p className="font-semibold text-gray-900">{area.name || `${area.city}, ${area.state}`}</p><Badge status={area.is_active ? 'active' : 'suspended'}>{area.is_active ? 'Active' : 'Inactive'}</Badge></div>
//                               <p className="text-sm text-gray-600 mt-1">Radius: {area.radius_km}km • {area.city}, {area.state}</p>
//                               {area.postal_codes.length > 0 && <p className="text-sm text-gray-500 mt-1">Pincodes: {area.postal_codes.slice(0, 5).join(', ')}{area.postal_codes.length > 5 ? ` +${area.postal_codes.length - 5} more` : ''}</p>}
//                             </div>
//                           </div>
//                         ))}</div>}
//                     </div>
//                   </Card>

//                   {/* Bank Accounts */}
//                   <Card title={`Bank Accounts (${bankAccounts.length})`}>
//                     <div className="p-6">
//                       {bankAccounts.length === 0 ? <div className="text-center py-8"><CreditCard size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No bank accounts added</p></div>
//                         : <div className="space-y-4">{bankAccounts.map(acc => (
//                           <div key={acc.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
//                             <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
//                             <div className="flex-1">
//                               <div className="flex items-center justify-between"><p className="font-semibold text-gray-900">{acc.bank_name}</p><div className="flex gap-2">{acc.is_primary && <Badge status="active">Primary</Badge>}{acc.is_verified && <Badge status="verified">Verified</Badge>}</div></div>
//                               <p className="text-sm text-gray-600 mt-1">{acc.account_holder_name}</p>
//                               <p className="text-sm text-gray-600">Account: {acc.account_number_masked} • IFSC: {acc.ifsc_code}</p>
//                               {acc.branch_name && <p className="text-sm text-gray-500">Branch: {acc.branch_name}</p>}
//                             </div>
//                           </div>
//                         ))}</div>}
//                     </div>
//                   </Card>

//                   {/* Documents — NOW with inline Verify / Reject */}
//                   <Card title={`Documents (${documents.length})`}>
//                     <div className="p-6">
//                       {documents.length === 0
//                         ? <div className="text-center py-8"><FileText size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No documents uploaded</p></div>
//                         : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                           {documents.map(doc => (
//                             <DocCard key={doc.id} doc={doc} partnerId={id!}
//                               onUpdated={updated => setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))} />
//                           ))}
//                         </div>}
//                     </div>
//                   </Card>
//                 </div>

//                 {/* ── RIGHT SIDEBAR (preserved exactly from original + status modal trigger) ── */}
//                 <div className="space-y-6">
//                   {/* Account Status */}
//                   <Card title="Account Status">
//                     <div className="p-6 space-y-4">
//                       <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Partner Status</span><Badge status={partner.status}>{partner.status}</Badge></div>
//                       <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Availability</span><Badge status={partner.is_available ? 'active' : 'suspended'}>{partner.is_available ? 'Available' : 'Unavailable'}</Badge></div>
//                       <div className="flex items-center justify-between"><span className="text-sm text-gray-600">KYC Status</span><Badge status={partner.user.kyc_status}>{partner.user.kyc_status}</Badge></div>
//                       <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Background Check</span><Badge status={partner.background_check_status}>{partner.background_check_status}</Badge></div>
//                     </div>
//                   </Card>

//                   {/* Profile Completion */}
//                   <Card title="Profile Completion">
//                     <div className="p-6">
//                       <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">Completion</span><span className="text-sm font-semibold text-gray-900">{partner.profile_completed}%</span></div>
//                       <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full transition-all ${partner.profile_completed >= 80 ? 'bg-emerald-600' : partner.profile_completed >= 50 ? 'bg-amber-600' : 'bg-red-600'}`} style={{ width: `${partner.profile_completed}%` }} /></div>
//                     </div>
//                   </Card>

//                   {/* Service Details */}
//                   <Card title="Service Details">
//                     <div className="p-6 space-y-3">
//                       <div><p className="text-sm text-gray-500">Service Radius</p><p className="font-semibold text-gray-900">{partner.service_radius_km} km</p></div>
//                       <div><p className="text-sm text-gray-500">Price Range</p><p className="font-semibold text-gray-900">{fmt(partner.price_range_min)} – {fmt(partner.price_range_max)}</p></div>
//                       <div><p className="text-sm text-gray-500">Service Areas</p><p className="font-semibold text-gray-900">{serviceAreas.length} configured</p></div>
//                       <div><p className="text-sm text-gray-500">Active Agents</p><p className="font-semibold text-gray-900">{stats.active_agents}</p></div>
//                     </div>
//                   </Card>

//                   {/* Important Dates */}
//                   <Card title="Important Dates">
//                     <div className="p-6 space-y-3">
//                       <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><div><p className="text-sm text-gray-500">Joined</p><p className="text-sm font-semibold text-gray-900">{fmtD(partner.created_at)}</p></div></div>
//                       <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><div><p className="text-sm text-gray-500">Last Updated</p><p className="text-sm font-semibold text-gray-900">{fmtD(partner.updated_at)}</p></div></div>
//                     </div>
//                   </Card>

//                   {/* Actions — NOW uses proper modal instead of browser prompt */}
//                   <Card title="Actions">
//                     <div className="p-6 space-y-3">
//                       {partner.status === 'pending' && <>
//                         <button onClick={() => setActionModal('approve')} className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"><CheckCircle size={18} />Approve Partner</button>
//                         <button onClick={() => setActionModal('reject')} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"><XCircle size={18} />Reject Partner</button>
//                       </>}
//                       {partner.status === 'approved' && (
//                         <button onClick={() => setActionModal('suspend')} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"><Ban size={18} />Suspend Partner</button>
//                       )}
//                       {partner.status === 'suspended' && (
//                         <button onClick={() => setActionModal('activate')} className="w-full px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 border border-emerald-200"><PlayCircle size={18} />Activate Partner</button>
//                       )}
//                       <button onClick={() => setEditing(true)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><Pencil size={18} />Edit Partner</button>
//                       <button onClick={() => setDeleteOpen(true)} className="w-full px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"><Trash2 size={18} />Delete Partner</button>
//                     </div>
//                   </Card>
//                 </div>
//               </div>
//             )}
//           </>
//         )}

//         {/* ════ LEADS TAB (preserved from original + pagination added) ════ */}
//         {activeTab === 'leads' && (
//           <Card title={`Leads (${leadsCount})`}>
//             <div className="p-6 border-b border-gray-100 flex gap-4 flex-wrap">
//               <select value={leadFilters.status} onChange={e => setLeadFilters(f => ({ ...f, status: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
//                 <option value="all">All Status</option>
//                 {['booked','partner_assigned','visit_scheduled','in_progress','completed','cancelled','pending_payment'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
//               </select>
//               <input type="text" value={leadFilters.search} onChange={e => setLeadFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search leads…" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
//             </div>
//             <div className="p-6">
//               {loadingTab ? <TabLoader /> : leads.length === 0
//                 ? <div className="text-center py-12"><Package size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No leads found</p></div>
//                 : <div className="overflow-x-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-50 border-b">
//                       <tr>{['Lead #','Customer','Device','Price','Status','Date'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-100">
//                       {leads.map(lead => (
//                         <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
//                           <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-700">{lead.lead_number}</td>
//                           <td className="px-4 py-3"><div className="font-medium text-gray-900">{lead.customer_name}</div><div className="text-xs text-gray-500">{lead.customer_phone}</div></td>
//                           <td className="px-4 py-3"><div className="font-medium text-gray-900">{lead.device_name}</div><div className="text-xs text-gray-500">{lead.storage}{lead.color ? ` • ${lead.color}` : ''}</div></td>
//                           <td className="px-4 py-3">{lead.final_price ? <span className="font-semibold text-emerald-600">{fmt(lead.final_price)}</span> : <span className="text-gray-500">{fmt(lead.estimated_price)}</span>}</td>
//                           <td className="px-4 py-3"><Badge status={lead.status}>{lead.status_display}</Badge></td>
//                           <td className="px-4 py-3 text-gray-600">{fmtD(lead.created_at)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>}
//             </div>
//             {leadPages > 1 && <Pager page={leadPage} total={leadsCount} pages={leadPages} size={20} onChange={loadLeads} />}
//           </Card>
//         )}

//         {/* ════ WALLET TAB (preserved from original + pagination + full wallet details) ════ */}
//         {activeTab === 'wallet' && (
//           <div className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <Card><div className="p-6"><p className="text-sm text-gray-500">Total Balance</p><p className="text-3xl font-bold text-gray-900 mt-2">{fmt(walletSnap?.balance ?? 0)}</p></div></Card>
//               <Card><div className="p-6"><p className="text-sm text-gray-500">Available</p><p className="text-3xl font-bold text-emerald-600 mt-2">{fmt(walletSnap?.available_balance ?? 0)}</p></div></Card>
//               <Card><div className="p-6"><p className="text-sm text-gray-500">Blocked</p><p className="text-3xl font-bold text-red-600 mt-2">{fmt(walletSnap?.blocked_amount ?? 0)}</p></div></Card>
//             </div>
//             <Card title={`Transactions (${transactionsCount})`}>
//               <div className="p-6 border-b border-gray-100">
//                 <select value={txnFilters.type} onChange={e => setTxnFilters({ type: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
//                   <option value="all">All Transactions</option><option value="credit">Credit Only</option><option value="debit">Debit Only</option>
//                 </select>
//               </div>
//               <div className="p-6">
//                 {loadingTab ? <TabLoader /> : transactions.length === 0
//                   ? <div className="text-center py-12"><CreditCard size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No transactions found</p></div>
//                   : <div className="space-y-3">
//                     {transactions.map(txn => (
//                       <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
//                         <div className="flex items-center gap-3">
//                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.transaction_type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
//                             {txn.transaction_type === 'credit' ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
//                           </div>
//                           <div><p className="font-semibold text-gray-900">{txn.description}</p><p className="text-sm text-gray-500">{fmtDT(txn.created_at)}</p></div>
//                         </div>
//                         <div className="text-right">
//                           <p className={`font-bold ${txn.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>{txn.transaction_type === 'credit' ? '+' : '–'}{fmt(txn.amount)}</p>
//                           <p className="text-sm text-gray-500">Balance: {fmt(txn.balance_after)}</p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>}
//               </div>
//               {txnPages > 1 && <Pager page={txnPage} total={transactionsCount} pages={txnPages} size={20} onChange={loadTransactions} />}
//             </Card>
//           </div>
//         )}

//         {/* ════ AGENTS TAB (preserved from original) ════ */}
//         {activeTab === 'agents' && (
//           <Card title={`Agents (${agents.length})`}>
//             <div className="p-6">
//               {loadingTab ? <TabLoader /> : agents.length === 0
//                 ? <div className="text-center py-12"><Users size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No agents found</p></div>
//                 : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {agents.map(agent => (
//                     <div key={agent.id} className="p-4 bg-gray-50 rounded-lg">
//                       <div className="flex items-center justify-between mb-3"><div><p className="font-semibold text-gray-900">{agent.name}</p><p className="text-sm text-gray-500">{agent.phone}</p><p className="text-xs text-gray-400">Code: {agent.employee_code}</p></div><Badge status={agent.status}>{agent.status}</Badge></div>
//                       <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
//                         <div><p className="text-xs text-gray-500">Assignments</p><p className="text-sm font-bold text-gray-900">{agent.total_assignments}</p></div>
//                         <div><p className="text-xs text-gray-500">Completed</p><p className="text-sm font-bold text-emerald-600">{agent.completed_assignments}</p></div>
//                         <div><p className="text-xs text-gray-500">Success</p><p className="text-sm font-bold text-blue-600">{agent.completion_rate.toFixed(0)}%</p></div>
//                       </div>
//                       <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /><span className="text-sm font-semibold">{agent.average_rating.toFixed(1)}</span></div>{agent.is_available && <Badge status="active">Available</Badge>}</div>
//                     </div>
//                   ))}
//                 </div>}
//             </div>
//           </Card>
//         )}

//         {/* ════ ACTIVITY TAB (preserved from original + pagination) ════ */}
//         {activeTab === 'activity' && (
//           <Card title={`Activity Logs (${actCount})`}>
//             <div className="p-6">
//               {loadingTab ? <TabLoader /> : activities.length === 0
//                 ? <div className="text-center py-12"><Activity size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No activity logs found</p></div>
//                 : <div className="space-y-3">
//                   {activities.map(activity => (
//                     <div key={activity.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
//                       <Activity className="w-5 h-5 text-gray-400 mt-1" />
//                       <div className="flex-1">
//                         <p className="font-semibold text-gray-900">{activity.description}</p>
//                         <div className="flex items-center gap-3 mt-1"><p className="text-sm text-gray-500">{activity.agent_name}</p><span className="text-gray-300">•</span><p className="text-sm text-gray-500">{fmtDT(activity.created_at)}</p></div>
//                         {Object.keys(activity.metadata).length > 0 && <p className="text-xs text-gray-400 mt-2">{JSON.stringify(activity.metadata)}</p>}
//                       </div>
//                     </div>
//                   ))}
//                 </div>}
//             </div>
//             {actPages > 1 && <Pager page={actPage} total={actCount} pages={actPages} size={30} onChange={loadActivity} />}
//           </Card>
//         )}

//         {/* ════ PERFORMANCE TAB (preserved from original) ════ */}
//         {activeTab === 'performance' && (
//           <div className="space-y-6">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
//               <select value={performanceDays} onChange={e => setPerfDays(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
//                 <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
//               </select>
//             </div>
//             {loadingTab && !performance ? <TabLoader /> : performance ? (
//               <>
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                   <Card><div className="p-6"><p className="text-sm text-gray-500">Total Leads</p><p className="text-3xl font-bold text-gray-900 mt-2">{performance.leads.total}</p><p className="text-xs text-gray-400 mt-1">{performance.leads.completed} completed</p></div></Card>
//                   <Card><div className="p-6"><p className="text-sm text-gray-500">Completion Rate</p><p className="text-3xl font-bold text-emerald-600 mt-2">{performance.leads.completion_rate.toFixed(1)}%</p><p className="text-xs text-gray-400 mt-1">{performance.leads.in_progress} in progress</p></div></Card>
//                   <Card><div className="p-6"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-3xl font-bold text-purple-600 mt-2">{fmt(performance.revenue.total)}</p><p className="text-xs text-gray-400 mt-1">Avg: {fmt(performance.revenue.average_deal_value)}</p></div></Card>
//                   <Card><div className="p-6"><p className="text-sm text-gray-500">Active Agents</p><p className="text-3xl font-bold text-blue-600 mt-2">{performance.agents.active_agents}</p><p className="text-xs text-gray-400 mt-1">of {performance.agents.total_agents} total</p></div></Card>
//                 </div>
//                 <Card title="Daily Breakdown">
//                   <div className="p-6 space-y-3">
//                     {performance.daily_breakdown.slice(-14).map(day => {
//                       const max = Math.max(...performance.daily_breakdown.map(d => d.leads), 1);
//                       return (
//                         <div key={day.date} className="flex items-center gap-4">
//                           <span className="text-sm text-gray-500 w-28 flex-shrink-0">{fmtD(day.date)}</span>
//                           <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(day.leads / max) * 100}%` }} /></div>
//                           <div className="flex gap-4 text-sm flex-shrink-0">
//                             <span className="text-gray-700 w-16 text-right">{day.completed}/{day.leads}</span>
//                             <span className="text-purple-600 w-20 text-right font-medium">{fmt(day.revenue)}</span>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </Card>
//               </>
//             ) : <div className="text-center py-12"><BarChart3 size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No performance data available</p></div>}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PartnerDetail;


// pages/partners/PartnerDetail.tsx
// All original tabs preserved. New "verification" tab added for onboarding review.
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Briefcase, FileText, CheckCircle,
  XCircle, User, Calendar, TrendingUp, Star, Building2, Shield,
  AlertCircle, Ban, PlayCircle, Package, Clock, DollarSign, Users,
  Activity, CreditCard, TrendingDown, RefreshCw, BarChart3, Wallet,
  Pencil, Trash2, Save, X, Loader2, ShieldCheck, ShieldAlert,
  ExternalLink, ChevronLeft, ChevronRight, Zap, CheckSquare,
  AlertTriangle, Circle, Info, BadgeCheck,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PartnerUser { id: string; phone: string; email: string | null; name: string; kyc_status: string; }
interface Partner {
  id: string; user: PartnerUser; business_name: string; business_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  service_radius_km: number; price_range_min: number; price_range_max: number;
  partner_score: number; completion_rate: number; average_rating: number;
  total_leads_completed: number; is_available: boolean;
  background_check_status: string; profile_completed: boolean;
  profile_image_url: string | null; created_at: string; updated_at: string;
}
interface PartnerStats {
  leads: { total: number; completed: number; cancelled: number; in_progress: number; revenue: number };
  wallet: { balance: number; available_balance: number };
  active_agents: number; partner_score: number; average_rating: number;
  completion_rate: number; total_leads_completed: number;
}
interface ServiceArea { id: string; name: string; city: string; state: string; postal_codes: string[]; is_active: boolean; radius_km: number; priority: number; }
interface BankAccount { id: string; account_holder_name: string; account_number_masked: string; ifsc_code: string; bank_name: string; branch_name: string; account_type: string; is_primary: boolean; is_verified: boolean; created_at: string; }
interface Document { id: string; document_type: string; document_type_display: string; document_url: string | null; verification_status: string; verification_notes: string; verified_by: string | null; verified_at: string | null; created_at: string; updated_at: string; }
interface Lead { id: string; lead_number: string; status: string; status_display: string; customer_name: string; customer_phone: string; device_name: string; storage: string; color: string; estimated_price: number; final_price: number | null; created_at: string; }
interface Transaction { id: string; transaction_type: 'credit' | 'debit'; amount: number; balance_after: number; status: string; description: string; created_at: string; }
interface Agent { id: string; name: string; phone: string; employee_code: string; status: string; is_available: boolean; total_assignments: number; completed_assignments: number; completion_rate: number; average_rating: number; }
interface ActivityLog { id: string; description: string; agent_name: string; metadata: Record<string, any>; created_at: string; }
interface Performance { period_days: number; leads: { total: number; completed: number; cancelled: number; in_progress: number; completion_rate: number }; revenue: { total: number; average_deal_value: number }; agents: { total_agents: number; active_agents: number }; daily_breakdown: Array<{ date: string; leads: number; completed: number; revenue: number }>; }
interface WalletSnap { balance: number; blocked_amount: number; available_balance: number; status: string; currency: string; }
interface EditForm { business_name: string; service_radius_km: string; price_range_min: string; price_range_max: string; is_available: boolean; background_check_status: string; status: string; user_name: string; user_email: string; user_kyc_status: string; }

type Tab = 'overview' | 'verification' | 'leads' | 'wallet' | 'agents' | 'activity' | 'performance';
type StatusAction = 'approve' | 'reject' | 'suspend' | 'activate';
type AlertType = 'success' | 'error' | 'warning';

// ── API ───────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((c) => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use((r) => r, (e) => { if (e.response?.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/admin/login'; } return Promise.reject(e); });

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtD  = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDT = (s: string) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp)(\\?.*)?$/i.test(url);

/** Compute profile completion score (mirrors Django model property) */
function computeCompletion(partner: Partner, docs: Document[], banks: BankAccount[], areas: ServiceArea[]): {
  score: number; pct: number; breakdown: Array<{ label: string; points: number; max: number; done: boolean; note: string }>;
} {
  const total = 7;
  const breakdown = [
    {
      label: 'Business Name',
      points: partner.business_name ? 1 : 0,
      max: 1,
      done: !!partner.business_name,
      note: partner.business_name || 'Not set',
    },
    {
      label: 'KYC Verification',
      points: partner.user.kyc_status === 'verified' ? 2 : partner.user.kyc_status === 'in_review' ? 1 : 0,
      max: 2,
      done: partner.user.kyc_status === 'verified',
      note: partner.user.kyc_status === 'verified'
        ? 'Verified (+2)'
        : partner.user.kyc_status === 'in_review'
        ? 'In review (+1 of 2)'
        : 'Not verified',
    },
    {
      label: 'Bank Account',
      points: banks.some(b => b.is_verified) ? 2 : banks.length > 0 ? 1 : 0,
      max: 2,
      done: banks.some(b => b.is_verified),
      note: banks.some(b => b.is_verified)
        ? 'Verified account (+2)'
        : banks.length > 0
        ? 'Account added, not verified (+1 of 2)'
        : 'No bank account',
    },
    {
      label: 'Service Area',
      points: areas.filter(a => a.is_active).length > 0 ? 1 : 0,
      max: 1,
      done: areas.filter(a => a.is_active).length > 0,
      note: areas.filter(a => a.is_active).length > 0
        ? `${areas.filter(a => a.is_active).length} active zone(s)`
        : 'No service areas',
    },
    {
      label: 'Background Check',
      points: partner.background_check_status === 'verified' ? 1 : 0,
      max: 1,
      done: partner.background_check_status === 'verified',
      note: partner.background_check_status,
    },
  ];
  const score = breakdown.reduce((s, b) => s + b.points, 0);
  return { score, pct: Math.round((score / total) * 100), breakdown };
}

// ══════════════════════════════════════════════════════════════════════════════
//  SHARED UI (all preserved from original)
// ══════════════════════════════════════════════════════════════════════════════
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; titleRight?: React.ReactNode }> =
  ({ children, className = '', title, titleRight }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {(title || titleRight) && (
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {titleRight}
      </div>
    )}
    {children}
  </div>
);

const Badge: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800',
    active: 'bg-blue-100 text-blue-800', verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800', suspended: 'bg-gray-100 text-gray-800',
    completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800',
    in_review: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800',
    credit: 'bg-emerald-100 text-emerald-800', debit: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-600',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{children}</span>;
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subtitle?: string; color?: string }> =
  ({ icon, label, value, subtitle, color = 'blue' }) => {
  const cls: Record<string, string> = { blue: 'bg-blue-100 text-blue-600', green: 'bg-emerald-100 text-emerald-600', yellow: 'bg-amber-100 text-amber-600', purple: 'bg-purple-100 text-purple-600', red: 'bg-red-100 text-red-600' };
  return (
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${cls[color]}`}>{icon}</div>
      <div><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900">{value}</p>{subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}</div>
    </div>
  );
};

const AlertBanner: React.FC<{ type: AlertType; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  const cfg = {
    success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', Icon: CheckCircle },
    error:   { bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-200',     Icon: XCircle },
    warning: { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   Icon: AlertCircle },
  }[type];
  return (
    <div className={`${cfg.bg} ${cfg.text} border ${cfg.border} rounded-lg p-4 flex items-center justify-between mb-6`}>
      <div className="flex items-center gap-3"><cfg.Icon size={20} /><span className="font-medium">{message}</span></div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XCircle size={18} /></button>
    </div>
  );
};

const Loader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" /><p className="mt-4 text-gray-600">Loading…</p></div>
  </div>
);

const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /><p className="mt-2 text-sm text-gray-600">Loading data…</p></div>
  </div>
);

const Pager: React.FC<{ page: number; total: number; pages: number; size: number; onChange: (p: number) => void }> = ({ page, total, pages, size, onChange }) => (
  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
    <p className="text-sm text-gray-600">{(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}</p>
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white"><ChevronLeft size={14} />Prev</button>
      <span className="text-sm text-gray-600">{page}/{pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white">Next<ChevronRight size={14} /></button>
    </div>
  </div>
);

// ── Status Modal ──────────────────────────────────────────────────────────────
const StatusModal: React.FC<{ action: StatusAction | null; name: string; onClose: () => void; onConfirm: (r?: string) => Promise<void> }> =
  ({ action, name, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setReason(''); setErr(null); }, [action]);
  if (!action) return null;
  const needsReason = action === 'reject' || action === 'suspend';
  const cfg = {
    approve:  { title: 'Approve Partner',    btn: 'Approve',    cls: 'bg-emerald-600 hover:bg-emerald-700', head: 'bg-emerald-50 border-emerald-100', Icon: CheckCircle, iconCls: 'text-emerald-600' },
    reject:   { title: 'Reject Partner',     btn: 'Reject',     cls: 'bg-red-600 hover:bg-red-700',         head: 'bg-red-50 border-red-100',         Icon: XCircle,     iconCls: 'text-red-600' },
    suspend:  { title: 'Suspend Partner',    btn: 'Suspend',    cls: 'bg-orange-600 hover:bg-orange-700',   head: 'bg-orange-50 border-orange-100',   Icon: Ban,         iconCls: 'text-orange-600' },
    activate: { title: 'Reactivate Partner', btn: 'Reactivate', cls: 'bg-blue-600 hover:bg-blue-700',       head: 'bg-blue-50 border-blue-100',       Icon: PlayCircle,  iconCls: 'text-blue-600' },
  }[action];
  const run = async () => {
    if (needsReason && !reason.trim()) { setErr('Reason is required.'); return; }
    setLoading(true); setErr(null);
    try { await onConfirm(needsReason ? reason : undefined); onClose(); }
    catch (e: any) { setErr(e.response?.data?.error || e.response?.data?.detail || 'Action failed.'); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className={`px-6 py-5 border-b ${cfg.head} flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-full ${cfg.head} flex items-center justify-center`}><cfg.Icon size={20} className={cfg.iconCls} /></div>
          <div><h3 className="font-bold text-gray-900 text-lg">{cfg.title}</h3><p className="text-sm text-gray-600">{name}</p></div>
        </div>
        <div className="px-6 py-5">
          {needsReason
            ? <><p className="text-sm text-gray-600 mb-2">Reason (required):</p><textarea value={reason} onChange={e => { setReason(e.target.value); setErr(null); }} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-500" /></>
            : <p className="text-sm text-gray-600">{action === 'approve' ? 'This will grant full platform access to this partner.' : 'This will restore access to this partner.'}</p>}
          {err && <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={13} />{err}</p>}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancel</button>
          <button onClick={run} disabled={loading || (needsReason && !reason.trim())} className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${cfg.cls}`}>
            {loading && <Loader2 size={13} className="animate-spin" />}{cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal: React.FC<{ open: boolean; name: string; onClose: () => void; onConfirm: () => Promise<void> }> =
  ({ open, name, onClose, onConfirm }) => {
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setTyped(''); setErr(null); }, [open]);
  if (!open) return null;
  const confirmed = typed.trim().toLowerCase() === 'delete';
  const run = async () => {
    setLoading(true); setErr(null);
    try { await onConfirm(); }
    catch (e: any) { setErr(e.response?.data?.detail || 'Delete failed.'); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div>
          <div><h3 className="font-bold text-gray-900">Delete Partner</h3><p className="text-sm text-gray-600">{name}</p></div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800"><p className="font-semibold mb-1">⚠ Irreversible action</p><p>Permanently deletes the partner account, documents, bank accounts, and owner account.</p></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Type <span className="font-mono text-red-600">delete</span> to confirm</label><input value={typed} onChange={e => setTyped(e.target.value)} placeholder="delete" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400" /></div>
          {err && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{err}</p>}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={run} disabled={loading || !confirmed} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading && <Loader2 size={13} className="animate-spin" />}<Trash2 size={13} />Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Edit Form ─────────────────────────────────────────────────────────────────
const EditPartnerForm: React.FC<{ partner: Partner; onSave: (p: Partner) => void; onCancel: () => void }> =
  ({ partner, onCancel, onSave }) => {
  const [form, setForm] = useState<EditForm>({
    business_name: partner.business_name,
    service_radius_km: String(partner.service_radius_km),
    price_range_min: String(partner.price_range_min),
    price_range_max: String(partner.price_range_max),
    is_available: partner.is_available,
    background_check_status: partner.background_check_status,
    status: partner.status,
    user_name: partner.user.name,
    user_email: partner.user.email || '',
    user_kyc_status: partner.user.kyc_status,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500';
  const sel = `${inp} bg-white`;
  const handleSave = async () => {
    setLoading(true); setErr(null);
    try {
      const { data } = await api.patch(`/admin/partners/${partner.id}/`, {
        business_name: form.business_name,
        service_radius_km: Number(form.service_radius_km),
        price_range_min: Number(form.price_range_min),
        price_range_max: Number(form.price_range_max),
        is_available: form.is_available,
        background_check_status: form.background_check_status,
        status: form.status,
        user: { name: form.user_name, email: form.user_email || null, kyc_status: form.user_kyc_status },
      });
      onSave(data.partner);
    } catch (e: any) { setErr(e.response?.data?.detail || e.response?.data?.error || 'Save failed.'); }
    finally { setLoading(false); }
  };
  const set = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  return (
    <Card>
      <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Pencil size={17} className="text-emerald-600" />Edit Partner</h3>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"><X size={14} />Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
      <div className="p-6 space-y-5">
        {err && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle size={14} />{err}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Owner Account</p>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label><input value={form.user_name} onChange={set('user_name')} className={inp} /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email</label><input value={form.user_email} onChange={set('user_email')} type="email" className={inp} /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">KYC Status</label>
              <select value={form.user_kyc_status} onChange={set('user_kyc_status')} className={sel}>
                {['pending', 'in_review', 'verified', 'rejected'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Business</p>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Business Name</label><input value={form.business_name} onChange={set('business_name')} className={inp} /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Service Radius (km)</label><input value={form.service_radius_km} onChange={set('service_radius_km')} type="number" className={inp} /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Price Range (₹)</label>
              <div className="flex items-center gap-2"><input value={form.price_range_min} onChange={set('price_range_min')} type="number" placeholder="Min" className={inp} /><span className="text-gray-400">–</span><input value={form.price_range_max} onChange={set('price_range_max')} type="number" placeholder="Max" className={inp} /></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-gray-100">
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Partner Status</label>
            <select value={form.status} onChange={set('status')} className={sel}>{['pending','approved','rejected','suspended'].map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Background Check</label>
            <select value={form.background_check_status} onChange={set('background_check_status')} className={sel}>{['pending','in_progress','verified','failed'].map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Available for Leads</label>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={set('is_available')} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">{form.is_available ? 'Yes — accepting leads' : 'No — unavailable'}</span>
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  VERIFICATION TAB — Profile Completion + Doc Review + Status
// ══════════════════════════════════════════════════════════════════════════════

/** Single document review card */
const DocReviewCard: React.FC<{ doc: Document; partnerId: string; onUpdated: (d: Document) => void }> =({ doc, partnerId, onUpdated }) => {
  const [action, setAction]     = useState<'verify' | 'reject' | null>(null);
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState<string | null>(null);
  const [imgErr, setImgErr]     = useState(false);
  const [expanded, setExpanded] = useState(false);

  const submit = async () => {
    if (action === 'reject' && !notes.trim()) { setErr('Rejection reason is required.'); return; }
    setLoading(true); setErr(null);
    try {
      const ep = action === 'verify' ? 'verify_document' : 'reject_document';
      const { data } = await api.post(`/admin/partners/${partnerId}/${ep}/`, { document_id: doc.id, notes });
      onUpdated({ ...doc, ...data.document });
      setAction(null); setNotes('');
    } catch (e: any) { setErr(e.response?.data?.error || 'Action failed.'); }
    finally { setLoading(false); }
  };

  const st = doc.verification_status;
  const borderMap: Record<string, string> = { verified: 'border-emerald-200', rejected: 'border-red-200', pending: 'border-amber-200', in_review: 'border-amber-200' };
  const headerMap: Record<string, string> = { verified: 'bg-emerald-50', rejected: 'bg-red-50', pending: 'bg-amber-50', in_review: 'bg-amber-50' };
  const StatusIcon = st === 'verified' ? ShieldCheck : st === 'rejected' ? ShieldAlert : Shield;
  const iconCls = st === 'verified' ? 'text-emerald-600' : st === 'rejected' ? 'text-red-600' : 'text-amber-500';
  const hasUrl = !!doc.document_url;
  const isImg  = hasUrl && !imgErr && isImageUrl(doc.document_url!);

  return (
    <div className={`rounded-xl border ${borderMap[st] || 'border-gray-200'} overflow-hidden bg-white shadow-sm`}>
      {/* Header */}
      <div className={`flex items-start justify-between gap-3 px-4 py-3 ${headerMap[st] || 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <StatusIcon size={16} className={`flex-shrink-0 ${iconCls}`} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 capitalize text-sm">
              {(doc.document_type_display || doc.document_type || 'Document').replace(/_/g, ' ')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Uploaded {fmtD(doc.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge status={st}>{st}</Badge>
          {hasUrl && (
            <a href={doc.document_url!} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
              <ExternalLink size={11} /> Open
            </a>
          )}
        </div>
      </div>

      {/* Preview */}
      {hasUrl ? (
        <div className="border-t border-gray-100">
          {isImg ? (
            <div className="relative bg-gray-100">
              <img src={doc.document_url!} alt={doc.document_type} onError={() => setImgErr(true)}
                className={`w-full object-contain transition-all ${expanded ? 'max-h-[500px]' : 'max-h-48'}`} />
              <button onClick={() => setExpanded(e => !e)}
                className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 text-white text-xs rounded-lg">
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-3 bg-gray-50">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><FileText size={24} className="text-blue-600" /></div>
              <p className="text-sm text-gray-600">Document attached (non-image file)</p>
              <a href={doc.document_url!} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                <ExternalLink size={14} /> Open Document
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 gap-2 bg-gray-50 border-t border-gray-100">
          <FileText size={28} className="text-gray-300" />
          <p className="text-sm text-gray-500">No file uploaded</p>
        </div>
      )}

      {/* Notes */}
      {(doc.verified_at || doc.verification_notes) && (
        <div className="px-4 py-3 border-t border-gray-100 space-y-1">
          {doc.verified_at && <p className="text-xs text-gray-500">{st === 'verified' ? '✓ Verified' : '✗ Reviewed'}: {fmtDT(doc.verified_at)}</p>}
          {doc.verification_notes && <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">📝 {doc.verification_notes}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-100">
        {action === null ? (
          <div className="flex items-center gap-2">
            {st !== 'verified' && (
              <button onClick={() => setAction('verify')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700">
                <ShieldCheck size={14} /> Verify
              </button>
            )}
            {st !== 'rejected' && (
              <button onClick={() => setAction('reject')}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-300 bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100">
                <ShieldAlert size={14} /> Reject
              </button>
            )}
            {st === 'verified' && <p className="text-xs text-emerald-700 flex items-center gap-1"><ShieldCheck size={12} /> Verified — you can still reject if needed</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {action === 'verify'
              ? <><p className="text-xs font-semibold text-emerald-700">Confirm verification:</p><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></>
              : <><p className="text-xs font-semibold text-red-700">Rejection reason (required):</p><textarea value={notes} onChange={e => { setNotes(e.target.value); setErr(null); }} rows={2} placeholder="Why is this document rejected?" className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-400" /></>}
            {err && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{err}</p>}
            <div className="flex gap-2">
              <button onClick={submit} disabled={loading || (action === 'reject' && !notes.trim())}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${action === 'verify' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {loading && <Loader2 size={13} className="animate-spin" />}
                {action === 'verify' ? 'Confirm Verify' : 'Confirm Reject'}
              </button>
              <button onClick={() => { setAction(null); setNotes(''); setErr(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Profile completion score breakdown + complete/approve panel */
const VerificationTab: React.FC<{
  partner: Partner;
  docs: Document[];
  banks: BankAccount[];
  areas: ServiceArea[];
  loadingData: boolean;
  onDocUpdated: (d: Document) => void;
  onPartnerUpdated: (p: Partner) => void;
  onStatusAction: (a: StatusAction) => void;
  showAlert: (t: AlertType, m: string) => void;
}> = ({ partner, docs, banks, areas, loadingData, onDocUpdated, onPartnerUpdated, onStatusAction, showAlert }) => {

  const { score, pct, breakdown } = computeCompletion(partner, docs, banks, areas);
  const [completing, setCompleting] = useState(false);
  const [approvingBankId, setApprovingBankId] = useState<string | null>(null);
  const [kycUpdating, setKycUpdating] = useState(false);
  const [bgUpdating, setBgUpdating]   = useState(false);

  const canAutoComplete = pct >= 80 && !partner.profile_completed;
  const isAlreadyComplete = partner.profile_completed;

  /** Force-mark profile as complete on backend */
  const handleForceComplete = async () => {
    setCompleting(true);
    try {
      const { data } = await api.patch(`/admin/partners/${partner.id}/`, {
        profile_completed: true,
      });
      onPartnerUpdated(data.partner);
      showAlert('success', 'Profile marked as complete.');
    } catch (e: any) {
      showAlert('error', e.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setCompleting(false);
    }
  };

  /** Intercept document updates to check for Auto-KYC */
  const handleDocUpdate = async (updatedDoc: Document) => {
    // 1. Update the document list locally
    onDocUpdated(updatedDoc);

    // 2. Check Auto-KYC conditions
    const newDocs = docs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    const verifiedDocs = newDocs.filter(d => d.verification_status === 'verified');
    
    const hasPhoto = verifiedDocs.some(d => d.document_type === 'photo');
    const standardDocs = verifiedDocs.filter(d => d.document_type !== 'photo');

    // Condition: 1 Photo + At least 2 other documents verified
    if (hasPhoto && standardDocs.length >= 2 && partner.user?.kyc_status !== 'verified') {
      try {
        await api.patch(`/admin/partners/${partner.id}/`, {
          user: { kyc_status: 'verified' }
        });
        showAlert('success', '✨ KYC Auto-Verified based on approved documents!');
        onPartnerUpdated({
          ...partner,
          user: { ...partner.user, kyc_status: 'verified' }
        });
      } catch (e) {
        console.error("Auto KYC Failed", e);
      }
    }
  };

  /** Verify a bank account */
  const handleBankVerify = async (bankId: string, verify: boolean) => {
    setApprovingBankId(bankId);
    try {
      await api.post(`/admin/partners/${partner.id}/verify_bank/`, { bank_account_id: bankId, is_verified: verify });
      showAlert('success', verify ? 'Bank account verified.' : 'Bank account verification removed.');
      // Force parent refresh
      onPartnerUpdated({ ...partner });
    } catch (e: any) {
      showAlert('error', e.response?.data?.detail || 'Bank action failed.');
    } finally {
      setApprovingBankId(null);
    }
  };

  /** Quick KYC status update */
  const handleKycUpdate = async (kycStatus: string) => {
    setKycUpdating(true);
    try {
      const { data } = await api.patch(`/admin/partners/${partner.id}/`, {
        user: { kyc_status: kycStatus },
      });
      onPartnerUpdated(data.partner);
      showAlert('success', `KYC status updated to "${kycStatus}".`);
    } catch {
      showAlert('error', 'Failed to update KYC status.');
    } finally {
      setKycUpdating(false);
    }
  };

  /** Quick background check update */
  const handleBgUpdate = async (bgStatus: string) => {
    setBgUpdating(true);
    try {
      const { data } = await api.patch(`/admin/partners/${partner.id}/`, {
        background_check_status: bgStatus,
      });
      onPartnerUpdated(data.partner);
      showAlert('success', `Background check updated to "${bgStatus}".`);
    } catch {
      showAlert('error', 'Failed to update background check.');
    } finally {
      setBgUpdating(false);
    }
  };

  const pctColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-red-700';
  const bgColor   = pct >= 80 ? 'bg-emerald-50 border-emerald-200' : pct >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">

      {/* ── 1. Profile Completion Score ──────────────────────────────── */}
      <Card>
        <div className="p-6 space-y-5">
          {/* Score header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Profile Completion</h3>
              <p className="text-sm text-gray-500 mt-0.5">Score needed to activate: 80% (6/7 points)</p>
            </div>
            <div className="flex items-center gap-3">
              {isAlreadyComplete ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 font-semibold text-sm">
                  <BadgeCheck size={18} className="text-emerald-600" /> Profile Complete
                </div>
              ) : canAutoComplete ? (
                <button onClick={handleForceComplete} disabled={completing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 disabled:opacity-60 shadow-sm transition-colors">
                  {completing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  {completing ? 'Completing…' : 'Mark Profile Complete'}
                </button>
              ) : (
                <button onClick={handleForceComplete} disabled={completing || pct < 50}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 disabled:opacity-40">
                  {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                  Force Complete
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{score} / 7 points</span>
              <span className={`text-2xl font-black ${textColor}`}>{pct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className={`h-4 rounded-full transition-all duration-500 ${pctColor}`} style={{ width: `${pct}%` }} />
            </div>
            {/* 80% marker */}
            <div className="relative mt-1">
              <div className="absolute left-[80%] -top-5 flex flex-col items-center">
                <div className="w-px h-4 bg-gray-400" />
                <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">80% min</span>
              </div>
            </div>
          </div>

          {/* Auto-complete notice */}
          {canAutoComplete && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-2">
              <Zap size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Auto-complete available</p>
                <p className="text-xs text-emerald-700 mt-0.5">All conditions are met ({pct}% ≥ 80%). Click "Mark Profile Complete" to activate this partner's profile flag. You can then approve their account.</p>
              </div>
            </div>
          )}

          {/* Breakdown table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {breakdown.map(item => (
              <div key={item.label} className={`flex items-start gap-3 p-3 rounded-xl border ${item.done ? 'bg-emerald-50 border-emerald-200' : item.points > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {item.done
                    ? <CheckCircle size={18} className="text-emerald-600" />
                    : item.points > 0
                    ? <AlertCircle size={18} className="text-amber-500" />
                    : <Circle size={18} className="text-gray-300" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className={`text-xs mt-0.5 ${item.done ? 'text-emerald-700' : item.points > 0 ? 'text-amber-700' : 'text-gray-500'}`}>{item.note}</p>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: item.max }).map((_, i) => (
                      <div key={i} className={`h-1.5 w-6 rounded-full ${i < item.points ? (item.done ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Documents + Banks ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Documents */}
          <Card title={`KYC Documents (${docs.length})`}
            titleRight={
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {docs.filter(d => d.verification_status === 'verified').length}/{docs.length} verified
                </span>
                {docs.length > 0 && docs.every(d => d.verification_status === 'verified') && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">✓ All verified</span>
                )}
              </div>
            }
          >
            <div className="p-6">
              {loadingData ? <TabLoader /> : docs.length === 0 ? (
                <div className="text-center py-10">
                  <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No documents uploaded</p>
                  <p className="text-sm text-gray-400 mt-1">Partner hasn't submitted any KYC documents yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map(doc => (
                    <DocReviewCard 
                      key={doc.id} 
                      doc={doc} 
                      partnerId={partner.id}
                      onUpdated={handleDocUpdate} // <--- USE THE NEW HANDLER HERE
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Bank Accounts */}
          <Card title={`Bank Accounts (${banks.length})`}>
            <div className="p-6">
              {loadingData ? <TabLoader /> : banks.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No bank accounts added</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {banks.map(acc => (
                    <div key={acc.id} className={`flex items-start gap-4 p-4 rounded-xl border ${acc.is_verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                      <CreditCard className={`w-5 h-5 mt-1 flex-shrink-0 ${acc.is_verified ? 'text-emerald-600' : 'text-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{acc.bank_name}</p>
                          {acc.is_primary && <Badge status="active">Primary</Badge>}
                          <Badge status={acc.is_verified ? 'verified' : 'pending'}>
                            {acc.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{acc.account_holder_name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          {acc.account_number_masked} · IFSC: {acc.ifsc_code}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {acc.is_verified ? (
                          <button
                            onClick={() => handleBankVerify(acc.id, false)}
                            disabled={approvingBankId === acc.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 bg-white text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50"
                          >
                            {approvingBankId === acc.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Unverify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBankVerify(acc.id, true)}
                            disabled={approvingBankId === acc.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {approvingBankId === acc.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT: Status Controls ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* Partner Status Actions */}
          <Card title="Account Status">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status</span>
                <Badge status={partner.status}>{partner.status}</Badge>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {partner.status === 'pending' && <>
                  <button onClick={() => onStatusAction('approve')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700">
                    <CheckCircle size={16} />Approve Partner
                  </button>
                  <button onClick={() => onStatusAction('reject')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 bg-red-50 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-100">
                    <XCircle size={16} />Reject Partner
                  </button>
                </>}
                {partner.status === 'approved' && (
                  <button onClick={() => onStatusAction('suspend')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-orange-200 bg-orange-50 text-orange-700 text-sm font-semibold rounded-xl hover:bg-orange-100">
                    <Ban size={16} />Suspend Partner
                  </button>
                )}
                {partner.status === 'suspended' && (
                  <button onClick={() => onStatusAction('activate')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                    <PlayCircle size={16} />Reactivate Partner
                  </button>
                )}
                {partner.status === 'rejected' && (
                  <button onClick={() => onStatusAction('activate')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                    <PlayCircle size={16} />Re-activate
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* KYC Status Quick Update */}
          <Card title="KYC Status">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current</span>
                <Badge status={partner.user?.kyc_status || 'pending'}>
                  {(partner.user?.kyc_status || 'pending').replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                {(['pending', 'in_review', 'verified', 'rejected'] as const).map(s => (
                  <button key={s} disabled={kycUpdating || partner.user.kyc_status === s}
                    onClick={() => handleKycUpdate(s)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 capitalize ${
                      partner.user.kyc_status === s
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {kycUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Background Check Quick Update */}
          <Card title="Background Check">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current</span>
                <Badge status={partner.background_check_status}>{partner.background_check_status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                {(['pending', 'in_progress', 'verified', 'failed'] as const).map(s => (
                  <button key={s} disabled={bgUpdating || partner.background_check_status === s}
                    onClick={() => handleBgUpdate(s)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 capitalize ${
                      partner.background_check_status === s
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {bgUpdating ? <Loader2 size={12} className="animate-spin mx-auto" /> : s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Service Areas summary */}
          <Card title={`Service Areas (${areas.length})`}>
            <div className="p-5">
              {areas.length === 0 ? (
                <p className="text-sm text-gray-500 flex items-center gap-2"><MapPin size={14} className="text-gray-400" />No areas configured</p>
              ) : (
                <div className="space-y-3">
                  {areas.slice(0, 5).map(area => (
                    <div key={area.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {area.name || `${area.city}, ${area.state}`}
                          </p>
                          <Badge status={area.is_active ? 'active' : 'suspended'}>
                            {area.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Radius: {area.radius_km}km · {area.city}, {area.state}
                        </p>
                        {area.postal_codes && area.postal_codes.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate" title={area.postal_codes.join(', ')}>
                            Pincodes: {area.postal_codes.slice(0, 3).join(', ')}
                            {area.postal_codes.length > 3 ? ` +${area.postal_codes.length - 3} more` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {areas.length > 5 && (
                    <p className="text-xs text-gray-400 pt-1 text-center">
                      +{areas.length - 5} more zones
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Profile image */}
          {partner.profile_image_url && (
            <Card title="Profile Photo">
              <div className="p-4">
                <img src={partner.profile_image_url} alt="Profile" className="w-full rounded-xl object-cover max-h-48" />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const PartnerDetail: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [partner, setPartner]           = useState<Partner | null>(null);
  const [partnerStats, setPartnerStats] = useState<PartnerStats | null>(null);
  const [walletSnap, setWalletSnap]     = useState<WalletSnap | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [alert, setAlert]               = useState<{ type: AlertType; message: string } | null>(null);
  const [editing, setEditing]           = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [actionModal, setActionModal]   = useState<StatusAction | null>(null);
  const [activeTab, setActiveTab]       = useState<Tab>('overview');
  const [loadingTab, setLoadingTab]     = useState(false);
  const loadedTabs                      = useRef<Set<Tab>>(new Set());

  // Overview / Verification shared data
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [documents, setDocuments]       = useState<Document[]>([]);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  // Leads
  const [leads, setLeads]             = useState<Lead[]>([]);
  const [leadsCount, setLeadsCount]   = useState(0);
  const [leadPage, setLeadPage]       = useState(1);
  const [leadPages, setLeadPages]     = useState(1);
  const [leadFilters, setLeadFilters] = useState({ status: 'all', search: '' });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsCount, setTxnCount] = useState(0);
  const [txnPage, setTxnPage]           = useState(1);
  const [txnPages, setTxnPages]         = useState(1);
  const [txnFilters, setTxnFilters]     = useState({ type: 'all' });

  // Agents / Activity / Performance
  const [agents, setAgents]           = useState<Agent[]>([]);
  const [activities, setActivities]   = useState<ActivityLog[]>([]);
  const [actCount, setActCount]       = useState(0);
  const [actPage, setActPage]         = useState(1);
  const [actPages, setActPages]       = useState(1);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [performanceDays, setPerfDays] = useState(30);

  const showAlert = useCallback((type: AlertType, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  // ── Core load ─────────────────────────────────────────────────────────────
  const loadPartner = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get<Partner>(`/admin/partners/${id}/`),
        api.get<PartnerStats>(`/admin/partners/${id}/partner_stats/`),
      ]);
      setPartner(pRes.data);
      setPartnerStats(sRes.data);
      setWalletSnap({ balance: sRes.data.wallet.balance, blocked_amount: 0, available_balance: sRes.data.wallet.available_balance, status: 'active', currency: 'INR' });
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to load partner.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadPartner(); }, [loadPartner]);

  // ── Overview / Verification data (shared) ─────────────────────────────────
  const loadOverviewData = useCallback(async (force = false) => {
    if (!id || (overviewLoaded && !force)) return;
    setLoadingTab(true);
    try {
      const [sa, ba, dc] = await Promise.all([
        api.get(`/admin/partners/${id}/service_areas/`),
        api.get(`/admin/partners/${id}/bank_accounts/`),
        api.get(`/admin/partners/${id}/documents/`),
      ]);
      setServiceAreas(sa.data.results || sa.data || []);
      setBankAccounts(ba.data.results || ba.data || []);
      setDocuments(dc.data.results || dc.data || []);
      setOverviewLoaded(true);
    } catch { } finally { setLoadingTab(false); }
  }, [id, overviewLoaded]);

  // ── Other tabs ────────────────────────────────────────────────────────────
  const loadLeads = useCallback(async (page = 1) => {
    if (!id) return; setLoadingTab(true);
    try {
      const params: any = { page, page_size: 20 };
      if (leadFilters.status !== 'all') params.status = leadFilters.status;
      if (leadFilters.search) params.search = leadFilters.search;
      const { data } = await api.get(`/admin/partners/${id}/leads/`, { params });
      setLeads(data.results || []); setLeadsCount(data.count);
      setLeadPage(data.page || page); setLeadPages(data.total_pages || 1);
    } catch { } finally { setLoadingTab(false); }
  }, [id, leadFilters]);

  const loadTransactions = useCallback(async (page = 1) => {
    if (!id) return; setLoadingTab(true);
    try {
      const params: any = { page, page_size: 20 };
      if (txnFilters.type !== 'all') params.transaction_type = txnFilters.type;
      const { data } = await api.get(`/admin/partners/${id}/transactions/`, { params });
      setTransactions(data.results || []); setTxnCount(data.count);
      setTxnPage(data.page || page); setTxnPages(data.total_pages || 1);
      if (!loadedTabs.current.has('wallet')) {
        const wd = await api.get(`/admin/partners/${id}/wallet/`);
        setWalletSnap(wd.data.wallet);
        loadedTabs.current.add('wallet');
      }
    } catch { } finally { setLoadingTab(false); }
  }, [id, txnFilters]);

  const loadAgents = useCallback(async () => {
    if (!id || loadedTabs.current.has('agents')) return; setLoadingTab(true);
    try { const { data } = await api.get(`/admin/partners/${id}/agents/`); setAgents(data.results || data || []); loadedTabs.current.add('agents'); }
    catch { } finally { setLoadingTab(false); }
  }, [id]);

  const loadActivity = useCallback(async (page = 1) => {
    if (!id) return; setLoadingTab(true);
    try {
      const { data } = await api.get(`/admin/partners/${id}/activity/`, { params: { page, page_size: 30 } });
      setActivities(data.results || []); setActCount(data.count);
      setActPage(data.page || page); setActPages(data.total_pages || 1);
    } catch { } finally { setLoadingTab(false); }
  }, [id]);

  const loadPerformance = useCallback(async (days = performanceDays) => {
    if (!id) return; setLoadingTab(true);
    try { const { data } = await api.get(`/admin/partners/${id}/performance/`, { params: { days } }); setPerformance(data); }
    catch { } finally { setLoadingTab(false); }
  }, [id, performanceDays]);

  useEffect(() => {
    switch (activeTab) {
      case 'overview':     loadOverviewData();    break;
      case 'verification': loadOverviewData();    break;  // reuse same data
      case 'leads':        loadLeads(1);          break;
      case 'wallet':       loadTransactions(1);   break;
      case 'agents':       loadAgents();          break;
      case 'activity':     loadActivity(1);       break;
      case 'performance':  loadPerformance();     break;
    }
  }, [activeTab]); // eslint-disable-line

  useEffect(() => { if (activeTab === 'leads')       loadLeads(1); },       [leadFilters]); // eslint-disable-line
  useEffect(() => { if (activeTab === 'wallet')      loadTransactions(1); }, [txnFilters]);  // eslint-disable-line
  useEffect(() => { if (activeTab === 'performance') { loadedTabs.current.delete('performance'); loadPerformance(performanceDays); } }, [performanceDays]); // eslint-disable-line

  const handleStatusAction = async (reason?: string) => {
    if (!id || !actionModal) throw new Error('No action');
    const ep: Record<StatusAction, string> = {
      approve:  `/admin/partners/${id}/approve/`,
      reject:   `/admin/partners/${id}/reject/`,
      suspend:  `/admin/partners/${id}/suspend/`,
      activate: `/admin/partners/${id}/activate/`,
    };
    await api.post(ep[actionModal], reason ? { reason } : {});
    showAlert('success', `Partner ${actionModal}d successfully.`);
    loadPartner();
  };

  const handleDelete = async () => {
    await api.delete(`/admin/partners/${id}/`);
    navigate('/partners');
  };

  if (loading) return <Loader />;
  if (error || !partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center"><AlertCircle size={48} className="text-red-500 mx-auto mb-4" /><p className="text-red-600 mb-4">{error || 'Partner not found'}</p><button onClick={() => navigate('/partners')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Back to Partners</button></div>
      </div>
    );
  }

  const stats = partnerStats ? {
    total_leads: partnerStats.leads.total, completed_leads: partnerStats.leads.completed,
    in_progress_leads: partnerStats.leads.in_progress, active_agents: partnerStats.active_agents,
  } : { total_leads: 0, completed_leads: 0, in_progress_leads: 0, active_agents: 0 };

  // Compute completion for header badge
  const { pct } = computeCompletion(partner, documents, bankAccounts, serviceAreas);
  const completionColor = pct >= 80 ? 'text-emerald-700 bg-emerald-100' : pct >= 50 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <StatusModal action={actionModal} name={partner.business_name} onClose={() => setActionModal(null)} onConfirm={handleStatusAction} />
      <DeleteModal open={deleteOpen} name={partner.business_name} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} />

      <div className="max-w-7xl mx-auto space-y-6">
        {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* ── Page header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/partners')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={24} /></button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{partner.business_name}</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {partner.id.slice(0, 8)}… · Joined {fmtD(partner.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge status={partner.status}>{partner.status}</Badge>
            {partner.user.kyc_status === 'verified' && <Badge status="verified">KYC Verified</Badge>}
            {partner.is_available && <Badge status="active">Available</Badge>}
            {/* Completion % badge */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${completionColor}`}>
              {overviewLoaded ? `${pct}% complete` : `${partner.profile_completed ? '100' : '—'}%`}
            </span>
            <button onClick={loadPartner} className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 ml-2"><RefreshCw size={15} /></button>
            {activeTab === 'overview' && !editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><Pencil size={14} />Edit</button>
            )}
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"><Trash2 size={14} />Delete</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card><div className="p-6"><StatCard icon={<Package size={24} />} label="Total Leads" value={stats.total_leads} subtitle={`${stats.completed_leads} completed`} color="blue" /></div></Card>
          <Card><div className="p-6"><StatCard icon={<TrendingUp size={24} />} label="Success Rate" value={`${(Number(partner.completion_rate) || 0).toFixed(1)}%`} subtitle={`${stats.in_progress_leads} in progress`} color="green" /></div></Card>
          <Card><div className="p-6"><StatCard icon={<Star size={24} />} label="Average Rating" value={(Number(partner.average_rating) || 0).toFixed(1)} subtitle="From customers" color="yellow" /></div></Card>
          <Card><div className="p-6"><StatCard icon={<Wallet size={24} />} label="Wallet Balance" value={fmt(walletSnap?.balance ?? 0)} subtitle={`${fmt(walletSnap?.available_balance ?? 0)} available`} color="purple" /></div></Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8 overflow-x-auto">
            {(['overview', 'verification', 'leads', 'wallet', 'agents', 'activity', 'performance'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); setEditing(false); }}
                className={`pb-4 border-b-2 transition-colors capitalize whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab ? 'border-emerald-600 text-emerald-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab === 'verification' && <ShieldCheck size={15} />}
                {tab}
                {tab === 'verification' && partner.status === 'pending' && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 inline-block" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ════ OVERVIEW TAB ════ */}
        {activeTab === 'overview' && (
          <>
            {editing ? (
              <EditPartnerForm partner={partner} onSave={(p) => { setPartner(p); setEditing(false); showAlert('success', 'Partner updated.'); }} onCancel={() => setEditing(false)} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {loadingTab && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>}
                  <Card title="Business Information">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3"><Briefcase className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Business Type</p><p className="font-semibold capitalize text-gray-900">{partner.business_type || '—'}</p></div></div>
                      <div className="flex items-start gap-3"><Building2 className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Business Name</p><p className="font-semibold text-gray-900">{partner.business_name}</p></div></div>
                      <div className="flex items-start gap-3"><Shield className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Background Check</p><Badge status={partner.background_check_status}>{partner.background_check_status}</Badge></div></div>
                      <div className="flex items-start gap-3"><DollarSign className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Partner Score</p><p className="font-semibold text-gray-900">{(Number(partner.partner_score) || 0).toFixed(1)}/100</p></div></div>
                    </div>
                  </Card>
                  <Card title="Contact Information">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3"><User className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Owner Name</p><p className="font-semibold text-gray-900">{partner.user.name || 'Not provided'}</p></div></div>
                      <div className="flex items-start gap-3"><Phone className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Phone</p><p className="font-semibold text-gray-900">{partner.user.phone}</p></div></div>
                      {partner.user.email && <div className="flex items-start gap-3"><Mail className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">Email</p><p className="font-semibold text-gray-900">{partner.user.email}</p></div></div>}
                      <div className="flex items-start gap-3"><Shield className="w-5 h-5 text-gray-400 mt-1" /><div><p className="text-sm text-gray-500">KYC Status</p><Badge status={partner.user.kyc_status}>{partner.user.kyc_status}</Badge></div></div>
                    </div>
                  </Card>
                  <Card title={`Service Areas (${serviceAreas.length})`}>
                    <div className="p-6">
                      {serviceAreas.length === 0 ? <div className="text-center py-8"><MapPin size={40} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No service areas configured</p></div>
                        : <div className="space-y-3">{serviceAreas.map(area => (
                          <div key={area.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div className="flex-1"><div className="flex items-center justify-between"><p className="font-semibold text-gray-900">{area.name || `${area.city}, ${area.state}`}</p><Badge status={area.is_active ? 'active' : 'suspended'}>{area.is_active ? 'Active' : 'Inactive'}</Badge></div>
                              <p className="text-sm text-gray-500 mt-0.5">Radius: {area.radius_km}km · {area.city}, {area.state}</p>
                            </div>
                          </div>
                        ))}</div>}
                    </div>
                  </Card>
                  <Card title={`Bank Accounts (${bankAccounts.length})`}>
                    <div className="p-6">
                      {bankAccounts.length === 0 ? <div className="text-center py-8"><CreditCard size={40} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No bank accounts added</p></div>
                        : <div className="space-y-3">{bankAccounts.map(acc => (
                          <div key={acc.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                            <CreditCard className="w-5 h-5 text-gray-400 mt-1" />
                            <div className="flex-1"><div className="flex items-center justify-between"><p className="font-semibold">{acc.bank_name}</p><div className="flex gap-2">{acc.is_primary && <Badge status="active">Primary</Badge>}{acc.is_verified && <Badge status="verified">Verified</Badge>}</div></div>
                              <p className="text-sm text-gray-600">{acc.account_holder_name}</p>
                              <p className="text-xs text-gray-500 font-mono">{acc.account_number_masked} · {acc.ifsc_code}</p>
                            </div>
                          </div>
                        ))}</div>}
                    </div>
                  </Card>
                  <Card title={`Documents (${documents.length})`}>
                    <div className="p-6">
                      {documents.length === 0 ? <div className="text-center py-8"><FileText size={40} className="mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No documents uploaded</p></div>
                        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{documents.map(doc => (
                          <DocReviewCard key={doc.id} doc={doc} partnerId={id!}
                            onUpdated={updated => setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))} />
                        ))}</div>}
                    </div>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card title="Account Status">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Partner Status</span><Badge status={partner.status}>{partner.status}</Badge></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Availability</span><Badge status={partner.is_available ? 'active' : 'suspended'}>{partner.is_available ? 'Available' : 'Unavailable'}</Badge></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">KYC Status</span><Badge status={partner.user.kyc_status}>{partner.user.kyc_status}</Badge></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-600">Background Check</span><Badge status={partner.background_check_status}>{partner.background_check_status}</Badge></div>
                    </div>
                  </Card>
                  <Card title="Profile Completion">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Score</span>
                        <span className={`text-lg font-black ${completionColor} px-2.5 py-0.5 rounded-lg`}>{overviewLoaded ? `${pct}%` : '—'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${overviewLoaded ? pct : 0}%` }} />
                      </div>
                      <button onClick={() => setActiveTab('verification')}
                        className="mt-3 w-full text-sm text-emerald-600 font-semibold hover:text-emerald-800 flex items-center justify-center gap-1">
                        <ShieldCheck size={14} /> Manage Verification →
                      </button>
                    </div>
                  </Card>
                  <Card title="Service Details">
                    <div className="p-6 space-y-3">
                      <div><p className="text-sm text-gray-500">Service Radius</p><p className="font-semibold">{partner.service_radius_km} km</p></div>
                      <div><p className="text-sm text-gray-500">Price Range</p><p className="font-semibold">{fmt(partner.price_range_min)} – {fmt(partner.price_range_max)}</p></div>
                      <div><p className="text-sm text-gray-500">Service Areas</p><p className="font-semibold">{serviceAreas.length} configured</p></div>
                      <div><p className="text-sm text-gray-500">Active Agents</p><p className="font-semibold">{stats.active_agents}</p></div>
                    </div>
                  </Card>
                  <Card title="Important Dates">
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><div><p className="text-sm text-gray-500">Joined</p><p className="text-sm font-semibold">{fmtD(partner.created_at)}</p></div></div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><div><p className="text-sm text-gray-500">Last Updated</p><p className="text-sm font-semibold">{fmtD(partner.updated_at)}</p></div></div>
                    </div>
                  </Card>
                  <Card title="Actions">
                    <div className="p-6 space-y-3">
                      {partner.status === 'pending' && <>
                        <button onClick={() => setActionModal('approve')} className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"><CheckCircle size={18} />Approve Partner</button>
                        <button onClick={() => setActionModal('reject')} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 border border-red-200"><XCircle size={18} />Reject Partner</button>
                      </>}
                      {partner.status === 'approved' && <button onClick={() => setActionModal('suspend')} className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 border border-red-200"><Ban size={18} />Suspend Partner</button>}
                      {partner.status === 'suspended' && <button onClick={() => setActionModal('activate')} className="w-full px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 flex items-center justify-center gap-2 border border-emerald-200"><PlayCircle size={18} />Activate Partner</button>}
                      <button onClick={() => setEditing(true)} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"><Pencil size={18} />Edit Partner</button>
                      <button onClick={() => setDeleteOpen(true)} className="w-full px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"><Trash2 size={18} />Delete Partner</button>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════ VERIFICATION TAB ════ */}
        {activeTab === 'verification' && (
          <VerificationTab
            partner={partner}
            docs={documents}
            banks={bankAccounts}
            areas={serviceAreas}
            loadingData={loadingTab && !overviewLoaded}
            onDocUpdated={updated => setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))}
            onPartnerUpdated={p => { setPartner(p); loadPartner(); }}
            onStatusAction={a => setActionModal(a)}
            showAlert={showAlert}
          />
        )}

        {/* ════ LEADS TAB ════ */}
        {activeTab === 'leads' && (
          <Card title={`Leads (${leadsCount})`}>
            <div className="p-6 border-b border-gray-100 flex gap-4 flex-wrap">
              <select value={leadFilters.status} onChange={e => setLeadFilters(f => ({ ...f, status: e.target.value }))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="all">All Status</option>
                {['booked','partner_assigned','visit_scheduled','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <input type="text" value={leadFilters.search} onChange={e => setLeadFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search leads…" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="p-6">
              {loadingTab ? <TabLoader /> : leads.length === 0
                ? <div className="text-center py-12"><Package size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No leads found</p></div>
                : <div className="overflow-x-auto">
                  <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['Lead #','Customer','Device','Price','Status','Date'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-gray-100">{leads.map(lead=>(
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-700">{lead.lead_number}</td>
                        <td className="px-4 py-3"><div className="font-medium text-gray-900">{lead.customer_name}</div></td>
                        <td className="px-4 py-3"><div className="font-medium text-gray-900">{lead.device_name}</div></td>
                        <td className="px-4 py-3">{lead.final_price ? <span className="font-semibold text-emerald-600">{fmt(lead.final_price)}</span> : '—'}</td>
                        <td className="px-4 py-3"><Badge status={lead.status}>{lead.status_display}</Badge></td>
                        <td className="px-4 py-3 text-gray-600">{fmtD(lead.created_at)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>}
            </div>
            {leadPages > 1 && <Pager page={leadPage} total={leadsCount} pages={leadPages} size={20} onChange={loadLeads} />}
          </Card>
        )}

        {/* ════ WALLET TAB ════ */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card><div className="p-6"><p className="text-sm text-gray-500">Total Balance</p><p className="text-3xl font-bold text-gray-900 mt-2">{fmt(walletSnap?.balance ?? 0)}</p></div></Card>
              <Card><div className="p-6"><p className="text-sm text-gray-500">Available</p><p className="text-3xl font-bold text-emerald-600 mt-2">{fmt(walletSnap?.available_balance ?? 0)}</p></div></Card>
              <Card><div className="p-6"><p className="text-sm text-gray-500">Blocked</p><p className="text-3xl font-bold text-red-600 mt-2">{fmt(walletSnap?.blocked_amount ?? 0)}</p></div></Card>
            </div>
            <Card title={`Transactions (${transactionsCount})`}>
              <div className="p-6 border-b border-gray-100">
                <select value={txnFilters.type} onChange={e => setTxnFilters({ type: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="all">All Transactions</option><option value="credit">Credit Only</option><option value="debit">Debit Only</option>
                </select>
              </div>
              <div className="p-6">
                {loadingTab ? <TabLoader /> : transactions.length === 0
                  ? <div className="text-center py-12"><CreditCard size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No transactions found</p></div>
                  : <div className="space-y-3">{transactions.map(txn=>(
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.transaction_type==='credit'?'bg-emerald-100':'bg-red-100'}`}>
                          {txn.transaction_type==='credit'?<TrendingUp className="w-5 h-5 text-emerald-600"/>:<TrendingDown className="w-5 h-5 text-red-600"/>}
                        </div>
                        <div><p className="font-semibold text-gray-900">{txn.description}</p><p className="text-sm text-gray-500">{fmtDT(txn.created_at)}</p></div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${txn.transaction_type==='credit'?'text-emerald-600':'text-red-600'}`}>{txn.transaction_type==='credit'?'+':'–'}{fmt(txn.amount)}</p>
                        <p className="text-sm text-gray-500">Balance: {fmt(txn.balance_after)}</p>
                      </div>
                    </div>
                  ))}</div>}
              </div>
              {txnPages > 1 && <Pager page={txnPage} total={transactionsCount} pages={txnPages} size={20} onChange={loadTransactions} />}
            </Card>
          </div>
        )}

        {/* ════ AGENTS TAB ════ */}
        {activeTab === 'agents' && (
          <Card title={`Agents (${agents.length})`}>
            <div className="p-6">
              {loadingTab ? <TabLoader /> : agents.length === 0
                ? <div className="text-center py-12"><Users size={48} className="mx-auto mb-4 text-gray-300"/><p className="text-gray-500">No agents found</p></div>
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{agents.map(agent=>(
                  <div key={agent.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div><p className="font-semibold text-gray-900">{agent.name}</p><p className="text-sm text-gray-500">{agent.phone}</p><p className="text-xs text-gray-400">Code: {agent.employee_code}</p></div>
                      <Badge status={agent.status}>{agent.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                      <div><p className="text-xs text-gray-500">Total</p><p className="text-sm font-bold">{agent.total_assignments}</p></div>
                      <div><p className="text-xs text-gray-500">Done</p><p className="text-sm font-bold text-emerald-600">{agent.completed_assignments}</p></div>
                      <div><p className="text-xs text-gray-500">Rate</p><p className="text-sm font-bold text-blue-600">{agent.completion_rate.toFixed(0)}%</p></div>
                    </div>
                  </div>
                ))}</div>}
            </div>
          </Card>
        )}

        {/* ════ ACTIVITY TAB ════ */}
        {activeTab === 'activity' && (
          <Card title={`Activity Logs (${actCount})`}>
            <div className="p-6">
              {loadingTab ? <TabLoader /> : activities.length === 0
                ? <div className="text-center py-12"><Activity size={48} className="mx-auto mb-4 text-gray-300"/><p className="text-gray-500">No activity logs found</p></div>
                : <div className="space-y-3">{activities.map(a=>(
                  <div key={a.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Activity className="w-5 h-5 text-gray-400 mt-1"/>
                    <div className="flex-1"><p className="font-semibold text-gray-900">{a.description}</p>
                      <div className="flex items-center gap-3 mt-1"><p className="text-sm text-gray-500">{a.agent_name}</p><span className="text-gray-300">•</span><p className="text-sm text-gray-500">{fmtDT(a.created_at)}</p></div>
                    </div>
                  </div>
                ))}</div>}
            </div>
            {actPages > 1 && <Pager page={actPage} total={actCount} pages={actPages} size={30} onChange={loadActivity} />}
          </Card>
        )}

        {/* ════ PERFORMANCE TAB ════ */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <select value={performanceDays} onChange={e => setPerfDays(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
              </select>
            </div>
            {loadingTab && !performance ? <TabLoader /> : performance ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card><div className="p-6"><p className="text-sm text-gray-500">Total Leads</p><p className="text-3xl font-bold text-gray-900 mt-2">{performance.leads.total}</p><p className="text-xs text-gray-400 mt-1">{performance.leads.completed} completed</p></div></Card>
                  <Card><div className="p-6"><p className="text-sm text-gray-500">Completion Rate</p><p className="text-3xl font-bold text-emerald-600 mt-2">{performance.leads.completion_rate.toFixed(1)}%</p></div></Card>
                  <Card><div className="p-6"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-3xl font-bold text-purple-600 mt-2">{fmt(performance.revenue.total)}</p></div></Card>
                  <Card><div className="p-6"><p className="text-sm text-gray-500">Active Agents</p><p className="text-3xl font-bold text-blue-600 mt-2">{performance.agents.active_agents}/{performance.agents.total_agents}</p></div></Card>
                </div>
                <Card title="Daily Breakdown">
                  <div className="p-6 space-y-3">
                    {performance.daily_breakdown.slice(-14).map(day => {
                      const max = Math.max(...performance.daily_breakdown.map(d => d.leads), 1);
                      return (
                        <div key={day.date} className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 w-28 flex-shrink-0">{fmtD(day.date)}</span>
                          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(day.leads / max) * 100}%` }} /></div>
                          <div className="flex gap-4 text-sm flex-shrink-0">
                            <span className="text-gray-700 w-16 text-right">{day.completed}/{day.leads}</span>
                            <span className="text-purple-600 w-20 text-right font-medium">{fmt(day.revenue)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            ) : <div className="text-center py-12"><BarChart3 size={48} className="mx-auto mb-4 text-gray-300"/><p className="text-gray-500">No performance data available</p></div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDetail;