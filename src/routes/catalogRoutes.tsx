// routes/catalogRoutes.tsx
import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Lazy load components for better performance
const CatalogBoard = lazy(() => import('../pages/Catalog/CatalogBoard'));

// Categories
const CategoryList = lazy(() => import('../pages/Catalog/CategoryList'));
const CategoryForm = lazy(() => import('../pages/Catalog/CategoryForm'));

// Brands
const BrandList = lazy(() => import('../pages/Catalog/BrandList'));
const BrandForm = lazy(() => import('../pages/Catalog/BrandForm'));

// Models
const ModelList = lazy(() => import('../pages/Catalog/Models'));
const ModelForm = lazy(() => import('../pages/Catalog/ModelForm'));
const ModelDetail = lazy(() => import('../pages/Catalog/ModelDetails'));

// Variants
const VariantManager = lazy(() => import('../pages/Catalog/VariantManager'));

// Attributes
const AttributeList = lazy(() => import('../pages/Catalog/AttributeList'));
const AttributeForm = lazy(() => import('../pages/Catalog/AttributeForm'));

// Tools
const BulkImport = lazy(() => import('../pages/Catalog/BulkImport'));
const SearchAnalytics = lazy(() => import('../pages/Catalog/SearchAnalytics'));

export const catalogRoutes = [
  {
    path: '/catalog',
    element: <Navigate to="/catalog/dashboard" replace />,
  },
  {
    path: '/catalog/dashboard',
    element: <CatalogBoard />,
  },
  
  // Categories
  {
    path: '/catalog/categories',
    element: <CategoryList />,
  },
  {
    path: '/catalog/categories/new',
    element: <CategoryForm />,
  },
  {
    path: '/catalog/categories/:id/edit',
    element: <CategoryForm />,
  },
  
  // Brands
  {
    path: '/catalog/brands',
    element: <BrandList />,
  },
  {
    path: '/catalog/brands/new',
    element: <BrandForm />,
  },
  {
    path: '/catalog/brands/:id/edit',
    element: <BrandForm />,
  },
  
  // Models
  {
    path: '/catalog/models',
    element: <ModelList />,
  },
  {
    path: '/catalog/models/new',
    element: <ModelForm />,
  },
  {
    path: '/catalog/models/:id',
    element: <ModelDetail />,
  },
  {
    path: '/catalog/models/:id/edit',
    element: <ModelForm />,
  },
  {
    path: '/catalog/models/:id/variants',
    element: <VariantManager />,
  },
  
  // Attributes
  {
    path: '/catalog/attributes',
    element: <AttributeList />,
  },
  {
    path: '/catalog/attributes/new',
    element: <AttributeForm />,
  },
  {
    path: '/catalog/attributes/:id/edit',
    element: <AttributeForm />,
  },
  
  // Tools
  {
    path: '/tools/bulk-import',
    element: <BulkImport />,
  },
  {
    path: '/catalog/search-analytics',
    element: <SearchAnalytics />,
  },
];

export default catalogRoutes;