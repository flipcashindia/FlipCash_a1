import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input, Textarea } from '../../components/UI/Form';
import { Loader } from '../../components/UI/Loader';
import { catalogService } from '../../services/catalog.service';
import { type DeviceBrand } from '../../types';
import toast from 'react-hot-toast';
import { 
  generateSlug, 
  isValidImageFile, 
  isValidFileSize, 
  formatFileSize,
  extractErrorMessage 
} from '../../lib/catalog.utils';
import { IMAGE_UPLOAD, VALIDATION, DEFAULTS } from '../../config/catalog.constants';

export default function BrandForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [brand, setBrand] = useState<Partial<DeviceBrand>>({
    name: '',
    slug: '',
    description: '',
    country_of_origin: '',
    website: '',
    is_active: DEFAULTS.IS_ACTIVE,
    sort_order: DEFAULTS.SORT_ORDER,
  });
  
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadBrand();
    }
  }, [id]);

  // Auto-generate slug from name
  useEffect(() => {
    if (brand.name && !id) {
      const slug = generateSlug(brand.name);
      setBrand(prev => ({ ...prev, slug }));
    }
  }, [brand.name, id]);

  const loadBrand = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getBrand(id!);
      setBrand(data);
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
      navigate('/catalog/brands');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setBrand(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setBrand(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setBrand(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const validateForm = (): boolean => {
    if (!brand.name || brand.name.length < VALIDATION.MIN_NAME_LENGTH) {
      toast.error(`Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`);
      return false;
    }
    
    if (brand.website && !brand.website.startsWith('http')) {
      toast.error('Website must start with http:// or https://');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);

    const formData = new FormData();
    
    Object.entries(brand).forEach(([key, value]) => {
      if (!['id', 'created_at', 'updated_at', 'logo_url', 'models_count', 'categories'].includes(key)) {
        formData.append(key, String(value));
      }
    });

    if (logo) {
      formData.append('logo', logo);
    }

    try {
      if (id) {
        await catalogService.updateBrand(id, formData);
        toast.success('Brand updated successfully');
      } else {
        await catalogService.createBrand(formData);
        toast.success('Brand created successfully');
      }
      navigate('/catalog/brands');
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
          {id ? 'Edit Brand' : 'Create New Brand'}
        </h1>
        <Link to="/catalog/brands">
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
                <h2 className="text-xl font-semibold border-b pb-2">Brand Information</h2>
                
                <Input 
                  label="Brand Name" 
                  name="name" 
                  value={brand.name || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., Apple, Samsung, OnePlus"
                  maxLength={VALIDATION.MAX_NAME_LENGTH}
                />

                <Input 
                  label="Slug" 
                  name="slug" 
                  value={brand.slug || ''} 
                  onChange={handleChange} 
                  placeholder="Auto-generated from name"
                  helpText="URL-friendly version of name"
                  maxLength={VALIDATION.SLUG_MAX_LENGTH}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Country of Origin" 
                    name="country_of_origin" 
                    value={brand.country_of_origin || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., USA, China, South Korea"
                  />
                  
                  <Input 
                    label="Website URL" 
                    name="website" 
                    type="url"
                    value={brand.website || ''} 
                    onChange={handleChange} 
                    placeholder="https://www.example.com"
                  />
                </div>

                <Textarea 
                  label="Description" 
                  name="description" 
                  value={brand.description || ''} 
                  onChange={handleChange} 
                  rows={4}
                  placeholder="Brief description of the brand..."
                />

                <Input 
                  label="Sort Order" 
                  name="sort_order" 
                  type="number" 
                  value={brand.sort_order || 0} 
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
                <h2 className="text-xl font-semibold border-b pb-2">Brand Logo</h2>
                
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {logo && (
                      <div className="mt-2 text-xs text-gray-500">
                        {formatFileSize(logo.size)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      onChange={handleLogoChange} 
                      accept={IMAGE_UPLOAD.ALLOWED_TYPES.join(',')}
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <span className="text-sm text-gray-600">Click to upload logo</span>
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
                
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="is_active" 
                    checked={brand.is_active || false} 
                    onChange={handleChange} 
                    className="rounded" 
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link to="/catalog/brands">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : (id ? 'Update Brand' : 'Create Brand')}
          </Button>
        </div>
      </form>
    </div>
  );
}