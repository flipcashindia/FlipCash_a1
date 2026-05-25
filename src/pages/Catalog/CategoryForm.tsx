import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input, Textarea } from '../../components/UI/Form';
import { Loader } from '../../components/UI/Loader';
import { catalogService } from '../../services/catalog.service';
import { type DeviceCategory } from '../../types';
import toast from 'react-hot-toast';
import { 
  generateSlug, 
  isValidImageFile, 
  isValidFileSize, 
  formatFileSize,
  extractErrorMessage 
} from '../../lib/catalog.utils';
import { IMAGE_UPLOAD, VALIDATION, DEFAULTS } from '../../config/catalog.constants';

export default function CategoryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState<Partial<DeviceCategory>>({
    name: '',
    slug: '',
    description: '',
    is_active: DEFAULTS.IS_ACTIVE,
    is_featured: DEFAULTS.IS_FEATURED,
    sort_order: DEFAULTS.SORT_ORDER,
  });
  
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadCategory();
    }
  }, [id]);

  // Auto-generate slug from name
  useEffect(() => {
    if (category.name && !id) {
      const slug = generateSlug(category.name);
      setCategory(prev => ({ ...prev, slug }));
    }
  }, [category.name, id]);

  const loadCategory = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getCategory(id!);
      setCategory(data);
      if (data.icon_url) {
        setIconPreview(data.icon_url);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
      navigate('/catalog/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setCategory(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setCategory(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setCategory(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!isValidImageFile(file)) {
        toast.error('Invalid file type. Please use JPG, PNG, or WebP');
        return;
      }
      
      if (!isValidFileSize(file, IMAGE_UPLOAD.MAX_SIZE_MB)) {
        toast.error(`File too large. Maximum ${IMAGE_UPLOAD.MAX_SIZE_MB}MB`);
        return;
      }
      
      setIcon(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const removeIcon = () => {
    setIcon(null);
    setIconPreview(null);
  };

  const validateForm = (): boolean => {
    if (!category.name || category.name.length < VALIDATION.MIN_NAME_LENGTH) {
      toast.error(`Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);

    const formData = new FormData();
    
    Object.entries(category).forEach(([key, value]) => {
      if (!['id', 'created_at', 'updated_at', 'icon_url', 'models_count'].includes(key)) {
        formData.append(key, String(value));
      }
    });

    if (icon) {
      formData.append('icon', icon);
    }

    try {
      if (id) {
        await catalogService.updateCategory(id, formData);
        toast.success('Category updated successfully');
      } else {
        await catalogService.createCategory(formData);
        toast.success('Category created successfully');
      }
      navigate('/catalog/categories');
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
          {id ? 'Edit Category' : 'Create New Category'}
        </h1>
        <Link to="/catalog/categories">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Category Information</h2>
                
                <Input 
                  label="Category Name" 
                  name="name" 
                  value={category.name || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., Smartphones, Tablets, Laptops"
                  maxLength={VALIDATION.MAX_NAME_LENGTH}
                />

                <Input 
                  label="Slug" 
                  name="slug" 
                  value={category.slug || ''} 
                  onChange={handleChange} 
                  placeholder="Auto-generated from name"
                  helpText="URL-friendly version of name"
                  maxLength={VALIDATION.SLUG_MAX_LENGTH}
                />

                <Textarea 
                  label="Description" 
                  name="description" 
                  value={category.description || ''} 
                  onChange={handleChange} 
                  rows={4}
                  placeholder="Brief description of the category..."
                />

                <Input 
                  label="Sort Order" 
                  name="sort_order" 
                  type="number" 
                  value={category.sort_order || 0} 
                  onChange={handleChange} 
                  min={0}
                  helpText="Lower numbers appear first"
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Category Icon</h2>
                
                {iconPreview ? (
                  <div className="relative">
                    <img 
                      src={iconPreview} 
                      alt="Icon preview" 
                      className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeIcon}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {icon && (
                      <div className="mt-2 text-xs text-gray-500">
                        {formatFileSize(icon.size)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <input 
                      type="file" 
                      id="icon-upload" 
                      className="hidden" 
                      onChange={handleIconChange} 
                      accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(',')}
                    />
                    <label 
                      htmlFor="icon-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <span className="text-sm text-gray-600">Click to upload icon</span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, WebP up to {IMAGE_UPLOAD.MAX_SIZE_MB}MB
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Status</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="is_active" 
                      checked={category.is_active || false} 
                      onChange={handleChange} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      name="is_featured" 
                      checked={category.is_featured || false} 
                      onChange={handleChange} 
                      className="rounded" 
                    />
                    <span className="text-sm font-medium">Featured</span>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link to="/catalog/categories">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : (id ? 'Update Category' : 'Create Category')}
          </Button>
        </div>
      </form>
    </div>
  );
}