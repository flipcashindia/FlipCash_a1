// src/components/Layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  UserCheck, 
  MapPin, 
  Wallet, 
  MessageSquare, 
  DollarSign, 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  LogOut,
  Menu,
  X,
  Grid3x3,
  Tag,
  Smartphone,
  ListChecks,
  Upload,
  TrendingUp,
  Clock,
  FileText,
  CreditCard 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { getInitials } from '../../lib/utils';
import { ROUTES } from '../../config/constants';

interface SubMenuItem {
  path: string;
  label: string;
  icon?: React.ElementType; 
}

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
  show: boolean;
  subItems?: SubMenuItem[];
}

// 👈 FIXED: Interface added and exported
export interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { canManageFinance, canManageOperations, canManageUsers, isAdmin } = usePermissions();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const path = location.pathname;
    const initialState: Record<string, boolean> = {};
    
    if (path.startsWith(ROUTES.CATALOG)) initialState[ROUTES.CATALOG] = true;
    if (path.startsWith(ROUTES.FINANCE)) initialState[ROUTES.FINANCE] = true;
    if (path.startsWith('/operations')) initialState['/operations'] = true;
    if (path.startsWith('/communications')) initialState['/communications'] = true;
    if (path.startsWith(ROUTES.PRICING)) initialState[ROUTES.PRICING] = true;
    
    return initialState;
  });

  const toggleGroup = (path: string) => {
    setExpandedGroups(prev => ({ ...prev, [path]: !prev[path] }));
  };

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    { 
      path: ROUTES.DASHBOARD, 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      show: true 
    },
    { 
      path: ROUTES.CATALOG, 
      icon: Package, 
      label: 'Catalog',
      show: true,
      subItems: [
        { path: '/catalog', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/catalog/categories', label: 'Categories', icon: Grid3x3 },
        { path: '/catalog/brands', label: 'Brands', icon: Tag },
        { path: '/catalog/models', label: 'Models', icon: Smartphone },
        { path: '/catalog/attributes', label: 'Attributes', icon: ListChecks },
        { path: '/catalog/bulk-import', label: 'Bulk Import', icon: Upload },
        { path: '/catalog/search-analytics', label: 'Search Analytics', icon: TrendingUp },
      ]
    },
    { 
      path: ROUTES.LEADS, 
      icon: ShoppingBag, 
      label: 'Leads',
      show: true 
    },
    { 
      path: ROUTES.PARTNERS, 
      icon: UserCheck, 
      label: 'Partners',
      show: true 
    },
    { 
      path: ROUTES.VISITS, 
      icon: MapPin, 
      label: 'Visits',
      show: true 
    },
    { 
      path: ROUTES.USERS, 
      icon: Users, 
      label: 'Customers',
      show: canManageUsers() 
    },
    { 
      path: ROUTES.FINANCE, 
      icon: Wallet, 
      label: 'Finance',
      show: canManageFinance(),
      subItems: [
        { path: '/finance', label: 'Overview', icon: LayoutDashboard },
        { path: '/finance/payout-requests', label: 'Payout Requests', icon: Clock },
        { path: '/finance/payouts', label: 'Payouts History', icon: DollarSign },
        { path: '/finance/transactions', label: 'Transactions', icon: ListChecks },
        { path: '/finance/wallet', label: 'Wallet Management', icon: Wallet },
        { path: '/finance/reconciliation', label: 'Reconciliation', icon: FileText },
        { path: '/finance/partner-payments', label: 'Partner Payments', icon: CreditCard },
      ]
    },
    { 
      path: '/operations', 
      icon: AlertCircle, 
      label: 'Operations',
      show: canManageOperations(),
      subItems: [
        { path: ROUTES.DISPUTES, label: 'Disputes' },
        { path: ROUTES.TICKETS, label: 'Support Tickets' },
      ]
    },
    { 
      path: '/communications', 
      icon: MessageSquare, 
      label: 'Communications',
      show: isAdmin(),
      subItems: [
        { path: '/communications/notifications', label: 'Notifications' },
        { path: '/communications/faqs', label: 'FAQs' },
        { path: '/communications/banners', label: 'Banners' },
      ]
    },
    { 
      path: ROUTES.PRICING, 
      icon: DollarSign, 
      label: 'Pricing',
      show: isAdmin(),
      subItems: [
        { path: '/pricing/rules', label: 'Pricing Rules' },
        { path: '/pricing/simulator', label: 'Price Simulator' },
      ]
    },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-dark text-white rounded-lg md:hidden"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`
          fixed left-0 top-0 h-screen w-64 bg-[#1a1c23] text-white flex flex-col border-r border-gray-800 z-50 transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${!isOpen ? 'md:hidden' : ''} 
        `}
      >
        <div className="p-6 flex-shrink-0 border-b border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-dark font-bold text-xl">FC</span>
            </div>
            <span className="text-xl font-bold tracking-tight">FlipCash Admin</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-gray-700">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              if (!item.show) return null;

              const isGroupActive = isActive(item.path);
              const isExpanded = expandedGroups[item.path];
              
              return (
                <div key={item.path} className="mb-1">
                  {item.subItems ? (
                    <>
                      <button
                        onClick={() => toggleGroup(item.path)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                          isGroupActive 
                            ? 'bg-gray-800/50 text-white' 
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 transition-colors ${
                            isGroupActive ? 'text-primary' : 'text-gray-500 group-hover:text-white'
                          }`} />
                          <span className={`font-medium ${isGroupActive ? 'text-white' : ''}`}>
                            {item.label}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="ml-5 pl-3 border-l-2 border-gray-800 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = isActive(subItem.path, true);
                            const SubIcon = subItem.icon;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                                  isSubActive
                                    ? 'text-primary font-medium bg-primary/10'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                <span>{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isGroupActive 
                          ? 'bg-primary text-dark font-semibold shadow-md shadow-primary/10' 
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 transition-colors ${
                        isGroupActive ? 'text-dark' : 'text-gray-500 group-hover:text-white'
                      }`} />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#15171e]">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-9 h-9 rounded-full bg-gray-700 ring-2 ring-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {user?.full_name ? getInitials(user.full_name) : 'A'}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role?.replace('_', ' ') || 'Administrator'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={clearAuth} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}