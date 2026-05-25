// components/UI/Badge.tsx
import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  status?: string;
  className?: string;
}

export function Badge({ children, status = 'default', className = '' }: BadgeProps) {
  const getStatusColor = () => {
    const statusMap: Record<string, string> = {
      // Lead statuses
      NEW: 'bg-blue-100 text-blue-800',
      CLAIMED: 'bg-yellow-100 text-yellow-800',
      PARTNER_ASSIGNED: 'bg-purple-100 text-purple-800',
      EN_ROUTE: 'bg-indigo-100 text-indigo-800',
      CHECKED_IN: 'bg-cyan-100 text-cyan-800',
      INSPECTING: 'bg-orange-100 text-orange-800',
      INSPECTED: 'bg-teal-100 text-teal-800',
      OFFER_MADE: 'bg-lime-100 text-lime-800',
      NEGOTIATING: 'bg-amber-100 text-amber-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      
      // Partner statuses
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
      
      // Visit statuses
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      
      // Generic statuses
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      
      // Payout statuses
      processing: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800',
      
      // KYC statuses
      verified: 'bg-green-100 text-green-800',
      unverified: 'bg-gray-100 text-gray-800',
      
      default: 'bg-gray-100 text-gray-800',
    };

    return statusMap[status] || statusMap.default;
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()} ${className}`}
    >
      {children}
    </span>
  );
}