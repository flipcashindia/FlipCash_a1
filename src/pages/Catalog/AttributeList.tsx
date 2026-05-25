import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Power, PowerOff, ListChecks } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type DeviceAttribute, type FilterOptions, type DeviceCategory } from '../../types';
import toast from 'react-hot-toast';
import { getStatusColor } from '../../lib/utils';
import { extractErrorMessage } from '../../lib/catalog.utils';
import { DEFAULT_CATALOG_PAGE_SIZE, ATTRIBUTE_TYPE_LABELS } from '../../config/catalog.constants';

export default function AttributeList() {
  const [attributes, setAttributes] = useState<DeviceAttribute[]>([]);
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: DEFAULT_CATALOG_PAGE_SIZE 
  });
  const [total, setTotal] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; attributeId: string | null }>({
    isOpen: false,
    attributeId: null,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadAttributes();
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

  const loadAttributes = async () => {
    try {
      const data = await catalogService.getAttributes(filters);
      console.log(data);
      setAttributes(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.attributeId) return;

    try {
      await catalogService.deleteAttribute(deleteDialog.attributeId);
      toast.success('Attribute deleted successfully');
      loadAttributes();
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleteDialog({ isOpen: false, attributeId: null });
    }
  };

  const toggleStatus = async (attribute: DeviceAttribute) => {
    try {
      await catalogService.toggleAttributeStatus(attribute.id, !attribute.is_active);
      toast.success(`Attribute ${!attribute.is_active ? 'activated' : 'deactivated'}`);
      loadAttributes();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const openDeleteDialog = (attributeId: string) => {
    setDeleteDialog({ isOpen: true, attributeId });
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-dark">Device Attributes</h1>
            <p className="text-gray-600 mt-1">{total} total attributes</p>
          </div>
          <Link to="/catalog/attributes/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Attribute
            </Button>
          </Link>
        </div>

        <SearchFilter
          onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
          onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
          placeholder="Search attributes by name or question..."
          filterConfigs={[
            {
              key: 'device_category',
              label: 'Category',
              type: 'select',
              options: [
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ],
            },
            {
              key: 'attribute_type',
              label: 'Type',
              type: 'select',
              options: [
                { value: '', label: 'All Types' },
                { value: 'cosmetic', label: 'Cosmetic' },
                { value: 'functional', label: 'Functional' },
                { value: 'accessory', label: 'Accessory' },
                { value: 'specification', label: 'Specification' },
                { value: 'warranty', label: 'Warranty' },
                { value: 'legal', label: 'Legal/Age' },
              ],
            },
            {
              key: 'is_required',
              label: 'Required',
              type: 'select',
              options: [
                { value: '', label: 'All' },
                { value: 'true', label: 'Required' },
                { value: 'false', label: 'Optional' },
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
          ]}
        />

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attribute</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attributes.map((attribute) => (
                  <tr key={attribute.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{attribute.name}</div>
                        <div className="text-sm text-gray-500">{attribute.question_text}</div>
                        <div className="flex gap-2 mt-1">
                          {attribute.is_required && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Required
                            </span>
                          )}
                          {attribute.is_boolean && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Yes/No
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {attribute.category_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {ATTRIBUTE_TYPE_LABELS[attribute.attribute_type as keyof typeof ATTRIBUTE_TYPE_LABELS] || attribute.attribute_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {attribute.is_boolean ? (
                        <span className="text-gray-500 italic">Yes/No</span>
                      ) : (
                        <span>{attribute.options?.length || 0} options</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attribute.is_active ? 'active' : 'inactive')}`}>
                        {attribute.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/catalog/attributes/${attribute.id}/edit`}
                          className="text-secondary hover:text-secondary-dark"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleStatus(attribute)}
                          className="text-gray-600 hover:text-primary"
                          title={attribute.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {attribute.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openDeleteDialog(attribute.id)}
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

          {attributes.length === 0 && !loading && (
            <div className="text-center py-12">
              <ListChecks className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attributes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating evaluation attributes for device assessment.
              </p>
              <div className="mt-6">
                <Link to="/catalog/attributes/new">
                  <Button className="inline-flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attribute
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {attributes.length > 0 && (
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
        onClose={() => setDeleteDialog({ isOpen: false, attributeId: null })}
        onConfirm={handleDelete}
        title="Delete Attribute"
        message="Are you sure you want to delete this attribute? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}