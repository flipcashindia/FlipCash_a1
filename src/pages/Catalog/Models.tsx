import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Package, Power, PowerOff } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type DeviceModel, type FilterOptions, type DeviceCategory, type DeviceBrand } from '../../types';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';
import { getCatalogStatusColor, extractErrorMessage } from '../../lib/catalog.utils';
import { DEFAULT_CATALOG_PAGE_SIZE, CATALOG_PAGE_SIZES } from '../../config/catalog.constants';

export default function ModelList() {
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: DEFAULT_CATALOG_PAGE_SIZE 
  });
  const [total, setTotal] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; modelId: string | null }>({
    isOpen: false,
    modelId: null,
  });

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  useEffect(() => {
    loadModels();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getCategories({ page_size: 999, is_active: true });
      console.log(data);
      setCategories(data.results);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const loadBrands = async () => {
    try {
      const data = await catalogService.getBrands({ page_size: 999, is_active: true });
      console.log(data);
      setBrands(data.results);
    } catch (error) {
      toast.error('Failed to load brands');
    }
  };

  const loadModels = async () => {
    try {
      const data = await catalogService.getModels(filters);
      console.log(data);
      setModels(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.modelId) return;

    try {
      await catalogService.deleteModel(deleteDialog.modelId);
      toast.success('Model deleted successfully');
      loadModels();
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleteDialog({ isOpen: false, modelId: null });
    }
  };

  const toggleStatus = async (model: DeviceModel) => {
    try {
      await catalogService.toggleModelStatus(model.id, !model.is_active);
      toast.success(`Model ${!model.is_active ? 'activated' : 'deactivated'}`);
      loadModels();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const openDeleteDialog = (modelId: string) => {
    setDeleteDialog({ isOpen: true, modelId });
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-dark">Device Models</h1>
            <p className="text-gray-600 mt-1">{total} total models</p>
          </div>
          <Link to="/catalog/models/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Model
            </Button>
          </Link>
        </div>

        <SearchFilter
          onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
          onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
          placeholder="Search models by name, brand, or model number..."
          filterConfigs={[
            {
              key: 'category',
              label: 'Category',
              type: 'select',
              options: [
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ],
            },
            {
              key: 'brand',
              label: 'Brand',
              type: 'select',
              options: [
                { value: '', label: 'All Brands' },
                ...brands.map(brand => ({ value: brand.id, label: brand.name }))
              ],
            },
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variants</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {models.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {model.thumbnail ? (
                          <img
                            src={model.thumbnail}
                            alt={model.name}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-50 mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{model.name}</div>
                          <div className="text-sm text-gray-500">{model.model_number || 'N/A'}</div>
                          {model.is_featured && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getCatalogStatusColor('featured')}`}>
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {model.category_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {model.brand_logo && (
                          <img 
                            src={model.brand_logo} 
                            alt={model.brand_name} 
                            className="w-6 h-6 rounded mr-2 object-contain"
                          />
                        )}
                        <span className="text-sm text-gray-900">{model.brand_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(model.base_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/catalog/models/${model.id}/variants`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">
                          {model.variants?.length || 0} variants
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCatalogStatusColor(model.is_active ? 'active' : 'inactive')}`}>
                        {model.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/catalog/models/${model.id}`}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/catalog/models/${model.id}/edit`}
                          className="text-secondary hover:text-secondary-dark"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleStatus(model)}
                          className="text-gray-600 hover:text-primary"
                          title={model.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {model.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openDeleteDialog(model.id)}
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

          {models.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No models found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new device model.
              </p>
              <div className="mt-6">
                <Link to="/catalog/models/new">
                  <Button className="inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Model
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {models.length > 0 && (
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
        onClose={() => setDeleteDialog({ isOpen: false, modelId: null })}
        onConfirm={handleDelete}
        title="Delete Model"
        message="Are you sure you want to delete this model? This action cannot be undone and will affect all associated variants."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}