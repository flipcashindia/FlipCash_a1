// services/pricing.admin.service.ts
// Complete service layer for the PricingAdmin panel
// All endpoints are admin-only (IsAdminUser)

import axios from '../lib/axios';


export interface DevicePriorityTier {
  id: string;
  name: string;
  tier_code: string;
  brand: string;
  brand_name: string;
  category: string;
  category_name: string;
  min_price: string;
  max_price: string;
  ask_warranty: boolean;
  scrap_value: string;
  display_name: string;
  description: string;
  is_active: boolean;
  rules_count: number;
  created_at: string;
  updated_at: string;
}


export interface PriorityTierRule {
  id: string;
  priority_tier: string;
  priority_tier_name: string;
  rule_key: string;
  rule_type: 'percentage' | 'fixed' | 'scrap' | 'warranty_bonus' | 'warranty_penalty';
  rule_type_display: string;
  rule_value: string;
  display_label: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}


export interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
  total: number;
}


export interface EstimateStats {
  total: number;
  valid: number;
  expired: number;
  converted: number;
  today: number;
  avg_final_price: string;
  total_value: string;
}

// ── Priority Tiers ────────────────────────────────────────────────────────────

export const tierService = {
  list: async (params?: Record<string, any>) => {
    const { data } = await axios.get('/pricing/priority-tiers/', { params });
    return data;
  },

  get: async (id: string) => {
    const { data } = await axios.get<DevicePriorityTier>(`/pricing/priority-tiers/${id}/`);
    return data;
  },

  create: async (payload: Partial<DevicePriorityTier>) => {
    const { data } = await axios.post('/pricing/priority-tiers/', payload);
    return data;
  },

  update: async (id: string, payload: Partial<DevicePriorityTier>) => {
    const { data } = await axios.patch(`/pricing/priority-tiers/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await axios.delete(`/pricing/priority-tiers/${id}/`);
  },

  bulkToggle: async (ids: string[], is_active: boolean) => {
    const { data } = await axios.post('/pricing/priority-tiers/bulk_toggle/', { ids, is_active });
    return data;
  },

  bulkDelete: async (ids: string[]) => {
    const { data } = await axios.post('/pricing/priority-tiers/bulk_delete/', { ids });
    return data;
  },

  importCsv: async (file: File): Promise<ImportResult> => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await axios.post('/pricing/priority-tiers/import_csv/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  exportCsv: () =>
    axios.get('/pricing/priority-tiers/export_csv/', { responseType: 'blob' })
      .then(r => new Blob([r.data], { type: 'text/csv' })),
};

// ── Tier Rules ────────────────────────────────────────────────────────────────

export const tierRuleService = {
  list: async (params?: Record<string, any>) => {
    const { data } = await axios.get('/pricing/tier-rules/', { params });
    return data;
  },

  create: async (payload: Partial<PriorityTierRule>) => {
    const { data } = await axios.post('/pricing/tier-rules/', payload);
    return data;
  },

  update: async (id: string, payload: Partial<PriorityTierRule>) => {
    const { data } = await axios.patch(`/pricing/tier-rules/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await axios.delete(`/pricing/tier-rules/${id}/`);
  },

  importCsv: async (file: File): Promise<ImportResult> => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await axios.post('/pricing/tier-rules/import_csv/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  exportCsv: () =>
    axios.get('/pricing/tier-rules/export_csv/', { responseType: 'blob' })
      .then(r => new Blob([r.data], { type: 'text/csv' })),
};

// ── Fee Structures ────────────────────────────────────────────────────────────

export const feeService = {
  list: async (params?: Record<string, any>) => {
    const { data } = await axios.get('/pricing/fees/', { params });
    return data;
  },

  create: async (payload: any) => {
    const { data } = await axios.post('/pricing/fees/', payload);
    return data;
  },

  update: async (id: string, payload: any) => {
    const { data } = await axios.patch(`/pricing/fees/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await axios.delete(`/pricing/fees/${id}/`);
  },

  test: async (id: string, amount: number) => {
    const { data } = await axios.post(`/pricing/fees/${id}/test_calculation/`, { amount });
    return data;
  },
};

// ── Market Prices ─────────────────────────────────────────────────────────────

export const marketPriceService = {
  list: async (params?: Record<string, any>) => {
    const { data } = await axios.get('/pricing/market-prices/', { params });
    return data;
  },

  create: async (payload: any) => {
    const { data } = await axios.post('/pricing/market-prices/', payload);
    return data;
  },

  update: async (id: string, payload: any) => {
    const { data } = await axios.patch(`/pricing/market-prices/${id}/`, payload);
    return data;
  },

  delete: async (id: string) => {
    await axios.delete(`/pricing/market-prices/${id}/`);
  },

  importCsv: async (file: File): Promise<ImportResult> => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await axios.post('/pricing/market-prices/import_csv/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  exportCsv: () =>
    axios.get('/pricing/market-prices/export_csv/', { responseType: 'blob' })
      .then(r => new Blob([r.data], { type: 'text/csv' })),
};

// ── Admin Estimates ───────────────────────────────────────────────────────────

export const adminEstimateService = {
  list: async (params?: Record<string, any>) => {
    const { data } = await axios.get('/pricing/estimates/', { params });
    return data;
  },

  get: async (id: string) => {
    const { data } = await axios.get(`/pricing/estimates/${id}/`);
    return data;
  },

  invalidate: async (id: string) => {
    const { data } = await axios.post(`/pricing/estimates/${id}/invalidate/`);
    return data;
  },

  stats: async (): Promise<EstimateStats> => {
    const { data } = await axios.get('/pricing/estimates/stats/');
    return data;
  },

  exportCsv: () =>
    axios.get('/pricing/estimates/export_csv/', { responseType: 'blob' })
      .then(r => new Blob([r.data], { type: 'text/csv' })),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function csvTemplateBlobUrl(headers: string[]): string {
  const content = headers.join(',') + '\n';
  return URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
}