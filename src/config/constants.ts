export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  PASSWORD_LOGIN: '/password-login',
  DASHBOARD: '/dashboard',
  LEADS: '/leads',
  PARTNERS: '/partners',
  VISITS: '/visits',
  FINANCE: '/finance',
  CATALOG: '/catalog',
  PRICING: '/pricing',
  USERS: '/users',
  DISPUTES: '/disputes',
  TICKETS: '/tickets',
};

export const LEAD_STATUSES = ['draft', 'booked', 'partner_assigned', 'visit_scheduled', 'in_progress', 'verified', 'offer_made', 'completed', 'cancelled'];
export const PARTNER_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];
export const PAGE_SIZES = [10, 20, 50, 100];