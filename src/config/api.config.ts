export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  PASSWORD_LOGIN: '/password-login',
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  LEAD_DETAIL: '/leads/:id',
  PARTNERS: '/partners',
  PARTNER_DETAIL: '/partners/:id',
  PENDING_APPROVALS: '/partners/pending',
  VISITS: '/visits',
  FINANCE: '/finance',
  WALLET: '/finance/wallet',
  PAYOUTS: '/finance/payouts',
  TRANSACTIONS: '/finance/transactions',
  CATALOG: '/catalog',
  CATEGORIES: '/catalog/categories',
  BRANDS: '/catalog/brands',
  MODELS: '/catalog/models',
  PRICING: '/pricing',
  USERS: '/users',
  DISPUTES: '/disputes',
  TICKETS: '/tickets',
  NOTIFICATIONS: '/notifications',
  FAQ: '/faq',
  BANNERS: '/banners',
};

export const LEAD_STATUSES = {
  DRAFT: 'draft',
  BOOKED: 'booked',
  PARTNER_ASSIGNED: 'partner_assigned',
  VISIT_SCHEDULED: 'visit_scheduled',
  IN_PROGRESS: 'in_progress',
  VERIFIED: 'verified',
  OFFER_MADE: 'offer_made',
  OFFER_ACCEPTED: 'offer_accepted',
  PAYMENT_PENDING: 'payment_pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PARTNER_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const PAYOUT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const DISPUTE_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const TIME_SLOTS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
};

export const PAGE_SIZES = [10, 20, 50, 100];

export const DEFAULT_PAGE_SIZE = 20;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  SUPPORT: 'support',
};

export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
};

export const LEAD_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};