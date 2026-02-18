import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { Pagination } from '../../components/Shared/Pagination';
import { catalogService } from '../../services/catalog.service';
import { type DeviceCategory, type FilterOptions } from '../../types';
import toast from 'react-hot-toast';

export default function CategoryList() {
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ page: 1, page_size: 10 });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCategories();
  }, [filters]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getCategories(filters);
      console.log(data);
      
      setCategories(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await catalogService.deleteCategory(id);
      toast.success('Category deleted successfully');
      loadCategories(); // Reload list
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };
  
  const toggleStatus = async (category: DeviceCategory) => {
    try {
      // Use the specific service function
      await catalogService.toggleCategoryStatus(category.id, !category.is_active);
      toast.success(`Category ${!category.is_active ? 'activated' : 'deactivated'}`);
      loadCategories();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">Device Categories</h1>
        <Link to="/catalog/categories/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* You can add a SearchFilter component here if you have one */}
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Icon</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Models</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {category.icon_url ? (
                      <img src={category.icon_url} alt={category.name} className="w-10 h-10 object-cover rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-full" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.slug}</div>
                  </td>
                  <td className="px-6 py-4">{category.models_count || 0}</td>
                  <td className="px-6 py-4">
                    <Badge status={category.is_active ? 'active' : 'inactive'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link to={`/catalog/categories/${category.id}/edit`}>
                        <button className="p-2 text-gray-600 hover:text-secondary">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => toggleStatus(category)}
                        className="p-2 text-gray-600 hover:text-primary"
                      >
                        {category.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-gray-600 hover:text-danger"
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

        <Pagination
          currentPage={filters.page || 1}
          totalPages={Math.ceil(total / (filters.page_size || 10))}
          totalItems={total}
          itemsPerPage={filters.page_size || 10}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      </Card>
    </div>
  );
}