// services/analytics.service.ts
import axiosInstance from '../lib/axios';

export interface AnalyticsSummary {
  totals: {
    categories: number;
    brands: number;
    models: number;
    variants: number;
    avg_price: number;
  };
  charts: {
    models_per_category: Array<{ name: string; models: number }>;
    models_per_brand: Array<{ name: string; models: number }>;
    model_status: Array<{ name: string; value: number }>;
    top_searches: Array<{ term: string; count: number }>;
    price_distribution: Array<{ range: string; count: number }>;
  };
  trends: {
    new_models_this_month: number;
    new_models_last_month: number;
    active_categories: number;
    active_brands: number;
  };
}

export const analyticsService = {
  // Get overall catalog summary
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await axiosInstance.get('/catalog/analytics/summary/');
    return response.data;
  },

  // Get category-specific analytics
  getCategoryAnalytics: async (categoryId: string) => {
    const response = await axiosInstance.get(`/catalog/categories/${categoryId}/analytics/`);
    return response.data;
  },

  // Get brand-specific analytics
  getBrandAnalytics: async (brandId: string) => {
    const response = await axiosInstance.get(`/catalog/brands/${brandId}/analytics/`);
    return response.data;
  },

  // Get search trends
  getSearchTrends: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await axiosInstance.get('/catalog/analytics/search-trends/', {
      params: { period },
    });
    return response.data;
  },

  // Get pricing analytics
  getPricingAnalytics: async () => {
    const response = await axiosInstance.get('/catalog/analytics/pricing/');
    return response.data;
  },

  // Get inventory analytics
  getInventoryAnalytics: async () => {
    const response = await axiosInstance.get('/catalog/analytics/inventory/');
    return response.data;
  },
};

export default analyticsService;