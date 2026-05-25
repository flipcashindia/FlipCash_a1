// routes/ProtectedRoute.tsx (Advanced Version)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { type ReactNode } from 'react';
import { Loader } from '../components/UI/Loader';
import { Alert } from '../components/UI/Alert';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  requireAdmin = false,
  requireSuperAdmin = false 
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if user object exists
  if (!user) {
    return <Loader text="Loading user data..." />;
  }

  // Check super admin requirement
  if (requireSuperAdmin && user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert type="error" title="Access Denied">
            You don't have permission to access this page. Super Admin privileges required.
          </Alert>
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !['super_admin', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert type="error" title="Access Denied">
            You don't have permission to access this page. Admin privileges required.
          </Alert>
        </div>
      </div>
    );
  }

  // Check specific role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert type="error" title="Access Denied">
              You don't have permission to access this page. Required role: {requiredRoles.join(', ')}
            </Alert>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}