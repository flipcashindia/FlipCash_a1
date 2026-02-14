// lib/catalog.utils.ts
import { formatCurrency, formatDate, formatDateTime, getStatusColor, truncateText, debounce } from './utils';

/**
 * Re-export common utilities from main utils
 */
export { formatCurrency, formatDate, formatDateTime, getStatusColor, truncateText, debounce };

/**
 * Generate slug from string
 */
export const generateSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Validate file type for image uploads
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
};

/**
 * Validate file size (in MB)
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate SKU from model details
 */
export const generateSKU = (
  brand: string,
  modelName: string,
  storage?: string,
  color?: string
): string => {
  const brandCode = brand.substring(0, 3).toUpperCase();
  const modelCode = modelName.replace(/\s+/g, '').substring(0, 6).toUpperCase();
  const storageCode = storage ? storage.replace(/GB|TB/gi, '').substring(0, 3) : '';
  const colorCode = color ? color.substring(0, 3).toUpperCase() : '';
  
  return `${brandCode}-${modelCode}${storageCode ? '-' + storageCode : ''}${colorCode ? '-' + colorCode : ''}`;
};

/**
 * Validate JSON string
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Parse price impact configuration
 */
export const parsePriceImpact = (priceImpact: Record<string, any>): string => {
  return Object.entries(priceImpact)
    .map(([option, impact]) => {
      const { type, value } = impact;
      const sign = value >= 0 ? '+' : '';
      const formatted = type === 'percentage' ? `${sign}${value}%` : formatCurrency(value);
      return `${option}: ${formatted}`;
    })
    .join(', ');
};

/**
 * Calculate price with impact
 */
export const calculatePriceWithImpact = (
  basePrice: number,
  impact: { type: 'percentage' | 'fixed'; value: number }
): number => {
  if (impact.type === 'percentage') {
    return basePrice + (basePrice * impact.value / 100);
  }
  return basePrice + impact.value;
};

/**
 * Sort array of objects by key
 */
export const sortByKey = <T extends Record<string, any>>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Group array by key
 */
export const groupBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Extract error message from API response
 */
export const extractErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Create query string from object
 */
export const createQueryString = (params: Record<string, any>): string => {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return filteredParams ? `?${filteredParams}` : '';
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Convert base64 to blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeType });
};

/**
 * Download file from blob
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get catalog status badge classes
 */
export const getCatalogStatusColor = (status: string): string => {
  // Use the main getStatusColor function but add catalog-specific ones
  const catalogColors: Record<string, string> = {
    'featured': 'bg-yellow-100 text-yellow-800',
    'available': 'bg-green-100 text-green-800',
    'unavailable': 'bg-red-100 text-red-800',
    'out_of_stock': 'bg-orange-100 text-orange-800',
    'low_stock': 'bg-amber-100 text-amber-800',
  };
  
  return catalogColors[status.toLowerCase()] || getStatusColor(status);
};

/**
 * Format model name with brand
 */
export const formatModelName = (brandName: string, modelName: string): string => {
  return `${brandName} ${modelName}`;
};

/**
 * Format variant display name
 */
export const formatVariantName = (
  modelName: string,
  storage?: string,
  ram?: string,
  color?: string
): string => {
  const parts = [modelName];
  if (storage) parts.push(storage);
  if (ram) parts.push(ram);
  if (color) parts.push(color);
  return parts.join(' • ');
};

/**
 * Calculate variant availability status
 */
export const getVariantStatus = (
  isAvailable: boolean,
  stockQuantity: number
): { status: string; label: string; color: string } => {
  if (!isAvailable) {
    return {
      status: 'unavailable',
      label: 'Unavailable',
      color: getCatalogStatusColor('unavailable'),
    };
  }
  
  if (stockQuantity === 0) {
    return {
      status: 'out_of_stock',
      label: 'Out of Stock',
      color: getCatalogStatusColor('out_of_stock'),
    };
  }
  
  if (stockQuantity < 10) {
    return {
      status: 'low_stock',
      label: `Low Stock (${stockQuantity})`,
      color: getCatalogStatusColor('low_stock'),
    };
  }
  
  return {
    status: 'available',
    label: 'In Stock',
    color: getCatalogStatusColor('available'),
  };
};

export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  truncateText,
  debounce,
  generateSlug,
  isValidImageFile,
  isValidFileSize,
  formatFileSize,
  generateSKU,
  isValidJSON,
  parsePriceImpact,
  calculatePriceWithImpact,
  sortByKey,
  groupBy,
  isEmpty,
  deepClone,
  extractErrorMessage,
  createQueryString,
  isValidEmail,
  isValidURL,
  getFileExtension,
  base64ToBlob,
  downloadBlob,
  getCatalogStatusColor,
  formatModelName,
  formatVariantName,
  getVariantStatus,
};