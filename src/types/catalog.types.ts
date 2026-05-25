// types/catalog.types.ts

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface DeviceCategory {
  id: string;
  name: string;
  title?: string;           // Alias returned by DeviceCategoryListSerializer
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
  is_featured?: boolean;
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
  attribute_type: AttributeType;
  device_category: string;
  category_name?: string;
  question_text: string;
  is_required: boolean;
  is_boolean: boolean;
  options: string[];
  price_impact: Record<
    string,
    { type: 'percentage' | 'fixed'; value: number } | string
  >;
  bucket?: BucketType;
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
  updated_at?: string;
}

export interface PopularSearch {
  id: string;
  search_term: string;
  search_count: number;
  last_searched_at: string;
  created_at: string;
}

// ============================================================================
// ENUMS / UNION TYPES
// ============================================================================

export type AttributeType =
  | 'cosmetic'
  | 'functional'
  | 'accessory'
  | 'specification'
  | 'warranty'
  | 'legal';

export type BucketType = 'screen' | 'body' | 'none';

export type EntityType =
  | 'categories'
  | 'brands'
  | 'models'
  | 'variants'
  | 'attributes';

export type BulkImportType =
  | 'categories'
  | 'brands'
  | 'models'
  | 'attributes'
  | 'variants';

export type BooleanField = 'is_active' | 'is_featured' | 'is_available';

export type VerificationStatus = 'pending' | 'in_review' | 'verified' | 'rejected';

// ============================================================================
// FILTER / QUERY OPTIONS
// ============================================================================

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
  device_category?: string;
  price_min?: number;
  price_max?: number;
  launch_year?: number;
  launch_year_min?: number;
  launch_year_max?: number;
  storage?: string;
  ordering?: string;
  [key: string]: any;
}

// ============================================================================
// PAGINATED RESPONSE
// ============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type CategoryListResponse  = PaginatedResponse<DeviceCategory>;
export type BrandListResponse     = PaginatedResponse<DeviceBrand>;
export type ModelListResponse     = PaginatedResponse<DeviceModel>;
export type AttributeListResponse = PaginatedResponse<DeviceAttribute>;
export type VariantListResponse   = PaginatedResponse<DeviceVariant>;
export type SearchListResponse    = PaginatedResponse<PopularSearch>;

// ============================================================================
// BULK OPERATION RESULTS
// ============================================================================

export interface BulkImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export interface BulkDeleteResult {
  deleted: number;
  failed: string[];
  errors: string[];
}

export interface BulkUpdateResult {
  updated: number;
  failed: string[];
  errors: string[];
}

export interface BulkImageUploadDetail {
  filename: string;
  model?: string;
  status: 'uploaded' | 'skipped' | 'error';
}

export interface BulkImageUploadResult {
  uploaded: number;
  skipped: number;
  errors: string[];
  details: BulkImageUploadDetail[];
}

// ============================================================================
// PRICE ESTIMATES
// ============================================================================

export interface PriceEstimateInput {
  model_id: string;
  storage?: string;
  ram?: string;
  color?: string;
  attributes: Record<string, string>;
  imei?: string;
  purchase_date?: string;
}

export interface PriceDeduction {
  attribute: string;
  impact: number;
  reason: string;
}

export interface PriceEstimate {
  estimate_id: string;
  device_model: DeviceModel;
  base_price: number;
  deductions: PriceDeduction[];
  final_price: number;
  pricing_version: string;
  created_at: string;
  depreciation_amount?: number;
  condition_deductions?: number;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface CatalogSummary {
  total_categories: number;
  total_brands: number;
  total_models: number;
  total_variants: number;
  average_price: number;
  featured_categories: number;
  featured_brands: number;
  featured_models: number;
}

export interface CatalogAnalytics {
  summary: CatalogSummary;
  models_by_category: Array<{ name: string; model_count: number }>;
  models_by_brand: Array<{ name: string; model_count: number }>;
}

/** Transformed version used by CatalogBoard charts */
export interface DashboardData {
  totals: {
    categories: number;
    brands: number;
    models: number;
    avg_price: number;
  };
  charts: {
    models_per_category: Array<{ name: string; models: number }>;
    model_status: Array<{ name: string; value: number }>;
    top_searches: Array<{ term: string; count: number }>;
  };
  trends?: {
    new_models_this_month: number;
    new_models_last_month: number;
    active_categories: number;
    active_brands: number;
  };
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

// ============================================================================
// VARIANT STATUS HELPER
// ============================================================================

export interface VariantStatus {
  status: 'available' | 'unavailable' | 'out_of_stock' | 'low_stock';
  label: string;
  color: string;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

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
  attribute_type: AttributeType;
  device_category: string;
  question_text: string;
  is_required: boolean;
  is_boolean: boolean;
  options: string[];
  price_impact: Record<string, { type: 'percentage' | 'fixed'; value: number }>;
  bucket?: BucketType;
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
  variant_price?: number | null;
  sku?: string;
  is_available: boolean;
  stock_quantity: number;
}







