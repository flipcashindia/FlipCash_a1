// types/index.ts

// ============================================================================
// AUTH TYPES
// ============================================================================
export interface User {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'sales' | 'support' | 'finance' | 'compliance' | 'consumer' | 'partner';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginCredentials {
  phone: string;
  purpose: 'login' | 'signup';
}

export interface OTPVerification {
  phone: string;
  code: string;
  device_id?: string;
}

export interface PasswordLogin {
  username: string;
  password: string;
}

// ============================================================================
// CATALOG TYPES
// ============================================================================
export interface DeviceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
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
  logo?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  models_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceModel {
  id: string;
  category: string;
  category_name?: string;
  brand: string;
  brand_name?: string;
  name: string;
  slug: string;
  base_price: string;
  image?: string;
  specifications?: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceAttribute {
  id: string;
  name: string;
  attribute_type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
}

// Find and update the DeviceVariant interface:
export interface DeviceVariant {
  id: string;
  device_model: string;
  storage?: string;
  ram?: string;
  color?: string;
  sku?: string;
  price_adjustment: number;  // ✅ Changed from string to number
  final_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LEAD TYPES
// ============================================================================
export interface Lead {
  id: string;
  lead_number: string;
  user: string;
  user_name?: string;
  user_phone?: string;
  device_category: string;
  device_brand: string;
  device_model: string;
  device_name?: string;
  device_variant?: string;
  device_age: string;
  device_condition: string;
  functional_issues: string[];
  cosmetic_condition: string;
  has_accessories: boolean;
  accessories_list?: string[];
  warranty_status: string;
  warranty_months?: number;
  imei_number?: string;
  estimated_price: string;
  final_price?: string;
  photos: string[];
  address: any;
  preferred_date?: string;
  preferred_time?: string;
  status: string;
  assigned_partner?: PartnerInfo;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_urgent?: boolean;
  is_flagged?: boolean;
  flag_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerInfo {
  id: string;
  business_name: string;
  phone: string;
  email?: string;
}

// ============================================================================
// PARTNER TYPES
// ============================================================================
export interface Partner {
  id: string;
  user: string;
  business_name: string;
  business_type: string;
  pan_number: string;
  gst_number?: string;
  phone: string;
  email?: string;
  address: any;
  city: string;
  state: string;
  pincode: string;
  status: string;
  is_available: boolean;
  service_radius: number;
  min_price_range: string;
  max_price_range: string;
  total_leads: number;
  completed_leads: number;
  average_rating: string;
  wallet_balance: string;
  kyc_verified: boolean;
  documents: any[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VISIT TYPES (UPDATED)
// ============================================================================
export type VisitStatus = 
  | 'scheduled' 
  | 'en_route' 
  | 'arrived' 
  | 'in_progress' 
  | 'kyc_verified' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export interface Visit {
  id: string;
  visit_number: string;
  
  // Nested Objects
  lead: {
    id: string;
    lead_number: string;
    device_name: string;
    device_model?: { name: string };
    user?: { first_name: string; full_name?: string }; 
  };
  partner: {
    id: string;
    business_name: string;
    phone: string;
  };
  customer: {
    id: string;
    full_name: string;
    phone: string;
  };

  // Status & Timing
  status: VisitStatus;
  scheduled_date: string;
  scheduled_time_slot: string;
  scheduled_at: string;
  estimated_arrival_time?: string;
  partner_started_at?: string;
  arrived_at?: string;
  inspection_started_at?: string;
  inspection_completed_at?: string;
  actual_end_time?: string;
  checked_in_at?: string; // Alias
  completed_at?: string; // Alias

  // Verification
  verification_code: string;
  verification_code_expires_at?: string;
  is_code_verified: boolean;
  verified_at?: string;
  verification_attempts: number;
  max_verification_attempts: number;

  // Location
  address: Address;
  location_verified: boolean;
  distance_from_address?: number;

  // Inspection
  inspection_notes?: string;
  inspection_photos: string[];
  verified_imei?: string;
  imei_matches?: boolean;
  device_powers_on?: boolean;
  partner_assessment?: Record<string, any>;
  partner_recommended_price?: string;

  // Duration
  travel_time_minutes?: number;
  inspection_duration_minutes?: number;
  total_visit_duration_minutes?: number;

  // Cancellation
  cancellation_reason?: string;
  cancelled_by?: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
  cancelled_at?: string;

  created_at: string;
  updated_at: string;
}

// ✅ NEW: Added Missing Interfaces
export interface VisitStatusLog {
  id: string;
  visit: string;
  old_status: VisitStatus;
  new_status: VisitStatus;
  changed_by?: {
    id: string;
    first_name?: string;
    email?: string;
  };
  reason?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface VerificationChecklist {
  id: string;
  visit: string;
  item_name: string;
  category: string;
  status: 'pass' | 'fail' | 'na';
  notes?: string;
  photo_url?: string;
  checked_at: string;
}

export interface VisitBreadcrumb {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy?: number;
}


export interface Address {
  id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: string;
  longitude?: string;
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================
export interface Customer extends User {
  total_leads: number;
  completed_leads: number;
  total_spent: string;
  wallet_balance: string;
  addresses: Address[];
  kyc_status: string;
  is_verified: boolean;
}

// ============================================================================
// FINANCE TYPES
// ============================================================================
export interface PayoutRequest {
  id: string;
  user: string;
  user_name?: string;
  amount: string;
  method: string;
  account_details: any;
  status: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  remarks?: string;
  reference_number?: string;
  cashfree_transfer_id?: string;
}

export interface Transaction {
  id: string;
  wallet: string;
  transaction_type: string;
  amount: string;
  balance_before: string;
  balance_after: string;
  reference_type?: string;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user: string;
  balance: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// OPERATIONS TYPES
// ============================================================================
export interface Dispute {
  id: string;
  lead: string;
  raised_by: string;
  dispute_type: string;
  description: string;
  status: string;
  resolution?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user: string;
  user_name?: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// COMMUNICATIONS TYPES
// ============================================================================
export interface Notification {
  id: string;
  recipient: string;
  notification_type: string;
  title: string;
  body: string;
  status: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image: string;
  link_url?: string;
  target_audience: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  sort_order: number;
}

// ============================================================================
// PRICING TYPES
// ============================================================================
export interface PricingRule {
  id: string;
  device_category?: string;
  device_model?: string;
  age_category: string;
  condition_grade: string;
  base_price_percentage: string;
  deduction_percentage: string;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================
export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  data_type: string;
  is_sensitive: boolean;
  is_active: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user: string;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: any;
  ip_address?: string;
  timestamp: string;
}

// ============================================================================
// COMMON TYPES
// ============================================================================
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface FilterOptions {
  search?: string;
  status?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  [key: string]: any;
}

export interface DashboardStats {
  total_leads: number;
  leads_today: number;
  active_leads: number;
  completed_leads: number;
  total_partners: number;
  active_partners: number;
  pending_approval: number;
  total_users: number;
  new_users_today: number;
  open_tickets: number;
  pending_disputes: number;
  revenue_today: string;
  revenue_month: string;
}