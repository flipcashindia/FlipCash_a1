// pages/partners/PendingApprovals.tsx
// Workflow: Review Documents → verify → Approve / Reject — all in one page
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Eye, Clock, Users, AlertTriangle,
  RefreshCw, Phone, Mail, MapPin, Calendar, FileText, ChevronDown,
  ChevronUp, ExternalLink, ShieldCheck, ShieldAlert, Shield, Loader2,
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PendingPartner {
  id: string;
  user: { id: string; phone: string; email: string | null; name: string; kyc_status: string };
  business_name: string;
  business_type: string;
  status: 'pending';
  service_radius_km: number;
  profile_completed: number;
  background_check_status: string;
  created_at: string;
}
interface Document {
  id: string;
  document_type: string;
  document_type_display: string;
  document_url: string | null;
  verification_status: string;
  verification_notes: string;
  verified_at: string | null;
  created_at: string;
}
interface PlatformStats {
  total: number; approved: number; pending: number; rejected: number; suspended: number;
}
type ActionType = 'approve' | 'reject';
interface CardState {
  docsOpen: boolean; docsLoading: boolean; docs: Document[];
  docsError: string | null; docsLoaded: boolean;
  actionLoading: boolean; actionError: string | null;
  rejectReason: string; confirmAction: ActionType | null;
}
const defaultCardState = (): CardState => ({
  docsOpen: false, docsLoading: false, docs: [], docsError: null, docsLoaded: false,
  actionLoading: false, actionError: null, rejectReason: '', confirmAction: null,
});

// ── API ───────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('access_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => { if (e.response?.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/admin/login'; } return Promise.reject(e); },
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const timeAgo = (s: string) => {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};
const docCfg = (status: string) => ({
  verified: { cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: ShieldCheck, label: 'Verified' },
  rejected: { cls: 'text-red-700 bg-red-50 border-red-200', Icon: ShieldAlert, label: 'Rejected' },
}[status] ?? { cls: 'text-amber-700 bg-amber-50 border-amber-200', Icon: Shield, label: 'Pending' });

// ══════════════════════════════════════════════════════════════════════════════
// Document review panel (expandable, lazy-fetched)
// ══════════════════════════════════════════════════════════════════════════════
const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp|tiff?)(\?.*)?$/i.test(url);

const DocPanel: React.FC<{ partnerId: string; state: CardState; set: (p: Partial<CardState>) => void }> =
  ({ partnerId, state, set }) => {

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [imgErrors, setImgErrors]   = useState<Record<string, boolean>>({});

  const toggle = async () => {
    if (state.docsOpen) { set({ docsOpen: false }); return; }
    set({ docsOpen: true });
    if (state.docsLoaded) return;
    set({ docsLoading: true, docsError: null });
    try {
      const { data } = await api.get<{ results: Document[] }>(`/admin/partners/${partnerId}/documents/`);
      set({ docs: data.results, docsLoaded: true, docsLoading: false });
    } catch { set({ docsError: 'Failed to load documents.', docsLoading: false }); }
  };

  const verified   = state.docs.filter(d => d.verification_status === 'verified').length;
  const allVerified = state.docs.length > 0 && verified === state.docs.length;
  const anyRejected = state.docs.some(d => d.verification_status === 'rejected');

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      {/* Toggle button */}
      <button onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FileText size={15} />
          Review Documents
          {state.docsLoaded && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {verified}/{state.docs.length} verified
            </span>
          )}
        </span>
        {state.docsOpen ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>

      {state.docsOpen && (
        <div className="bg-white border-t border-gray-200">
          {state.docsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin text-emerald-500" /> Loading documents…
            </div>
          ) : state.docsError ? (
            <p className="text-sm text-red-600 flex items-center gap-1.5 p-4"><AlertTriangle size={14} /> {state.docsError}</p>
          ) : state.docs.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Shield size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              <p className="text-xs text-gray-400 mt-0.5">Partner hasn't submitted any KYC documents.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {state.docs.map(doc => {
                const { cls, Icon, label } = docCfg(doc.verification_status);
                const hasUrl   = !!doc.document_url;
                const isImage  = hasUrl && isImageUrl(doc.document_url!) && !imgErrors[doc.id];
                const isExpand = expandedId === doc.id;

                return (
                  <div key={doc.id} className="p-4">
                    {/* ── Doc header row ── */}
                    <div className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${cls} mb-3`}>
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Icon size={15} className="mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold capitalize">
                            {(doc.document_type_display || doc.document_type).replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs opacity-60 mt-0.5">Uploaded {fmtDate(doc.created_at)}</p>
                          {doc.verification_notes && (
                            <p className="text-xs mt-1 opacity-80 bg-white/60 rounded px-2 py-0.5">
                              📝 {doc.verification_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
                        {/* Always-visible open button */}
                        {hasUrl && (
                          <a
                            href={doc.document_url!}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 whitespace-nowrap transition-colors"
                          >
                            <ExternalLink size={12} /> Open
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ── Document preview ── */}
                    {hasUrl ? (
                      isImage ? (
                        /* Image — inline preview with expand */
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 mb-3">
                          <img
                            src={doc.document_url!}
                            alt={doc.document_type_display || doc.document_type}
                            onError={() => setImgErrors(e => ({ ...e, [doc.id]: true }))}
                            className={`w-full object-contain transition-all duration-200 ${isExpand ? 'max-h-[500px]' : 'max-h-44'}`}
                          />
                          <button
                            onClick={() => setExpandedId(isExpand ? null : doc.id)}
                            className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 text-white text-xs rounded-lg hover:bg-black/80 transition-colors"
                          >
                            {isExpand ? 'Collapse' : 'Expand'}
                          </button>
                        </div>
                      ) : (
                        /* Non-image file (PDF, doc, etc.) */
                        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">Document attached</p>
                              <p className="text-xs text-gray-500">Click to open in a new tab</p>
                            </div>
                          </div>
                          <a
                            href={doc.document_url!}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink size={14} /> Open
                          </a>
                        </div>
                      )
                    ) : (
                      /* No file at all */
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                        <FileText size={20} className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">No file uploaded</p>
                          <p className="text-xs text-gray-400">Partner hasn't submitted this document yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Summary hint ── */}
              <div className={`mx-4 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border ${
                allVerified  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : anyRejected ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {allVerified
                  ? <><ShieldCheck size={13} /> All documents verified — safe to approve</>
                  : anyRejected
                  ? <><ShieldAlert size={13} /> Some documents rejected — consider rejecting this application</>
                  : <><Shield size={13} /> {verified}/{state.docs.length} verified — review all before approving</>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Action area (inline, no modal)
// ══════════════════════════════════════════════════════════════════════════════
const ActionArea: React.FC<{
  state: CardState; set: (p: Partial<CardState>) => void;
  onAction: (a: ActionType) => void; onView: () => void;
}> = ({ state, set, onAction, onView }) => {

  // Step 2 of reject: textarea + confirm
  if (state.confirmAction === 'reject') {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
        <p className="text-sm font-semibold text-red-800">Provide rejection reason (required):</p>
        <textarea
          autoFocus value={state.rejectReason}
          onChange={(e) => set({ rejectReason: e.target.value, actionError: null })}
          placeholder="e.g. Incomplete documents, invalid GST number…"
          rows={3}
          className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-400 bg-white"
        />
        {state.actionError && (
          <p className="text-xs text-red-700 flex items-center gap-1"><AlertTriangle size={12} />{state.actionError}</p>
        )}
        <div className="flex gap-2">
          <button onClick={() => onAction('reject')} disabled={state.actionLoading || !state.rejectReason.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {state.actionLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
            Confirm Rejection
          </button>
          <button onClick={() => set({ confirmAction: null, rejectReason: '', actionError: null })}
            className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Step 2 of approve: quick confirm banner
  if (state.confirmAction === 'approve') {
    return (
      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-emerald-800 font-medium flex items-center gap-1.5">
          <CheckCircle size={14} /> Confirm approval? Partner will get full platform access.
        </p>
        <div className="flex gap-2">
          <button onClick={() => onAction('approve')} disabled={state.actionLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {state.actionLoading ? <Loader2 size={13} className="animate-spin" /> : null}
            Yes, Approve
          </button>
          <button onClick={() => set({ confirmAction: null })}
            className="px-3 py-1.5 border border-emerald-300 text-emerald-700 text-sm rounded-lg hover:bg-emerald-100 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Step 1: primary buttons
  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 flex-wrap">
      <button onClick={() => set({ confirmAction: 'approve' })} disabled={state.actionLoading}
        className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
        <CheckCircle size={14} /> Approve
      </button>
      <button onClick={() => set({ confirmAction: 'reject' })} disabled={state.actionLoading}
        className="flex items-center gap-1.5 px-5 py-2 border border-red-200 bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
        <XCircle size={14} /> Reject
      </button>
      <button onClick={onView}
        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors ml-auto">
        <Eye size={14} /> Full Profile
      </button>
      {state.actionError && (
        <p className="w-full text-xs text-red-600 flex items-center gap-1 mt-1">
          <AlertTriangle size={12} /> {state.actionError}
        </p>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Partner card
// ══════════════════════════════════════════════════════════════════════════════
const PartnerCard: React.FC<{
  partner: PendingPartner; index: number;
  state: CardState; set: (p: Partial<CardState>) => void;
  onAction: (a: ActionType) => void; onView: () => void;
}> = ({ partner, index, state, set, onAction, onView }) => {
  const pct = partner.profile_completed;
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${state.docsOpen ? 'border-indigo-200 shadow-md' : 'border-gray-200 hover:shadow-md hover:border-gray-300'}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            {/* Title + age */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">{partner.business_name}</h3>
                <p className="text-sm text-gray-500 capitalize mt-0.5">{partner.business_type || 'General'}</p>
              </div>
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex-shrink-0 flex items-center gap-1">
                <Clock size={11} /> {timeAgo(partner.created_at)}
              </span>
            </div>

            {/* Contact */}
            <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><Users size={11} className="text-gray-400" />{partner.user.name}</span>
              <span className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" />{partner.user.phone}</span>
              {partner.user.email && <span className="col-span-2 flex items-center gap-1.5"><Mail size={11} className="text-gray-400" />{partner.user.email}</span>}
              <span className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400" />{partner.service_radius_km} km radius</span>
              <span className="flex items-center gap-1.5"><Calendar size={11} className="text-gray-400" />{fmtDate(partner.created_at)}</span>
            </div>

            {/* Profile bar + status badges */}
            <div className="mt-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Profile</span>
                  <span className={`font-bold ${pct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${partner.user.kyc_status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  KYC: {partner.user.kyc_status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${partner.background_check_status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  BGC: {partner.background_check_status}
                </span>
              </div>
            </div>

            {/* ── Document review panel ── */}
            <DocPanel partnerId={partner.id} state={state} set={set} />

            {/* ── Action area ── */}
            <ActionArea state={state} set={set} onAction={onAction} onView={onView} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════════
const PendingApprovals: React.FC = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  const getState = (id: string) => cardStates[id] ?? defaultCardState();
  const setState = (id: string, patch: Partial<CardState>) =>
    setCardStates(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { const { data } = await api.get<PlatformStats>('/admin/partners/stats/'); setStats(data); }
    catch { /* non-blocking */ } finally { setStatsLoading(false); }
  }, []);

  const loadPending = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get<{ results: PendingPartner[] }>('/admin/partners/pending_approvals/');
      setPartners(data.results || []);
      const init: Record<string, CardState> = {};
      (data.results || []).forEach(p => { init[p.id] = defaultCardState(); });
      setCardStates(init);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load pending approvals.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); loadPending(); }, [loadStats, loadPending]);

  const handleAction = async (partnerId: string, action: ActionType) => {
    const s = getState(partnerId);
    if (action === 'reject' && !s.rejectReason.trim()) {
      setState(partnerId, { actionError: 'Rejection reason is required.' }); return;
    }
    setState(partnerId, { actionLoading: true, actionError: null });
    try {
      if (action === 'approve') await api.post(`/admin/partners/${partnerId}/approve/`);
      else await api.post(`/admin/partners/${partnerId}/reject/`, { reason: s.rejectReason });
      setPartners(prev => prev.filter(p => p.id !== partnerId));
      loadStats();
    } catch (e: any) {
      setState(partnerId, {
        actionLoading: false, confirmAction: null,
        actionError: e.response?.data?.error || e.response?.data?.detail || 'Action failed.',
      });
    }
  };

  const STRIP = [
    { label: 'Awaiting', key: 'pending',   dot: 'bg-amber-400',   bg: 'bg-amber-50 border-amber-200 text-amber-900' },
    { label: 'Approved', key: 'approved',  dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
    { label: 'Rejected', key: 'rejected',  dot: 'bg-red-400',     bg: 'bg-red-50 border-red-200 text-red-900' },
    { label: 'Suspended',key: 'suspended', dot: 'bg-gray-400',    bg: 'bg-gray-50 border-gray-200 text-gray-800' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/partners')} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
              <p className="text-sm text-gray-500">Review documents → approve or reject</p>
            </div>
          </div>
          <button onClick={() => { loadPending(); loadStats(); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3">
          {STRIP.map(({ label, key, dot, bg }) => (
            <div key={key} className={`rounded-xl border px-4 py-3 flex items-center gap-2.5 ${bg}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
              <div>
                <p className="text-xs opacity-70">{label}</p>
                {statsLoading
                  ? <div className="mt-0.5 h-5 w-8 bg-black/10 animate-pulse rounded" />
                  : <p className="text-lg font-bold">{stats?.[key] ?? 0}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Workflow hint */}
        {!loading && partners.length > 0 && (
          <div className="flex items-start gap-2.5 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            <FileText size={16} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Workflow:</strong> Click <em>"Review Documents"</em> to inspect KYC files for each partner,
              then <em>Approve</em> or <em>Reject</em> inline — no navigation needed.
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-gray-200">
            <div className="text-center space-y-3">
              <Loader2 size={32} className="mx-auto text-emerald-600 animate-spin" />
              <p className="text-sm text-gray-500">Loading applications…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="text-center space-y-3">
              <AlertTriangle size={36} className="mx-auto text-red-400" />
              <p className="text-gray-700">{error}</p>
              <button onClick={loadPending} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">Retry</button>
            </div>
          </div>
        ) : partners.length === 0 ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-gray-200">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h3 className="font-semibold text-gray-900">All clear!</h3>
              <p className="text-sm text-gray-500">No pending applications right now.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
              {partners.length} Application{partners.length !== 1 ? 's' : ''} · Oldest first
            </p>
            {partners.map((p, i) => (
              <PartnerCard
                key={p.id} partner={p} index={i}
                state={getState(p.id)}
                set={(patch) => setState(p.id, patch)}
                onAction={(a) => handleAction(p.id, a)}
                onView={() => navigate(`/partners/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;