// hooks/usePermissions.ts
import { useAuthStore } from '../store/authStore';

export function usePermissions() {
  const { user } = useAuthStore();

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = (): boolean => {
    return hasRole(['super_admin', 'admin']);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole(['super_admin']);
  };

  const canManageUsers = (): boolean => {
    return hasRole(['super_admin', 'admin']);
  };

  const canManageFinance = (): boolean => {
    return hasRole(['super_admin', 'admin', 'finance']);
  };

  const canManageOperations = (): boolean => {
    return hasRole(['super_admin', 'admin', 'support']);
  };

  return {
    hasRole,
    isAdmin,
    isSuperAdmin,
    canManageUsers,
    canManageFinance,
    canManageOperations,
  };
}