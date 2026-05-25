import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Package, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type DeviceModel } from '../../types';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { 
  getCatalogStatusColor, 
  extractErrorMessage, 
  formatVariantName,
  getVariantStatus 
} from '../../lib/catalog.utils';

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<DeviceModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadModel();
    }
  }, [id]);

  const loadModel = async () => {
    try {
      const data = await catalogService.getModel(id!);
      setModel(data);
      if (data.images?.length > 0) {
        setSelectedImage(data.images[0].image_url);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
      navigate('/catalog/models');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await catalogService.deleteModel(id!);
      toast.success('Model deleted successfully');
      navigate('/catalog/models');
    } catch (error: any) {
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
            <Link to="/catalog/models">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-dark">{model.name}</h1>
              <p className="text-gray-600 mt-1">{model.brand?.name}</p>
            </div>
            {model.is_featured && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCatalogStatusColor('featured')}`}>
                Featured
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Link to={`/catalog/models/${id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Product Images</h2>
                {model.images && model.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={selectedImage || model.images[0].image_url} 
                        alt={model.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {model.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(img.image_url)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === img.image_url 
                              ? 'border-primary ring-2 ring-primary ring-offset-2' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img 
                            src={img.image_url} 
                            alt={img.alt_text || `Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {img.is_primary && (
                            <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                              Primary
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No images available</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Description */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                {model.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{model.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available</p>
                )}
              </div>
            </Card>

            {/* Specifications */}
            {model.specifications && Object.keys(model.specifications).length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(model.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Variants */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Variants</h2>
                  <Link to={`/catalog/models/${id}/variants`}>
                    <Button variant="outline" size="sm">
                      Manage Variants
                    </Button>
                  </Link>
                </div>
                {model.variants && model.variants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Configuration</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {model.variants.map((variant) => {
                          const variantStatus = getVariantStatus(variant.is_available, variant.stock_quantity);
                          return (
                            <tr key={variant.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {formatVariantName('', variant.storage, variant.ram, variant.color)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                                {variant.sku || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {formatCurrency(variant.effective_price)}
                                {variant.variant_price && (
                                  <span className="ml-2 text-xs text-gray-500">(Custom)</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {variant.stock_quantity} units
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStatus.color}`}>
                                  {variantStatus.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-4">No variants configured</p>
                    <Link to={`/catalog/models/${id}/variants`}>
                      <Button variant="outline">
                        Add Variants
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar - Right */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 font-medium">{model.category?.name || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Brand</label>
                  <div className="flex items-center gap-2 mt-1">
                    {model.brand?.logo && (
                      <img 
                        src={model.brand.logo} 
                        alt={model.brand.name} 
                        className="w-6 h-6 rounded object-contain" 
                      />
                    )}
                    <p className="text-gray-900 font-medium">{model.brand?.name || 'N/A'}</p>
                  </div>
                  {model.brand?.website && (
                    <a 
                      href={model.brand.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-1"
                    >
                      Visit website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Model Number</label>
                  <p className="text-gray-900 font-mono">{model.model_number || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Launch Year</label>
                  <p className="text-gray-900">{model.launch_year || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Slug</label>
                  <p className="text-gray-900 text-sm font-mono break-all">{model.slug}</p>
                </div>
              </div>
            </Card>

            {/* Pricing */}
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Pricing</h2>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Base Price</label>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {formatCurrency(model.base_price)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Starting price for this model
                  </p>
                </div>
              </div>
            </Card>

            {/* Configuration Options */}
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Configuration Options</h2>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Storage Options</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {model.storage_options && model.storage_options.length > 0 ? (
                      model.storage_options.map((option, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {option}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">None configured</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">RAM Options</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {model.ram_options && model.ram_options.length > 0 ? (
                      model.ram_options.map((option, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                          {option}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">None configured</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Color Options</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {model.color_options && model.color_options.length > 0 ? (
                      model.color_options.map((option, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {option}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">None configured</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Status */}
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Status</h2>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Active</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCatalogStatusColor(model.is_active ? 'active' : 'inactive')}`}>
                    {model.is_active ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Featured</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${model.is_featured ? getCatalogStatusColor('featured') : 'bg-gray-100 text-gray-700'}`}>
                    {model.is_featured ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </Card>

            {/* SEO */}
            {model.meta_description && (
              <Card>
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold border-b pb-2">SEO</h2>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Meta Description</label>
                    <p className="text-gray-700 text-sm mt-1">{model.meta_description}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Metadata</h2>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900 text-sm mt-1">
                    {formatDateTime(model.created_at)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900 text-sm mt-1">
                    {formatDateTime(model.updated_at)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Model ID</label>
                  <p className="text-gray-600 text-xs font-mono mt-1 break-all">{model.id}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Model"
        message="Are you sure you want to delete this model? This action cannot be undone and will affect all associated variants and data."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}