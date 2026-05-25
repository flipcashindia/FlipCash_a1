import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Form';
// import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type DeviceModel, type DeviceVariant } from '../../types';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';
import { 
  generateSKU, 
  extractErrorMessage,
  getVariantStatus,
  formatVariantName 
} from '../../lib/catalog.utils';
import { VALIDATION } from '../../config/catalog.constants';

interface VariantFormData {
  id?: string;
  storage: string;
  ram: string;
  color: string;
  variant_price: string;
  sku: string;
  stock_quantity: number;
  is_available: boolean;
}

export default function VariantManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<DeviceModel | null>(null);
  const [variants, setVariants] = useState<DeviceVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<VariantFormData | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; variantId: string | null }>({
    isOpen: false,
    variantId: null,
  });

  useEffect(() => {
    if (id) {
      loadModelAndVariants();
    }
  }, [id]);

  const loadModelAndVariants = async () => {
    try {
      const modelData = await catalogService.getModel(id!);
      setModel(modelData);
      setVariants(modelData.variants || []);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      navigate('/catalog/models');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    if (!model) return;
    
    const storage = model.storage_options?.[0] || '';
    const ram = model.ram_options?.[0] || '';
    const color = model.color_options?.[0] || '';
    
    // Auto-generate SKU
    const autoSKU = generateSKU(
      model.brand_name || 'BRAND', // Fallback to brand_name 
      model.name,
      storage,
      color
    );

    setEditingVariant({
      storage,
      ram,
      color,
      variant_price: '',
      sku: autoSKU,
      stock_quantity: 0,
      is_available: true,
    });
  };

  const handleEdit = (variant: DeviceVariant) => {
    setEditingVariant({
      id: variant.id,
      storage: variant.storage || '',
      ram: variant.ram || '',
      color: variant.color || '',
      variant_price: variant.variant_price?.toString() || '',
      sku: variant.sku || '',
      stock_quantity: variant.stock_quantity || 0,
      is_available: variant.is_available ?? false, // 👈 FIX applied
    });
  };

  const handleChange = (field: string, value: any) => {
    if (!editingVariant) return;
    
    setEditingVariant({ ...editingVariant, [field]: value });
    
    // Auto-regenerate SKU when storage, ram, or color changes
    if ((field === 'storage' || field === 'color') && model) {
      const newSKU = generateSKU(
        model.brand_name || 'BRAND', // Fallback to brand_name
        model.name,
        field === 'storage' ? value : editingVariant.storage,
        field === 'color' ? value : editingVariant.color
      );
      setEditingVariant(prev => prev ? { ...prev, sku: newSKU } : null);
    }
  };

  const validateVariant = (): boolean => {
    if (!editingVariant) return false;
    
    if (!editingVariant.storage && !editingVariant.ram && !editingVariant.color) {
      toast.error('Please select at least one option (storage, RAM, or color)');
      return false;
    }
    
    if (editingVariant.variant_price) {
      const price = parseFloat(editingVariant.variant_price);
      if (price < VALIDATION.MIN_PRICE || price > VALIDATION.MAX_PRICE) {
        toast.error(`Price must be between ${formatCurrency(VALIDATION.MIN_PRICE)} and ${formatCurrency(VALIDATION.MAX_PRICE)}`);
        return false;
      }
    }
    
    if (editingVariant.stock_quantity < VALIDATION.MIN_STOCK || editingVariant.stock_quantity > VALIDATION.MAX_STOCK) {
      toast.error(`Stock must be between ${VALIDATION.MIN_STOCK} and ${VALIDATION.MAX_STOCK}`);
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!editingVariant || !model) return;
    
    if (!validateVariant()) return;

    const payload = {
      device_model: id,
      storage: editingVariant.storage || null,
      ram: editingVariant.ram || null,
      color: editingVariant.color || null,
      variant_price: editingVariant.variant_price ? parseFloat(editingVariant.variant_price) : null,
      sku: editingVariant.sku || null,
      stock_quantity: editingVariant.stock_quantity,
      is_available: editingVariant.is_available,
    };

    try {
      if (editingVariant.id) {
        await catalogService.updateVariant(editingVariant.id, payload);
        toast.success('Variant updated successfully');
      } else {
        await catalogService.createVariant(payload);
        toast.success('Variant created successfully');
      }
      setEditingVariant(null);
      loadModelAndVariants();
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.variantId) return;

    try {
      await catalogService.deleteVariant(deleteDialog.variantId);
      toast.success('Variant deleted successfully');
      loadModelAndVariants();
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleteDialog({ isOpen: false, variantId: null });
    }
  };

  const toggleAvailability = async (variant: DeviceVariant) => {
    try {
      const currentStatus = variant.is_available ?? false; // 👈 FIX applied
      await catalogService.toggleVariantAvailability(variant.id, !currentStatus);
      toast.success(`Variant ${!currentStatus ? 'enabled' : 'disabled'}`);
      loadModelAndVariants();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  if (loading) return <Loader />;
  if (!model) return <div>Model not found</div>;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to={`/catalog/models/${id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Model
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-dark">Manage Variants</h1>
              <p className="text-gray-600 mt-1">{model.name}</p>
            </div>
          </div>
          <Button onClick={handleAddNew} disabled={!!editingVariant}>
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </div>

        {/* Info Banner */}
        {(!model.storage_options?.length && !model.ram_options?.length && !model.color_options?.length) && (
          <Card className="bg-amber-50 border-amber-200">
            <div className="p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">No Configuration Options</h3>
                <p className="text-sm text-amber-800 mt-1">
                  This model doesn't have any storage, RAM, or color options configured. 
                  Please edit the model to add options before creating variants.
                </p>
                <Link to={`/catalog/models/${id}/edit`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    Edit Model Options
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Variant Form */}
        {editingVariant && (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingVariant.id ? 'Edit Variant' : 'New Variant'}
                </h2>
                <Button variant="outline" size="sm" onClick={() => setEditingVariant(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage</label>
                  <select
                    value={editingVariant.storage}
                    onChange={(e) => handleChange('storage', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    disabled={!model.storage_options?.length}
                  >
                    <option value="">Select storage</option>
                    {model.storage_options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RAM</label>
                  <select
                    value={editingVariant.ram}
                    onChange={(e) => handleChange('ram', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    disabled={!model.ram_options?.length}
                  >
                    <option value="">Select RAM</option>
                    {model.ram_options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <select
                    value={editingVariant.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    disabled={!model.color_options?.length}
                  >
                    <option value="">Select color</option>
                    {model.color_options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Variant Price (₹)"
                  type="number"
                  step="0.01"
                  value={editingVariant.variant_price}
                  onChange={(e) => handleChange('variant_price', e.target.value)}
                  placeholder="Leave empty to use base price"
                  helpText={`Base price: ${formatCurrency(Number(model.base_price) || 0)}`}
                />

                <Input
                  label="SKU"
                  value={editingVariant.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="Auto-generated"
                  helpText="Product SKU for inventory"
                />

                <Input
                  label="Stock Quantity"
                  type="number"
                  value={editingVariant.stock_quantity.toString()}
                  onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
                  min={VALIDATION.MIN_STOCK}
                  max={VALIDATION.MAX_STOCK}
                />

                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingVariant.is_available}
                      onChange={(e) => handleChange('is_available', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Available for Purchase</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingVariant(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Variant
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Variants List */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Existing Variants 
              <span className="text-gray-500 text-base font-normal ml-2">
                ({variants.length} total)
              </span>
            </h2>
            
            {variants.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No variants configured yet</p>
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Variant
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Configuration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {variants.map((variant) => {
                      // 👈 FIX applied: Fallbacks provided
                      const variantStatus = getVariantStatus(variant.is_available ?? false, variant.stock_quantity ?? 0);
                      return (
                        <tr key={variant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatVariantName('', variant.storage, variant.ram, variant.color) || 'Default'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                            {variant.sku || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {/* 👈 FIX applied: Fallbacks provided */}
                                {formatCurrency(variant.effective_price ?? 0)}
                              </div>
                              {variant.variant_price && (
                                <div className="text-xs text-gray-500">
                                  Custom pricing
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {/* 👈 FIX applied: Fallbacks provided */}
                            <span className={`text-sm ${
                              (variant.stock_quantity ?? 0) > 0 ? 'text-gray-900' : 'text-red-600 font-medium'
                            }`}>
                              {variant.stock_quantity ?? 0} units
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStatus.color}`}>
                              {variantStatus.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleEdit(variant)}
                                className="text-secondary hover:text-secondary-dark"
                                title="Edit"
                                disabled={!!editingVariant}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleAvailability(variant)}
                                // 👈 FIX applied: Fallbacks provided
                                className={`${(variant.is_available ?? false) ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}
                                title={(variant.is_available ?? false) ? 'Mark Unavailable' : 'Mark Available'}
                                disabled={!!editingVariant}
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteDialog({ isOpen: true, variantId: variant.id })}
                                className="text-red-600 hover:text-red-700"
                                title="Delete"
                                disabled={!!editingVariant}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Helper Info */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Managing Variants</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Create variants for all available combinations of storage, RAM, and color</li>
              <li>Leave variant price empty to use the model's base price ({formatCurrency(Number(model.base_price) || 0)})</li>
              <li>Set custom pricing for premium configurations (e.g., higher storage)</li>
              <li>SKU is auto-generated but can be customized for inventory tracking</li>
              <li>Mark variants as unavailable when out of stock instead of deleting them</li>
              <li>Stock quantity helps track inventory and shows availability status</li>
            </ul>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, variantId: null })}
        onConfirm={handleDelete}
        title="Delete Variant"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}