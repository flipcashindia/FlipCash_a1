import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Power, PowerOff, Package } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type DeviceCategory, type FilterOptions } from '../../types';
import toast from 'react-hot-toast';
import { getStatusColor } from '../../lib/utils';
import { extractErrorMessage, getCatalogStatusColor } from '../../lib/catalog.utils';
import { DEFAULT_CATALOG_PAGE_SIZE } from '../../config/catalog.constants';

export default function CategoryList() {
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: DEFAULT_CATALOG_PAGE_SIZE 
  });
  const [total, setTotal] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; categoryId: string | null }>({
    isOpen: false,
    categoryId: null,
  });

  useEffect(() => {
    loadCategories();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getCategories(filters);
      console.log(data);
      
      setCategories(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.categoryId) return;

    try {
      await catalogService.deleteCategory(deleteDialog.categoryId);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleteDialog({ isOpen: false, categoryId: null });
    }
  };

  const toggleStatus = async (category: DeviceCategory) => {
    try {
      await catalogService.toggleCategoryStatus(category.id, !category.is_active);
      toast.success(`Category ${!category.is_active ? 'activated' : 'deactivated'}`);
      loadCategories();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const openDeleteDialog = (categoryId: string) => {
    setDeleteDialog({ isOpen: true, categoryId });
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-dark">Device Categories</h1>
            <p className="text-gray-600 mt-1">{total} total categories</p>
          </div>
          <Link to="/catalog/categories/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Category
            </Button>
          </Link>
        </div>

        <SearchFilter
          onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
          onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
          placeholder="Search categories by name..."
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
            {
              key: 'is_featured',
              label: 'Featured',
              type: 'select',
              options: [
                { value: '', label: 'All' },
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Models</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {category.icon_url ? (
                          <img
                            src={category.icon_url}
                            alt={category.name}
                            className="w-12 h-12 rounded-lg object-contain bg-gray-50 mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          <div className="text-xs text-gray-500">{category.slug}</div>
                          {category.is_featured && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getCatalogStatusColor('featured')}`}>
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate">
                        {category.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category.models_count || 0} models
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(category.is_active ? 'active' : 'inactive')}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/catalog/categories/${category.id}/edit`}
                          className="text-secondary hover:text-secondary-dark"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleStatus(category)}
                          className="text-gray-600 hover:text-primary"
                          title={category.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {category.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openDeleteDialog(category.id)}
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

          {categories.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new category.
              </p>
              <div className="mt-6">
                <Link to="/catalog/categories/new">
                  <Button className="inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {categories.length > 0 && (
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
        onClose={() => setDeleteDialog({ isOpen: false, categoryId: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone and will affect all associated models and brands."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}