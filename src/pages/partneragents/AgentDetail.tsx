// pages/agents/AgentDetail.tsx
// Full agent detail: Edit, Delete, KYC verify/reject + user KYC, assignments, activity, stats
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, CheckCircle, XCircle, Phone, Mail, Building2,
  Shield, AlertCircle, Ban, Activity, Package, RefreshCw, AlertTriangle,
  ChevronLeft, ChevronRight, Pencil, Trash2, Save, X, Loader2,
  ShieldCheck, ShieldAlert, Eye, TrendingUp, Users, Clock, MapPin,
  FileText, CreditCard, BarChart3, PlayCircle, UserCheck,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Agent {
  id: string; employee_code: string;
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_notes: string; verified_at: string | null;
  is_available: boolean; max_concurrent_leads: number; can_accept_leads: boolean;
  total_leads_completed: number; total_visits_completed: number; average_rating: number;
  notes: string; aadhaar_number_masked: string;
  aadhaar_front_url: string | null; aadhaar_back_url: string | null;
  last_known_latitude: number | null; last_known_longitude: number | null;
  last_location_update: string | null; created_at: string; updated_at: string;
  partner: { id: string; business_name: string; status: string };
  user: { id: string; phone: string; name: string; email: string | null; kyc_status: string; role: string };
}
interface AgentStats {
  all_time: { total_assignments: number; completed: number; cancelled: number; customer_rejected: number; completion_rate: number; total_revenue: number; avg_deal_value: number; average_rating: number };
  recent: { period_days: number; total: number; completed: number; revenue: number };
  live: { active_assignments: number; is_available: boolean; can_accept_leads: boolean; max_concurrent: number };
}
interface Assignment {
  id: string; status: string; status_display: string; priority: string;
  lead_number: string; lead_id: string; customer_name: string; customer_phone: string;
  device_name: string; estimated_price: number; final_price: number | null;
  customer_response: string | null; rating: number | null;
  assigned_at: string; accepted_at: string | null; completed_at: string | null; cancelled_at: string | null;
}
interface ActivityLog {
  id: string; activity_type: string; description: string;
  metadata: Record<string, any>; latitude: number | null; longitude: number | null; created_at: string;
}
interface EditForm {
  employee_code: string; status: string; is_available: boolean;
  max_concurrent_leads: string; notes: string; verification_notes: string;
  aadhaar_number: string; user_name: string; user_email: string; user_kyc_status: string;
}

type Tab = 'overview' | 'assignments' | 'activity' | 'performance';
type AlertType = 'success' | 'error' | 'warning';

// ── API ───────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((c) => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use((r) => r, (e) => { if (e.response?.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/admin/login'; } return Promise.reject(e); });

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtD  = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDT = (s: string) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ASSIGN_CLR: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800',
  assigned: 'bg-blue-100 text-blue-800', accepted: 'bg-blue-100 text-blue-800',
  en_route: 'bg-indigo-100 text-indigo-800', checked_in: 'bg-purple-100 text-purple-800',
  inspecting: 'bg-violet-100 text-violet-800', customer_rejected: 'bg-orange-100 text-orange-800',
};

// ── Shared ────────────────────────────────────────────────────────────────────
const Badge: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
  const m: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800', inactive: 'bg-gray-100 text-gray-700',
    suspended: 'bg-orange-100 text-orange-800', terminated: 'bg-red-100 text-red-800',
    verified: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m[status] || 'bg-gray-100 text-gray-800'}`}>{children}</span>;
};

const AlertBanner: React.FC<{ type: AlertType; message: string; onClose: () => void }> = ({ type, message, onClose }) => {
  const cfg = { success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', Icon: CheckCircle }, error: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', Icon: XCircle }, warning: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', Icon: AlertCircle } }[type];
  return (
    <div className={`${cfg.bg} ${cfg.text} border ${cfg.border} rounded-lg p-4 flex items-center justify-between mb-6`}>
      <div className="flex items-center gap-3"><cfg.Icon size={18} /><span className="font-medium text-sm">{message}</span></div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XCircle size={16} /></button>
    </div>
  );
};

const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" /><p className="mt-2 text-sm text-gray-600">Loading…</p></div>
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

const KpiCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> = ({ label, value, sub, color = 'text-gray-900' }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold mt-1.5 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
//  KYC PANEL — verify/reject aadhaar + update user kyc_status
// ══════════════════════════════════════════════════════════════════════════════
const KYCPanel: React.FC<{ agent: Agent; onUpdated: (patch: Partial<Agent>) => void; showAlert: (t: AlertType, m: string) => void }> =
  ({ agent, onUpdated, showAlert }) => {
  const [docAction, setDocAction]   = useState<'verify' | 'reject' | null>(null);
  const [docNotes, setDocNotes]     = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [userKyc, setUserKyc]       = useState(agent.user.kyc_status);
  const [userKycLoading, setUKL]    = useState(false);

  const submitDocAction = async () => {
    if (docAction === 'reject' && !docNotes.trim()) return;
    setDocLoading(true);
    try {
      const ep = docAction === 'verify' ? 'verify_kyc' : 'reject_kyc';
      const { data } = await api.post(`/admin/agents/${agent.id}/${ep}/`, { notes: docNotes, also_verify_user_kyc: docAction === 'verify' });
      onUpdated({ verification_status: data.verification_status, verified_at: data.verified_at });
      if (data.user_kyc_status) setUserKyc(data.user_kyc_status);
      showAlert('success', `Agent KYC ${docAction === 'verify' ? 'verified' : 'rejected'} successfully.`);
      setDocAction(null); setDocNotes('');
    } catch (e: any) { showAlert('error', e.response?.data?.error || 'KYC action failed.'); }
    finally { setDocLoading(false); }
  };

  const updateUserKyc = async () => {
    setUKL(true);
    try {
      const { data } = await api.post(`/admin/agents/${agent.id}/update_user_kyc/`, { kyc_status: userKyc });
      showAlert('success', `User KYC updated: ${data.old_kyc_status} → ${data.new_kyc_status}`);
    } catch (e: any) { showAlert('error', e.response?.data?.error || 'Failed to update user KYC.'); }
    finally { setUKL(false); }
  };

  const vst = agent.verification_status;
  const docBorder = vst === 'verified' ? 'border-emerald-200 bg-emerald-50' : vst === 'rejected' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50';
  const DocIcon = vst === 'verified' ? ShieldCheck : vst === 'rejected' ? ShieldAlert : Shield;
  const docIconCls = vst === 'verified' ? 'text-emerald-600' : vst === 'rejected' ? 'text-red-600' : 'text-amber-500';

  return (
    <div className="space-y-6">
      {/* ── Agent KYC (Aadhaar) ── */}
      <div className={`rounded-xl border p-5 ${docBorder}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DocIcon size={20} className={docIconCls} />
            <h4 className="font-bold text-gray-900">Agent KYC — Aadhaar Verification</h4>
            <Badge status={vst}>{vst}</Badge>
          </div>
          {agent.verified_at && <p className="text-xs text-gray-500">Verified {fmtDT(agent.verified_at)}</p>}
        </div>

        {/* Aadhaar info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div><p className="text-xs text-gray-500">Aadhaar Number</p><p className="font-semibold text-gray-900 font-mono">{agent.aadhaar_number_masked}</p></div>
          <div><p className="text-xs text-gray-500">Current Status</p><Badge status={vst}>{vst}</Badge></div>
          {agent.verification_notes && <div><p className="text-xs text-gray-500">Notes</p><p className="text-sm text-gray-700">{agent.verification_notes}</p></div>}
        </div>

        {/* Aadhaar images */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[{ label: 'Aadhaar Front', url: agent.aadhaar_front_url }, { label: 'Aadhaar Back', url: agent.aadhaar_back_url }].map(({ label, url }) => (
            <div key={label} className={`rounded-lg border border-gray-200 overflow-hidden bg-white ${url ? '' : 'opacity-50'}`}>
              <p className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100 bg-gray-50 font-medium">{label}</p>
              {url ? (
                <div className="relative">
                  <img src={url} alt={label} className="w-full h-36 object-cover" />
                  <a href={url} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-lg hover:bg-white"><Eye size={14} className="text-gray-600" /></a>
                </div>
              ) : (
                <div className="flex items-center justify-center h-36 text-gray-400"><div className="text-center"><FileText size={24} className="mx-auto mb-1" /><p className="text-xs">Not uploaded</p></div></div>
              )}
            </div>
          ))}
        </div>

        {/* Verify / Reject actions */}
        {docAction === null ? (
          <div className="flex items-center gap-2 pt-3 border-t border-black/10">
            {vst !== 'verified' && <button onClick={() => setDocAction('verify')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"><ShieldCheck size={14} />Verify KYC</button>}
            {vst !== 'rejected' && <button onClick={() => setDocAction('reject')} className="flex items-center gap-1.5 px-4 py-2 border border-red-200 bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100"><ShieldAlert size={14} />Reject KYC</button>}
          </div>
        ) : (
          <div className="pt-3 border-t border-black/10 space-y-2">
            {docAction === 'verify' ? (
              <>
                <p className="text-sm font-semibold text-emerald-700">Confirm KYC verification — optional notes:</p>
                <input value={docNotes} onChange={e => setDocNotes(e.target.value)} placeholder="Notes (optional)…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-gray-500 flex items-center gap-1"><UserCheck size={12} className="text-emerald-600" />This will also set the user's KYC status to "verified".</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-red-700">Rejection reason (required):</p>
                <textarea value={docNotes} onChange={e => setDocNotes(e.target.value)} rows={2} placeholder="Why is KYC being rejected?" className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-400 bg-white" />
              </>
            )}
            <div className="flex gap-2">
              <button onClick={submitDocAction} disabled={docLoading || (docAction === 'reject' && !docNotes.trim())}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors ${docAction === 'verify' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {docLoading && <Loader2 size={13} className="animate-spin" />}{docAction === 'verify' ? 'Confirm Verify' : 'Confirm Reject'}
              </button>
              <button onClick={() => { setDocAction(null); setDocNotes(''); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ── User KYC (linked User account) ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserCheck size={17} className="text-blue-600" />User Account KYC Status</h4>
        <p className="text-sm text-gray-600 mb-4">
          This controls the <strong>User.kyc_status</strong> field on the linked account — the same field used by the main accounts KYC system.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current: <strong>{agent.user.kyc_status}</strong></p>
            <select value={userKyc} onChange={e => setUserKyc(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-36">
              {['pending', 'in_review', 'verified', 'rejected'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <button onClick={updateUserKyc} disabled={userKycLoading || userKyc === agent.user.kyc_status}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-4">
            {userKycLoading && <Loader2 size={13} className="animate-spin" />}Update User KYC
          </button>
        </div>
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <p className="font-semibold mb-1">KYC Status meanings:</p>
          <p>• <strong>pending</strong> — Not submitted</p>
          <p>• <strong>in_review</strong> — Documents uploaded, under review</p>
          <p>• <strong>verified</strong> — Identity confirmed (set automatically when you verify KYC above)</p>
          <p>• <strong>rejected</strong> — Verification failed</p>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  EDIT FORM (Overview)
// ══════════════════════════════════════════════════════════════════════════════
const EditAgentForm: React.FC<{ agent: Agent; onSave: (a: Agent) => void; onCancel: () => void }> =
  ({ agent, onSave, onCancel }) => {
  const [form, setForm] = useState<EditForm>({
    employee_code: agent.employee_code, status: agent.status,
    is_available: agent.is_available,
    max_concurrent_leads: String(agent.max_concurrent_leads),
    notes: agent.notes, verification_notes: agent.verification_notes,
    aadhaar_number: '', // blank = no change
    user_name: agent.user.name, user_email: agent.user.email || '',
    user_kyc_status: agent.user.kyc_status,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500';
  const sel = `${inp} bg-white`;
  const set = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSave = async () => {
    setLoading(true); setErr(null);
    try {
      const body: any = {
        employee_code: form.employee_code, status: form.status,
        is_available: form.is_available,
        max_concurrent_leads: Number(form.max_concurrent_leads),
        notes: form.notes, verification_notes: form.verification_notes,
        user: { name: form.user_name, email: form.user_email || null, kyc_status: form.user_kyc_status },
      };
      if (form.aadhaar_number.trim()) body.aadhaar_number = form.aadhaar_number.trim();
      const { data } = await api.patch(`/admin/agents/${agent.id}/`, body);
      onSave(data.agent);
    } catch (e: any) { setErr(e.response?.data?.detail || e.response?.data?.error || 'Save failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-emerald-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Pencil size={16} className="text-emerald-600" />Edit Agent</h3>
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
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">User KYC Status</label>
              <select value={form.user_kyc_status} onChange={set('user_kyc_status')} className={sel}>
                {['pending', 'in_review', 'verified', 'rejected'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Agent Details</p>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Employee Code</label><input value={form.employee_code} onChange={set('employee_code')} className={inp} /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Max Concurrent Leads</label><input value={form.max_concurrent_leads} onChange={set('max_concurrent_leads')} type="number" className={inp} /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Aadhaar Number <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label><input value={form.aadhaar_number} onChange={set('aadhaar_number')} placeholder="12-digit number" maxLength={12} className={inp} /></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-gray-100">
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={set('status')} className={sel}>{['active', 'inactive', 'suspended', 'terminated'].map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Available for Leads</label>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={set('is_available')} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">{form.is_available ? 'Yes' : 'No'}</span>
            </label>
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Verification Notes</label><input value={form.verification_notes} onChange={set('verification_notes')} className={inp} /></div>
        </div>
        <div><label className="block text-xs font-semibold text-gray-700 mb-1">Internal Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inp} resize-none`} /></div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const AgentDetail: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [agent, setAgent]           = useState<Agent | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [alert, setAlert]           = useState<{ type: AlertType; message: string } | null>(null);
  const [editing, setEditing]       = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDL]      = useState(false);
  const [deleteTyped, setDT]        = useState('');
  const [deleteErr, setDE]          = useState<string | null>(null);
  const [statusLoading, setSL]      = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const loadedTabs = useRef<Set<Tab>>(new Set());

  // Assignments
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignMeta, setAssignMeta]   = useState({ count: 0, page: 1, totalPages: 1 });
  const [assignFilter, setAssignFilter] = useState({ status: '', search: '' });

  // Activity
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [actMeta, setActMeta]        = useState({ count: 0, page: 1, totalPages: 1 });

  // Performance
  const [perfDays, setPerfDays] = useState(30);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showAlert = useCallback((type: AlertType, message: string) => {
    setAlert({ type, message }); setTimeout(() => setAlert(null), 5000);
  }, []);

  // ── Load agent ──────────────────────────────────────────────────────────
  const loadAgent = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const [aRes, sRes] = await Promise.all([
        api.get<Agent>(`/admin/agents/${id}/`),
        api.get<AgentStats>(`/admin/agents/${id}/stats/`),
      ]);
      setAgent(aRes.data); setAgentStats(sRes.data);
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to load agent.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadAgent(); }, [loadAgent]);

  // ── Tab loaders ──────────────────────────────────────────────────────────
  const loadAssignments = useCallback(async (page = 1) => {
    if (!id) return;
    try {
      const params: any = { page, page_size: 20 };
      if (assignFilter.status) params.status = assignFilter.status;
      if (assignFilter.search) params.search = assignFilter.search;
      const { data } = await api.get(`/admin/agents/${id}/assignments/`, { params });
      setAssignments(data.results || []); setAssignMeta({ count: data.count, page: data.page, totalPages: data.total_pages });
    } catch { }
  }, [id, assignFilter]);

  const loadActivity = useCallback(async (page = 1) => {
    if (!id) return;
    try {
      const { data } = await api.get(`/admin/agents/${id}/activity/`, { params: { page, page_size: 30 } });
      setActivities(data.results || []); setActMeta({ count: data.count, page: data.page, totalPages: data.total_pages });
    } catch { }
  }, [id]);

  const loadStats = useCallback(async (days = perfDays) => {
    if (!id) return;
    try { const { data } = await api.get<AgentStats>(`/admin/agents/${id}/stats/`, { params: { days } }); setAgentStats(data); } catch { }
  }, [id, perfDays]);

  useEffect(() => {
    switch (activeTab) {
      case 'assignments': loadAssignments(1); break;
      case 'activity':    loadActivity(1);    break;
      case 'performance': loadStats(perfDays); break;
    }
  }, [activeTab]); // eslint-disable-line

  useEffect(() => { if (activeTab === 'assignments') loadAssignments(1); }, [assignFilter]); // eslint-disable-line
  useEffect(() => { if (activeTab === 'performance') loadStats(perfDays); }, [perfDays]); // eslint-disable-line

  // ── Status actions ─────────────────────────────────────────────────────
  const handleStatus = async (action: 'activate' | 'deactivate' | 'suspend') => {
    if (!id) return;
    setSL(true);
    try {
      await api.post(`/admin/agents/${id}/${action}/`);
      showAlert('success', `Agent ${action}d.`);
      loadAgent();
    } catch (e: any) { showAlert('error', e.response?.data?.error || 'Action failed.'); }
    finally { setSL(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDL(true); setDE(null);
    try {
      await api.delete(`/admin/agents/${id}/`);
      navigate('/agents');
    } catch (e: any) { setDE(e.response?.data?.detail || 'Delete failed.'); setDL(false); }
  };

  // ── Renders ────────────────────────────────────────────────────────────
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><Loader2 size={36} className="mx-auto text-emerald-600 animate-spin" /><p className="mt-4 text-gray-600">Loading agent…</p></div></div>;
  if (error || !agent) return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><AlertCircle size={48} className="text-red-500 mx-auto mb-4" /><p className="text-red-600 mb-4">{error || 'Agent not found'}</p><button onClick={() => navigate('/agents')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Back to Agents</button></div></div>;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',     label: 'Overview',     icon: <Building2 size={14} /> },
    { key: 'assignments',  label: 'Assignments',  icon: <Package size={14} /> },
    { key: 'activity',     label: 'Activity',     icon: <Activity size={14} /> },
    { key: 'performance',  label: 'Performance',  icon: <BarChart3 size={14} /> },
  ];

  const vst = agent.verification_status;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Delete modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteOpen(false)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div><div><h3 className="font-bold text-gray-900">Delete Agent</h3><p className="text-sm text-gray-600">{agent.user.name}</p></div></div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800"><p className="font-semibold mb-1">⚠ Irreversible</p><p>Permanently deletes this agent profile and the linked user account.</p></div>
              <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Type <span className="font-mono text-red-600">delete</span> to confirm</label><input value={deleteTyped} onChange={e => setDT(e.target.value)} placeholder="delete" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400" /></div>
              {deleteErr && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{deleteErr}</p>}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setDeleteOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading || deleteTyped.trim().toLowerCase() !== 'delete'} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {deleteLoading && <Loader2 size={13} className="animate-spin" />}<Trash2 size={13} />Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/agents')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft size={22} /></button>
            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><span className="text-xl font-bold text-emerald-700">{(agent.user.name || 'A')[0].toUpperCase()}</span></div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{agent.user.name}</h1>
                <Badge status={agent.status}>{agent.status}</Badge>
                <Badge status={vst}>{vst}</Badge>
                {agent.is_available && <Badge status="active">Available</Badge>}
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1"><Phone size={12} />{agent.user.phone}</span>
                {agent.user.email && <span className="flex items-center gap-1"><Mail size={12} />{agent.user.email}</span>}
                <span className="flex items-center gap-1"><Building2 size={12} />{agent.partner.business_name}</span>
                {agent.employee_code && <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">#{agent.employee_code}</span>}
                <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" />{(Number(agent.average_rating) || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={loadAgent} className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"><RefreshCw size={15} /></button>
            {activeTab === 'overview' && !editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><Pencil size={14} />Edit</button>}
            {agent.status === 'active' && <button onClick={() => handleStatus('suspend')} disabled={statusLoading} className="flex items-center gap-1.5 px-3 py-2 border border-orange-200 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 disabled:opacity-50"><Ban size={14} />Suspend</button>}
            {agent.status === 'active' && <button onClick={() => handleStatus('deactivate')} disabled={statusLoading} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"><XCircle size={14} />Deactivate</button>}
            {(agent.status === 'inactive' || agent.status === 'suspended') && <button onClick={() => handleStatus('activate')} disabled={statusLoading} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"><PlayCircle size={14} />Activate</button>}
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"><Trash2 size={14} />Delete</button>
            <button onClick={() => navigate(`/partners/${agent.partner.id}`)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Eye size={14} />Partner Page</button>
          </div>
        </div>

        {/* ── KPI bar ── */}
        {agentStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { l: 'Total Assigned', v: agentStats.all_time.total_assignments },
              { l: 'Completed',      v: agentStats.all_time.completed,       c: 'text-emerald-600' },
              { l: 'Completion Rate', v: `${agentStats.all_time.completion_rate.toFixed(1)}%`, c: 'text-blue-600' },
              { l: 'Total Revenue',  v: fmt(agentStats.all_time.total_revenue), c: 'text-purple-600' },
              { l: 'Active Now',     v: agentStats.live.active_assignments,   c: 'text-teal-600' },
              { l: 'Avg Deal',       v: fmt(agentStats.all_time.avg_deal_value) },
            ].map(({ l, v, c = 'text-gray-900' }) => (
              <div key={l} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 text-center">
                <p className="text-xs text-gray-500">{l}</p><p className={`text-lg font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="border-b border-gray-200 bg-white rounded-t-lg px-6 flex gap-6 overflow-x-auto sticky top-0 z-10">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => { setActiveTab(key); setEditing(false); }}
              className={`flex items-center gap-1.5 py-4 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {editing ? (
              <EditAgentForm agent={agent} onSave={a => { setAgent(a); setEditing(false); showAlert('success', 'Agent updated.'); }} onCancel={() => setEditing(false)} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — info cards */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Agent Profile */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[
                        { l: 'Full Name', v: agent.user.name },
                        { l: 'Phone', v: agent.user.phone },
                        { l: 'Email', v: agent.user.email || '—' },
                        { l: 'Employee Code', v: agent.employee_code || '—' },
                        { l: 'Partner', v: agent.partner.business_name },
                        { l: 'Max Concurrent Leads', v: agent.max_concurrent_leads },
                        { l: 'User KYC', v: <Badge status={agent.user.kyc_status}>{agent.user.kyc_status}</Badge> },
                        { l: 'Can Accept Leads', v: agent.can_accept_leads ? 'Yes' : 'No' },
                      ].map(({ l, v }) => (
                        <div key={l} className="flex items-start gap-3">
                          <div><p className="text-sm text-gray-500">{l}</p><p className="font-semibold text-gray-900">{v}</p></div>
                        </div>
                      ))}
                    </div>
                    {agent.notes && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-xs text-gray-500 mb-1">Internal Notes</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{agent.notes}</p></div>}
                  </div>

                  {/* KYC Panel */}
                  <KYCPanel agent={agent} onUpdated={patch => setAgent(a => a ? { ...a, ...patch } : a)} showAlert={showAlert} />

                  {/* Location */}
                  {agent.last_known_latitude && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin size={17} />Last Known Location</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><p className="text-gray-500">Latitude</p><p className="font-semibold">{agent.last_known_latitude}</p></div>
                        <div><p className="text-gray-500">Longitude</p><p className="font-semibold">{agent.last_known_longitude}</p></div>
                        <div><p className="text-gray-500">Updated</p><p className="font-semibold">{agent.last_location_update ? fmtDT(agent.last_location_update) : '—'}</p></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                  {/* Status card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                    <div className="space-y-3">
                      {[
                        { l: 'Agent Status', v: <Badge status={agent.status}>{agent.status}</Badge> },
                        { l: 'KYC Verification', v: <Badge status={vst}>{vst}</Badge> },
                        { l: 'Availability', v: <Badge status={agent.is_available ? 'active' : 'inactive'}>{agent.is_available ? 'Available' : 'Unavailable'}</Badge> },
                        { l: 'User KYC', v: <Badge status={agent.user.kyc_status}>{agent.user.kyc_status}</Badge> },
                      ].map(({ l, v }) => (
                        <div key={l} className="flex items-center justify-between"><span className="text-sm text-gray-600">{l}</span>{v}</div>
                      ))}
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                    <div className="space-y-3">
                      {[
                        { l: 'Total Completed', v: `${agent.total_leads_completed}` },
                        { l: 'Avg Rating', v: `${(Number(agent.average_rating) || 0).toFixed(1)}/5` },
                        { l: 'Completion Rate', v: `${(agentStats?.all_time?.completion_rate || 0).toFixed(1)}%` },
                        { l: 'Avg Deal Value', v: fmt(agentStats?.all_time?.avg_deal_value || 0) },
                      ].map(({ l, v }) => (
                        <div key={l} className="flex items-center justify-between"><span className="text-sm text-gray-600">{l}</span><span className="font-semibold text-gray-900">{v}</span></div>
                      ))}
                    </div>
                  </div>

                  {/* Actions card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => setEditing(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"><Pencil size={16} />Edit Agent</button>
                      {agent.status === 'active' ? (
                        <>
                          <button onClick={() => handleStatus('deactivate')} disabled={statusLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 disabled:opacity-50"><XCircle size={16} />Deactivate</button>
                          <button onClick={() => handleStatus('suspend')} disabled={statusLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 text-sm font-medium text-orange-700 disabled:opacity-50"><Ban size={16} />Suspend</button>
                        </>
                      ) : (
                        <button onClick={() => handleStatus('activate')} disabled={statusLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50"><PlayCircle size={16} />Activate</button>
                      )}
                      <button onClick={() => setDeleteOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 text-sm font-medium text-red-600"><Trash2 size={16} />Delete Agent</button>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-medium">{fmtD(agent.created_at)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Last Updated</span><span className="font-medium">{fmtD(agent.updated_at)}</span></div>
                      {agent.verified_at && <div className="flex justify-between"><span className="text-gray-500">KYC Verified</span><span className="font-medium">{fmtD(agent.verified_at)}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ ASSIGNMENTS TAB ══ */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-3">
              <h3 className="font-bold text-gray-900">Assignments ({assignMeta.count})</h3>
              <select value={assignFilter.status} onChange={e => setAssignFilter(f => ({ ...f, status: e.target.value }))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white ml-auto">
                <option value="">All statuses</option>
                {['assigned','accepted','en_route','checked_in','inspecting','inspection_submitted','awaiting_customer_response','customer_accepted','customer_rejected','kyc_completed','payment_processed','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <input type="text" placeholder="Search lead/customer…" value={assignFilter.search} onChange={e => setAssignFilter(f => ({ ...f, search: e.target.value }))}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20"><Package size={36} className="text-gray-300 mb-3" /><p className="text-gray-500">No assignments found.</p></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['Lead #', 'Customer', 'Device', 'Est.', 'Final', 'Status', 'Rating', 'Assigned', 'Completed'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignments.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs font-bold text-emerald-700">{a.lead_number}</td>
                          <td className="px-5 py-3"><p className="font-medium text-gray-900">{a.customer_name}</p><p className="text-xs text-gray-500">{a.customer_phone}</p></td>
                          <td className="px-5 py-3 text-xs text-gray-700">{a.device_name}</td>
                          <td className="px-5 py-3 text-xs text-gray-600">{a.estimated_price ? `₹${a.estimated_price.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-5 py-3 text-xs font-semibold text-gray-900">{a.final_price ? `₹${a.final_price.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ASSIGN_CLR[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status_display}</span></td>
                          <td className="px-5 py-3">{a.rating ? <div className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /><span className="text-xs">{a.rating}</span></div> : <span className="text-gray-400 text-xs">—</span>}</td>
                          <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtD(a.assigned_at)}</td>
                          <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{a.completed_at ? fmtD(a.completed_at) : a.cancelled_at ? <span className="text-red-500">{fmtD(a.cancelled_at)}</span> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {assignMeta.totalPages > 1 && <Pager page={assignMeta.page} total={assignMeta.count} pages={assignMeta.totalPages} size={20} onChange={loadAssignments} />}
              </>
            )}
          </div>
        )}

        {/* ══ ACTIVITY TAB ══ */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-900">Activity Feed ({actMeta.count})</h3></div>
            {activities.length === 0 ? <div className="flex flex-col items-center justify-center py-20"><Activity size={36} className="text-gray-300 mb-3" /><p className="text-gray-500">No activity logged.</p></div>
            : (
              <>
                <div className="divide-y divide-gray-100">
                  {activities.map(a => (
                    <div key={a.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Activity size={13} className="text-indigo-600" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{a.description}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500">{fmtDT(a.created_at)}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">{a.activity_type.replace(/_/g, ' ')}</span>
                          {a.latitude && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{a.latitude}, {a.longitude}</span>}
                        </div>
                        {Object.keys(a.metadata).length > 0 && <p className="text-xs text-gray-400 mt-1 font-mono">{JSON.stringify(a.metadata)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {actMeta.totalPages > 1 && <Pager page={actMeta.page} total={actMeta.count} pages={actMeta.totalPages} size={30} onChange={loadActivity} />}
              </>
            )}
          </div>
        )}

        {/* ══ PERFORMANCE TAB ══ */}
        {activeTab === 'performance' && agentStats && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Performance Metrics</h3>
              <div className="flex gap-2">{[7, 30, 90].map(d => <button key={d} onClick={() => setPerfDays(d)} className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${perfDays === d ? 'bg-emerald-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{d}d</button>)}</div>
            </div>

            {/* All-time KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Total Assigned" value={agentStats.all_time.total_assignments} sub={`${agentStats.all_time.completed} completed`} />
              <KpiCard label="Completion Rate" value={`${agentStats.all_time.completion_rate.toFixed(1)}%`} sub={`${agentStats.all_time.cancelled} cancelled`} color="text-emerald-600" />
              <KpiCard label="Total Revenue" value={fmt(agentStats.all_time.total_revenue)} sub={`Avg ${fmt(agentStats.all_time.avg_deal_value)}/deal`} color="text-purple-600" />
              <KpiCard label="Avg Rating" value={`${agentStats.all_time.average_rating.toFixed(1)}/5`} color="text-yellow-600" />
            </div>

            {/* Recent period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><p className="text-xs text-gray-500 uppercase tracking-wide">This Period — Total</p><p className="text-2xl font-bold text-gray-900 mt-1">{agentStats.recent.total}</p></div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><p className="text-xs text-gray-500 uppercase tracking-wide">This Period — Completed</p><p className="text-2xl font-bold text-emerald-600 mt-1">{agentStats.recent.completed}</p></div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"><p className="text-xs text-gray-500 uppercase tracking-wide">This Period — Revenue</p><p className="text-2xl font-bold text-purple-600 mt-1">{fmt(agentStats.recent.revenue)}</p></div>
            </div>

            {/* Live state */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h4 className="font-bold text-gray-900 mb-4">Live Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { l: 'Active Assignments', v: agentStats.live.active_assignments, c: 'text-teal-600' },
                  { l: 'Max Concurrent', v: agentStats.live.max_concurrent },
                  { l: 'Available', v: agentStats.live.is_available ? 'Yes' : 'No', c: agentStats.live.is_available ? 'text-emerald-600' : 'text-gray-600' },
                  { l: 'Can Accept', v: agentStats.live.can_accept_leads ? 'Yes' : 'No', c: agentStats.live.can_accept_leads ? 'text-emerald-600' : 'text-red-600' },
                ].map(({ l, v, c = 'text-gray-900' }) => (
                  <div key={l} className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">{l}</p><p className={`text-xl font-bold mt-0.5 ${c}`}>{v}</p></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
