// types/catalog.types.ts

export interface DeviceCategory {
  id: string;
  name: string;
  title?: string; // Alias for name
  slug: string;
  description: string;
  icon?: File | null;
  icon_url?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  models_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceBrand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: File | null;
  logo_url?: string;
  country_of_origin: string;
  website: string;
  is_active: boolean;
  sort_order: number;
  models_count?: number;
  categories?: DeviceCategory[];
  created_at: string;
  updated_at: string;
}

export interface DeviceModelImage {
  id: string;
  image: File | string;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

export interface DeviceModel {
  id: string;
  category: DeviceCategory | string;
  category_id?: string;
  category_name?: string;
  brand: DeviceBrand | string;
  brand_id?: string;
  brand_name?: string;
  brand_logo?: string;
  name: string;
  slug: string;
  model_number: string;
  launch_year: number;
  base_price: number;
  storage_options: string[];
  ram_options: string[];
  color_options: string[];
  specifications: Record<string, any>;
  images?: DeviceModelImage[];
  thumbnail?: string;
  primary_image?: DeviceModelImage;
  description: string;
  meta_description: string;
  is_active: boolean;
  is_featured: boolean;
  variants?: DeviceVariant[];
  attributes?: DeviceAttribute[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface DeviceAttribute {
  id: string;
  name: string;
  attribute_type: 'cosmetic' | 'functional' | 'accessory' | 'specification' | 'warranty' | 'legal';
  device_category: string;
  category_name?: string;
  question_text: string;
  is_required: boolean;
  is_boolean: boolean;
  options: string[];
  price_impact: Record<string, {
    type: 'percentage' | 'fixed';
    value: number;
  } | string>; // Can be rule key (string) or direct impact object
  bucket?: 'screen' | 'body' | 'none';
  display_order: number;
  help_text: string;
  placeholder: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceVariant {
  id: string;
  device_model: string;
  storage: string;
  ram: string;
  color: string;
  variant_price: number | null;
  effective_price: number;
  sku: string;
  is_available: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PopularSearch {
  id: string;
  search_term: string;
  search_count: number;
  last_searched_at: string;
  created_at: string;
}

export interface FilterOptions {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  brand?: string;
  is_active?: boolean | string;
  is_featured?: boolean | string;
  is_boolean?: boolean | string;
  is_required?: boolean | string;
  attribute_type?: string;
  price_min?: number;
  price_max?: number;
  launch_year?: number;
  launch_year_min?: number;
  launch_year_max?: number;
  storage?: string;
  ordering?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface BulkImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export interface PriceEstimateInput {
  model_id: string;
  storage?: string;
  ram?: string;
  color?: string;
  attributes: Record<string, string>;
  imei?: string;
  purchase_date?: string;
}

export interface PriceEstimate {
  estimate_id: string;
  device_model: DeviceModel;
  base_price: number;
  deductions: Array<{
    attribute: string;
    impact: number;
    reason: string;
  }>;
  final_price: number;
  pricing_version: string;
  created_at: string;
  depreciation_amount?: number;
  condition_deductions?: number;
}

// Analytics types
export interface CatalogAnalytics {
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
  };
}

// Form data types
export interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  icon?: File;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

export interface BrandFormData {
  name: string;
  slug?: string;
  description?: string;
  logo?: File;
  country_of_origin?: string;
  website?: string;
  is_active: boolean;
  sort_order: number;
}

export interface ModelFormData {
  category: string;
  brand: string;
  name: string;
  slug?: string;
  model_number?: string;
  launch_year?: number;
  base_price: number;
  storage_options: string[];
  ram_options: string[];
  color_options: string[];
  specifications: Record<string, any>;
  description?: string;
  meta_description?: string;
  is_active: boolean;
  is_featured: boolean;
  images?: FileList;
}

export interface AttributeFormData {
  name: string;
  attribute_type: string;
  device_category: string;
  question_text: string;
  is_required: boolean;
  is_boolean: boolean;
  options: string[];
  price_impact: Record<string, any>;
  bucket?: string;
  display_order: number;
  help_text?: string;
  placeholder?: string;
  is_active: boolean;
}

export interface VariantFormData {
  device_model: string;
  storage?: string;
  ram?: string;
  color?: string;
  variant_price?: number;
  sku?: string;
  is_available: boolean;
  stock_quantity: number;
}

// Utility types
export interface VariantStatus {
  status: 'available' | 'unavailable' | 'out_of_stock' | 'low_stock';
  label: string;
  color: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface SearchTrendData {
  term: string;
  count: number;
  date?: string;
}

// API Response types
export type CategoryListResponse = PaginatedResponse<DeviceCategory>;
export type BrandListResponse = PaginatedResponse<DeviceBrand>;
export type ModelListResponse = PaginatedResponse<DeviceModel>;
export type AttributeListResponse = PaginatedResponse<DeviceAttribute>;
export type VariantListResponse = PaginatedResponse<DeviceVariant>;
export type SearchListResponse = PaginatedResponse<PopularSearch>;