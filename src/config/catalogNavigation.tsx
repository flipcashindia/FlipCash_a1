// config/catalogNavigation.tsx
import {
  LayoutDashboard,
  Package,
  Tablet,
  Smartphone,
  ListChecks,
  UploadCloud,
  Search,
  BarChart3,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
}

export const catalogNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    path: '/catalog/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics',
  },
  {
    name: 'Categories',
    path: '/catalog/categories',
    icon: Package,
    description: 'Manage device categories',
  },
  {
    name: 'Brands',
    path: '/catalog/brands',
    icon: Tablet,
    description: 'Manage device brands',
  },
  {
    name: 'Models',
    path: '/catalog/models',
    icon: Smartphone,
    description: 'Manage device models',
  },
  {
    name: 'Attributes',
    path: '/catalog/attributes',
    icon: ListChecks,
    description: 'Manage evaluation attributes',
  },
  {
    name: 'Tools',
    path: '#',
    icon: UploadCloud,
    description: 'Bulk operations and utilities',
    children: [
      {
        name: 'Bulk Import',
        path: '/tools/bulk-import',
        icon: UploadCloud,
        description: 'Import data from Excel/CSV',
      },
      {
        name: 'Search Analytics',
        path: '/catalog/search-analytics',
        icon: Search,
        description: 'View search trends',
      },
    ],
  },
];

export default catalogNavigation;