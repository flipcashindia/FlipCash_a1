// config/catalog.constants.ts
// Catalog-specific constants to complement the main constants.ts

export const CATALOG_ROUTES = {
  DASHBOARD: '/catalog/dashboard',
  CATEGORIES: '/catalog/categories',
  CATEGORY_NEW: '/catalog/categories/new',
  CATEGORY_EDIT: '/catalog/categories/:id/edit',
  BRANDS: '/catalog/brands',
  BRAND_NEW: '/catalog/brands/new',
  BRAND_EDIT: '/catalog/brands/:id/edit',
  MODELS: '/catalog/models',
  MODEL_NEW: '/catalog/models/new',
  MODEL_DETAIL: '/catalog/models/:id',
  MODEL_EDIT: '/catalog/models/:id/edit',
  MODEL_VARIANTS: '/catalog/models/:id/variants',
  ATTRIBUTES: '/catalog/attributes',
  ATTRIBUTE_NEW: '/catalog/attributes/new',
  ATTRIBUTE_EDIT: '/catalog/attributes/:id/edit',
  BULK_IMPORT: '/tools/bulk-import',
  SEARCH_ANALYTICS: '/catalog/search-analytics',
};

export const ATTRIBUTE_TYPES = {
  COSMETIC: 'cosmetic',
  FUNCTIONAL: 'functional',
  ACCESSORY: 'accessory',
  SPECIFICATION: 'specification',
  WARRANTY: 'warranty',
  LEGAL: 'legal',
} as const;

export const ATTRIBUTE_BUCKETS = {
  SCREEN: 'screen',
  BODY: 'body',
  NONE: 'none',
} as const;

export const PRICE_IMPACT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;

export const CATALOG_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FEATURED: 'featured',
  DRAFT: 'draft',
} as const;

export const VARIANT_STATUS = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  OUT_OF_STOCK: 'out_of_stock',
  LOW_STOCK: 'low_stock',
} as const;

export const BULK_IMPORT_TYPES = {
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  MODELS: 'models',
} as const;

export const IMAGE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  MAX_IMAGES_PER_MODEL: 10,
} as const;

export const CATALOG_PAGE_SIZES = [10, 20, 50, 100];

export const DEFAULT_CATALOG_PAGE_SIZE = 20;

export const SEARCH_ANALYTICS_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
} as const;

// Validation rules
export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MIN_PRICE: 0,
  MAX_PRICE: 10000000,
  MIN_STOCK: 0,
  MAX_STOCK: 999999,
  MIN_LAUNCH_YEAR: 2000,
  MAX_LAUNCH_YEAR: new Date().getFullYear() + 1,
  SKU_MAX_LENGTH: 100,
  SLUG_MAX_LENGTH: 255,
} as const;

// Default values
export const DEFAULTS = {
  SORT_ORDER: 0,
  DISPLAY_ORDER: 0,
  STOCK_QUANTITY: 0,
  BASE_PRICE: 0,
  IS_ACTIVE: true,
  IS_FEATURED: false,
  IS_REQUIRED: false,
  IS_BOOLEAN: false,
} as const;

// File upload templates
export const TEMPLATE_URLS = {
  CATEGORIES: '/templates/categories_import.xlsx',
  BRANDS: '/templates/brands_import.xlsx',
  MODELS: '/templates/models_import.xlsx',
} as const;

// Chart colors for analytics
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
} as const;

// Storage/RAM/Color common options (can be overridden per model)
export const COMMON_OPTIONS = {
  STORAGE: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
  RAM: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB'],
  COLORS: ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Purple', 'Pink', 'Gray'],
} as const;

// Attribute type labels
export const ATTRIBUTE_TYPE_LABELS = {
  cosmetic: 'Cosmetic',
  functional: 'Functional',
  accessory: 'Accessory',
  specification: 'Specification',
  warranty: 'Warranty',
  legal: 'Legal/Age',
} as const;

// Bucket labels
export const BUCKET_LABELS = {
  screen: 'Screen Bucket (Apply MAX impact)',
  body: 'Body Bucket (Apply MAX impact)',
  none: 'No Bucket (Apply ALL impacts)',
} as const;

export default {
  CATALOG_ROUTES,
  ATTRIBUTE_TYPES,
  ATTRIBUTE_BUCKETS,
  PRICE_IMPACT_TYPES,
  CATALOG_STATUS,
  VARIANT_STATUS,
  BULK_IMPORT_TYPES,
  IMAGE_UPLOAD,
  CATALOG_PAGE_SIZES,
  DEFAULT_CATALOG_PAGE_SIZE,
  SEARCH_ANALYTICS_PERIODS,
  VALIDATION,
  DEFAULTS,
  TEMPLATE_URLS,
  CHART_COLORS,
  COMMON_OPTIONS,
  ATTRIBUTE_TYPE_LABELS,
  BUCKET_LABELS,
};