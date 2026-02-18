import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Power, PowerOff, ExternalLink } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type DeviceBrand, type FilterOptions } from '../../types';
import toast from 'react-hot-toast';
import { getStatusColor } from '../../lib/utils';
import { extractErrorMessage } from '../../lib/catalog.utils';
import { DEFAULT_CATALOG_PAGE_SIZE } from '../../config/catalog.constants';

export default function BrandList() {
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: DEFAULT_CATALOG_PAGE_SIZE 
  });
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
      console.log(data);
      setBrands(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error(extractErrorMessage(error));
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
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleteDialog({ isOpen: false, brandId: null });
    }
  };

  const toggleStatus = async (brand: DeviceBrand) => {
    try {
      await catalogService.toggleBrandStatus(brand.id, !brand.is_active);
      toast.success(`Brand ${!brand.is_active ? 'activated' : 'deactivated'}`);
      loadBrands();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const openDeleteDialog = (brandId: string) => {
    setDeleteDialog({ isOpen: true, brandId });
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-dark">Device Brands</h1>
            <p className="text-gray-600 mt-1">{total} total brands</p>
          </div>
          <Link to="/catalog/brands/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Brand
            </Button>
          </Link>
        </div>

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
                { value: '', label: 'All Status' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Models</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-12 h-12 rounded-lg object-contain bg-gray-50 mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-gray-400 font-bold">
                            {brand.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                          {brand.website && (
                            <a 
                              href={brand.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              Website
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {brand.country_of_origin || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {brand.models_count || 0} models
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(brand.is_active ? 'active' : 'inactive')}`}>
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/catalog/brands/${brand.id}/edit`}
                          className="text-secondary hover:text-secondary-dark"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleStatus(brand)}
                          className="text-gray-600 hover:text-primary"
                          title={brand.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {brand.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openDeleteDialog(brand.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
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
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No brands found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new brand.
              </p>
              <div className="mt-6">
                <Link to="/catalog/brands/new">
                  <Button className="inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Brand
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {brands.length > 0 && (
            <Pagination
              currentPage={filters.page || 1}
              totalPages={Math.ceil(total / (filters.page_size || DEFAULT_CATALOG_PAGE_SIZE))}
              totalItems={total}
              itemsPerPage={filters.page_size || DEFAULT_CATALOG_PAGE_SIZE}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          )}
        </Card>
      </div>

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