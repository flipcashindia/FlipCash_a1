// // pages/pricing/PricingAdmin.tsx
// import { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   Plus, Edit2, Trash2, Upload, Download,
//   CheckSquare2, Square, FlaskConical, Layers,
//   DollarSign, TrendingUp, ClipboardList,
//   Eye, RefreshCw, X, Search,
// } from 'lucide-react';
// import { Card } from '../../components/UI/Card';
// import { Button } from '../../components/UI/Button';
// import { Badge } from '../../components/UI/Badge';
// import { Loader } from '../../components/UI/Loader';
// import { Input } from '../../components/UI/Input';
// import { Select } from '../../components/UI/Select';
// import { Modal } from '../../components/UI/Modal';
// import { Alert } from '../../components/UI/Alert';
// import { formatCurrency, formatDate } from '../../lib/utils';
// import toast from 'react-hot-toast';
// import { API_BASE_URL } from '../../config/constants';

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface DevicePriorityTier {
//   id: string;
//   name: string;
//   tier_code: string;
//   display_name: string;
//   description: string;
//   brand: string;
//   brand_name: string;
//   category: string;
//   category_name: string;
//   min_price: string;
//   max_price: string;
//   ask_warranty: boolean;
//   scrap_value: string;
//   warranty_bonus: string;     // e.g. "1.02"
//   warranty_penalty: string;   // e.g. "0.85"
//   is_active: boolean;
//   rules_count?: number;
//   created_at: string;
//   updated_at: string;
// }

// interface PriorityTierRule {
//   id: string;
//   priority_tier: string;
//   priority_tier_name?: string;
//   rule_key: string;
//   rule_type: 'percentage' | 'fixed' | 'scrap' | 'warranty_bonus' | 'warranty_penalty';
//   rule_value: string;
//   display_label: string;
//   display_order: number;
//   is_active: boolean;
//   created_at: string;
// }

// interface FeeStructure {
//   id: string;
//   name: string;
//   fee_type: string;
//   fee_type_display: string;
//   calculation_type: string;
//   calculation_type_display: string;
//   fee_value: string;
//   min_fee: string | null;
//   max_fee: string | null;
//   gst_applicable: boolean;
//   gst_percentage: string;
//   is_active: boolean;
//   effective_from: string;
//   effective_until: string | null;
// }

// interface MarketPriceData {
//   id: string;
//   device_model: string;
//   device_name: string;
//   source: string;
//   source_display: string;
//   source_url: string;
//   listed_price: string;
//   condition: string;
//   storage: string;
//   color: string;
//   is_active: boolean;
//   recorded_at: string;
// }

// interface PriceEstimate {
//   id: string;
//   estimate_number: string;
//   user_phone: string;
//   device_model: { id: string; name: string; brand_name: string };
//   device_variant: { storage: string; ram: string };
//   condition_inputs: Record<string, string>;
//   base_price: string;
//   deductions: Array<{ reason: string; type: string; value: string; amount: string }>;
//   additions: Array<{ reason: string; type: string; value: string; amount: string }>;
//   final_price: string;
//   pricing_rule_version: string;
//   is_valid: boolean;
//   is_expired: boolean;
//   expires_at: string;
//   converted_to_lead: boolean;
//   created_at: string;
// }

// interface ImportResult {
//   created: number;
//   updated: number;
//   errors: Array<{ row: number; error: string }>;
//   total: number;
// }

// // ─── API ──────────────────────────────────────────────────────────────────────

// const BASE = `${API_BASE_URL}/pricing`;
// const authH = () => ({
//   Authorization: `Bearer ${localStorage.getItem('access_token')}`,
// });

// // async function apiFetch(path: string, opts?: RequestInit) {
// //   const res = await fetch(`${BASE}${path}`, {
// //     headers: {
// //       'Content-Type': 'application/json',
// //       ...authH(),
// //       ...(opts?.headers || {}),
// //     },
// //     ...opts,
// //   });
// //   if (!res.ok) {
// //     const err = await res.json().catch(() => ({ detail: res.statusText }));
// //     throw new Error(err.detail || JSON.stringify(err));
// //   }
// //   if (res.status === 204) return null;
// //   return res.json();
// // }

// async function apiFetch(path: string, opts?: RequestInit) {
//   // 1. Separate headers from the rest of the options so we don't overwrite them later
//   const { headers: customHeaders, ...restOpts } = opts || {};
  
//   // 2. Build the headers safely
//   const headers: any = {
//     ...authH(),
//     ...(customHeaders || {}),
//   };

//   // 3. ONLY force JSON if the body is NOT FormData. 
//   // (Browsers need to auto-set the Content-Type for file uploads)
//   if (!(opts?.body instanceof FormData)) {
//     headers['Content-Type'] = 'application/json';
//   }

//   const res = await fetch(`${BASE}${path}`, {
//     headers,
//     ...restOpts, // Spread the rest of the options, safely omitting `headers`
//   });

//   if (!res.ok) {
//     const err = await res.json().catch(() => ({ detail: res.statusText }));
//     throw new Error(err.detail || JSON.stringify(err));
//   }
//   if (res.status === 204) return null;
//   return res.json();
// }

// const api = {
//   // Priority Tiers
//   getTiers:    (p?: any) => apiFetch(`/priority-tiers/?${new URLSearchParams(p || {})}`),
//   createTier:  (d: any)  => apiFetch('/priority-tiers/', { method: 'POST', body: JSON.stringify(d) }),
//   updateTier:  (id: string, d: any) => apiFetch(`/priority-tiers/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
//   deleteTier:  (id: string) => apiFetch(`/priority-tiers/${id}/`, { method: 'DELETE' }),
//   importTiers: (f: File) => {
//     const fd = new FormData(); fd.append('file', f);
//     return apiFetch('/priority-tiers/import_csv/', { method: 'POST', body: fd, headers: {} });
//   },
//   exportTiers: () => fetch(`${BASE}/priority-tiers/export_csv/`, { headers: authH() }),
//   templateTiers: () => fetch(`${BASE}/priority-tiers/csv_template/`, { headers: authH() }),
//   bulkToggle:  (ids: string[], is_active: boolean) =>
//     apiFetch('/priority-tiers/bulk_toggle/', { method: 'POST', body: JSON.stringify({ ids, is_active }) }),
//   bulkDelete:  (ids: string[]) =>
//     apiFetch('/priority-tiers/bulk_delete/', { method: 'POST', body: JSON.stringify({ ids }) }),

//   // Tier Rules
//   getRules:    (tierId?: string) => apiFetch(`/tier-rules/${tierId ? `?priority_tier=${tierId}` : ''}`),
//   createRule:  (d: any) => apiFetch('/tier-rules/', { method: 'POST', body: JSON.stringify(d) }),
//   updateRule:  (id: string, d: any) => apiFetch(`/tier-rules/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
//   deleteRule:  (id: string) => apiFetch(`/tier-rules/${id}/`, { method: 'DELETE' }),
//   importRules: (f: File) => {
//     const fd = new FormData(); fd.append('file', f);
//     return apiFetch('/tier-rules/import_csv/', { method: 'POST', body: fd, headers: {} });
//   },
//   exportRules: (tierId?: string) =>
//     fetch(`${BASE}/tier-rules/export_csv/${tierId ? `?priority_tier=${tierId}` : ''}`, { headers: authH() }),
//   templateRules: () => fetch(`${BASE}/tier-rules/csv_template/`, { headers: authH() }),

//   // Fees
//   getFees:     () => apiFetch('/fees/'),
//   createFee:   (d: any) => apiFetch('/fees/', { method: 'POST', body: JSON.stringify(d) }),
//   updateFee:   (id: string, d: any) => apiFetch(`/fees/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
//   deleteFee:   (id: string) => apiFetch(`/fees/${id}/`, { method: 'DELETE' }),
//   testFee:     (id: string, amount: number) =>
//     apiFetch(`/fees/${id}/test_calculation/`, { method: 'POST', body: JSON.stringify({ amount }) }),

//   // Market Prices
//   getMarket:    (p?: any) => apiFetch(`/market-prices/?${new URLSearchParams(p || {})}`),
//   createMarket: (d: any)  => apiFetch('/market-prices/', { method: 'POST', body: JSON.stringify(d) }),
//   updateMarket: (id: string, d: any) => apiFetch(`/market-prices/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
//   deleteMarket: (id: string) => apiFetch(`/market-prices/${id}/`, { method: 'DELETE' }),
//   importMarket: (f: File) => {
//     const fd = new FormData(); fd.append('file', f);
//     return apiFetch('/market-prices/import_csv/', { method: 'POST', body: fd, headers: {} });
//   },
//   exportMarket: () => fetch(`${BASE}/market-prices/export_csv/`, { headers: authH() }),

//   // Estimates
//   getEstimates:      (p?: any) => apiFetch(`/estimates/?${new URLSearchParams(p || {})}`),
//   invalidateEstimate:(id: string) => apiFetch(`/estimates/${id}/invalidate/`, { method: 'POST' }),
//   exportEstimates:   () => fetch(`${BASE}/estimates/export_csv/`, { headers: authH() }),
// };

// // ─── Utilities ────────────────────────────────────────────────────────────────

// function dlBlob(res: Response, filename: string) {
//   res.blob().then((b) => {
//     const a = document.createElement('a');
//     a.href = URL.createObjectURL(b);
//     a.download = filename;
//     a.click();
//   });
// }

// // ─── Shared tiny components ───────────────────────────────────────────────────

// function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
//   return (
//     <button
//       type="button"
//       onClick={() => onChange(!value)}
//       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-secondary' : 'bg-gray-300'}`}
//     >
//       <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
//     </button>
//   );
// }

// function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
//   return (
//     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
//       <div>
//         <p className="text-sm font-medium text-gray-700">{label}</p>
//         {hint && <p className="text-xs text-gray-400">{hint}</p>}
//       </div>
//       <Switch value={value} onChange={onChange} />
//     </div>
//   );
// }

// function Pill({ label, colorCls }: { label: string; colorCls: string }) {
//   return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorCls}`}>{label}</span>;
// }

// // Simple native <select> for toolbar filters (not the full Select component)
// function FilterSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
//   return (
//     <select
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent bg-white text-gray-700 outline-none"
//     >
//       {children}
//     </select>
//   );
// }

// function DataTable({ cols, loading, span, children }: { cols: string[]; loading: boolean; span: number; children: React.ReactNode }) {
//   return (
//     <div className="overflow-x-auto rounded-xl border border-gray-100">
//       <table className="w-full text-sm">
//         <thead className="bg-gray-50 border-b border-gray-100">
//           <tr>
//             {cols.map((c) => (
//               <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-50">
//           {loading ? (
//             <tr><td colSpan={span} className="py-16 text-center"><Loader size="sm" /></td></tr>
//           ) : children}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function EmptyRow({ span, msg }: { span: number; msg: string }) {
//   return <tr><td colSpan={span} className="py-14 text-center text-sm text-gray-400">{msg}</td></tr>;
// }

// function EditBtn({ onClick }: { onClick: () => void }) {
//   return <button onClick={onClick} className="p-1.5 rounded-lg text-secondary hover:bg-blue-50 transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>;
// }
// function DelBtn({ onClick }: { onClick: () => void }) {
//   return <button onClick={onClick} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>;
// }
// function LabelBtn({ label, icon: Icon, onClick }: { label: string; icon: any; onClick: () => void }) {
//   return (
//     <button onClick={onClick} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 whitespace-nowrap">
//       <Icon className="w-3 h-3" /> {label}
//     </button>
//   );
// }

// function StatCard({ label, value, icon: Icon, colorCls }: { label: string; value: string | number; icon: any; colorCls: string }) {
//   return (
//     <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
//       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorCls}`}><Icon className="w-5 h-5" /></div>
//       <div>
//         <p className="text-xl font-bold text-dark">{value}</p>
//         <p className="text-xs text-gray-500 font-medium">{label}</p>
//       </div>
//     </div>
//   );
// }

// // ─── Colour maps ──────────────────────────────────────────────────────────────

// const TIER_CODE_CLS: Record<string, string> = {
//   P1: 'bg-gray-100 text-gray-700',
//   P2: 'bg-blue-100 text-blue-700',
//   P3: 'bg-purple-100 text-purple-700',
//   P4: 'bg-amber-100 text-amber-700',
// };
// const RULE_TYPE_CLS: Record<string, string> = {
//   percentage:       'bg-blue-100 text-blue-700',
//   fixed:            'bg-cyan-100 text-cyan-700',
//   scrap:            'bg-red-100 text-red-700',
//   warranty_bonus:   'bg-green-100 text-green-700',
//   warranty_penalty: 'bg-orange-100 text-orange-700',
// };
// const FEE_TYPE_CLS: Record<string, string> = {
//   platform_commission: 'bg-blue-100 text-blue-700',
//   partner_fee:         'bg-purple-100 text-purple-700',
//   claim_fee:           'bg-cyan-100 text-cyan-700',
//   transaction_fee:     'bg-green-100 text-green-700',
//   payment_gateway:     'bg-orange-100 text-orange-700',
//   cancellation_fee:    'bg-red-100 text-red-700',
// };
// const SOURCE_CLS: Record<string, string> = {
//   cashify:   'bg-blue-100 text-blue-700',
//   instacash: 'bg-green-100 text-green-700',
//   olx:       'bg-amber-100 text-amber-700',
//   quickr:    'bg-purple-100 text-purple-700',
//   manual:    'bg-gray-100 text-gray-700',
// };

// // ─── Import CSV Modal ─────────────────────────────────────────────────────────

// function ImportModal({
//   isOpen, onClose, title, columns, onImport, onTemplate,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   /** Exact CSV columns shown in the modal as a reference */
//   columns: string[];
//   onImport: (f: File) => Promise<void>;
//   onTemplate?: () => void;
// }) {
//   const [drag, setDrag] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [busy, setBusy] = useState(false);
//   const [result, setResult] = useState<ImportResult | null>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const reset = () => { setFile(null); setResult(null); };

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={() => { reset(); onClose(); }}
//       title={title}
//       size="md"
//       footer={
//         <>
//           <Button variant="outline" onClick={() => { reset(); onClose(); }}>Close</Button>
//           <Button
//             loading={busy}
//             disabled={!file || busy}
//             onClick={async () => {
//               if (!file) return;
//               setBusy(true);
//               try {
//                 const r: ImportResult = await onImport(file) as any;
//                 setResult(r);
//                 if (r.errors.length === 0) toast.success(`${r.created} created, ${r.updated} updated`);
//                 else toast.error(`${r.errors.length} row(s) failed`);
//               } finally {
//                 setBusy(false);
//               }
//             }}
//           >
//             <Upload className="w-4 h-4 mr-1" /> Import
//           </Button>
//         </>
//       }
//     >
//       <div className="space-y-4">
//         {/* Column reference */}
//         <div>
//           <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Required CSV columns</p>
//           <div className="flex flex-wrap gap-1">
//             {columns.map((c) => (
//               <code key={c} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{c}</code>
//             ))}
//           </div>
//         </div>

//         {/* Template download */}
//         {onTemplate && (
//           <button
//             onClick={onTemplate}
//             className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
//           >
//             <Download className="w-3.5 h-3.5" /> Download template CSV
//           </button>
//         )}

//         {/* Drop zone */}
//         <div
//           onClick={() => inputRef.current?.click()}
//           onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
//           onDragLeave={() => setDrag(false)}
//           onDrop={(e) => {
//             e.preventDefault(); setDrag(false);
//             const f = e.dataTransfer.files[0];
//             if (f?.name.endsWith('.csv')) { setFile(f); setResult(null); }
//           }}
//           className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
//             drag ? 'border-secondary bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
//           }`}
//         >
//           <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
//           <p className="font-semibold text-gray-500 text-sm">
//             {file ? file.name : 'Drop CSV here or click to browse'}
//           </p>
//           {file && <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>}
//           <input
//             ref={inputRef}
//             type="file"
//             accept=".csv"
//             className="hidden"
//             onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); } }}
//           />
//         </div>

//         {/* Result */}
//         {result && (
//           <div className={`rounded-xl p-4 border ${result.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
//             <div className="flex gap-4 text-sm mb-2">
//               <span className="text-green-700 font-semibold">✓ {result.created} created</span>
//               <span className="text-blue-700 font-semibold">↺ {result.updated} updated</span>
//               {result.errors.length > 0 && <span className="text-red-600 font-semibold">✗ {result.errors.length} errors</span>}
//             </div>
//             {result.errors.length > 0 && (
//               <div className="max-h-32 overflow-y-auto space-y-1">
//                 {result.errors.map((e, i) => (
//                   <p key={i} className="text-xs text-red-700">Row {e.row}: {e.error}</p>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </Modal>
//   );
// }

// // ─── Confirm modal ────────────────────────────────────────────────────────────

// function ConfirmModal({ isOpen, onClose, onConfirm, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; message: string }) {
//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Confirm" size="sm"
//       footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Confirm</Button></>}
//     >
//       <Alert type="warning">{message}</Alert>
//     </Modal>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Priority Tiers Section
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * Exact CSV columns – must match backend TIER_CSV_COLUMNS constant.
//  */
// const TIER_CSV_COLS = [
//   'priority_tier_id',
//   'brand',
//   'device_category',
//   'name',
//   'min_price',
//   'max_price',
//   'ask_warranty',
//   'scrap_value',
//   'warranty_bonus',
//   'warranty_penalty',
// ];

// const RULE_TYPE_OPTIONS = [
//   { value: 'percentage',       label: 'Percentage' },
//   { value: 'fixed',            label: 'Fixed Amount' },
//   { value: 'scrap',            label: 'Set to Scrap Value' },
//   { value: 'warranty_bonus',   label: 'Warranty Bonus' },
//   { value: 'warranty_penalty', label: 'Warranty Penalty' },
// ];

// function PriorityTiersSection() {
//   const [rows, setRows]             = useState<DevicePriorityTier[]>([]);
//   const [loading, setLoading]       = useState(true);
//   const [sel, setSel]               = useState<Set<string>>(new Set());
//   const [search, setSearch]         = useState('');
//   const [fBrand, setFBrand]         = useState('');
//   const [fCat, setFCat]             = useState('');
//   const [edit, setEdit]             = useState<Partial<DevicePriorityTier> | null>(null);
//   const [rulesFor, setRulesFor]     = useState<DevicePriorityTier | null>(null);
//   const [showImport, setShowImport] = useState(false);
//   const [saving, setSaving]         = useState(false);
//   const [confirm, setConfirm]       = useState<{ msg: string; fn: () => void } | null>(null);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const d = await api.getTiers({ search, page_size: 200 });
//       setRows(d.results || d);
//     } catch (e: any) { toast.error(e.message); }
//     finally { setLoading(false); }
//   }, [search]);

//   useEffect(() => { load(); }, [load]);

//   const brands = [...new Set(rows.map((r) => r.brand_name).filter(Boolean))];
//   const cats   = [...new Set(rows.map((r) => r.category_name).filter(Boolean))];

//   const filtered = rows.filter((r) => {
//     const bOk = !fBrand || r.brand_name === fBrand;
//     const cOk = !fCat   || r.category_name === fCat;
//     return bOk && cOk;
//   });

//   const toggleSel = (id: string) => {
//     const s = new Set(sel);
//     s.has(id) ? s.delete(id) : s.add(id);
//     setSel(s);
//   };

//   const handleSave = async () => {
//     if (!edit) return;
//     setSaving(true);
//     try {
//       edit.id ? await api.updateTier(edit.id, edit) : await api.createTier(edit);
//       toast.success('Saved');
//       setEdit(null);
//       load();
//     } catch (e: any) { toast.error(e.message); }
//     finally { setSaving(false); }
//   };

//   return (
//     <div className="space-y-4">
//       {/* Toolbar */}
//       <div className="flex flex-wrap gap-3 items-center">
//         <Input
//           placeholder="Search name, brand…"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           icon={Search}
//           className="w-52"
//         />
//         <FilterSelect value={fBrand} onChange={setFBrand}>
//           <option value="">All Brands</option>
//           {brands.map((b) => <option key={b} value={b}>{b}</option>)}
//         </FilterSelect>
//         <FilterSelect value={fCat} onChange={setFCat}>
//           <option value="">All Categories</option>
//           {cats.map((c) => <option key={c} value={c}>{c}</option>)}
//         </FilterSelect>

//         {/* Bulk actions */}
//         {sel.size > 0 && (
//           <>
//             <Button size="sm" variant="secondary"
//               onClick={() => setConfirm({ msg: `Activate ${sel.size} tier(s)?`, fn: async () => { await api.bulkToggle([...sel], true); toast.success('Activated'); setSel(new Set()); load(); } })}>
//               <CheckSquare2 className="w-3.5 h-3.5 mr-1" /> Activate ({sel.size})
//             </Button>
//             <Button size="sm" variant="outline"
//               onClick={() => setConfirm({ msg: `Deactivate ${sel.size} tier(s)?`, fn: async () => { await api.bulkToggle([...sel], false); toast.success('Deactivated'); setSel(new Set()); load(); } })}>
//               <Square className="w-3.5 h-3.5 mr-1" /> Deactivate
//             </Button>
//             <Button size="sm" variant="danger"
//               onClick={() => setConfirm({ msg: `Permanently delete ${sel.size} tier(s)?`, fn: async () => { await api.bulkDelete([...sel]); toast.success('Deleted'); setSel(new Set()); load(); } })}>
//               <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete ({sel.size})
//             </Button>
//           </>
//         )}

//         <div className="ml-auto flex flex-wrap gap-2">
//           <Button size="sm" variant="outline" onClick={() => api.templateTiers().then((r) => dlBlob(r, 'priority_tiers_template.csv'))}>
//             <Download className="w-3.5 h-3.5 mr-1" /> Template
//           </Button>
//           <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
//             <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV
//           </Button>
//           <Button size="sm" variant="outline" onClick={() => api.exportTiers().then((r) => dlBlob(r, 'priority_tiers.csv')).catch((e) => toast.error(e.message))}>
//             <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
//           </Button>
//           <Button size="sm" onClick={() => setEdit({ is_active: true, ask_warranty: false, warranty_bonus: '1.00', warranty_penalty: '1.00' })}>
//             <Plus className="w-3.5 h-3.5 mr-1" /> Add Tier
//           </Button>
//         </div>
//       </div>

//       {/* Table — includes warranty_bonus and warranty_penalty columns */}
//       <DataTable loading={loading} span={13} cols={[
//         '', 'Name', 'Brand', 'Category', 'Code',
//         'Price Range', 'Scrap', 'Warranty', 'W. Bonus', 'W. Penalty',
//         'Rules', 'Status', 'Actions',
//       ]}>
//         {filtered.length === 0
//           ? <EmptyRow span={13} msg="No priority tiers found" />
//           : filtered.map((t) => (
//             <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${sel.has(t.id) ? 'bg-blue-50' : ''}`}>
//               <td className="px-4 py-3 w-8">
//                 <input type="checkbox" checked={sel.has(t.id)} onChange={() => toggleSel(t.id)}
//                   className="rounded border-gray-300 text-secondary focus:ring-secondary" />
//               </td>
//               <td className="px-4 py-3">
//                 <p className="font-semibold text-secondary text-sm">{t.name}</p>
//                 {t.display_name && <p className="text-xs text-gray-400">{t.display_name}</p>}
//               </td>
//               <td className="px-4 py-3 text-sm text-gray-700">{t.brand_name}</td>
//               <td className="px-4 py-3 text-sm text-gray-700">{t.category_name}</td>
//               <td className="px-4 py-3">
//                 <Pill label={t.tier_code} colorCls={TIER_CODE_CLS[t.tier_code] || 'bg-gray-100 text-gray-700'} />
//               </td>
//               <td className="px-4 py-3 text-sm whitespace-nowrap">
//                 <span className="font-semibold">{formatCurrency(+t.min_price)}</span>
//                 <span className="text-gray-300 mx-1">–</span>
//                 <span className="font-semibold">{formatCurrency(+t.max_price)}</span>
//               </td>
//               <td className="px-4 py-3 text-sm font-medium text-gray-700">{formatCurrency(+t.scrap_value)}</td>
//               <td className="px-4 py-3">
//                 <Pill label={t.ask_warranty ? 'Yes' : 'No'} colorCls={t.ask_warranty ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-500'} />
//               </td>
//               {/* warranty_bonus */}
//               <td className="px-4 py-3 text-sm text-center">
//                 <span className={+t.warranty_bonus > 1 ? 'font-semibold text-green-600' : 'text-gray-400'}>
//                   {+t.warranty_bonus > 1 ? `+${((+t.warranty_bonus - 1) * 100).toFixed(0)}%` : '—'}
//                 </span>
//               </td>
//               {/* warranty_penalty */}
//               <td className="px-4 py-3 text-sm text-center">
//                 <span className={+t.warranty_penalty < 1 ? 'font-semibold text-red-500' : 'text-gray-400'}>
//                   {+t.warranty_penalty < 1 ? `−${((1 - +t.warranty_penalty) * 100).toFixed(0)}%` : '—'}
//                 </span>
//               </td>
//               <td className="px-4 py-3 text-sm text-center text-gray-700">{t.rules_count ?? '—'}</td>
//               <td className="px-4 py-3">
//                 <Badge status={t.is_active ? 'active' : 'inactive'}>{t.is_active ? 'Active' : 'Inactive'}</Badge>
//               </td>
//               <td className="px-4 py-3">
//                 <div className="flex items-center gap-1">
//                   <LabelBtn label="Rules" icon={Layers} onClick={() => setRulesFor(t)} />
//                   <EditBtn onClick={() => setEdit({ ...t })} />
//                   <DelBtn onClick={() => setConfirm({ msg: `Delete tier "${t.name}"?`, fn: async () => { await api.deleteTier(t.id); toast.success('Deleted'); load(); } })} />
//                 </div>
//               </td>
//             </tr>
//           ))
//         }
//       </DataTable>

//       {filtered.length > 0 && (
//         <p className="text-xs text-gray-400 px-1">Showing {filtered.length} of {rows.length} tiers</p>
//       )}

//       {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
//       <Modal
//         isOpen={!!edit}
//         onClose={() => setEdit(null)}
//         title={edit?.id ? 'Edit Priority Tier' : 'Add Priority Tier'}
//         size="lg"
//         footer={
//           <>
//             <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
//             <Button loading={saving} onClick={handleSave}>Save Tier</Button>
//           </>
//         }
//       >
//         {edit && (
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div className="col-span-2">
//                 <Input
//                   label="Tier Name — e.g. Apple.Phone.P3"
//                   value={edit.name || ''}
//                   onChange={(e) => setEdit({ ...edit, name: e.target.value })}
//                   helpText="Format: Brand.Category.Code — tier_code and display_name are derived automatically"
//                 />
//               </div>
//               <Input label="Min Price (₹)" type="number" value={edit.min_price || ''} onChange={(e) => setEdit({ ...edit, min_price: e.target.value })} />
//               <Input label="Max Price (₹)" type="number" value={edit.max_price || ''} onChange={(e) => setEdit({ ...edit, max_price: e.target.value })} />
//               <Input label="Scrap Value (₹)" type="number" value={edit.scrap_value || ''} onChange={(e) => setEdit({ ...edit, scrap_value: e.target.value })} />
//               <div /> {/* spacer */}
//             </div>

//             {/* Warranty multipliers — new fields from CSV */}
//             <div>
//               <p className="text-sm font-semibold text-gray-700 mb-2">Warranty Multipliers</p>
//               <div className="grid grid-cols-2 gap-4">
//                 <Input
//                   label="Warranty Bonus"
//                   type="number"
//                   placeholder="e.g. 1.02"
//                   value={edit.warranty_bonus || '1.00'}
//                   onChange={(e) => setEdit({ ...edit, warranty_bonus: e.target.value })}
//                   helpText="Multiplier when device HAS warranty (1.02 = +2%)"
//                 />
//                 <Input
//                   label="Warranty Penalty"
//                   type="number"
//                   placeholder="e.g. 0.85"
//                   value={edit.warranty_penalty || '1.00'}
//                   onChange={(e) => setEdit({ ...edit, warranty_penalty: e.target.value })}
//                   helpText="Multiplier when device has NO warranty (0.85 = −15%)"
//                 />
//               </div>
//               {/* Live preview */}
//               {edit.warranty_bonus && edit.warranty_penalty && (
//                 <div className="mt-2 flex gap-3 text-xs">
//                   <span className={`px-2 py-1 rounded-md font-medium ${+edit.warranty_bonus > 1 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
//                     With warranty: {+edit.warranty_bonus > 1 ? `+${((+edit.warranty_bonus - 1) * 100).toFixed(1)}%` : 'no change'}
//                   </span>
//                   <span className={`px-2 py-1 rounded-md font-medium ${+edit.warranty_penalty < 1 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
//                     Without warranty: {+edit.warranty_penalty < 1 ? `−${((1 - +edit.warranty_penalty) * 100).toFixed(1)}%` : 'no change'}
//                   </span>
//                 </div>
//               )}
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <SwitchRow
//                 label="Ask Warranty Questions"
//                 hint="Prompt user about warranty status during flow"
//                 value={!!edit.ask_warranty}
//                 onChange={(v) => setEdit({ ...edit, ask_warranty: v })}
//               />
//               <SwitchRow label="Active" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* ── Tier Rules sub-modal ─────────────────────────────────────────── */}
//       {rulesFor && <TierRulesModal tier={rulesFor} onClose={() => setRulesFor(null)} />}

//       {/* ── Import modal ─────────────────────────────────────────────────── */}
//       <ImportModal
//         isOpen={showImport}
//         onClose={() => { setShowImport(false); load(); }}
//         title="Import Priority Tiers"
//         columns={TIER_CSV_COLS}
//         onImport={api.importTiers}
//         onTemplate={() => api.templateTiers().then((r) => dlBlob(r, 'priority_tiers_template.csv'))}
//       />

//       <ConfirmModal
//         isOpen={!!confirm}
//         onClose={() => setConfirm(null)}
//         onConfirm={confirm?.fn || (() => {})}
//         message={confirm?.msg || ''}
//       />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Tier Rules sub-modal
// // ─────────────────────────────────────────────────────────────────────────────

// const RULE_CSV_COLS = [
//   'priority_tier_name', 'rule_key', 'rule_type',
//   'rule_value', 'display_label', 'display_order', 'is_active',
// ];

// function TierRulesModal({ tier, onClose }: { tier: DevicePriorityTier; onClose: () => void }) {
//   const [rules, setRules]           = useState<PriorityTierRule[]>([]);
//   const [loading, setLoading]       = useState(true);
//   const [edit, setEdit]             = useState<Partial<PriorityTierRule> | null>(null);
//   const [showImport, setShowImport] = useState(false);
//   const [saving, setSaving]         = useState(false);

//   const load = async () => {
//     setLoading(true);
//     try { const d = await api.getRules(tier.id); setRules(d.results || d); }
//     catch (e: any) { toast.error(e.message); }
//     finally { setLoading(false); }
//   };
//   useEffect(() => { load(); }, []);

//   const handleSave = async () => {
//     if (!edit) return;
//     setSaving(true);
//     try {
//       const p = { ...edit, priority_tier: tier.id };
//       edit.id ? await api.updateRule(edit.id, p) : await api.createRule(p);
//       toast.success('Saved'); setEdit(null); load();
//     } catch (e: any) { toast.error(e.message); }
//     finally { setSaving(false); }
//   };

//   return (
//     <Modal isOpen title={`Rules — ${tier.name}`} onClose={onClose} size="xl">
//       <div className="space-y-4">
//         {/* Context strip */}
//         <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 border border-gray-100 text-sm text-gray-600">
//           <div className="flex flex-wrap gap-4">
//             <span>Range: <strong className="text-gray-900">{formatCurrency(+tier.min_price)} – {formatCurrency(+tier.max_price)}</strong></span>
//             <span>Scrap: <strong className="text-gray-900">{formatCurrency(+tier.scrap_value)}</strong></span>
//             <span className={`font-semibold ${+tier.warranty_bonus > 1 ? 'text-green-600' : 'text-gray-400'}`}>
//               Bonus: {+tier.warranty_bonus > 1 ? `+${((+tier.warranty_bonus - 1) * 100).toFixed(0)}%` : '—'}
//             </span>
//             <span className={`font-semibold ${+tier.warranty_penalty < 1 ? 'text-red-500' : 'text-gray-400'}`}>
//               Penalty: {+tier.warranty_penalty < 1 ? `−${((1 - +tier.warranty_penalty) * 100).toFixed(0)}%` : '—'}
//             </span>
//           </div>
//           <div className="flex gap-2">
//             <Button size="sm" variant="outline" onClick={() => api.templateRules().then((r) => dlBlob(r, 'tier_rules_template.csv'))}>
//               <Download className="w-3.5 h-3.5 mr-1" /> Template
//             </Button>
//             <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
//               <Upload className="w-3.5 h-3.5 mr-1" /> Import CSV
//             </Button>
//             <Button size="sm" variant="outline" onClick={() => api.exportRules(tier.id).then((r) => dlBlob(r, `rules_${tier.name}.csv`)).catch((e) => toast.error(e.message))}>
//               <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
//             </Button>
//             <Button size="sm" onClick={() => setEdit({ is_active: true, rule_type: 'percentage', display_order: rules.length, priority_tier: tier.id })}>
//               <Plus className="w-3.5 h-3.5 mr-1" /> Add Rule
//             </Button>
//           </div>
//         </div>

//         <DataTable loading={loading} span={7} cols={['Rule Key', 'Type', 'Value', 'Label', 'Order', 'Status', 'Actions']}>
//           {rules.length === 0
//             ? <EmptyRow span={7} msg="No rules yet — add the first one above" />
//             : rules.map((r) => (
//               <tr key={r.id} className="hover:bg-gray-50 transition-colors">
//                 <td className="px-4 py-3"><code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{r.rule_key}</code></td>
//                 <td className="px-4 py-3"><Pill label={r.rule_type} colorCls={RULE_TYPE_CLS[r.rule_type] || 'bg-gray-100 text-gray-700'} /></td>
//                 <td className="px-4 py-3 text-sm font-bold">
//                   <span className={+r.rule_value < 0 ? 'text-red-600' : 'text-green-700'}>
//                     {r.rule_type === 'percentage' ? `${r.rule_value}%` : r.rule_type === 'fixed' ? formatCurrency(+r.rule_value) : '—'}
//                   </span>
//                 </td>
//                 <td className="px-4 py-3 text-sm text-gray-500">{r.display_label || '—'}</td>
//                 <td className="px-4 py-3 text-sm text-center text-gray-700">{r.display_order}</td>
//                 <td className="px-4 py-3"><Badge status={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Active' : 'Inactive'}</Badge></td>
//                 <td className="px-4 py-3">
//                   <div className="flex gap-1">
//                     <EditBtn onClick={() => setEdit({ ...r })} />
//                     <DelBtn onClick={async () => {
//                       if (!confirm('Delete rule?')) return;
//                       try { await api.deleteRule(r.id); toast.success('Deleted'); load(); }
//                       catch (e: any) { toast.error(e.message); }
//                     }} />
//                   </div>
//                 </td>
//               </tr>
//             ))
//           }
//         </DataTable>

//         {edit && (
//           <Card title={edit.id ? 'Edit Rule' : 'New Rule'}>
//             <div className="grid grid-cols-3 gap-4">
//               <Input label="Rule Key" placeholder="e.g. screen_cracked" value={edit.rule_key || ''} onChange={(e) => setEdit({ ...edit, rule_key: e.target.value })} />
//               <Select label="Rule Type" value={edit.rule_type || 'percentage'} onChange={(e) => setEdit({ ...edit, rule_type: e.target.value as any })} options={RULE_TYPE_OPTIONS} />
//               <Input label="Value (% or ₹)" type="number" placeholder="-40 or 500" value={edit.rule_value || ''} onChange={(e) => setEdit({ ...edit, rule_value: e.target.value })} />
//               <div className="col-span-2">
//                 <Input label="Display Label" placeholder="Cracked screen" value={edit.display_label || ''} onChange={(e) => setEdit({ ...edit, display_label: e.target.value })} />
//               </div>
//               <Input label="Order" type="number" value={edit.display_order ?? ''} onChange={(e) => setEdit({ ...edit, display_order: +e.target.value })} />
//             </div>
//             <div className="flex items-center justify-between mt-4">
//               <SwitchRow label="Active" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
//               <div className="flex gap-2">
//                 <Button size="sm" variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
//                 <Button size="sm" loading={saving} onClick={handleSave}>Save Rule</Button>
//               </div>
//             </div>
//           </Card>
//         )}
//       </div>

//       <ImportModal
//         isOpen={showImport}
//         onClose={() => { setShowImport(false); load(); }}
//         title="Import Tier Rules"
//         columns={RULE_CSV_COLS}
//         onImport={api.importRules}
//         onTemplate={() => api.templateRules().then((r) => dlBlob(r, 'tier_rules_template.csv'))}
//       />
//     </Modal>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Fee Structures Section
// // ─────────────────────────────────────────────────────────────────────────────

// const FEE_TYPE_OPTIONS = [
//   { value: 'platform_commission', label: 'Platform Commission' },
//   { value: 'partner_fee',         label: 'Partner Fee' },
//   { value: 'claim_fee',           label: 'Lead Claim Fee' },
//   { value: 'transaction_fee',     label: 'Transaction Fee' },
//   { value: 'payment_gateway',     label: 'Payment Gateway Fee' },
//   { value: 'cancellation_fee',    label: 'Cancellation Fee' },
// ];
// const CALC_TYPE_OPTIONS = [
//   { value: 'percentage', label: 'Percentage' },
//   { value: 'fixed',      label: 'Fixed Amount' },
//   { value: 'tiered',     label: 'Tiered' },
// ];

// function FeeStructuresSection() {
//   const [fees, setFees]           = useState<FeeStructure[]>([]);
//   const [loading, setLoading]     = useState(true);
//   const [edit, setEdit]           = useState<Partial<FeeStructure> | null>(null);
//   const [testTarget, setTestTarget] = useState<FeeStructure | null>(null);
//   const [testAmt, setTestAmt]     = useState('');
//   const [testRes, setTestRes]     = useState<any>(null);
//   const [testBusy, setTestBusy]   = useState(false);
//   const [saving, setSaving]       = useState(false);

//   const load = async () => {
//     setLoading(true);
//     try { const d = await api.getFees(); setFees(d.results || d); }
//     catch (e: any) { toast.error(e.message); }
//     finally { setLoading(false); }
//   };
//   useEffect(() => { load(); }, []);

//   const handleSave = async () => {
//     if (!edit) return;
//     setSaving(true);
//     try { edit.id ? await api.updateFee(edit.id, edit) : await api.createFee(edit); toast.success('Saved'); setEdit(null); load(); }
//     catch (e: any) { toast.error(e.message); }
//     finally { setSaving(false); }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex justify-end">
//         <Button size="sm" onClick={() => setEdit({ is_active: true, gst_applicable: true, gst_percentage: '18.00', calculation_type: 'percentage' })}>
//           <Plus className="w-3.5 h-3.5 mr-1" /> Add Fee Structure
//         </Button>
//       </div>

//       <DataTable loading={loading} span={8} cols={['Name', 'Fee Type', 'Calculation', 'Value', 'Min / Max', 'GST', 'Status', 'Actions']}>
//         {fees.length === 0
//           ? <EmptyRow span={8} msg="No fee structures configured" />
//           : fees.map((f) => (
//             <tr key={f.id} className="hover:bg-gray-50 transition-colors">
//               <td className="px-4 py-3"><p className="font-semibold text-sm text-gray-900">{f.name}</p></td>
//               <td className="px-4 py-3"><Pill label={f.fee_type_display || f.fee_type} colorCls={FEE_TYPE_CLS[f.fee_type] || 'bg-gray-100 text-gray-700'} /></td>
//               <td className="px-4 py-3 text-sm text-gray-600">{f.calculation_type_display || f.calculation_type}</td>
//               <td className="px-4 py-3 text-sm font-bold text-gray-900">
//                 {f.calculation_type === 'percentage' ? `${f.fee_value}%` : formatCurrency(+f.fee_value)}
//               </td>
//               <td className="px-4 py-3 text-xs text-gray-500">
//                 {f.min_fee && <div>Min: {formatCurrency(+f.min_fee)}</div>}
//                 {f.max_fee && <div>Max: {formatCurrency(+f.max_fee)}</div>}
//                 {!f.min_fee && !f.max_fee && '—'}
//               </td>
//               <td className="px-4 py-3 text-sm">
//                 {f.gst_applicable ? <span className="font-medium text-gray-700">{f.gst_percentage}%</span> : <span className="text-gray-400">No</span>}
//               </td>
//               <td className="px-4 py-3"><Badge status={f.is_active ? 'active' : 'inactive'}>{f.is_active ? 'Active' : 'Inactive'}</Badge></td>
//               <td className="px-4 py-3">
//                 <div className="flex items-center gap-1">
//                   <LabelBtn label="Test" icon={FlaskConical} onClick={() => { setTestTarget(f); setTestRes(null); setTestAmt(''); }} />
//                   <EditBtn onClick={() => setEdit({ ...f })} />
//                   <DelBtn onClick={async () => {
//                     if (!confirm('Delete fee structure?')) return;
//                     try { await api.deleteFee(f.id); toast.success('Deleted'); load(); }
//                     catch (e: any) { toast.error(e.message); }
//                   }} />
//                 </div>
//               </td>
//             </tr>
//           ))
//         }
//       </DataTable>

//       {/* Edit Modal */}
//       <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Fee Structure' : 'Add Fee Structure'} size="lg"
//         footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
//       >
//         {edit && (
//           <div className="space-y-4">
//             <Input label="Name" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
//             <div className="grid grid-cols-2 gap-4">
//               <Select label="Fee Type" value={edit.fee_type || ''} onChange={(e) => setEdit({ ...edit, fee_type: e.target.value })} options={FEE_TYPE_OPTIONS} />
//               <Select label="Calculation Type" value={edit.calculation_type || 'percentage'} onChange={(e) => setEdit({ ...edit, calculation_type: e.target.value })} options={CALC_TYPE_OPTIONS} />
//               <Input label="Fee Value (% or ₹)" type="number" value={edit.fee_value || ''} onChange={(e) => setEdit({ ...edit, fee_value: e.target.value })} />
//               <Input label="GST %" type="number" value={edit.gst_percentage || '18.00'} onChange={(e) => setEdit({ ...edit, gst_percentage: e.target.value })} />
//               <Input label="Min Fee ₹ (optional)" type="number" value={edit.min_fee || ''} onChange={(e) => setEdit({ ...edit, min_fee: e.target.value })} />
//               <Input label="Max Fee ₹ (optional)" type="number" value={edit.max_fee || ''} onChange={(e) => setEdit({ ...edit, max_fee: e.target.value })} />
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <SwitchRow label="GST Applicable" value={!!edit.gst_applicable} onChange={(v) => setEdit({ ...edit, gst_applicable: v })} />
//               <SwitchRow label="Active" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Fee Test Modal */}
//       <Modal isOpen={!!testTarget} onClose={() => { setTestTarget(null); setTestRes(null); }} title={`Test: ${testTarget?.name}`}
//         footer={<><Button variant="outline" onClick={() => { setTestTarget(null); setTestRes(null); }}>Close</Button><Button loading={testBusy} onClick={async () => { if (!testTarget || !testAmt) return; setTestBusy(true); try { setTestRes(await api.testFee(testTarget.id, +testAmt)); } catch (e: any) { toast.error(e.message); } finally { setTestBusy(false); } }}><FlaskConical className="w-4 h-4 mr-1" /> Calculate</Button></>}
//       >
//         <div className="space-y-4">
//           <Input label="Transaction Amount (₹)" type="number" placeholder="e.g. 15000" value={testAmt} onChange={(e) => setTestAmt(e.target.value)} />
//           {testRes && (
//             <div className="bg-green-50 border border-green-200 rounded-xl p-4">
//               <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Result</p>
//               <div className="grid grid-cols-2 gap-3">
//                 {([['Amount', testRes.test_amount], ['Fee', testRes.calculated_fee], ['GST', testRes.gst_amount], ['Total', testRes.total]] as [string, string][]).map(([l, v]) => (
//                   <div key={l} className="bg-white rounded-lg p-3 border border-green-100">
//                     <p className="text-xs text-gray-400">{l}</p>
//                     <p className="text-base font-bold text-gray-900">{formatCurrency(+v)}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Market Prices Section
// // ─────────────────────────────────────────────────────────────────────────────

// const MARKET_CSV_COLS = ['device_model_name', 'source', 'source_url', 'listed_price', 'condition', 'storage', 'color'];
// const SOURCES = ['cashify', 'instacash', 'olx', 'quickr', 'manual'];

// function MarketPricesSection() {
//   const [rows, setRows]             = useState<MarketPriceData[]>([]);
//   const [loading, setLoading]       = useState(true);
//   const [search, setSearch]         = useState('');
//   const [fSrc, setFSrc]             = useState('');
//   const [edit, setEdit]             = useState<Partial<MarketPriceData> | null>(null);
//   const [showImport, setShowImport] = useState(false);
//   const [saving, setSaving]         = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try { const d = await api.getMarket({ search, source: fSrc, page_size: 100 }); setRows(d.results || d); }
//     catch (e: any) { toast.error(e.message); }
//     finally { setLoading(false); }
//   }, [search, fSrc]);
//   useEffect(() => { load(); }, [load]);

//   const handleSave = async () => {
//     if (!edit) return;
//     setSaving(true);
//     try { edit.id ? await api.updateMarket(edit.id, edit) : await api.createMarket(edit); toast.success('Saved'); setEdit(null); load(); }
//     catch (e: any) { toast.error(e.message); }
//     finally { setSaving(false); }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex flex-wrap gap-3 items-center">
//         <Input placeholder="Search device…" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} className="w-52" />
//         <FilterSelect value={fSrc} onChange={setFSrc}>
//           <option value="">All Sources</option>
//           {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
//         </FilterSelect>
//         <div className="ml-auto flex gap-2">
//           <Button size="sm" variant="outline" onClick={() => setShowImport(true)}><Upload className="w-3.5 h-3.5 mr-1" /> Import CSV</Button>
//           <Button size="sm" variant="outline" onClick={() => api.exportMarket().then((r) => dlBlob(r, 'market_prices.csv')).catch((e) => toast.error(e.message))}><Download className="w-3.5 h-3.5 mr-1" /> Export CSV</Button>
//           <Button size="sm" onClick={() => setEdit({ is_active: true, source: 'manual' })}><Plus className="w-3.5 h-3.5 mr-1" /> Add Price</Button>
//         </div>
//       </div>

//       <DataTable loading={loading} span={9} cols={['Device', 'Source', 'Listed Price', 'Condition', 'Storage', 'Color', 'Recorded', 'Status', 'Actions']}>
//         {rows.length === 0 ? <EmptyRow span={9} msg="No market prices found" /> : rows.map((m) => (
//           <tr key={m.id} className="hover:bg-gray-50 transition-colors">
//             <td className="px-4 py-3"><p className="font-semibold text-sm text-gray-900">{m.device_name}</p></td>
//             <td className="px-4 py-3"><Pill label={m.source_display || m.source} colorCls={SOURCE_CLS[m.source] || 'bg-gray-100 text-gray-700'} /></td>
//             <td className="px-4 py-3 text-sm font-bold text-green-700">{formatCurrency(+m.listed_price)}</td>
//             <td className="px-4 py-3 text-sm text-gray-600">{m.condition || '—'}</td>
//             <td className="px-4 py-3 text-sm text-gray-600">{m.storage || '—'}</td>
//             <td className="px-4 py-3 text-sm text-gray-600">{m.color || '—'}</td>
//             <td className="px-4 py-3 text-sm text-gray-500">{formatDate(m.recorded_at)}</td>
//             <td className="px-4 py-3"><Badge status={m.is_active ? 'active' : 'inactive'}>{m.is_active ? 'Active' : 'Inactive'}</Badge></td>
//             <td className="px-4 py-3">
//               <div className="flex gap-1">
//                 <EditBtn onClick={() => setEdit({ ...m })} />
//                 <DelBtn onClick={async () => { if (!confirm('Delete?')) return; try { await api.deleteMarket(m.id); toast.success('Deleted'); load(); } catch (e: any) { toast.error(e.message); } }} />
//               </div>
//             </td>
//           </tr>
//         ))}
//       </DataTable>

//       <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Market Price' : 'Add Market Price'} size="md"
//         footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}
//       >
//         {edit && (
//           <div className="space-y-4">
//             <Input label="Listed Price (₹)" type="number" value={edit.listed_price || ''} onChange={(e) => setEdit({ ...edit, listed_price: e.target.value })} />
//             <Select label="Source" value={edit.source || 'manual'} onChange={(e) => setEdit({ ...edit, source: e.target.value })} options={SOURCES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
//             <Input label="Source URL (optional)" value={edit.source_url || ''} onChange={(e) => setEdit({ ...edit, source_url: e.target.value })} />
//             <div className="grid grid-cols-3 gap-3">
//               <Input label="Condition" value={edit.condition || ''} onChange={(e) => setEdit({ ...edit, condition: e.target.value })} />
//               <Input label="Storage" value={edit.storage || ''} onChange={(e) => setEdit({ ...edit, storage: e.target.value })} />
//               <Input label="Color" value={edit.color || ''} onChange={(e) => setEdit({ ...edit, color: e.target.value })} />
//             </div>
//             <SwitchRow label="Active" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
//           </div>
//         )}
//       </Modal>

//       <ImportModal isOpen={showImport} onClose={() => { setShowImport(false); load(); }} title="Import Market Prices" columns={MARKET_CSV_COLS} onImport={api.importMarket} />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Estimates Section
// // ─────────────────────────────────────────────────────────────────────────────

// function EstimatesSection() {
//   const [rows, setRows]       = useState<PriceEstimate[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch]   = useState('');
//   const [fValid, setFValid]   = useState('');
//   const [detail, setDetail]   = useState<PriceEstimate | null>(null);

//   const load = useCallback(async () => {
//     setLoading(true);
//     try { const d = await api.getEstimates({ search, is_valid: fValid, page_size: 100 }); setRows(d.results || d); }
//     catch (e: any) { toast.error(e.message); }
//     finally { setLoading(false); }
//   }, [search, fValid]);
//   useEffect(() => { load(); }, [load]);

//   const estBadge = (e: PriceEstimate) =>
//     e.is_expired ? { label: 'Expired', s: 'inactive' } : !e.is_valid ? { label: 'Invalid', s: 'danger' } : { label: 'Valid', s: 'active' };

//   return (
//     <div className="space-y-4">
//       <div className="flex flex-wrap gap-3 items-center">
//         <Input placeholder="Search estimate #, device…" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} className="w-64" />
//         <FilterSelect value={fValid} onChange={setFValid}>
//           <option value="">All Status</option>
//           <option value="true">Valid</option>
//           <option value="false">Invalid / Expired</option>
//         </FilterSelect>
//         <div className="ml-auto flex gap-2">
//           <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh</Button>
//           <Button size="sm" variant="outline" onClick={() => api.exportEstimates().then((r) => dlBlob(r, 'estimates.csv')).catch((e) => toast.error(e.message))}><Download className="w-3.5 h-3.5 mr-1" /> Export CSV</Button>
//         </div>
//       </div>

//       <DataTable loading={loading} span={10} cols={['Estimate #', 'User', 'Device', 'Variant', 'Base', 'Final', 'Status', 'Expires', 'Lead', 'Actions']}>
//         {rows.length === 0 ? <EmptyRow span={10} msg="No estimates found" /> : rows.map((e) => {
//           const st = estBadge(e);
//           return (
//             <tr key={e.id} className="hover:bg-gray-50 transition-colors">
//               <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-secondary">{e.estimate_number}</span></td>
//               <td className="px-4 py-3 text-sm text-gray-700">{e.user_phone}</td>
//               <td className="px-4 py-3">
//                 <p className="font-semibold text-sm text-gray-900">{e.device_model?.name}</p>
//                 <p className="text-xs text-gray-400">{e.device_model?.brand_name}</p>
//               </td>
//               <td className="px-4 py-3 text-xs text-gray-500">
//                 {e.device_variant?.storage && <div>💾 {e.device_variant.storage}</div>}
//                 {e.device_variant?.ram && <div>🔧 {e.device_variant.ram}</div>}
//               </td>
//               <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(+e.base_price)}</td>
//               <td className="px-4 py-3"><span className="text-base font-bold text-green-700">{formatCurrency(+e.final_price)}</span></td>
//               <td className="px-4 py-3"><Badge status={st.s}>{st.label}</Badge></td>
//               <td className="px-4 py-3 text-sm text-gray-500">{formatDate(e.expires_at)}</td>
//               <td className="px-4 py-3">
//                 {e.converted_to_lead ? <Pill label="Converted" colorCls="bg-green-100 text-green-700" /> : <span className="text-gray-400 text-sm">—</span>}
//               </td>
//               <td className="px-4 py-3">
//                 <div className="flex items-center gap-1">
//                   <button onClick={() => setDetail(e)} className="p-1.5 rounded-lg text-secondary hover:bg-blue-50 transition-colors"><Eye className="w-4 h-4" /></button>
//                   {e.is_valid && !e.is_expired && (
//                     <button onClick={async () => {
//                       if (!confirm('Invalidate this estimate?')) return;
//                       try { await api.invalidateEstimate(e.id); toast.success('Invalidated'); load(); }
//                       catch (err: any) { toast.error(err.message); }
//                     }} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors" title="Invalidate">
//                       <X className="w-4 h-4" />
//                     </button>
//                   )}
//                 </div>
//               </td>
//             </tr>
//           );
//         })}
//       </DataTable>

//       {/* Detail Modal */}
//       <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Estimate ${detail?.estimate_number}`} size="lg"
//         footer={<Button variant="outline" onClick={() => setDetail(null)}>Close</Button>}
//       >
//         {detail && (
//           <div className="space-y-5">
//             <div className="grid grid-cols-3 gap-3">
//               {([
//                 ['Device',       detail.device_model?.name],
//                 ['Brand',        detail.device_model?.brand_name],
//                 ['User',         detail.user_phone],
//                 ['Base Price',   formatCurrency(+detail.base_price)],
//                 ['Final Price',  formatCurrency(+detail.final_price)],
//                 ['Rule Version', detail.pricing_rule_version],
//                 ['Created',      formatDate(detail.created_at)],
//                 ['Expires',      formatDate(detail.expires_at)],
//                 ['Converted',    detail.converted_to_lead ? 'Yes' : 'No'],
//               ] as [string, string][]).map(([l, v]) => (
//                 <div key={l} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
//                   <p className="text-xs text-gray-400 mb-0.5">{l}</p>
//                   <p className="text-sm font-semibold text-gray-900">{v}</p>
//                 </div>
//               ))}
//             </div>
//             {detail.deductions.length > 0 && (
//               <div>
//                 <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Deductions</p>
//                 {detail.deductions.map((d, i) => (
//                   <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50">
//                     <span className="text-gray-600">{d.reason}</span>
//                     <span className="font-bold text-red-600">−{formatCurrency(+d.amount)}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//             {detail.additions.length > 0 && (
//               <div>
//                 <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Additions</p>
//                 {detail.additions.map((a, i) => (
//                   <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50">
//                     <span className="text-gray-600">{a.reason}</span>
//                     <span className="font-bold text-green-700">+{formatCurrency(+a.amount)}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Main Page
// // ─────────────────────────────────────────────────────────────────────────────

// const TABS = [
//   { id: 'tiers',     label: 'Priority Tiers',  Icon: Layers },
//   { id: 'fees',      label: 'Fee Structures',  Icon: DollarSign },
//   { id: 'market',    label: 'Market Prices',   Icon: TrendingUp },
//   { id: 'estimates', label: 'Estimates',       Icon: ClipboardList },
// ];

// export default function PricingAdmin() {
//   const [tab, setTab] = useState('tiers');

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold text-dark">Pricing Admin</h1>
//         <p className="text-sm text-gray-500 mt-1">
//           Manage priority tiers, fee structures, market benchmarks and estimates
//         </p>
//       </div>

//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatCard label="Priority Tiers"  value="—" icon={Layers}      colorCls="bg-blue-100 text-blue-600" />
//         <StatCard label="Fee Structures"  value="—" icon={DollarSign}  colorCls="bg-purple-100 text-purple-600" />
//         <StatCard label="Market Prices"   value="—" icon={TrendingUp}  colorCls="bg-amber-100 text-amber-600" />
//         <StatCard label="Estimates"       value="—" icon={ClipboardList} colorCls="bg-green-100 text-green-600" />
//       </div>

//       {/* Tab bar */}
//       <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
//         {TABS.map(({ id, label, Icon }) => (
//           <button
//             key={id}
//             onClick={() => setTab(id)}
//             className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
//               tab === id ? 'bg-white text-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'
//             }`}
//           >
//             <Icon className="w-4 h-4" /> {label}
//           </button>
//         ))}
//       </div>

//       <Card>
//         {tab === 'tiers'     && <PriorityTiersSection />}
//         {tab === 'fees'      && <FeeStructuresSection />}
//         {tab === 'market'    && <MarketPricesSection />}
//         {tab === 'estimates' && <EstimatesSection />}
//       </Card>
//     </div>
//   );
// }



// pages/pricing/PricingAdmin.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Upload, Download,
  CheckSquare2, Square, FlaskConical, Layers,
  DollarSign, TrendingUp, ClipboardList,
  Eye, RefreshCw, X, Search, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Modal } from '../../components/UI/Modal';
import { Alert } from '../../components/UI/Alert';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DevicePriorityTier {
  id: string;
  name: string;
  tier_code: string;
  display_name: string;
  description: string;
  brand: string;
  brand_name: string;
  category: string;
  category_name: string;
  min_price: string;
  max_price: string;
  ask_warranty: boolean;
  scrap_value: string;
  warranty_bonus: string;
  warranty_penalty: string;
  is_active: boolean;
  rules_count?: number;
  created_at: string;
  updated_at: string;
}

interface PriorityTierRule {
  id: string;
  priority_tier: string;
  priority_tier_name?: string;
  rule_key: string;
  rule_type: 'percentage' | 'fixed' | 'scrap' | 'warranty_bonus' | 'warranty_penalty';
  rule_value: string;
  display_label: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface FeeStructure {
  id: string;
  name: string;
  fee_type: string;
  fee_type_display: string;
  calculation_type: string;
  calculation_type_display: string;
  fee_value: string;
  min_fee: string | null;
  max_fee: string | null;
  gst_applicable: boolean;
  gst_percentage: string;
  is_active: boolean;
  effective_from: string;
  effective_until: string | null;
}

interface MarketPriceData {
  id: string;
  device_model: string;
  device_name: string;
  source: string;
  source_display: string;
  source_url: string;
  listed_price: string;
  condition: string;
  storage: string;
  color: string;
  is_active: boolean;
  recorded_at: string;
}

interface PriceEstimate {
  id: string;
  estimate_number: string;
  user_phone: string;
  device_model: { id: string; name: string; brand_name: string };
  device_variant: { storage: string; ram: string };
  condition_inputs: Record<string, string>;
  base_price: string;
  deductions: Array<{ reason: string; type: string; value: string; amount: string }>;
  additions: Array<{ reason: string; type: string; value: string; amount: string }>;
  final_price: string;
  pricing_rule_version: string;
  is_valid: boolean;
  is_expired: boolean;
  expires_at: string;
  converted_to_lead: boolean;
  created_at: string;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
  total: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE = `${API_BASE_URL}/pricing`;
const authH = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

async function apiFetch(path: string, opts?: RequestInit) {
  const { headers: customHeaders, ...restOpts } = opts || {};
  const headers: any = { ...authH(), ...(customHeaders || {}) };

  if (!(opts?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { headers, ...restOpts });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || JSON.stringify(err));
  }
  if (res.status === 204) return null;
  return res.json();
}

const api = {
  getTiers:    (p?: any) => apiFetch(`/priority-tiers/?${new URLSearchParams(p || {})}`),
  createTier:  (d: any)  => apiFetch('/priority-tiers/', { method: 'POST', body: JSON.stringify(d) }),
  updateTier:  (id: string, d: any) => apiFetch(`/priority-tiers/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteTier:  (id: string) => apiFetch(`/priority-tiers/${id}/`, { method: 'DELETE' }),
  importTiers: (f: File) => {
    const fd = new FormData(); fd.append('file', f);
    return apiFetch('/priority-tiers/import_csv/', { method: 'POST', body: fd, headers: {} });
  },
  exportTiers: () => fetch(`${BASE}/priority-tiers/export_csv/`, { headers: authH() }),
  templateTiers: () => fetch(`${BASE}/priority-tiers/csv_template/`, { headers: authH() }),
  bulkToggle:  (ids: string[], is_active: boolean) =>
    apiFetch('/priority-tiers/bulk_toggle/', { method: 'POST', body: JSON.stringify({ ids, is_active }) }),
  bulkDelete:  (ids: string[]) =>
    apiFetch('/priority-tiers/bulk_delete/', { method: 'POST', body: JSON.stringify({ ids }) }),

  getRules:    (tierId?: string) => apiFetch(`/tier-rules/${tierId ? `?priority_tier=${tierId}` : ''}`),
  createRule:  (d: any) => apiFetch('/tier-rules/', { method: 'POST', body: JSON.stringify(d) }),
  updateRule:  (id: string, d: any) => apiFetch(`/tier-rules/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteRule:  (id: string) => apiFetch(`/tier-rules/${id}/`, { method: 'DELETE' }),
  importRules: (f: File) => {
    const fd = new FormData(); fd.append('file', f);
    return apiFetch('/tier-rules/import_csv/', { method: 'POST', body: fd, headers: {} });
  },
  exportRules: (tierId?: string) => fetch(`${BASE}/tier-rules/export_csv/${tierId ? `?priority_tier=${tierId}` : ''}`, { headers: authH() }),
  templateRules: () => fetch(`${BASE}/tier-rules/csv_template/`, { headers: authH() }),

  getFees:     () => apiFetch('/fees/'),
  createFee:   (d: any) => apiFetch('/fees/', { method: 'POST', body: JSON.stringify(d) }),
  updateFee:   (id: string, d: any) => apiFetch(`/fees/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteFee:   (id: string) => apiFetch(`/fees/${id}/`, { method: 'DELETE' }),
  testFee:     (id: string, amount: number) => apiFetch(`/fees/${id}/test_calculation/`, { method: 'POST', body: JSON.stringify({ amount }) }),

  getMarket:    (p?: any) => apiFetch(`/market-prices/?${new URLSearchParams(p || {})}`),
  createMarket: (d: any)  => apiFetch('/market-prices/', { method: 'POST', body: JSON.stringify(d) }),
  updateMarket: (id: string, d: any) => apiFetch(`/market-prices/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteMarket: (id: string) => apiFetch(`/market-prices/${id}/`, { method: 'DELETE' }),
  importMarket: (f: File) => {
    const fd = new FormData(); fd.append('file', f);
    return apiFetch('/market-prices/import_csv/', { method: 'POST', body: fd, headers: {} });
  },
  exportMarket: () => fetch(`${BASE}/market-prices/export_csv/`, { headers: authH() }),

  getEstimates:      (p?: any) => apiFetch(`/estimates/?${new URLSearchParams(p || {})}`),
  invalidateEstimate:(id: string) => apiFetch(`/estimates/${id}/invalidate/`, { method: 'POST' }),
  exportEstimates:   () => fetch(`${BASE}/estimates/export_csv/`, { headers: authH() }),
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function dlBlob(res: Response, filename: string) {
  res.blob().then((b) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = filename;
    a.click();
  });
}

function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SwitchRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <Switch value={value} onChange={onChange} />
    </div>
  );
}

function Pill({ label, colorCls }: { label: string; colorCls: string }) {
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${colorCls}`}>{label}</span>;
}

function FilterSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-700 outline-none shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
      {children}
    </select>
  );
}

function DataTable({ cols, loading, span, children }: { cols: string[]; loading: boolean; span: number; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{cols.map((c) => <th key={c} className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? <tr><td colSpan={span} className="py-16 text-center"><Loader size="md" /></td></tr> : children}
        </tbody>
      </table>
    </div>
  );
}

function EmptyRow({ span, msg }: { span: number; msg: string }) {
  return <tr><td colSpan={span} className="py-16 text-center text-sm font-medium text-gray-400">{msg}</td></tr>;
}

function EditBtn({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>; }
function DelBtn({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="p-2 rounded-md text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>; }
function LabelBtn({ label, icon: Icon, onClick }: { label: string; icon: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs font-bold px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm">
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, colorCls }: { label: string; value: string | number; icon: any; colorCls: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorCls}`}><Icon className="w-6 h-6" /></div>
      <div>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const TIER_CODE_CLS: Record<string, string> = {
  P1: 'bg-gray-100 text-gray-700 border border-gray-200',
  P2: 'bg-blue-50 text-blue-700 border border-blue-200',
  P3: 'bg-purple-50 text-purple-700 border border-purple-200',
  P4: 'bg-amber-50 text-amber-700 border border-amber-200',
};
const RULE_TYPE_CLS: Record<string, string> = {
  percentage:       'bg-blue-50 text-blue-700 border border-blue-200',
  fixed:            'bg-cyan-50 text-cyan-700 border border-cyan-200',
  scrap:            'bg-red-50 text-red-700 border border-red-200',
  warranty_bonus:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warranty_penalty: 'bg-orange-50 text-orange-700 border border-orange-200',
};
const FEE_TYPE_CLS: Record<string, string> = {
  platform_commission: 'bg-blue-50 text-blue-700 border border-blue-200',
  partner_fee:         'bg-purple-50 text-purple-700 border border-purple-200',
  claim_fee:           'bg-cyan-50 text-cyan-700 border border-cyan-200',
  transaction_fee:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  payment_gateway:     'bg-orange-50 text-orange-700 border border-orange-200',
  cancellation_fee:    'bg-red-50 text-red-700 border border-red-200',
};
const SOURCE_CLS: Record<string, string> = {
  cashify:   'bg-blue-50 text-blue-700 border border-blue-200',
  instacash: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  olx:       'bg-amber-50 text-amber-700 border border-amber-200',
  quickr:    'bg-purple-50 text-purple-700 border border-purple-200',
  manual:    'bg-gray-50 text-gray-700 border border-gray-200',
};

// ─── Import CSV Modal ─────────────────────────────────────────────────────────

function ImportModal({
  isOpen, onClose, title, columns, onImport, onTemplate,
}: {
  isOpen: boolean; onClose: () => void; title: string; columns: string[]; onImport: (f: File) => Promise<void>; onTemplate?: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reset = () => { setFile(null); setResult(null); };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title={title} size="md"
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Close</Button>
          <Button loading={busy} disabled={!file || busy} onClick={async () => {
            if (!file) return; setBusy(true);
            try {
              const r: ImportResult = await onImport(file) as any; setResult(r);
              if (r.errors.length === 0) toast.success(`${r.created} created, ${r.updated} updated`);
              else toast.error(`${r.errors.length} row(s) failed`);
            } finally { setBusy(false); }
          }}><Upload className="w-4 h-4 mr-2" /> Import File</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Required Columns</p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((c) => <code key={c} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-mono border border-gray-200">{c}</code>)}
          </div>
        </div>
        {onTemplate && (
          <button onClick={onTemplate} className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            <Download className="w-4 h-4" /> Download Template CSV
          </button>
        )}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.csv')) { setFile(f); setResult(null); } }}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            drag ? 'border-emerald-500 bg-emerald-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-emerald-300'
          }`}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${file ? 'text-green-500' : 'text-gray-400'}`} />
          <p className="font-bold text-gray-700 text-sm">{file ? file.name : 'Drop CSV here or click to browse'}</p>
          {file && <p className="text-xs font-medium text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>}
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); } }} />
        </div>
        {result && (
          <div className={`rounded-xl p-4 border ${result.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex gap-4 text-sm mb-2">
              <span className="text-green-700 font-bold">✓ {result.created} created</span>
              <span className="text-blue-700 font-bold">↺ {result.updated} updated</span>
              {result.errors.length > 0 && <span className="text-red-600 font-bold">✗ {result.errors.length} errors</span>}
            </div>
            {result.errors.length > 0 && <div className="max-h-32 overflow-y-auto space-y-1 mt-2 p-2 bg-white rounded border border-red-100">{result.errors.map((e, i) => <p key={i} className="text-xs text-red-700 font-mono">Row {e.row}: {e.error}</p>)}</div>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; message: string }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Action" size="sm" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Confirm</Button></>}>
      <Alert type="warning">{message}</Alert>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Priority Tiers Section
// ─────────────────────────────────────────────────────────────────────────────

const TIER_CSV_COLS = ['priority_tier_id', 'brand', 'device_category', 'name', 'min_price', 'max_price', 'ask_warranty', 'scrap_value', 'warranty_bonus', 'warranty_penalty'];
const RULE_TYPE_OPTIONS = [
  { value: 'percentage',       label: 'Percentage' },
  { value: 'fixed',            label: 'Fixed Amount' },
  { value: 'scrap',            label: 'Set to Scrap Value' },
  { value: 'warranty_bonus',   label: 'Warranty Bonus' },
  { value: 'warranty_penalty', label: 'Warranty Penalty' },
];

function PriorityTiersSection() {
  const [rows, setRows]             = useState<DevicePriorityTier[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sel, setSel]               = useState<Set<string>>(new Set());
  const [search, setSearch]         = useState('');
  const [fBrand, setFBrand]         = useState('');
  const [fCat, setFCat]             = useState('');
  const [edit, setEdit]             = useState<Partial<DevicePriorityTier> | null>(null);
  const [rulesFor, setRulesFor]     = useState<DevicePriorityTier | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [confirm, setConfirm]       = useState<{ msg: string; fn: () => void } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api.getTiers({ search, page_size: 200 }); setRows(d.results || d); }
    catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const brands = [...new Set(rows.map((r) => r.brand_name).filter(Boolean))];
  const cats   = [...new Set(rows.map((r) => r.category_name).filter(Boolean))];
  const filtered = rows.filter((r) => (!fBrand || r.brand_name === fBrand) && (!fCat || r.category_name === fCat));

  const toggleSel = (id: string) => {
    const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s);
  };

  const handleSave = async () => {
    if (!edit) return; setSaving(true);
    try { edit.id ? await api.updateTier(edit.id, edit) : await api.createTier(edit); toast.success('Saved'); setEdit(null); load(); }
    catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
        <Input placeholder="Search tiers…" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} className="w-64 bg-white" />
        <FilterSelect value={fBrand} onChange={setFBrand}><option value="">All Brands</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}</FilterSelect>
        <FilterSelect value={fCat} onChange={setFCat}><option value="">All Categories</option>{cats.map((c) => <option key={c} value={c}>{c}</option>)}</FilterSelect>

        {sel.size > 0 && (
          <div className="flex gap-2 ml-4 border-l pl-4 border-gray-300">
            <Button size="sm" variant="secondary" onClick={() => setConfirm({ msg: `Activate ${sel.size} tier(s)?`, fn: async () => { await api.bulkToggle([...sel], true); toast.success('Activated'); setSel(new Set()); load(); } })}><CheckSquare2 className="w-4 h-4 mr-1.5" /> Activate ({sel.size})</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirm({ msg: `Deactivate ${sel.size} tier(s)?`, fn: async () => { await api.bulkToggle([...sel], false); toast.success('Deactivated'); setSel(new Set()); load(); } })}><Square className="w-4 h-4 mr-1.5" /> Deactivate</Button>
            <Button size="sm" variant="danger" onClick={() => setConfirm({ msg: `Delete ${sel.size} tier(s)?`, fn: async () => { await api.bulkDelete([...sel]); toast.success('Deleted'); setSel(new Set()); load(); } })}><Trash2 className="w-4 h-4 mr-1.5" /> Delete ({sel.size})</Button>
          </div>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => api.templateTiers().then((r) => dlBlob(r, 'priority_tiers_template.csv'))}><Download className="w-4 h-4 mr-1.5" /> Template</Button>
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}><Upload className="w-4 h-4 mr-1.5" /> Import CSV</Button>
          <Button size="sm" variant="outline" onClick={() => api.exportTiers().then((r) => dlBlob(r, 'priority_tiers.csv')).catch((e) => toast.error(e.message))}><Download className="w-4 h-4 mr-1.5" /> Export</Button>
          <Button size="sm" onClick={() => setEdit({ is_active: true, ask_warranty: false, warranty_bonus: '1.00', warranty_penalty: '1.00' })}><Plus className="w-4 h-4 mr-1.5" /> New Tier</Button>
        </div>
      </div>

      <DataTable loading={loading} span={13} cols={['', 'Name', 'Brand', 'Category', 'Code', 'Price Range', 'Scrap', 'Warranty', 'Bonus', 'Penalty', 'Rules', 'Status', 'Actions']}>
        {filtered.length === 0 ? <EmptyRow span={13} msg="No priority tiers found" /> : filtered.map((t) => (
          <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${sel.has(t.id) ? 'bg-indigo-50/50' : ''}`}>
            <td className="px-5 py-4 w-8"><input type="checkbox" checked={sel.has(t.id)} onChange={() => toggleSel(t.id)} className="rounded border-gray-300 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" /></td>
            <td className="px-5 py-4">
              <p className="font-bold text-gray-900 text-sm">{t.name}</p>
              {t.display_name && <p className="text-xs font-medium text-gray-500 mt-0.5">{t.display_name}</p>}
            </td>
            <td className="px-5 py-4 text-sm font-medium text-gray-600">{t.brand_name}</td>
            <td className="px-5 py-4 text-sm font-medium text-gray-600">{t.category_name}</td>
            <td className="px-5 py-4"><Pill label={t.tier_code} colorCls={TIER_CODE_CLS[t.tier_code] || 'bg-gray-100 text-gray-700'} /></td>
            <td className="px-5 py-4 text-sm whitespace-nowrap">
              <span className="font-bold text-gray-900">{formatCurrency(+t.min_price)}</span>
              <span className="text-gray-400 mx-1.5">—</span>
              <span className="font-bold text-gray-900">{formatCurrency(+t.max_price)}</span>
            </td>
            <td className="px-5 py-4 text-sm font-bold text-red-600">{formatCurrency(+t.scrap_value)}</td>
            <td className="px-5 py-4"><Pill label={t.ask_warranty ? 'Yes' : 'No'} colorCls={t.ask_warranty ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-500 border border-gray-200'} /></td>
            <td className="px-5 py-4 text-sm text-center">
              <span className={`font-bold ${+t.warranty_bonus > 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                {+t.warranty_bonus > 1 ? `+${((+t.warranty_bonus - 1) * 100).toFixed(0)}%` : '—'}
              </span>
            </td>
            <td className="px-5 py-4 text-sm text-center">
              <span className={`font-bold ${+t.warranty_penalty < 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                {+t.warranty_penalty < 1 ? `−${((1 - +t.warranty_penalty) * 100).toFixed(0)}%` : '—'}
              </span>
            </td>
            <td className="px-5 py-4 text-sm font-bold text-center text-gray-600">{t.rules_count ?? '—'}</td>
            <td className="px-5 py-4"><Badge status={t.is_active ? 'active' : 'inactive'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <LabelBtn label="Rules" icon={Layers} onClick={() => setRulesFor(t)} />
                <EditBtn onClick={() => setEdit({ ...t })} />
                <DelBtn onClick={() => setConfirm({ msg: `Delete tier "${t.name}"?`, fn: async () => { await api.deleteTier(t.id); toast.success('Deleted'); load(); } })} />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {filtered.length > 0 && <p className="text-sm font-medium text-gray-500 px-2">Showing {filtered.length} of {rows.length} tiers</p>}

      <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Priority Tier' : 'Add Priority Tier'} size="lg" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save Tier</Button></>}>
        {edit && (
          <div className="space-y-6">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <Input label="Tier Name" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} helpText="Format: Brand.Category.Code (e.g. Apple.Phone.P3)" />
              </div>
              <Input label="Min Price (₹)" type="number" value={edit.min_price || ''} onChange={(e) => setEdit({ ...edit, min_price: e.target.value })} />
              <Input label="Max Price (₹)" type="number" value={edit.max_price || ''} onChange={(e) => setEdit({ ...edit, max_price: e.target.value })} />
              <Input label="Scrap Value (₹)" type="number" value={edit.scrap_value || ''} onChange={(e) => setEdit({ ...edit, scrap_value: e.target.value })} />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Warranty Configuration</p>
              <div className="grid grid-cols-2 gap-5 mb-4">
                <Input label="Warranty Bonus Multiplier" type="number" placeholder="1.02" value={edit.warranty_bonus || '1.00'} onChange={(e) => setEdit({ ...edit, warranty_bonus: e.target.value })} helpText="E.g., 1.02 = +2% bonus" />
                <Input label="Warranty Penalty Multiplier" type="number" placeholder="0.85" value={edit.warranty_penalty || '1.00'} onChange={(e) => setEdit({ ...edit, warranty_penalty: e.target.value })} helpText="E.g., 0.85 = -15% penalty" />
              </div>
              <SwitchRow label="Enforce Warranty Check" hint="Ask warranty status during estimation" value={!!edit.ask_warranty} onChange={(v) => setEdit({ ...edit, ask_warranty: v })} />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <SwitchRow label="Active Status" hint="Enable or disable this tier entirely" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
            </div>
          </div>
        )}
      </Modal>

      {rulesFor && <TierRulesModal tier={rulesFor} onClose={() => setRulesFor(null)} />}
      <ImportModal isOpen={showImport} onClose={() => { setShowImport(false); load(); }} title="Import Priority Tiers" columns={TIER_CSV_COLS} onImport={api.importTiers} onTemplate={() => api.templateTiers().then((r) => dlBlob(r, 'priority_tiers_template.csv'))} />
      <ConfirmModal isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={confirm?.fn || (() => {})} message={confirm?.msg || ''} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier Rules sub-modal
// ─────────────────────────────────────────────────────────────────────────────

const RULE_CSV_COLS = ['priority_tier_name', 'rule_key', 'rule_type', 'rule_value', 'display_label', 'display_order', 'is_active'];

function TierRulesModal({ tier, onClose }: { tier: DevicePriorityTier; onClose: () => void }) {
  const [rules, setRules]           = useState<PriorityTierRule[]>([]);
  const [loading, setLoading]       = useState(true);
  const [edit, setEdit]             = useState<Partial<PriorityTierRule> | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d = await api.getRules(tier.id); setRules(d.results || d); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!edit) return; setSaving(true);
    try { const p = { ...edit, priority_tier: tier.id }; edit.id ? await api.updateRule(edit.id, p) : await api.createRule(p); toast.success('Saved'); setEdit(null); load(); } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen title={`Rules for ${tier.name}`} onClose={onClose} size="xl">
      <div className="space-y-5">
        <div className="bg-gray-900 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex flex-wrap gap-5 text-sm">
            <span className="text-gray-400">Range: <strong className="text-white ml-1">{formatCurrency(+tier.min_price)} – {formatCurrency(+tier.max_price)}</strong></span>
            <span className="text-gray-400">Scrap: <strong className="text-red-400 ml-1">{formatCurrency(+tier.scrap_value)}</strong></span>
            <span className={`font-medium ${+tier.warranty_bonus > 1 ? 'text-emerald-400' : 'text-gray-500'}`}>Bonus: {+tier.warranty_bonus > 1 ? `+${((+tier.warranty_bonus - 1) * 100).toFixed(0)}%` : '—'}</span>
            <span className={`font-medium ${+tier.warranty_penalty < 1 ? 'text-orange-400' : 'text-gray-500'}`}>Penalty: {+tier.warranty_penalty < 1 ? `−${((1 - +tier.warranty_penalty) * 100).toFixed(0)}%` : '—'}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => api.templateRules().then((r) => dlBlob(r, 'tier_rules_template.csv'))}><Download className="w-4 h-4 mr-1.5" /> Template</Button>
            <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setShowImport(true)}><Upload className="w-4 h-4 mr-1.5" /> Import</Button>
            <Button size="sm" variant="primary" onClick={() => setEdit({ is_active: true, rule_type: 'percentage', display_order: rules.length, priority_tier: tier.id })}><Plus className="w-4 h-4 mr-1.5" /> Add Rule</Button>
          </div>
        </div>

        <DataTable loading={loading} span={7} cols={['Key', 'Type', 'Value', 'Label', 'Order', 'Status', 'Actions']}>
          {rules.length === 0 ? <EmptyRow span={7} msg="No rules defined for this tier" /> : rules.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3"><code className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{r.rule_key}</code></td>
              <td className="px-5 py-3"><Pill label={r.rule_type} colorCls={RULE_TYPE_CLS[r.rule_type] || 'bg-gray-100 text-gray-700'} /></td>
              <td className="px-5 py-3 text-sm font-black">
                <span className={+r.rule_value < 0 ? 'text-red-600' : 'text-emerald-600'}>{r.rule_type === 'percentage' ? `${r.rule_value}%` : r.rule_type === 'fixed' ? formatCurrency(+r.rule_value) : '—'}</span>
              </td>
              <td className="px-5 py-3 text-sm font-medium text-gray-700">{r.display_label || '—'}</td>
              <td className="px-5 py-3 text-sm text-center font-bold text-gray-500">{r.display_order}</td>
              <td className="px-5 py-3"><Badge status={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Active' : 'Inactive'}</Badge></td>
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  <EditBtn onClick={() => setEdit({ ...r })} />
                  <DelBtn onClick={async () => { if (!confirm('Delete rule?')) return; try { await api.deleteRule(r.id); toast.success('Deleted'); load(); } catch (e: any) { toast.error(e.message); } }} />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>

        {edit && (
          <Card title={edit.id ? 'Edit Rule' : 'New Rule'} className="shadow-lg border-indigo-100">
            <div className="grid grid-cols-3 gap-5">
              <Input label="Rule Key" placeholder="e.g. screen_cracked" value={edit.rule_key || ''} onChange={(e) => setEdit({ ...edit, rule_key: e.target.value })} />
              <Select label="Rule Type" value={edit.rule_type || 'percentage'} onChange={(e) => setEdit({ ...edit, rule_type: e.target.value as any })} options={RULE_TYPE_OPTIONS} />
              <Input label="Impact Value" type="number" placeholder="-40" value={edit.rule_value || ''} onChange={(e) => setEdit({ ...edit, rule_value: e.target.value })} />
              <div className="col-span-2"><Input label="Display Label" placeholder="Cracked screen" value={edit.display_label || ''} onChange={(e) => setEdit({ ...edit, display_label: e.target.value })} /></div>
              <Input label="Sort Order" type="number" value={edit.display_order ?? ''} onChange={(e) => setEdit({ ...edit, display_order: +e.target.value })} />
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <SwitchRow label="Rule Active" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
                <Button loading={saving} onClick={handleSave}>Save Rule</Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <ImportModal isOpen={showImport} onClose={() => { setShowImport(false); load(); }} title="Import Tier Rules" columns={RULE_CSV_COLS} onImport={api.importRules} onTemplate={() => api.templateRules().then((r) => dlBlob(r, 'tier_rules_template.csv'))} />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fee Structures Section
// ─────────────────────────────────────────────────────────────────────────────

const FEE_TYPE_OPTIONS = [
  { value: 'platform_commission', label: 'Platform Commission' },
  { value: 'partner_fee',         label: 'Partner Fee' },
  { value: 'claim_fee',           label: 'Lead Claim Fee' },
  { value: 'transaction_fee',     label: 'Transaction Fee' },
  { value: 'payment_gateway',     label: 'Payment Gateway Fee' },
  { value: 'cancellation_fee',    label: 'Cancellation Fee' },
];
const CALC_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed',      label: 'Fixed Amount' },
  { value: 'tiered',     label: 'Tiered' },
];

function FeeStructuresSection() {
  const [fees, setFees]           = useState<FeeStructure[]>([]);
  const [loading, setLoading]     = useState(true);
  const [edit, setEdit]           = useState<Partial<FeeStructure> | null>(null);
  const [testTarget, setTestTarget] = useState<FeeStructure | null>(null);
  const [testAmt, setTestAmt]     = useState('');
  const [testRes, setTestRes]     = useState<any>(null);
  const [testBusy, setTestBusy]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d = await api.getFees(); setFees(d.results || d); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!edit) return; setSaving(true);
    try { edit.id ? await api.updateFee(edit.id, edit) : await api.createFee(edit); toast.success('Saved'); setEdit(null); load(); } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
        <p className="font-medium text-gray-600 ml-2">Manage dynamic fee structures applied during checkout.</p>
        <Button size="sm" onClick={() => setEdit({ is_active: true, gst_applicable: true, gst_percentage: '18.00', calculation_type: 'percentage' })}><Plus className="w-4 h-4 mr-1.5" /> New Fee Structure</Button>
      </div>

      <DataTable loading={loading} span={8} cols={['Name', 'Type', 'Calculation', 'Value', 'Min/Max', 'GST', 'Status', 'Actions']}>
        {fees.length === 0 ? <EmptyRow span={8} msg="No fee structures configured" /> : fees.map((f) => (
          <tr key={f.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-5 py-4"><p className="font-bold text-sm text-gray-900">{f.name}</p></td>
            <td className="px-5 py-4"><Pill label={f.fee_type_display || f.fee_type} colorCls={FEE_TYPE_CLS[f.fee_type] || 'bg-gray-100 text-gray-700'} /></td>
            <td className="px-5 py-4 text-sm font-medium text-gray-600">{f.calculation_type_display || f.calculation_type}</td>
            <td className="px-5 py-4 text-sm font-black text-indigo-700">{f.calculation_type === 'percentage' ? `${f.fee_value}%` : formatCurrency(+f.fee_value)}</td>
            <td className="px-5 py-4 text-xs font-medium text-gray-500 space-y-1">
              {f.min_fee && <div>Min: {formatCurrency(+f.min_fee)}</div>}
              {f.max_fee && <div>Max: {formatCurrency(+f.max_fee)}</div>}
              {!f.min_fee && !f.max_fee && '—'}
            </td>
            <td className="px-5 py-4 text-sm">{f.gst_applicable ? <span className="font-bold text-emerald-600">{f.gst_percentage}%</span> : <span className="text-gray-400 font-medium">No</span>}</td>
            <td className="px-5 py-4"><Badge status={f.is_active ? 'active' : 'inactive'}>{f.is_active ? 'Active' : 'Inactive'}</Badge></td>
            <td className="px-5 py-4">
              <div className="flex items-center gap-2">
                <LabelBtn label="Simulate" icon={FlaskConical} onClick={() => { setTestTarget(f); setTestRes(null); setTestAmt(''); }} />
                <EditBtn onClick={() => setEdit({ ...f })} />
                <DelBtn onClick={async () => { if (!confirm('Delete fee structure?')) return; try { await api.deleteFee(f.id); toast.success('Deleted'); load(); } catch (e: any) { toast.error(e.message); } }} />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Fee Structure' : 'New Fee Structure'} size="lg" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save Config</Button></>}>
        {edit && (
          <div className="space-y-6">
            <Input label="Internal Name" value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 grid grid-cols-2 gap-5">
              <Select label="Fee Type Category" value={edit.fee_type || ''} onChange={(e) => setEdit({ ...edit, fee_type: e.target.value })} options={FEE_TYPE_OPTIONS} />
              <Select label="Calculation Method" value={edit.calculation_type || 'percentage'} onChange={(e) => setEdit({ ...edit, calculation_type: e.target.value })} options={CALC_TYPE_OPTIONS} />
              <Input label="Fee Value (% or ₹)" type="number" value={edit.fee_value || ''} onChange={(e) => setEdit({ ...edit, fee_value: e.target.value })} />
              <Input label="Applicable GST %" type="number" value={edit.gst_percentage || '18.00'} onChange={(e) => setEdit({ ...edit, gst_percentage: e.target.value })} />
              <Input label="Minimum Cap ₹ (Optional)" type="number" value={edit.min_fee || ''} onChange={(e) => setEdit({ ...edit, min_fee: e.target.value })} />
              <Input label="Maximum Cap ₹ (Optional)" type="number" value={edit.max_fee || ''} onChange={(e) => setEdit({ ...edit, max_fee: e.target.value })} />
            </div>
            <div className="flex gap-6 mt-4">
              <div className="flex-1"><SwitchRow label="Apply GST" value={!!edit.gst_applicable} onChange={(v) => setEdit({ ...edit, gst_applicable: v })} /></div>
              <div className="flex-1"><SwitchRow label="Active Status" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} /></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!testTarget} onClose={() => { setTestTarget(null); setTestRes(null); }} title={`Simulation: ${testTarget?.name}`} footer={<><Button variant="outline" onClick={() => { setTestTarget(null); setTestRes(null); }}>Close</Button><Button loading={testBusy} onClick={async () => { if (!testTarget || !testAmt) return; setTestBusy(true); try { setTestRes(await api.testFee(testTarget.id, +testAmt)); } catch (e: any) { toast.error(e.message); } finally { setTestBusy(false); } }}><FlaskConical className="w-4 h-4 mr-2" /> Run Calculation</Button></>}>
        <div className="space-y-5">
          <Input label="Test Transaction Amount (₹)" type="number" placeholder="e.g. 15000" value={testAmt} onChange={(e) => setTestAmt(e.target.value)} className="text-lg font-bold" />
          {testRes && (
            <div className="bg-slate-900 rounded-xl p-5 shadow-lg text-white">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Calculation Results</p>
              <div className="grid grid-cols-2 gap-4">
                {([['Base Amount', testRes.test_amount], ['Calculated Fee', testRes.calculated_fee], ['Tax (GST)', testRes.gst_amount], ['Total Deducted', testRes.total]] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <p className="text-xs text-slate-400 font-medium mb-1">{l}</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(+v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Market Prices Section
// ─────────────────────────────────────────────────────────────────────────────

const MARKET_CSV_COLS = ['device_model_name', 'source', 'source_url', 'listed_price', 'condition', 'storage', 'color'];
const SOURCES = ['cashify', 'instacash', 'olx', 'quickr', 'manual'];

function MarketPricesSection() {
  const [rows, setRows]             = useState<MarketPriceData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [fSrc, setFSrc]             = useState('');
  const [edit, setEdit]             = useState<Partial<MarketPriceData> | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api.getMarket({ search, source: fSrc, page_size: 100 }); setRows(d.results || d); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }, [search, fSrc]);
  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!edit) return; setSaving(true);
    try { edit.id ? await api.updateMarket(edit.id, edit) : await api.createMarket(edit); toast.success('Saved'); setEdit(null); load(); } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
        <Input placeholder="Search device models…" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} className="w-64 bg-white" />
        <FilterSelect value={fSrc} onChange={setFSrc}><option value="">All Sources</option>{SOURCES.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}</FilterSelect>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}><Upload className="w-4 h-4 mr-1.5" /> Import Data</Button>
          <Button size="sm" variant="outline" onClick={() => api.exportMarket().then((r) => dlBlob(r, 'market_prices.csv')).catch((e) => toast.error(e.message))}><Download className="w-4 h-4 mr-1.5" /> Export Data</Button>
          <Button size="sm" onClick={() => setEdit({ is_active: true, source: 'manual' })}><Plus className="w-4 h-4 mr-1.5" /> Add Benchmark</Button>
        </div>
      </div>

      <DataTable loading={loading} span={9} cols={['Model', 'Source', 'Listed Price', 'Condition', 'Storage', 'Color', 'Logged', 'Status', 'Actions']}>
        {rows.length === 0 ? <EmptyRow span={9} msg="No market benchmark data found" /> : rows.map((m) => (
          <tr key={m.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-5 py-4"><p className="font-bold text-sm text-gray-900">{m.device_name}</p></td>
            <td className="px-5 py-4"><Pill label={m.source_display || m.source} colorCls={SOURCE_CLS[m.source] || 'bg-gray-100 text-gray-700 border border-gray-200'} /></td>
            <td className="px-5 py-4 text-sm font-black text-emerald-600">{formatCurrency(+m.listed_price)}</td>
            <td className="px-5 py-4 text-sm font-medium text-gray-600">{m.condition || '—'}</td>
            <td className="px-5 py-4 text-sm font-medium text-gray-600">{m.storage || '—'}</td>
            <td className="px-5 py-4 text-sm font-medium text-gray-600">{m.color || '—'}</td>
            <td className="px-5 py-4 text-xs font-medium text-gray-400">{formatDate(m.recorded_at)}</td>
            <td className="px-5 py-4"><Badge status={m.is_active ? 'active' : 'inactive'}>{m.is_active ? 'Active' : 'Inactive'}</Badge></td>
            <td className="px-5 py-4">
              <div className="flex gap-2">
                <EditBtn onClick={() => setEdit({ ...m })} />
                <DelBtn onClick={async () => { if (!confirm('Delete benchmark?')) return; try { await api.deleteMarket(m.id); toast.success('Deleted'); load(); } catch (e: any) { toast.error(e.message); } }} />
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal isOpen={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Benchmark' : 'Add Benchmark'} size="md" footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save Record</Button></>}>
        {edit && (
          <div className="space-y-5">
            <Input label="Listed Price (₹)" type="number" value={edit.listed_price || ''} onChange={(e) => setEdit({ ...edit, listed_price: e.target.value })} className="text-lg font-bold" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Data Source" value={edit.source || 'manual'} onChange={(e) => setEdit({ ...edit, source: e.target.value })} options={SOURCES.map((s) => ({ value: s, label: s.toUpperCase() }))} />
              <Input label="Source URL" value={edit.source_url || ''} onChange={(e) => setEdit({ ...edit, source_url: e.target.value })} />
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-3 gap-4">
              <Input label="Condition" value={edit.condition || ''} onChange={(e) => setEdit({ ...edit, condition: e.target.value })} />
              <Input label="Storage" value={edit.storage || ''} onChange={(e) => setEdit({ ...edit, storage: e.target.value })} />
              <Input label="Color" value={edit.color || ''} onChange={(e) => setEdit({ ...edit, color: e.target.value })} />
            </div>
            <SwitchRow label="Record Active" hint="Include this benchmark in analytics" value={!!edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
          </div>
        )}
      </Modal>

      <ImportModal isOpen={showImport} onClose={() => { setShowImport(false); load(); }} title="Import Benchmark Data" columns={MARKET_CSV_COLS} onImport={api.importMarket} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estimates Section
// ─────────────────────────────────────────────────────────────────────────────

function EstimatesSection() {
  const [rows, setRows]       = useState<PriceEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [fValid, setFValid]   = useState('');
  const [detail, setDetail]   = useState<PriceEstimate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api.getEstimates({ search, is_valid: fValid, page_size: 100 }); setRows(d.results || d); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }, [search, fValid]);
  useEffect(() => { load(); }, [load]);

  const estBadge = (e: PriceEstimate) => e.is_expired ? { label: 'Expired', s: 'inactive' } : !e.is_valid ? { label: 'Invalid', s: 'danger' } : { label: 'Valid', s: 'active' };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
        <Input placeholder="Search estimate #, device…" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} className="w-72 bg-white" />
        <FilterSelect value={fValid} onChange={setFValid}><option value="">All Statuses</option><option value="true">Active & Valid</option><option value="false">Invalidated / Expired</option></FilterSelect>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-1.5" /> Refresh</Button>
          <Button size="sm" variant="outline" onClick={() => api.exportEstimates().then((r) => dlBlob(r, 'estimates_history.csv')).catch((e) => toast.error(e.message))}><Download className="w-4 h-4 mr-1.5" /> Export Log</Button>
        </div>
      </div>

      <DataTable loading={loading} span={10} cols={['Est #', 'Customer', 'Device', 'Config', 'Base', 'Final', 'Status', 'Expiry', 'Lead', 'Details']}>
        {rows.length === 0 ? <EmptyRow span={10} msg="No calculation history found" /> : rows.map((e) => {
          const st = estBadge(e);
          return (
            <tr key={e.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4"><span className="font-mono text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{e.estimate_number}</span></td>
              <td className="px-5 py-4 text-sm font-medium text-gray-700">{e.user_phone}</td>
              <td className="px-5 py-4">
                <p className="font-bold text-sm text-gray-900">{e.device_model?.name}</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{e.device_model?.brand_name}</p>
              </td>
              <td className="px-5 py-4 text-xs font-medium text-gray-500 space-y-1">
                {e.device_variant?.storage && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span> {e.device_variant.storage}</div>}
                {e.device_variant?.ram && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400"></span> {e.device_variant.ram}</div>}
              </td>
              <td className="px-5 py-4 text-sm font-medium text-gray-500 line-through">{formatCurrency(+e.base_price)}</td>
              <td className="px-5 py-4"><span className="text-lg font-black text-emerald-600">{formatCurrency(+e.final_price)}</span></td>
              <td className="px-5 py-4"><Badge status={st.s}>{st.label}</Badge></td>
              <td className="px-5 py-4 text-xs font-medium text-gray-400">{formatDate(e.expires_at)}</td>
              <td className="px-5 py-4">{e.converted_to_lead ? <Pill label="Converted" colorCls="bg-emerald-100 text-emerald-700 border border-emerald-200" /> : <span className="text-gray-300 font-bold">—</span>}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setDetail(e)} className="p-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors" title="View Full Calculation"><Eye className="w-4 h-4" /></button>
                  {e.is_valid && !e.is_expired && <button onClick={async () => { if (!confirm('Invalidate estimate?')) return; try { await api.invalidateEstimate(e.id); toast.success('Invalidated'); load(); } catch (err: any) { toast.error(err.message); } }} className="p-2 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors" title="Force Invalidate"><X className="w-4 h-4" /></button>}
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Estimate Report: ${detail?.estimate_number}`} size="lg" footer={<Button variant="outline" onClick={() => setDetail(null)}>Close Report</Button>}>
        {detail && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Base Valuation</p><p className="text-2xl font-medium">{formatCurrency(+detail.base_price)}</p></div>
              <div><p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Final Offer</p><p className="text-2xl font-black">{formatCurrency(+detail.final_price)}</p></div>
              <div className="col-span-2 lg:col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Device Identity</p>
                <p className="text-lg font-bold">{detail.device_model?.name} <span className="text-slate-500 font-normal">({detail.device_model?.brand_name})</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <p className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3"><ShieldAlert className="w-4 h-4 text-red-500" /> Applied Deductions</p>
                {detail.deductions.length === 0 ? <p className="text-sm text-gray-400 italic">No deductions applied.</p> : detail.deductions.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{d.reason}</span>
                    <span className="font-black text-red-500 bg-red-50 px-2 py-1 rounded">−{formatCurrency(+d.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <p className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Applied Additions</p>
                {detail.additions.length === 0 ? <p className="text-sm text-gray-400 italic">No additions applied.</p> : detail.additions.map((a, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{a.reason}</span>
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+{formatCurrency(+a.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center text-sm">
              <span className="font-medium text-indigo-800">Calculation Engine Version: <strong className="font-mono bg-white px-2 py-0.5 rounded ml-1">{detail.pricing_rule_version}</strong></span>
              <span className="font-medium text-indigo-800">Valid Until: <strong className="ml-1">{formatDate(detail.expires_at)}</strong></span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Configuration
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'tiers',     label: 'Priority Tiers & Rules', Icon: Layers },
  { id: 'fees',      label: 'Platform Fees',          Icon: DollarSign },
  { id: 'market',    label: 'Competitor Benchmark',   Icon: TrendingUp },
  { id: 'estimates', label: 'Calculation Logs',       Icon: ClipboardList },
];

export default function PricingAdmin() {
  const [tab, setTab] = useState('tiers');

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pricing Engine Admin</h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Configure matrix rules, fee structures, and audit calculation histories.
          </p>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100/80 p-1.5 rounded-xl w-fit border border-gray-200/60 shadow-inner">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
              tab === id ? 'bg-white text-indigo-700 shadow border border-gray-200/50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <Card className="shadow-lg border-0 ring-1 ring-gray-200">
        <div className="p-2">
          {tab === 'tiers'     && <PriorityTiersSection />}
          {tab === 'fees'      && <FeeStructuresSection />}
          {tab === 'market'    && <MarketPricesSection />}
          {tab === 'estimates' && <EstimatesSection />}
        </div>
      </Card>
    </div>
  );
}