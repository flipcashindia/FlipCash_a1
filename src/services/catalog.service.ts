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

  toggleCategoryFeatured: async (id: string, isFeatured: boolean) => {
    const response = await axiosInstance.patch(`/catalog/categories/${id}/`, { is_featured: isFeatured });
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

  toggleBrandFeatured: async (id: string, isFeatured: boolean) => {
    const response = await axiosInstance.patch(`/catalog/brands/${id}/`, { is_featured: isFeatured });
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

  toggleModelFeatured: async (id: string, isFeatured: boolean) => {
    const response = await axiosInstance.patch(`/catalog/models/${id}/`, { is_featured: isFeatured });
    return response.data;
  },

  // Model images
  uploadModelImages: async (modelId: string, files: FileList | File[]) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });
    const response = await axiosInstance.post(
      `/catalog/models/${modelId}/upload-images/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  deleteModelImage: async (modelId: string, imageId: string) => {
    const response = await axiosInstance.delete(`/catalog/models/${modelId}/images/${imageId}/`);
    return response.data;
  },

  setPrimaryImage: async (modelId: string, imageId: string) => {
    const response = await axiosInstance.post(
      `/catalog/models/${modelId}/images/${imageId}/set-primary/`
    );
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
    const response = await axiosInstance.patch(`/catalog/variants/${id}/`, {
      is_available: isAvailable,
    });
    return response.data;
  },

  // ============================================================================
  // SEARCH & POPULAR SEARCHES
  // ============================================================================
  searchCatalog: async (query: string, params?: FilterOptions) => {
    const response = await axiosInstance.get('/catalog/search/', {
      params: { ...params, q: query },
    });
    return response.data;
  },

  getSearchSuggestions: async (query: string) => {
    const response = await axiosInstance.get('/catalog/search/suggestions/', {
      params: { q: query },
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
  // BULK IMPORT  (CSV / XLSX)
  // ============================================================================

  /**
   * POST /catalog/bulk-import/upload/
   * FormData: { file: File, model_type: 'categories' | 'brands' | 'models' | 'attributes' | 'variants' }
   */
  bulkImport: async (formData: FormData) => {
    const response = await axiosInstance.post('/catalog/bulk-import/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as { created: number; updated: number; errors: string[] };
  },

  /**
   * Download a pre-filled CSV template for the given import type.
   * Falls back to client-side generation if the backend endpoint is unavailable.
   */
  downloadTemplate: async (
    modelType: 'categories' | 'brands' | 'models' | 'attributes' | 'variants'
  ): Promise<Blob> => {
    try {
      const response = await axiosInstance.get(
        `/catalog/bulk-import/template/?model_type=${modelType}`,
        { responseType: 'blob' }
      );
      return response.data as Blob;
    } catch {
      // Client-side fallback templates
      const TEMPLATES: Record<string, string> = {
        categories:
          'name,slug,description,sort_order,is_active,is_featured\n' +
          'Smartphones,smartphones,Mobile phones,1,true,true\n' +
          'Laptops,laptops,Portable computers,2,true,false',

        brands:
          'name,slug,description,country_of_origin,website,sort_order,is_active\n' +
          'Apple,apple,Premium devices,USA,https://apple.com,1,true\n' +
          'Samsung,samsung,Korean electronics,South Korea,https://samsung.com,2,true',

        models:
          'Category,Brand,Name,Slug,Model Number,Launch Year,Base Price,' +
          'Storage Options,Ram Options,Color Options,Specifications (JSON),' +
          'Description,Meta Description,Is Active,Is Featured\n' +
          'Phones,Apple,iPhone 15,iphone-15,A3092,2023,79900.00,' +
          '"[""128GB"",""256GB""]","[""6GB""]","[""Black"",""Blue""]",' +
          '"{""processor"":""A16 Bionic""}","iPhone 15 description",' +
          '"iPhone 15 meta",true,true',

        attributes:
          'name,device_category,attribute_type,question_text,is_boolean,' +
          'options,price_impact,bucket,is_required\n' +
          'screen_condition,Phones,cosmetic,What is the screen condition?,false,' +
          '"[""Excellent"",""Good"",""Fair""]",' +
          '"{""Excellent"":{""type"":""percentage"",""value"":0},' +
          '""Good"":{""type"":""percentage"",""value"":-10},' +
          '""Fair"":{""type"":""percentage"",""value"":-20}}",' +
          'screen,true\n' +
          'battery_health,Phones,functional,Is battery above 80%?,true,,' +
          '"{""Yes"":{""type"":""percentage"",""value"":0},' +
          '""No"":{""type"":""percentage"",""value"":-15}}",none,true',

        variants:
          'Category,Brand,Model,Specs,Final Price\n' +
          'Phones,Apple,iPhone 15,,79900\n' +
          'Phones,Apple,iPhone 15,128GB/6GB/Black,79900\n' +
          'Phones,Apple,iPhone 15,256GB/6GB/Blue,89900',
      };

      const csv = TEMPLATES[modelType] ?? '';
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    }
  },

  // ============================================================================
  // BULK IMAGE UPLOAD
  // ============================================================================

  /**
   * POST /catalog/bulk-images/upload-images/
   * FormData key: "images" — each File with webkitRelativePath set as name,
   * OR flat naming  Category__Brand__ModelName__01.jpg
   *
   * Returns: { uploaded, skipped, errors[], details[] }
   */
  bulkUploadImages: async (formData: FormData) => {
    const response = await axiosInstance.post(
      '/catalog/bulk-images/upload-images/',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data as {
      uploaded: number;
      skipped: number;
      errors: string[];
      details: { filename: string; model?: string; status: 'uploaded' | 'skipped' | 'error' }[];
    };
  },

  // ============================================================================
  // BULK DELETE
  // ============================================================================

  /**
   * POST /catalog/{entityType}/bulk-delete/
   * Body: { ids: string[] }
   * Returns: { deleted, failed[], errors[] }
   *
   * Falls back to individual DELETEs if the endpoint is unavailable.
   */
  bulkDelete: async (
    entityType: 'categories' | 'brands' | 'models' | 'variants' | 'attributes',
    ids: string[]
  ): Promise<{ deleted: number; failed: string[]; errors: string[] }> => {
    // Try dedicated bulk-delete endpoint first
    try {
      const response = await axiosInstance.post(`/catalog/${entityType}/bulk-delete/`, { ids });
      return response.data;
    } catch {
      // Fallback: delete one-by-one
      const ENDPOINT_MAP: Record<string, string> = {
        categories: 'categories',
        brands:     'brands',
        models:     'models',
        variants:   'variants',
        attributes: 'attributes',
      };
      const base = ENDPOINT_MAP[entityType];
      let deleted = 0;
      const failed: string[] = [];
      const errors: string[] = [];

      await Promise.allSettled(
        ids.map(async (id) => {
          try {
            await axiosInstance.delete(`/catalog/${base}/${id}/`);
            deleted++;
          } catch (err: any) {
            failed.push(id);
            errors.push(`${id}: ${err?.response?.data?.detail ?? 'Delete failed'}`);
          }
        })
      );

      return { deleted, failed, errors };
    }
  },

  // ============================================================================
  // BULK STATUS UPDATE
  // ============================================================================

  /**
   * POST /catalog/{entityType}/bulk-update/
   * Body: { ids: string[], updates: { is_active?: bool, is_featured?: bool, is_available?: bool } }
   * Returns: { updated, failed[], errors[] }
   *
   * Falls back to individual PATCHes if the endpoint is unavailable.
   */
  bulkUpdateStatus: async (
    entityType: 'categories' | 'brands' | 'models' | 'variants' | 'attributes',
    ids: string[],
    field: 'is_active' | 'is_featured' | 'is_available',
    value: boolean
  ): Promise<{ updated: number; failed: string[]; errors: string[] }> => {
    // Try dedicated bulk-update endpoint first
    try {
      const response = await axiosInstance.post(`/catalog/${entityType}/bulk-update/`, {
        ids,
        updates: { [field]: value },
      });
      return response.data;
    } catch {
      // Fallback: PATCH one-by-one
      let updated = 0;
      const failed: string[] = [];
      const errors: string[] = [];

      await Promise.allSettled(
        ids.map(async (id) => {
          try {
            await axiosInstance.patch(`/catalog/${entityType}/${id}/`, { [field]: value });
            updated++;
          } catch (err: any) {
            failed.push(id);
            errors.push(`${id}: ${err?.response?.data?.detail ?? 'Update failed'}`);
          }
        })
      );

      return { updated, failed, errors };
    }
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