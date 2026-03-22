import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, Plus, X } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input, Select, Textarea } from '../../components/UI/Form';
import { Loader } from '../../components/UI/Loader';
import { catalogService } from '../../services/catalog.service';
import { type DeviceModel, type DeviceCategory, type DeviceBrand } from '../../types';
import toast from 'react-hot-toast';
import { 
  generateSlug, 
  isValidImageFile, 
  isValidFileSize, 
  formatFileSize,
  extractErrorMessage 
} from '../../lib/catalog.utils';
import { formatCurrency } from '../../lib/utils';
import { IMAGE_UPLOAD, VALIDATION, DEFAULTS } from '../../config/catalog.constants';

// Helper component for managing JSON arrays
const OptionListEditor = ({ 
  label, 
  items, 
  setItems, 
  placeholder = "Add an option" 
}: { 
  label: string;
  items: string[];
  setItems: (items: string[]) => void;
  placeholder?: string;
}) => {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmed = value.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      setValue('');
    }
  };

  const handleRemove = (itemToRemove: string) => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          placeholder={placeholder}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span key={idx} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
            {item}
            <button type="button" onClick={() => handleRemove(item)} className="text-gray-500 hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

// Helper component for specifications editor
const SpecificationsEditor = ({ 
  specs, 
  setSpecs 
}: { 
  specs: Record<string, string>;
  setSpecs: (specs: Record<string, string>) => void;
}) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    if (trimmedKey && trimmedValue) {
      setSpecs({ ...specs, [trimmedKey]: trimmedValue });
      setKey('');
      setValue('');
    }
  };

  const handleRemove = (keyToRemove: string) => {
    const newSpecs = { ...specs };
    delete newSpecs[keyToRemove];
    setSpecs(newSpecs);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Input 
          value={key} 
          onChange={(e) => setKey(e.target.value)} 
          placeholder="Key (e.g., 'processor')"
        />
        <div className="flex gap-2">
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            placeholder="Value (e.g., 'A15 Bionic')"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        {Object.entries(specs).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
            <span><strong className="capitalize">{k.replace(/_/g, ' ')}:</strong> {v}</span>
            <button type="button" onClick={() => handleRemove(k)} className="text-gray-500 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Image upload component
const ImageUploader = ({ 
  images, 
  setImages 
}: { 
  images: File[];
  setImages: (images: File[]) => void;
}) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      
      filesArray.forEach(file => {
        if (!isValidImageFile(file)) {
          toast.error(`${file.name}: Invalid file type. Please use JPG, PNG, or WebP`);
          return;
        }
        if (!isValidFileSize(file, IMAGE_UPLOAD.MAX_SIZE_MB)) {
          toast.error(`${file.name}: File too large. Maximum ${IMAGE_UPLOAD.MAX_SIZE_MB}MB`);
          return;
        }
        if (images.length + validFiles.length >= IMAGE_UPLOAD.MAX_IMAGES_PER_MODEL) {
          toast.error(`Maximum ${IMAGE_UPLOAD.MAX_IMAGES_PER_MODEL} images allowed`);
          return;
        }
        validFiles.push(file);
      });
      
      if (validFiles.length > 0) {
        setImages([...images, ...validFiles]);
      }
    }
  };

  const handleRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
        <input 
          type="file" 
          id="image-upload" 
          className="hidden" 
          onChange={handleFileChange} 
          accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(',')}
          multiple
        />
        <label 
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">Click to upload images</span>
          <span className="text-xs text-gray-500 mt-1">
            PNG, JPG, WebP up to {IMAGE_UPLOAD.MAX_SIZE_MB}MB each
          </span>
          <span className="text-xs text-gray-500">
            Maximum {IMAGE_UPLOAD.MAX_IMAGES_PER_MODEL} images
          </span>
        </label>
      </div>
      {images.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">{images.length} image(s) selected</div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((file, index) => (
              <div key={index} className="relative group">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-24 object-cover rounded"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b truncate">
                  {formatFileSize(file.size)}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ModelForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [model, setModel] = useState<Partial<DeviceModel>>({
    name: '',
    slug: '',
    model_number: '',
    category: '',
    brand: '',
    launch_year: new Date().getFullYear(),
    base_price: String(DEFAULTS.BASE_PRICE), // 👈 FIXED: Cast default to string
    storage_options: [],
    ram_options: [],
    color_options: [],
    specifications: {},
    description: '',
    meta_description: '',
    is_active: DEFAULTS.IS_ACTIVE,
    is_featured: DEFAULTS.IS_FEATURED,
  });
  
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [allBrands, setAllBrands] = useState<DeviceBrand[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    loadAllBrands();
  }, []);

  useEffect(() => {
    if (id) {
      loadModel();
    }
  }, [id]);

  useEffect(() => {
    if (model.category) {
      filterBrandsByCategory(model.category);
    }
  }, [model.category, allBrands]);

  // Auto-generate slug from name
  useEffect(() => {
    if (model.name && !id) {
      const slug = generateSlug(model.name);
      setModel(prev => ({ ...prev, slug }));
    }
  }, [model.name, id]);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getCategories({ page_size: 999, is_active: true });
      setCategories(data.results);
      console.log("categories data : ", data.results)
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const loadAllBrands = async () => {
    try {
      const data = await catalogService.getBrands({ page_size: 999, is_active: true });
      setAllBrands(data.results);
    } catch (error) {
      toast.error('Failed to load brands');
    }
  };

  // 👈 FIXED: Prefix unused parameter with underscore
  const filterBrandsByCategory = (_categoryId: string) => { 
    setBrands(allBrands);
  };

  const loadModel = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getModel(id!);
      setModel({
        ...data,
        category: data.category?.id || '',
        brand: data.brand?.id || '',
      });
      setExistingImages(data.images || []);
    } catch (error) {
      toast.error(extractErrorMessage(error));
      navigate('/catalog/models');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setModel(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setModel(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setModel(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!model.name || model.name.length < VALIDATION.MIN_NAME_LENGTH) {
      toast.error(`Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`);
      return false;
    }
    
    if (!model.category) {
      toast.error('Please select a category');
      return false;
    }
    
    if (!model.brand) {
      toast.error('Please select a brand');
      return false;
    }
    
    // 👈 FIXED: Parse strings to numbers for validation comparison
    const priceNum = Number(model.base_price);
    if (priceNum < VALIDATION.MIN_PRICE || priceNum > VALIDATION.MAX_PRICE) {
      toast.error(`Price must be between ${formatCurrency(VALIDATION.MIN_PRICE)} and ${formatCurrency(VALIDATION.MAX_PRICE)}`);
      return false;
    }
    
    if (model.launch_year && (model.launch_year < VALIDATION.MIN_LAUNCH_YEAR || model.launch_year > VALIDATION.MAX_LAUNCH_YEAR)) {
      toast.error(`Launch year must be between ${VALIDATION.MIN_LAUNCH_YEAR} and ${VALIDATION.MAX_LAUNCH_YEAR}`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);

    const formData = new FormData();
    
    Object.entries(model).forEach(([key, value]) => {
      if (key === 'storage_options' || key === 'ram_options' || key === 'color_options') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'specifications') {
        formData.append(key, JSON.stringify(value));
      } else if (!['id', 'created_at', 'updated_at', 'images', 'variants', 'attributes'].includes(key)) {
        formData.append(key, String(value));
      }
    });

    images.forEach((file) => {
      formData.append(`images`, file);
    });

    try {
      if (id) {
        await catalogService.updateModel(id, formData);
        toast.success('Model updated successfully');
      } else {
        await catalogService.createModel(formData);
        toast.success('Model created successfully');
      }
      navigate('/catalog/models');
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">
          {id ? 'Edit Device Model' : 'Create New Device Model'}
        </h1>
        <Link to="/catalog/models">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Basic Information</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    name="category"
                    value={model.category || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </Select>

                  <Select
                    label="Brand"
                    name="brand"
                    value={model.brand || ''}
                    onChange={handleChange}
                    required
                    disabled={!model.category}
                  >
                    <option value="">Select a brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </Select>
                </div>

                <Input 
                  label="Model Name" 
                  name="name" 
                  value={model.name || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., iPhone 15 Pro"
                  maxLength={VALIDATION.MAX_NAME_LENGTH}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Slug" 
                    name="slug" 
                    value={model.slug || ''} 
                    onChange={handleChange} 
                    placeholder="Auto-generated from name"
                    helpText="URL-friendly version of name"
                    maxLength={VALIDATION.SLUG_MAX_LENGTH}
                  />
                  
                  <Input 
                    label="Model Number" 
                    name="model_number" 
                    value={model.model_number || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., A2890"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Launch Year" 
                    name="launch_year" 
                    type="number" 
                    value={model.launch_year || ''} 
                    onChange={handleChange} 
                    min={VALIDATION.MIN_LAUNCH_YEAR}
                    max={VALIDATION.MAX_LAUNCH_YEAR}
                  />
                  
                  <Input 
                    label="Base Price (₹)" 
                    name="base_price" 
                    type="number" 
                    step="0.01"
                    value={model.base_price || ''} 
                    onChange={handleChange} 
                    required
                    min={VALIDATION.MIN_PRICE}
                    max={VALIDATION.MAX_PRICE}
                  />
                </div>

                <Textarea 
                  label="Description" 
                  name="description" 
                  value={model.description || ''} 
                  onChange={handleChange} 
                  rows={4}
                  placeholder="Full product description..."
                />

                <Input 
                  label="Meta Description (SEO)" 
                  name="meta_description" 
                  value={model.meta_description || ''} 
                  onChange={handleChange} 
                  maxLength={300}
                  helpText="Used for search engine results"
                />
              </div>
            </Card>

            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Configuration Options</h2>
                
                <OptionListEditor
                  label="Storage Options"
                  items={model.storage_options || []}
                  setItems={(items) => setModel(prev => ({ ...prev, storage_options: items }))}
                  placeholder="e.g., 64GB, 128GB, 256GB"
                />

                <OptionListEditor
                  label="RAM Options"
                  items={model.ram_options || []}
                  setItems={(items) => setModel(prev => ({ ...prev, ram_options: items }))}
                  placeholder="e.g., 4GB, 6GB, 8GB"
                />

                <OptionListEditor
                  label="Color Options"
                  items={model.color_options || []}
                  setItems={(items) => setModel(prev => ({ ...prev, color_options: items }))}
                  placeholder="e.g., Black, White, Blue"
                />
              </div>
            </Card>

            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Technical Specifications</h2>
                
                <SpecificationsEditor
                  specs={model.specifications || {}}
                  setSpecs={(specs) => setModel(prev => ({ ...prev, specifications: specs }))}
                />
                
                <p className="text-xs text-gray-500">
                  Add specifications like processor, screen size, camera, battery, etc.
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Status</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      checked={model.is_active || false} 
                      onChange={handleChange} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="is_featured" 
                      checked={model.is_featured || false} 
                      onChange={handleChange} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">Featured</span>
                  </label>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Images</h2>
                
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Existing Images:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {existingImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={img.image_url} 
                            alt={img.alt_text || `Image ${index + 1}`} 
                            className="w-full h-24 object-cover rounded"
                          />
                          {img.is_primary && (
                            <span className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <ImageUploader images={images} setImages={setImages} />
              </div>
            </Card>

            {id && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold border-b pb-2 mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Link to={`/catalog/models/${id}/variants`}>
                      <Button variant="outline" className="w-full">
                        Manage Variants
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link to="/catalog/models">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : (id ? 'Update Model' : 'Create Model')}
          </Button>
        </div>
      </form>
    </div>
  );
}