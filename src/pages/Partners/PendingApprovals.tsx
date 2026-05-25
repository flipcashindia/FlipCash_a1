// pages/partners/PendingApprovals.tsx
/**
 * UNIFIED PARTNER REVIEW QUEUE
 *
 * Shows every partner that needs admin attention in ONE list:
 *   • status === 'pending'           → needs Approve / Reject
 *   • profile_completed === false    → needs docs / bank / service-area review
 *   (a partner can appear for both reasons simultaneously)
 *
 * INLINE VERIFICATION (no page navigation needed):
 *   ① KYC status  — quick-select grid, PATCH /admin/partners/{id}/
 *   ② Background check — quick-select grid, PATCH /admin/partners/{id}/
 *   ③ Documents   — lazy-load, image preview, Verify / Reject per doc
 *                   POST /admin/partners/{id}/verify_document/
 *                   POST /admin/partners/{id}/reject_document/
 *   ④ Bank accounts — lazy-load, Verify / Unverify per account
 *                   POST /admin/partners/{id}/verify_bank/
 *                     body: { bank_account_id, is_verified: true|false }
 *   ⑤ Service areas — lazy-load, view-only (admin sees but can't add)
 *   ⑥ Mark Profile Complete — PATCH /admin/partners/{id}/ { profile_completed: true }
 *      Only enabled when computed score >= 80 %
 *   ⑦ Approve / Reject — POST /admin/partners/{id}/approve|reject/
 *
 * SORT ORDER: incomplete-and-pending first (highest urgency), then oldest-first
 *
 * ── Backend endpoints expected ───────────────────────────────────────────────
 *  Already in AdminPartnerViewSet (from urls_admin.py comments):
 *   PATCH  /admin/partners/{id}/               ← update fields
 *   POST   /admin/partners/{id}/approve/
 *   POST   /admin/partners/{id}/reject/
 *   GET    /admin/partners/{id}/documents/
 *   GET    /admin/partners/{id}/bank_accounts/
 *   GET    /admin/partners/{id}/service_areas/
 *
 *  Need to add to AdminPartnerViewSet if not present:
 *   POST   /admin/partners/{id}/verify_document/  { document_id, notes? }
 *   POST   /admin/partners/{id}/reject_document/  { document_id, notes }
 *   POST   /admin/partners/{id}/verify_bank/       { bank_account_id, is_verified }
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Eye, Clock, Users, AlertTriangle,
  RefreshCw, Phone, Mail, MapPin, Calendar, FileText, ChevronDown,
  ChevronUp, ExternalLink, ShieldCheck, ShieldAlert, Shield, Loader2,
  BadgeCheck, Zap, Circle, AlertCircle, Building2, CreditCard,
  ChevronRight, Star, Info,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PartnerUser {
  id: string; phone: string; email: string | null;
  name: string; kyc_status: string;
}

interface PartnerItem {
  id: string;
  user: PartnerUser;
  business_name: string;
  business_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  profile_completed: boolean;          // BooleanField on model
  profile_completion_percentage?: number; // @property — may be in serializer
  background_check_status: string;
  service_radius_km: number;
  created_at: string;
  updated_at: string;
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

interface BankAccount {
  id: string;
  account_holder_name: string;
  account_number_masked: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  account_type: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

interface ServiceArea {
  id: string;
  name: string;
  city: string;
  state: string;
  postal_codes: string[];
  is_active: boolean;
}

interface PlatformStats {
  total: number; approved: number; pending: number;
  rejected: number; suspended: number;
}

/** Per-card lazy-loaded detail data + UI state */
interface CardDetail {
  // fetch state
  loading: boolean;
  loaded: boolean;
  error: string | null;
  open: boolean;

  // data
  docs: Document[];
  banks: BankAccount[];
  areas: ServiceArea[];

  // which section is expanded
  section: 'docs' | 'bank' | 'areas' | null;

  // action state
  actionLoading: boolean;
  actionError: string | null;
  confirmAction: 'approve' | 'reject' | null;
  rejectReason: string;
  completing: boolean;

  // per-doc inline state
  docActions: Record<string, {
    mode: 'idle' | 'verify' | 'reject';
    notes: string;
    loading: boolean;
    error: string | null;
  }>;

  // per-bank inline state
  bankActions: Record<string, { loading: boolean; error: string | null }>;

  // quick-update loading
  kycLoading: boolean;
  bgcLoading: boolean;
}

const defaultDetail = (): CardDetail => ({
  loading: false, loaded: false, error: null, open: false,
  docs: [], banks: [], areas: [],
  section: null,
  actionLoading: false, actionError: null,
  confirmAction: null, rejectReason: '',
  completing: false,
  docActions: {}, bankActions: {},
  kycLoading: false, bgcLoading: false,
});

// ── API ───────────────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('access_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/admin/login'; }
    return Promise.reject(e);
  },
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const timeAgo = (s: string) => {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif|bmp)(\?.*)?$/i.test(url);

/** Compute completion score (mirrors Django model property exactly) */
function computeScore(
  p: PartnerItem,
  banks: BankAccount[],
  areas: ServiceArea[],
): { score: number; pct: number; items: Array<{ label: string; pts: number; max: number; ok: boolean; note: string }> } {
  // Use server-side value if present
  if (typeof p.profile_completion_percentage === 'number') {
    return {
      score: 0,
      pct: p.profile_completion_percentage,
      items: [],
    };
  }
  const items = [
    {
      label: 'Business Name', max: 1,
      pts: p.business_name ? 1 : 0,
      ok: !!p.business_name,
      note: p.business_name || 'Not set',
    },
    {
      label: 'KYC', max: 2,
      pts: p.user.kyc_status === 'verified' ? 2 : p.user.kyc_status === 'in_review' ? 1 : 0,
      ok: p.user.kyc_status === 'verified',
      note: p.user.kyc_status === 'verified' ? 'Verified (+2)' : p.user.kyc_status === 'in_review' ? 'In review (+1)' : 'Pending',
    },
    {
      label: 'Bank Account', max: 2,
      pts: banks.some(b => b.is_verified) ? 2 : banks.length > 0 ? 1 : 0,
      ok: banks.some(b => b.is_verified),
      note: banks.some(b => b.is_verified) ? 'Verified (+2)' : banks.length > 0 ? 'Unverified (+1)' : 'None added',
    },
    {
      label: 'Service Area', max: 1,
      pts: areas.filter(a => a.is_active).length > 0 ? 1 : 0,
      ok: areas.filter(a => a.is_active).length > 0,
      note: areas.filter(a => a.is_active).length > 0 ? `${areas.filter(a => a.is_active).length} active zone(s)` : 'No zones',
    },
    {
      label: 'Background Check', max: 1,
      pts: p.background_check_status === 'verified' ? 1 : 0,
      ok: p.background_check_status === 'verified',
      note: p.background_check_status,
    },
  ];
  const score = items.reduce((s, i) => s + i.pts, 0);
  return { score, pct: Math.round((score / 7) * 100), items };
}

// ── Shared tiny components ────────────────────────────────────────────────────
const Pill: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
    {children}
  </span>
);

const SectionToggle: React.FC<{
  label: string; count?: number; open: boolean;
  badge?: { text: string; color: string };
  onClick: () => void;
}> = ({ label, count, open, badge, onClick }) => (
  <button onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-t border-gray-200 first:border-t-0">
    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
      {label}
      {count !== undefined && (
        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{count}</span>
      )}
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.text}</span>
      )}
    </span>
    {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
  </button>
);

// ══════════════════════════════════════════════════════════════════════════════
//  DOCUMENT SECTION
// ══════════════════════════════════════════════════════════════════════════════
const DocSection: React.FC<{
  partnerId: string;
  detail: CardDetail;
  patchDetail: (p: Partial<CardDetail>) => void;
}> = ({ partnerId, detail, patchDetail }) => {
  const [expandedImg, setExpandedImg] = useState<string | null>(null);
  const [imgErrors, setImgErrors]     = useState<Record<string, boolean>>({});

  const verified   = detail.docs.filter(d => d.verification_status === 'verified').length;
  const allOk      = detail.docs.length > 0 && verified === detail.docs.length;
  const anyBad     = detail.docs.some(d => d.verification_status === 'rejected');
  const badgeColor = allOk ? 'bg-emerald-100 text-emerald-700' : anyBad ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  const badgeText  = `${verified}/${detail.docs.length} verified`;

  const toggleSection = () => {
    patchDetail({ section: detail.section === 'docs' ? null : 'docs' });
  };

  const getDocAction = (docId: string) =>
    detail.docActions[docId] ?? { mode: 'idle', notes: '', loading: false, error: null };

  const patchDocAction = (docId: string, patch: Partial<typeof detail.docActions[string]>) =>
    patchDetail({
      docActions: {
        ...detail.docActions,
        [docId]: { ...getDocAction(docId), ...patch },
      },
    });

  const submitDocAction = async (docId: string) => {
    const da = getDocAction(docId);
    if (da.mode === 'reject' && !da.notes.trim()) {
      patchDocAction(docId, { error: 'Rejection reason is required.' });
      return;
    }
    patchDocAction(docId, { loading: true, error: null });
    try {
      const ep   = da.mode === 'verify' ? 'verify_document' : 'reject_document';
      const body: any = { document_id: docId };
      if (da.notes.trim()) body.notes = da.notes;
      const { data } = await api.post(`/admin/partners/${partnerId}/${ep}/`, body);
      // update the doc in place
      patchDetail({
        docs: detail.docs.map(d => d.id === docId ? { ...d, ...data.document } : d),
        docActions: { ...detail.docActions, [docId]: { mode: 'idle', notes: '', loading: false, error: null } },
      });
    } catch (e: any) {
      patchDocAction(docId, { loading: false, error: e.response?.data?.error || 'Action failed.' });
    }
  };

  return (
    <div>
      <SectionToggle
        label="KYC Documents"
        count={detail.docs.length}
        open={detail.section === 'docs'}
        badge={detail.docs.length > 0 ? { text: badgeText, color: badgeColor } : undefined}
        onClick={toggleSection}
      />

      {detail.section === 'docs' && (
        <div className="bg-white divide-y divide-gray-100">
          {detail.docs.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Shield size={28} className="text-gray-300" />
              <p className="text-sm text-gray-500">No documents uploaded yet</p>
              <p className="text-xs text-gray-400">Partner hasn't submitted any KYC documents</p>
            </div>
          ) : (
            detail.docs.map(doc => {
              const st       = doc.verification_status;
              const da       = getDocAction(doc.id);
              const hasUrl   = !!doc.document_url;
              const isImg    = hasUrl && isImageUrl(doc.document_url!) && !imgErrors[doc.id];
              const isExpImg = expandedImg === doc.id;

              const stColor = st === 'verified' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                            : st === 'rejected'  ? 'text-red-600 bg-red-50 border-red-200'
                            : 'text-amber-600 bg-amber-50 border-amber-200';
              const StIcon  = st === 'verified' ? ShieldCheck : st === 'rejected' ? ShieldAlert : Shield;

              return (
                <div key={doc.id} className="p-4 space-y-3">
                  {/* Doc header */}
                  <div className={`flex items-start justify-between gap-3 p-3 rounded-xl border ${stColor}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <StIcon size={15} className="flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold capitalize">
                          {(doc.document_type_display || doc.document_type).replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs opacity-60">Uploaded {fmtDate(doc.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${stColor}`}>
                        {st}
                      </span>
                      {hasUrl && (
                        <a href={doc.document_url!} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                          <ExternalLink size={11} /> Open
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Image / File preview */}
                  {hasUrl && (
                    isImg ? (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                        <img
                          src={doc.document_url!}
                          alt={doc.document_type}
                          onError={() => setImgErrors(p => ({ ...p, [doc.id]: true }))}
                          className={`w-full object-contain transition-all ${isExpImg ? 'max-h-[480px]' : 'max-h-40'}`}
                        />
                        <button onClick={() => setExpandedImg(isExpImg ? null : doc.id)}
                          className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 text-white text-xs rounded-lg">
                          {isExpImg ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText size={18} className="text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-700">Non-image document</p>
                        </div>
                        <a href={doc.document_url!} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                          <ExternalLink size={13} /> Open
                        </a>
                      </div>
                    )
                  )}
                  {!hasUrl && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                      <FileText size={18} className="text-gray-400" />
                      <p className="text-sm text-gray-500">No file uploaded</p>
                    </div>
                  )}

                  {/* Verification notes */}
                  {doc.verification_notes && (
                    <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      📝 {doc.verification_notes}
                    </p>
                  )}

                  {/* Inline verify / reject */}
                  {da.mode === 'idle' ? (
                    <div className="flex items-center gap-2">
                      {st !== 'verified' && (
                        <button onClick={() => patchDocAction(doc.id, { mode: 'verify' })}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">
                          <ShieldCheck size={13} /> Verify
                        </button>
                      )}
                      {st !== 'rejected' && (
                        <button onClick={() => patchDocAction(doc.id, { mode: 'reject' })}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 border border-red-300 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100">
                          <ShieldAlert size={13} /> Reject
                        </button>
                      )}
                      {st === 'verified' && (
                        <p className="text-xs text-emerald-700 flex items-center gap-1">
                          <ShieldCheck size={12} /> Verified — reject to undo
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <p className={`text-xs font-bold ${da.mode === 'verify' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {da.mode === 'verify' ? 'Confirm verification (optional notes):' : 'Rejection reason (required):'}
                      </p>
                      <input
                        type="text"
                        value={da.notes}
                        onChange={e => patchDocAction(doc.id, { notes: e.target.value, error: null })}
                        placeholder={da.mode === 'verify' ? 'Optional notes…' : 'Why is this rejected?'}
                        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ${
                          da.mode === 'verify' ? 'border-gray-300 focus:ring-emerald-400' : 'border-red-300 focus:ring-red-400'
                        }`}
                      />
                      {da.error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{da.error}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => submitDocAction(doc.id)}
                          disabled={da.loading || (da.mode === 'reject' && !da.notes.trim())}
                          className={`flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-lg disabled:opacity-50 ${
                            da.mode === 'verify' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                          }`}>
                          {da.loading ? <Loader2 size={12} className="animate-spin" /> : null}
                          {da.mode === 'verify' ? 'Confirm Verify' : 'Confirm Reject'}
                        </button>
                        <button onClick={() => patchDocAction(doc.id, { mode: 'idle', notes: '', error: null })}
                          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-100">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Summary */}
          {detail.docs.length > 0 && (
            <div className={`mx-4 mb-4 mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border ${
              allOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : anyBad ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {allOk  ? <><ShieldCheck size={13} /> All verified — safe to approve</>
              : anyBad ? <><ShieldAlert size={13} /> Some rejected — review before deciding</>
              : <><Shield size={13} /> {verified}/{detail.docs.length} verified</>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  BANK ACCOUNT SECTION
// ══════════════════════════════════════════════════════════════════════════════
const BankSection: React.FC<{
  partnerId: string;
  detail: CardDetail;
  patchDetail: (p: Partial<CardDetail>) => void;
}> = ({ partnerId, detail, patchDetail }) => {
  const verifiedCount = detail.banks.filter(b => b.is_verified).length;
  const allOk         = detail.banks.length > 0 && verifiedCount === detail.banks.length;
  const badgeColor    = allOk ? 'bg-emerald-100 text-emerald-700' : detail.banks.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
  const badgeText     = detail.banks.length > 0 ? `${verifiedCount}/${detail.banks.length} verified` : 'None';

  const getBankAction = (id: string) => detail.bankActions[id] ?? { loading: false, error: null };

  const handleBankVerify = async (bank: BankAccount, verifyFlag: boolean) => {
    patchDetail({ bankActions: { ...detail.bankActions, [bank.id]: { loading: true, error: null } } });
    try {
      await api.post(`/admin/partners/${partnerId}/verify_bank/`, {
        bank_account_id: bank.id,
        is_verified: verifyFlag,
      });
      patchDetail({
        banks: detail.banks.map(b => b.id === bank.id ? { ...b, is_verified: verifyFlag } : b),
        bankActions: { ...detail.bankActions, [bank.id]: { loading: false, error: null } },
      });
    } catch (e: any) {
      patchDetail({
        bankActions: { ...detail.bankActions, [bank.id]: { loading: false, error: e.response?.data?.detail || 'Failed.' } },
      });
    }
  };

  return (
    <div>
      <SectionToggle
        label="Bank Accounts"
        count={detail.banks.length}
        open={detail.section === 'bank'}
        badge={{ text: badgeText, color: badgeColor }}
        onClick={() => patchDetail({ section: detail.section === 'bank' ? null : 'bank' })}
      />

      {detail.section === 'bank' && (
        <div className="bg-white p-4 space-y-3">
          {detail.banks.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <CreditCard size={28} className="text-gray-300" />
              <p className="text-sm text-gray-500">No bank accounts added</p>
              <p className="text-xs text-gray-400">Partner needs to add a bank account for payouts</p>
            </div>
          ) : (
            detail.banks.map(bank => {
              const ba = getBankAction(bank.id);
              return (
                <div key={bank.id} className={`rounded-xl border p-4 ${bank.is_verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CreditCard size={18} className={`mt-0.5 flex-shrink-0 ${bank.is_verified ? 'text-emerald-600' : 'text-amber-500'}`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{bank.bank_name}</p>
                          {bank.is_primary && (
                            <Pill color="bg-blue-100 text-blue-700"><Star size={9} className="fill-blue-700 text-blue-700" /> Primary</Pill>
                          )}
                          <Pill color={bank.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                            {bank.is_verified ? '✓ Verified' : '⚠ Unverified'}
                          </Pill>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{bank.account_holder_name}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">
                          {bank.account_number_masked} · IFSC: {bank.ifsc_code}
                        </p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">
                          {bank.account_type} account{bank.branch_name ? ` · ${bank.branch_name}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {bank.is_verified ? (
                        <button onClick={() => handleBankVerify(bank, false)} disabled={ba.loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 bg-white text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 disabled:opacity-50">
                          {ba.loading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                          Unverify
                        </button>
                      ) : (
                        <button onClick={() => handleBankVerify(bank, true)} disabled={ba.loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                          {ba.loading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                  {ba.error && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{ba.error}</p>
                  )}
                </div>
              );
            })
          )}

          {!allOk && detail.banks.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2.5">
              <Info size={12} />
              Unverified bank accounts count as only +1 point instead of +2 toward profile completion.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  SERVICE AREAS SECTION
// ══════════════════════════════════════════════════════════════════════════════
const AreasSection: React.FC<{ detail: CardDetail; patchDetail: (p: Partial<CardDetail>) => void }> = ({ detail, patchDetail }) => {
  const active    = detail.areas.filter(a => a.is_active).length;
  const badgeColor = active > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';

  return (
    <div>
      <SectionToggle
        label="Service Areas"
        count={detail.areas.length}
        open={detail.section === 'areas'}
        badge={{ text: active > 0 ? `${active} active` : 'None active', color: badgeColor }}
        onClick={() => patchDetail({ section: detail.section === 'areas' ? null : 'areas' })}
      />

      {detail.section === 'areas' && (
        <div className="bg-white p-4">
          {detail.areas.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <MapPin size={28} className="text-gray-300" />
              <p className="text-sm text-gray-500">No service areas configured</p>
              <p className="text-xs text-gray-400">Partner hasn't set up any pickup zones yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {detail.areas.map(area => (
                <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{area.name || `${area.city}, ${area.state}`}</p>
                      <p className="text-xs text-gray-500">{area.city}, {area.state}</p>
                      {area.postal_codes.length > 0 && (
                        <p className="text-xs text-gray-400 font-mono">
                          {area.postal_codes.slice(0, 4).join(', ')}{area.postal_codes.length > 4 ? ' …' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <Pill color={area.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                    {area.is_active ? 'Active' : 'Inactive'}
                  </Pill>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  FULL PARTNER REVIEW CARD
// ══════════════════════════════════════════════════════════════════════════════
const ReviewCard: React.FC<{
  partner: PartnerItem;
  index: number;
  detail: CardDetail;
  patchDetail: (p: Partial<CardDetail>) => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
  onMarkedComplete: (id: string) => void;
}> = ({ partner, index, detail, patchDetail, onApproved, onRejected, onMarkedComplete }) => {
  const navigate = useNavigate();

  // ── Toggle whole card open/closed ──────────────────────────────────────────
  const handleOpen = async () => {
    const nowOpen = !detail.open;
    patchDetail({ open: nowOpen });
    if (nowOpen && !detail.loaded && !detail.loading) {
      patchDetail({ loading: true, error: null });
      try {
        const [docsRes, banksRes, areasRes] = await Promise.allSettled([
          api.get(`/admin/partners/${partner.id}/documents/`),
          api.get(`/admin/partners/${partner.id}/bank_accounts/`),
          api.get(`/admin/partners/${partner.id}/service_areas/`),
        ]);
        patchDetail({
          loading: false,
          loaded: true,
          docs:  docsRes.status  === 'fulfilled' ? (docsRes.value.data.results  || docsRes.value.data  || []) : [],
          banks: banksRes.status === 'fulfilled' ? (banksRes.value.data.results || banksRes.value.data || []) : [],
          areas: areasRes.status === 'fulfilled' ? (areasRes.value.data.results || areasRes.value.data || []) : [],
        });
      } catch {
        patchDetail({ loading: false, error: 'Failed to load partner data.' });
      }
    }
  };

  // ── Quick KYC update ───────────────────────────────────────────────────────
  const handleKyc = async (kycStatus: string) => {
    patchDetail({ kycLoading: true });
    try {
      await api.patch(`/admin/partners/${partner.id}/`, { user: { kyc_status: kycStatus } });
      // Optimistic — parent will refresh on next load; force partial update
      partner.user.kyc_status = kycStatus; // mutate for immediate feedback
    } catch { /* ignore */ }
    finally { patchDetail({ kycLoading: false }); }
  };

  // ── Quick BGC update ───────────────────────────────────────────────────────
  const handleBgc = async (bgStatus: string) => {
    patchDetail({ bgcLoading: true });
    try {
      await api.patch(`/admin/partners/${partner.id}/`, { background_check_status: bgStatus });
      partner.background_check_status = bgStatus;
    } catch { /* ignore */ }
    finally { patchDetail({ bgcLoading: false }); }
  };

  // ── Mark profile complete ──────────────────────────────────────────────────
  const handleMarkComplete = async () => {
    patchDetail({ completing: true, actionError: null });
    try {
      await api.patch(`/admin/partners/${partner.id}/`, { profile_completed: true });
      onMarkedComplete(partner.id);
    } catch (e: any) {
      patchDetail({ completing: false, actionError: e.response?.data?.detail || 'Failed to mark complete.' });
    }
  };

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !detail.rejectReason.trim()) {
      patchDetail({ actionError: 'Rejection reason is required.' }); return;
    }
    patchDetail({ actionLoading: true, actionError: null });
    try {
      if (action === 'approve') {
        await api.post(`/admin/partners/${partner.id}/approve/`);
        onApproved(partner.id);
      } else {
        await api.post(`/admin/partners/${partner.id}/reject/`, { reason: detail.rejectReason });
        onRejected(partner.id);
      }
    } catch (e: any) {
      patchDetail({
        actionLoading: false, confirmAction: null,
        actionError: e.response?.data?.error || e.response?.data?.detail || 'Action failed.',
      });
    }
  };

  // ── Compute score (uses loaded data if available, estimates otherwise) ─────
  const { pct, items } = computeScore(partner, detail.banks, detail.areas);
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  const pctText  = pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
  const canComplete = pct >= 80 && !partner.profile_completed;

  // ── Urgency tags ───────────────────────────────────────────────────────────
  const isPending    = partner.status === 'pending';
  const isIncomplete = !partner.profile_completed;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      detail.open ? 'border-indigo-200 shadow-md' : 'border-gray-200 hover:shadow-md hover:border-gray-300'
    }`}>
      {/* ── Urgency strip ── */}
      <div className="flex">
        {isPending    && <div className="w-1.5 bg-amber-400 flex-shrink-0" />}
        {!isPending && isIncomplete && <div className="w-1.5 bg-blue-400 flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          {/* ── Card header ── */}
          <div className="p-5 cursor-pointer" onClick={handleOpen}>
            <div className="flex items-start gap-3">
              {/* Index */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${
                isPending ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {partner.business_name || <span className="text-gray-400 italic">No business name</span>}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize mt-0.5">{partner.business_type || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPending && <Pill color="bg-amber-100 text-amber-800"><Clock size={10} />Pending</Pill>}
                    {isIncomplete && <Pill color="bg-blue-100 text-blue-800"><AlertCircle size={10} />Incomplete</Pill>}
                    <span className="text-xs text-gray-400">{timeAgo(partner.created_at)}</span>
                    {detail.open
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><Users size={11} className="text-gray-400" />{partner.user.name}</span>
                  <span className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" />{partner.user.phone}</span>
                  {partner.user.email && <span className="flex items-center gap-1.5"><Mail size={11} className="text-gray-400" />{partner.user.email}</span>}
                  <span className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400" />{partner.service_radius_km} km radius</span>
                  <span className="flex items-center gap-1.5"><Calendar size={11} className="text-gray-400" />{fmtDate(partner.created_at)}</span>
                </div>

                {/* Profile completion bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      Profile completion
                      {!detail.loaded && <span className="text-gray-400 ml-1">(estimate — expand to see full score)</span>}
                    </span>
                    <span className={`text-sm font-black ${pctText}`}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  {/* 80% marker */}
                  <div className="relative h-3">
                    <div className="absolute left-[80%] -top-0.5">
                      <div className="w-px h-2.5 bg-gray-400 mx-auto" />
                      <span className="text-[9px] text-gray-400">80%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Expanded body ── */}
          {detail.open && (
            <div className="border-t border-gray-100">

              {/* Loading spinner */}
              {detail.loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                  <Loader2 size={18} className="animate-spin text-indigo-500" /> Loading partner data…
                </div>
              )}

              {detail.error && (
                <div className="p-4 text-sm text-red-600 flex items-center gap-2 bg-red-50">
                  <AlertTriangle size={14} />{detail.error}
                </div>
              )}

              {detail.loaded && (
                <>
                  {/* ── Score breakdown ─────────────────────────────────── */}
                  {items.length > 0 && (
                    <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-gray-50 border-b border-gray-100">
                      {items.map(item => (
                        <div key={item.label} className={`flex items-start gap-2 p-2 rounded-xl border ${
                          item.ok ? 'bg-emerald-50 border-emerald-200'
                          : item.pts > 0 ? 'bg-amber-50 border-amber-200'
                          : 'bg-gray-100 border-gray-200'
                        }`}>
                          {item.ok
                            ? <CheckCircle size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            : item.pts > 0
                            ? <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            : <Circle size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-700 truncate">{item.label}</p>
                            <p className="text-xs text-gray-500 truncate">{item.note}</p>
                            <div className="flex gap-0.5 mt-1">
                              {Array.from({ length: item.max }).map((_, i) => (
                                <div key={i} className={`h-1 w-4 rounded-full ${i < item.pts ? (item.ok ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Quick status controls ────────────────────────────── */}
                  <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-100">
                    {/* KYC */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Shield size={12} /> KYC Status
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${
                          partner.background_check_status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>{partner.background_check_status || 'pending'}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['pending', 'in_review', 'verified', 'rejected'] as const).map(s => (
                          <button key={s} disabled={detail.kycLoading || partner.user.kyc_status === s}
                            onClick={() => handleKyc(s)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 capitalize ${
                              partner.user.kyc_status === s
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}>
                            {detail.kycLoading ? <Loader2 size={11} className="animate-spin mx-auto" /> : s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background check */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <BadgeCheck size={12} /> Background Check
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${
                          partner.background_check_status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>{partner.background_check_status}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['pending', 'in_progress', 'verified', 'failed'] as const).map(s => (
                          <button key={s} disabled={detail.bgcLoading || partner.background_check_status === s}
                            onClick={() => handleBgc(s)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-40 capitalize ${
                              partner.background_check_status === s
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}>
                            {detail.bgcLoading ? <Loader2 size={11} className="animate-spin mx-auto" /> : s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Expandable sections ──────────────────────────────── */}
                  <DocSection   partnerId={partner.id} detail={detail} patchDetail={patchDetail} />
                  <BankSection  partnerId={partner.id} detail={detail} patchDetail={patchDetail} />
                  <AreasSection detail={detail} patchDetail={patchDetail} />

                  {/* ── Action footer ────────────────────────────────────── */}
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">

                    {/* Mark complete (if conditions met) */}
                    {canComplete && (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <Zap size={16} className="text-emerald-600 flex-shrink-0" />
                        <p className="text-sm text-emerald-800 flex-1">
                          Score is {pct}% — all conditions met. Ready to mark profile as complete.
                        </p>
                        <button onClick={handleMarkComplete} disabled={detail.completing}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex-shrink-0">
                          {detail.completing ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />}
                          {detail.completing ? 'Saving…' : 'Mark Complete'}
                        </button>
                      </div>
                    )}

                    {/* Approve / Reject (pending only) */}
                    {isPending && (
                      detail.confirmAction === 'reject' ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                          <p className="text-sm font-bold text-red-800">Rejection reason (required):</p>
                          <textarea autoFocus value={detail.rejectReason}
                            onChange={e => patchDetail({ rejectReason: e.target.value, actionError: null })}
                            placeholder="e.g. Incomplete documents, mismatch in KYC details…"
                            rows={3} className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-400 bg-white" />
                          {detail.actionError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{detail.actionError}</p>}
                          <div className="flex gap-2">
                            <button onClick={() => handleAction('reject')} disabled={detail.actionLoading || !detail.rejectReason.trim()}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
                              {detail.actionLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                              Confirm Rejection
                            </button>
                            <button onClick={() => patchDetail({ confirmAction: null, rejectReason: '', actionError: null })}
                              className="px-4 py-2 border border-red-200 text-red-700 text-sm rounded-lg hover:bg-red-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : detail.confirmAction === 'approve' ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-sm text-emerald-800 font-semibold flex items-center gap-1.5">
                            <CheckCircle size={14} /> Confirm approval? Partner gets full platform access.
                          </p>
                          <div className="flex gap-2">
                            <button onClick={() => handleAction('approve')} disabled={detail.actionLoading}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                              {detail.actionLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                              Yes, Approve
                            </button>
                            <button onClick={() => patchDetail({ confirmAction: null })}
                              className="px-3 py-2 border border-emerald-300 text-emerald-700 text-sm rounded-lg hover:bg-emerald-100">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => patchDetail({ confirmAction: 'approve' })} disabled={detail.actionLoading}
                            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                            <CheckCircle size={15} /> Approve Partner
                          </button>
                          <button onClick={() => patchDetail({ confirmAction: 'reject' })} disabled={detail.actionLoading}
                            className="flex items-center gap-1.5 px-5 py-2.5 border border-red-200 bg-red-50 text-red-700 text-sm font-bold rounded-xl hover:bg-red-100 disabled:opacity-50">
                            <XCircle size={15} /> Reject Partner
                          </button>
                          <button onClick={() => navigate(`/partners/${partner.id}?tab=verification`)}
                            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-100 ml-auto">
                            <Eye size={14} /> Full Profile
                          </button>
                          {detail.actionError && (
                            <p className="w-full text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{detail.actionError}</p>
                          )}
                        </div>
                      )
                    )}

                    {/* Non-pending incomplete: just navigate */}
                    {!isPending && isIncomplete && !detail.confirmAction && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/partners/${partner.id}?tab=verification`)}
                          className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                          <ShieldCheck size={15} /> Open Verification Tab
                        </button>
                        {detail.actionError && (
                          <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{detail.actionError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const PendingApprovals: React.FC = () => {
  const navigate = useNavigate();

  const [partners, setPartners]     = useState<PartnerItem[]>([]);
  const [stats, setStats]           = useState<PlatformStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState<Record<string, CardDetail>>({});

  // ── Helper: patch one card's detail ─────────────────────────────────────
  const getDetail  = useCallback((id: string) => cardDetails[id] ?? defaultDetail(), [cardDetails]);
  const patchDetail = useCallback((id: string, patch: Partial<CardDetail>) =>
    setCardDetails(prev => ({ ...prev, [id]: { ...(prev[id] ?? defaultDetail()), ...patch } })),
  []);

  // ── Load stats ────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { const { data } = await api.get<PlatformStats>('/admin/partners/stats/'); setStats(data); }
    catch { /* non-blocking */ }
    finally { setStatsLoading(false); }
  }, []);

  // ── Load the unified queue ────────────────────────────────────────────────
  const loadQueue = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Fetch both in parallel: pending list + all incomplete
      const [pendingRes, allRes] = await Promise.allSettled([
        api.get<{ results: PartnerItem[] }>('/admin/partners/pending_approvals/'),
        api.get<{ results: PartnerItem[] }>('/admin/partners/', {
          params: { profile_completed: 'false', page_size: 200, ordering: '-created_at' },
        }),
      ]);

      const pending = pendingRes.status === 'fulfilled'
        ? (pendingRes.value.data.results || [])
        : [];

      const allIncomplete = allRes.status === 'fulfilled'
        ? (allRes.value.data.results || []).filter(p => !p.profile_completed)
        : [];

      // Merge: start with pending, then add incomplete not already in list
      const pendingIds = new Set(pending.map(p => p.id));
      const extra      = allIncomplete.filter(p => !pendingIds.has(p.id) && p.status !== 'pending');

      // Sort: pending-and-incomplete first → pending only → incomplete only → oldest first
      const merged = [...pending, ...extra].sort((a, b) => {
        const urgencyA = (a.status === 'pending' ? 2 : 0) + (!a.profile_completed ? 1 : 0);
        const urgencyB = (b.status === 'pending' ? 2 : 0) + (!b.profile_completed ? 1 : 0);
        if (urgencyB !== urgencyA) return urgencyB - urgencyA;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      setPartners(merged);
      const init: Record<string, CardDetail> = {};
      merged.forEach(p => { init[p.id] = defaultDetail(); });
      setCardDetails(init);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); loadQueue(); }, [loadStats, loadQueue]);

  const handleApproved = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    loadStats();
  };
  const handleRejected = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    loadStats();
  };
  const handleMarkedComplete = (id: string) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, profile_completed: true } : p));
  };

  const pendingCount    = partners.filter(p => p.status === 'pending').length;
  const incompleteCount = partners.filter(p => !p.profile_completed).length;

  const STRIP = [
    { label: 'Awaiting',  key: 'pending',   dot: 'bg-amber-400',   bg: 'bg-amber-50 border-amber-200 text-amber-900' },
    { label: 'Approved',  key: 'approved',  dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
    { label: 'Rejected',  key: 'rejected',  dot: 'bg-red-400',     bg: 'bg-red-50 border-red-200 text-red-900' },
    { label: 'Suspended', key: 'suspended', dot: 'bg-gray-400',    bg: 'bg-gray-50 border-gray-200 text-gray-800' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/partners')} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Partner Review Queue</h1>
              <p className="text-sm text-gray-500">
                {pendingCount} pending approval · {incompleteCount} incomplete profiles
              </p>
            </div>
          </div>
          <button onClick={() => { loadQueue(); loadStats(); }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* How to use hint */}
        {!loading && partners.length > 0 && (
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800">
            <Info size={15} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Click any card to expand.</strong> Inside you can update KYC and background check status,
              verify documents (view inline image → Verify / Reject), verify bank accounts, and
              see service areas — all without leaving this page.
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-gray-200">
            <div className="text-center space-y-3">
              <Loader2 size={32} className="mx-auto text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-500">Loading queue…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="text-center space-y-3">
              <AlertTriangle size={36} className="mx-auto text-red-400" />
              <p className="text-gray-700">{error}</p>
              <button onClick={loadQueue} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Retry</button>
            </div>
          </div>
        ) : partners.length === 0 ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-gray-200">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">All clear!</h3>
              <p className="text-sm text-gray-500">No partners waiting for review.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
              {partners.length} partner{partners.length !== 1 ? 's' : ''} need attention
              <span className="normal-case font-normal ml-2 text-gray-400">
                (sorted: pending + incomplete first, then oldest)
              </span>
            </p>
            {partners.map((p, i) => (
              <ReviewCard
                key={p.id}
                partner={p}
                index={i}
                detail={getDetail(p.id)}
                patchDetail={(patch) => patchDetail(p.id, patch)}
                onApproved={handleApproved}
                onRejected={handleRejected}
                onMarkedComplete={handleMarkedComplete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;