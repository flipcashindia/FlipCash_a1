// services/catalog.service.ts
import axiosInstance from '../lib/axios';
import { type FilterOptions } from '../types';

export const catalogService = {
  // ============================================================================
  // CATEGORIES
  // ============================================================================
  getCategories: async (params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/categories/', { params });
    return response.data;
  },

  getCategory: async (id: string) => {
    const response = await axiosInstance.get(`/catalog/categories/${id}/`);
    return response.data;
  },

  createCategory: async (data: FormData | any) => {
    const response = await axiosInstance.post('/catalog/categories/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  updateCategory: async (id: string, data: FormData | any) => {
    const response = await axiosInstance.patch(`/catalog/categories/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  deleteCategory: async (id: string) => {
    const response = await axiosInstance.delete(`/catalog/categories/${id}/`);
    return response.data;
  },

  toggleCategoryStatus: async (id: string, isActive: boolean) => {
    const response = await axiosInstance.patch(`/catalog/categories/${id}/`, { is_active: isActive });
    return response.data;
  },

  getFeaturedCategories: async () => {
    const response = await axiosInstance.get('/catalog/categories/featured/');
    return response.data;
  },

  // ============================================================================
  // BRANDS
  // ============================================================================
  getBrands: async (params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/brands/', { params });
    return response.data;
  },

  getBrand: async (id: string) => {
    const response = await axiosInstance.get(`/catalog/brands/${id}/`);
    return response.data;
  },

  createBrand: async (data: FormData | any) => {
    const response = await axiosInstance.post('/catalog/brands/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  updateBrand: async (id: string, data: FormData | any) => {
    const response = await axiosInstance.patch(`/catalog/brands/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  deleteBrand: async (id: string) => {
    const response = await axiosInstance.delete(`/catalog/brands/${id}/`);
    return response.data;
  },

  toggleBrandStatus: async (id: string, isActive: boolean) => {
    const response = await axiosInstance.patch(`/catalog/brands/${id}/`, { is_active: isActive });
    return response.data;
  },

  // ============================================================================
  // MODELS
  // ============================================================================
  getModels: async (params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/models/', { params });
    return response.data;
  },

  getModel: async (id: string) => {
    const response = await axiosInstance.get(`/catalog/models/${id}/`);
    return response.data;
  },

  createModel: async (data: FormData | any) => {
    const response = await axiosInstance.post('/catalog/models/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  updateModel: async (id: string, data: FormData | any) => {
    const response = await axiosInstance.patch(`/catalog/models/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  deleteModel: async (id: string) => {
    const response = await axiosInstance.delete(`/catalog/models/${id}/`);
    return response.data;
  },

  toggleModelStatus: async (id: string, isActive: boolean) => {
    const response = await axiosInstance.patch(`/catalog/models/${id}/`, { is_active: isActive });
    return response.data;
  },

  // Model images
  uploadModelImages: async (modelId: string, files: FileList | File[]) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });
    const response = await axiosInstance.post(`/catalog/models/${modelId}/upload-images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteModelImage: async (modelId: string, imageId: string) => {
    const response = await axiosInstance.delete(`/catalog/models/${modelId}/images/${imageId}/`);
    return response.data;
  },

  setPrimaryImage: async (modelId: string, imageId: string) => {
    const response = await axiosInstance.post(`/catalog/models/${modelId}/images/${imageId}/set-primary/`);
    return response.data;
  },

  // ============================================================================
  // ATTRIBUTES
  // ============================================================================
  getAttributes: async (params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/attributes/', { params });
    return response.data;
  },

  getAttribute: async (id: string) => {
    const response = await axiosInstance.get(`/catalog/attributes/${id}/`);
    return response.data;
  },

  createAttribute: async (data: any) => {
    const response = await axiosInstance.post('/catalog/attributes/', data);
    return response.data;
  },

  updateAttribute: async (id: string, data: any) => {
    const response = await axiosInstance.patch(`/catalog/attributes/${id}/`, data);
    return response.data;
  },

  deleteAttribute: async (id: string) => {
    const response = await axiosInstance.delete(`/catalog/attributes/${id}/`);
    return response.data;
  },

  toggleAttributeStatus: async (id: string, isActive: boolean) => {
    const response = await axiosInstance.patch(`/catalog/attributes/${id}/`, { is_active: isActive });
    return response.data;
  },

  // ============================================================================
  // VARIANTS
  // ============================================================================
  getVariants: async (params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/variants/', { params });
    return response.data;
  },

  getVariant: async (id: string) => {
    const response = await axiosInstance.get(`/catalog/variants/${id}/`);
    return response.data;
  },

  getModelVariants: async (modelId: string) => {
    const response = await axiosInstance.get(`/catalog/models/${modelId}/variants/`);
    return response.data;
  },

  createVariant: async (data: any) => {
    const response = await axiosInstance.post('/catalog/variants/', data);
    return response.data;
  },

  updateVariant: async (id: string, data: any) => {
    const response = await axiosInstance.patch(`/catalog/variants/${id}/`, data);
    return response.data;
  },

  deleteVariant: async (id: string) => {
    const response = await axiosInstance.delete(`/catalog/variants/${id}/`);
    return response.data;
  },

  toggleVariantAvailability: async (id: string, isAvailable: boolean) => {
    const response = await axiosInstance.patch(`/catalog/variants/${id}/`, { is_available: isAvailable });
    return response.data;
  },

  // ============================================================================
  // SEARCH & ANALYTICS
  // ============================================================================
  searchCatalog: async (query: string, params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/search/', { 
      params: { ...params, q: query } 
    });
    return response.data;
  },

  getPopularSearches: async (params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/popular-searches/', { params });
    return response.data;
  },

  deletePopularSearch: async (id: string) => {
    const response = await axiosInstance.delete(`/catalog/popular-searches/${id}/`);
    return response.data;
  },

  // ============================================================================
  // BULK IMPORT
  // ============================================================================
  bulkImport: async (formData: FormData) => {
    const response = await axiosInstance.post('/catalog/bulk-import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadTemplate: async (modelType: 'categories' | 'brands' | 'models') => {
    const response = await axiosInstance.get(`/catalog/bulk-import/template/${modelType}/`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  getCatalogAnalytics: async () => {
    const response = await axiosInstance.get('/catalog/analytics/summary/');
    return response.data;
  },

  getCategoryAnalytics: async (categoryId: string) => {
    const response = await axiosInstance.get(`/catalog/categories/${categoryId}/analytics/`);
    return response.data;
  },

  getBrandAnalytics: async (brandId: string) => {
    const response = await axiosInstance.get(`/catalog/brands/${brandId}/analytics/`);
    return response.data;
  },

  // ============================================================================
  // PRICE ESTIMATES
  // ============================================================================
  calculatePriceEstimate: async (data: any) => {
    const response = await axiosInstance.post('/catalog/price-estimate/', data);
    return response.data;
  },
};

export default catalogService;