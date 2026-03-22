// pages/agents/AgentsList.tsx
// Admin list of ALL agents across all partners — Create, Search, Filter, Delete, Analytics
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Eye, Search, ChevronLeft, ChevronRight, Star, Phone, Mail,
  Users, CheckCircle, Clock, AlertTriangle, RefreshCw, X, Loader2,
  Trash2, ShieldCheck, ShieldAlert, Shield, BarChart3, TrendingUp,
  Activity, Building2, Ban,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Agent {
  id: string;
  employee_code: string;
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  verification_status: 'pending' | 'verified' | 'rejected';
  is_available: boolean;
  max_concurrent_leads: number;
  can_accept_leads: boolean;
  total_leads_completed: number;
  average_rating: number;
  aadhaar_number_masked: string;
  created_at: string;
  partner: { id: string; business_name: string; status: string };
  user: { id: string; phone: string; name: string; email: string | null; kyc_status: string; role: string };
}
interface PlatformStats {
  total: number; active: number; inactive: number; suspended: number;
  available: number; verified: number; pending_kyc: number;
  avg_rating: number; total_leads_completed: number;
}
interface CreateForm {
  phone: string; name: string; email: string; partner_id: string;
  employee_code: string; aadhaar_number: string;
  max_concurrent_leads: string; notes: string;
}
interface Partner { id: string; business_name: string; }

// ── API ───────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((c) => { const t = localStorage.getItem('access_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use((r) => r, (e) => { if (e.response?.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/admin/login'; } return Promise.reject(e); });

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtD = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const kycIcon = (status: string) => {
  if (status === 'verified') return <ShieldCheck size={14} className="text-emerald-600" />;
  if (status === 'rejected') return <ShieldAlert size={14} className="text-red-600" />;
  return <Shield size={14} className="text-amber-500" />;
};

// ── Shared ────────────────────────────────────────────────────────────────────
const Badge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const m: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    suspended: 'bg-orange-100 text-orange-800 border-orange-200',
    terminated: 'bg-red-100 text-red-800 border-red-200',
    verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${m[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>{label ?? status}</span>;
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; accent: string; loading?: boolean }> =
  ({ icon, label, value, accent, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>{icon}</div>
    <div><p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      {loading ? <div className="mt-1 h-7 w-14 bg-gray-200 animate-pulse rounded" /> : <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>}
    </div>
  </div>
);

// ── Create Agent Modal ────────────────────────────────────────────────────────
const CreateAgentModal: React.FC<{ open: boolean; onClose: () => void; onCreated: () => void }> =
  ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState<CreateForm>({ phone: '', name: '', email: '', partner_id: '', employee_code: '', aadhaar_number: '', max_concurrent_leads: '5', notes: '' });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [apiErr, setApiErr]   = useState<string | null>(null);

  useEffect(() => {
    if (open) api.get('/admin/partners/?status=approved&page_size=200').then(r => setPartners(r.data.results || []));
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  const set = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.phone.trim()) e.phone = 'Required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Invalid 10-digit number';
    if (!form.name.trim()) e.name = 'Required';
    if (!form.partner_id) e.partner_id = 'Select a partner';
    if (form.aadhaar_number && !/^\d{12}$/.test(form.aadhaar_number)) e.aadhaar_number = 'Must be 12 digits';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setApiErr(null);
    try {
      await api.post('/admin/agents/', {
        phone: form.phone.trim(), name: form.name.trim(),
        email: form.email.trim() || undefined,
        partner_id: form.partner_id,
        employee_code: form.employee_code.trim() || undefined,
        aadhaar_number: form.aadhaar_number.trim() || undefined,
        max_concurrent_leads: Number(form.max_concurrent_leads),
        notes: form.notes.trim() || undefined,
      });
      onCreated(); onClose();
      setForm({ phone: '', name: '', email: '', partner_id: '', employee_code: '', aadhaar_number: '', max_concurrent_leads: '5', notes: '' });
    } catch (e: any) {
      const d = e.response?.data;
      if (d?.errors) setErrors(d.errors);
      else setApiErr(d?.detail || d?.error || 'Failed to create agent.');
    } finally { setLoading(false); }
  };

  if (!open) return null;
  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500";
  const err = (k: string) => errors[k] && <p className="text-xs text-red-600 mt-1">{errors[k]}</p>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-emerald-50">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center"><Plus size={17} className="text-emerald-700" /></div><div><h3 className="font-bold text-gray-900">Create Agent</h3><p className="text-xs text-gray-500">New agent account</p></div></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-emerald-100 text-gray-500"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {apiErr && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertTriangle size={14} />{apiErr}</div>}
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Partner *</label>
            <select value={form.partner_id} onChange={set('partner_id')} className={`${inp} ${errors.partner_id ? 'border-red-400' : ''} bg-white`}>
              <option value="">Select partner…</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.business_name}</option>)}
            </select>{err('partner_id')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label><input value={form.phone} onChange={set('phone')} placeholder="9876543210" className={`${inp} ${errors.phone ? 'border-red-400' : ''}`} />{err('phone')}</div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label><input value={form.name} onChange={set('name')} placeholder="Ramesh Kumar" className={`${inp} ${errors.name ? 'border-red-400' : ''}`} />{err('name')}</div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label><input value={form.email} onChange={set('email')} type="email" placeholder="agent@example.com" className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Employee Code</label><input value={form.employee_code} onChange={set('employee_code')} placeholder="EMP001" className={inp} /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Max Leads</label><input value={form.max_concurrent_leads} onChange={set('max_concurrent_leads')} type="number" className={inp} /></div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Aadhaar Number <span className="text-gray-400 font-normal">(12 digits)</span></label><input value={form.aadhaar_number} onChange={set('aadhaar_number')} placeholder="Enter 12-digit number" maxLength={12} className={`${inp} ${errors.aadhaar_number ? 'border-red-400' : ''}`} />{err('aadhaar_number')}</div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Internal notes…" className={`${inp} resize-none`} /></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />} Create Agent
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal: React.FC<{ agent: Agent | null; onClose: () => void; onDeleted: () => void }> =
  ({ agent, onClose, onDeleted }) => {
  const [typed, setTyped] = useState(''); const [loading, setLoading] = useState(false); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setTyped(''); setErr(null); }, [agent]);
  if (!agent) return null;
  const confirmed = typed.trim().toLowerCase() === 'delete';
  const run = async () => {
    setLoading(true); setErr(null);
    try { await api.delete(`/admin/agents/${agent.id}/`); onDeleted(); onClose(); }
    catch (e: any) { setErr(e.response?.data?.detail || 'Delete failed.'); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={18} className="text-red-600" /></div><div><h3 className="font-bold text-gray-900">Delete Agent</h3><p className="text-sm text-gray-600">{agent.user.name} — {agent.user.phone}</p></div></div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800"><p className="font-semibold mb-1">⚠ Irreversible</p><p>Deletes the agent profile and the linked user account permanently.</p></div>
          <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Type <span className="font-mono text-red-600">delete</span> to confirm</label><input value={typed} onChange={e => setTyped(e.target.value)} placeholder="delete" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400" /></div>
          {err && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} />{err}</p>}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={run} disabled={loading || !confirmed} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading && <Loader2 size={13} className="animate-spin" />}<Trash2 size={13} />Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
const AgentsList: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents]           = useState<Agent[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [statsLoading, setStatsL]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [stats, setStats]             = useState<PlatformStats | null>(null);
  const [filters, setFilters]         = useState({ page: 1, page_size: 20, search: '', status: '', verification_status: '' });
  const [searchInput, setSearch]      = useState('');
  const [createOpen, setCreateOpen]   = useState(false);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsL(true);
    try { const { data } = await api.get('/admin/agents/platform_stats/'); setStats(data); } catch { } finally { setStatsL(false); }
  }, []);

  const fetchAgents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: any = { page: filters.page, page_size: filters.page_size };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.verification_status) params.verification_status = filters.verification_status;
      const { data } = await api.get('/admin/agents/', { params });
      setAgents(data.results || []); setTotal(data.count || 0);
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to load agents.'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const totalPages = Math.ceil(total / filters.page_size);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setFilters(f => ({ ...f, page: 1, search: searchInput })); };

  const STATUS_TABS = [
    { key: '', label: 'All', count: stats?.total },
    { key: 'active', label: 'Active', count: stats?.active },
    { key: 'inactive', label: 'Inactive', count: stats?.inactive },
    { key: 'suspended', label: 'Suspended', count: stats?.suspended },
  ];

  const VERIF_TABS = [
    { key: '', label: 'All KYC' },
    { key: 'pending', label: 'Pending', count: stats?.pending_kyc },
    { key: 'verified', label: 'Verified', count: stats?.verified },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <CreateAgentModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { fetchAgents(); fetchStats(); }} />
      <DeleteModal agent={deleteAgent} onClose={() => setDeleteAgent(null)} onDeleted={() => { fetchAgents(); fetchStats(); }} />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Agents</h1><p className="text-sm text-gray-500 mt-0.5">Manage all field agents across all partners</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/agents/analytics')} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><BarChart3 size={15} />Analytics</button>
            <button onClick={() => navigate('/agents/leaderboard')} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><TrendingUp size={15} />Leaderboard</button>
            <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"><Plus size={15} />Create Agent</button>
            <button onClick={() => { fetchStats(); fetchAgents(); }} className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"><RefreshCw size={15} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users size={19} className="text-blue-600" />} label="Total Agents" value={stats?.total ?? 0} accent="bg-blue-50" loading={statsLoading} />
          <StatCard icon={<CheckCircle size={19} className="text-emerald-600" />} label="Active" value={stats?.active ?? 0} accent="bg-emerald-50" loading={statsLoading} />
          <StatCard icon={<ShieldCheck size={19} className="text-emerald-600" />} label="KYC Verified" value={stats?.verified ?? 0} accent="bg-emerald-50" loading={statsLoading} />
          <StatCard icon={<Clock size={19} className="text-amber-600" />} label="Pending KYC" value={stats?.pending_kyc ?? 0} accent="bg-amber-50" loading={statsLoading} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchInput} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, employee code, partner…" className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">Search</button>
              {filters.search && <button type="button" onClick={() => { setSearch(''); setFilters(f => ({ ...f, page: 1, search: '' })); }} className="px-4 py-2.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-1"><X size={14} />Clear</button>}
            </form>
            {/* Status tabs */}
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map(t => (
                <button key={t.key} onClick={() => setFilters(f => ({ ...f, page: 1, status: t.key }))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filters.status === t.key ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t.label}{t.count !== undefined && <span className="ml-1.5 text-xs opacity-70">{t.count}</span>}
                </button>
              ))}
              <span className="w-px h-6 bg-gray-200 self-center mx-1" />
              {VERIF_TABS.map(t => (
                <button key={t.key} onClick={() => setFilters(f => ({ ...f, page: 1, verification_status: t.key }))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filters.verification_status === t.key ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t.label}{t.count !== undefined && <span className="ml-1.5 opacity-70">{t.count}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={28} className="text-emerald-600 animate-spin" /></div>
          ) : error ? (
            <div className="flex items-center justify-center py-20"><div className="text-center space-y-3"><AlertTriangle size={32} className="mx-auto text-red-400" /><p className="text-gray-700">{error}</p><button onClick={fetchAgents} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg">Retry</button></div></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Agent', 'Partner', 'Contact', 'Status', 'KYC', 'Performance', 'Joined', 'Actions'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agents.length === 0 ? (
                      <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400">No agents found.</td></tr>
                    ) : agents.map(agent => (
                      <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900">{agent.user.name}</p>
                          {agent.employee_code && <p className="text-xs text-gray-500 mt-0.5">Code: {agent.employee_code}</p>}
                          {agent.aadhaar_number_masked !== '****' && <p className="text-xs text-gray-400 font-mono">{agent.aadhaar_number_masked}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-800">{agent.partner.business_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{agent.partner.status}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-xs text-gray-700"><Phone size={11} className="text-gray-400" />{agent.user.phone}</div>
                          {agent.user.email && <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5"><Mail size={11} className="text-gray-400" />{agent.user.email}</div>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <Badge status={agent.status} />
                            {agent.is_available && <Badge status="active" label="Available" />}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {kycIcon(agent.verification_status)}
                            <span className="text-xs text-gray-700 capitalize">{agent.verification_status}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {kycIcon(agent.user.kyc_status)}
                            <span className="text-xs text-gray-500">User KYC: {agent.user.kyc_status}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-gray-900">{agent.total_leads_completed} <span className="font-normal text-gray-500">done</span></p>
                          <div className="flex items-center gap-1 mt-0.5"><Star size={11} className="text-yellow-500 fill-yellow-500" /><span className="text-xs text-gray-700">{(Number(agent.average_rating) || 0).toFixed(1)}</span></div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">{fmtD(agent.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => navigate(`/agents/${agent.id}`)} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 border border-emerald-200"><Eye size={12} />View</button>
                            <button onClick={() => setDeleteAgent(agent)} className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 border border-red-200"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > 0 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600"><strong>{(filters.page - 1) * filters.page_size + 1}</strong>–<strong>{Math.min(filters.page * filters.page_size, total)}</strong> of <strong>{total}</strong></p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white"><ChevronLeft size={14} />Prev</button>
                    <span className="text-sm text-gray-600">{filters.page}/{totalPages}</span>
                    <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={filters.page >= totalPages} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-white">Next<ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentsList;
