// pages/catalog/BrandList.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Image as ImageIcon, Plus } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type DeviceBrand, type FilterOptions } from '../../types';
import toast from 'react-hot-toast';

export default function BrandList() {
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ page: 1, page_size: 20 });
  const [total, setTotal] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; brandId: string | null }>({
    isOpen: false,
    brandId: null,
  });

  useEffect(() => {
    loadBrands();
  }, [filters]);

  const loadBrands = async () => {
    try {
      const data = await catalogService.getBrands(filters);
      setBrands(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.brandId) return;

    try {
      await catalogService.deleteBrand(deleteDialog.brandId);
      toast.success('Brand deleted successfully');
      loadBrands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete brand');
    } finally {
      setDeleteDialog({ isOpen: false, brandId: null });
    }
  };

  const openDeleteDialog = (brandId: string) => {
    setDeleteDialog({ isOpen: true, brandId });
  };

  if (loading) return <Loader />;

  return (
    <>
      <SearchFilter
        onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
        onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
        placeholder="Search brands by name..."
        filterConfigs={[
          {
            key: 'is_active',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
          {
            key: 'is_featured',
            label: 'Featured',
            type: 'select',
            options: [
              { value: 'true', label: 'Featured' },
              { value: 'false', label: 'Not Featured' },
            ],
          },
        ]}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Models</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-10 h-10 rounded-lg object-contain bg-gray-50 mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                        {brand.is_featured && (
                          <Badge status="warning" className="mt-1">Featured</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brand.slug}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {brand.models_count || 0} models
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={brand.is_active ? 'active' : 'inactive'}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brand.sort_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/catalog/brands/${brand.id}/edit`}
                        className="text-secondary hover:text-secondary-dark"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openDeleteDialog(brand.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {brands.length === 0 && !loading && (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No brands found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new brand.
            </p>
            <div className="mt-6">
              <Link to="/catalog/brands/new">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-dark bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </button>
              </Link>
            </div>
          </div>
        )}

        {brands.length > 0 && (
          <Pagination
            currentPage={filters.page || 1}
            totalPages={Math.ceil(total / (filters.page_size || 20))}
            totalItems={total}
            itemsPerPage={filters.page_size || 20}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        )}
      </Card>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, brandId: null })}
        onConfirm={handleDelete}
        title="Delete Brand"
        message="Are you sure you want to delete this brand? This action cannot be undone and will affect all associated models."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}