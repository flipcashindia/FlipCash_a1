// components/Layout/Header.tsx
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Header({ sidebarOpen, toggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      clearAuth();
      navigate('/auth/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-10 transition-all duration-300 ${sidebarOpen ? 'md:left-64 left-0' : 'left-0'}`}>
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          {/* Search or breadcrumbs can go here */}
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-dark" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}