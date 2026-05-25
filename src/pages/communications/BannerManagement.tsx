import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Form'; // Ensure using the correct UI path
import { Modal } from '../../components/UI/Modal';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { commsService } from '../../services/comms.service';
import { type Banner } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    target_audience: 'all',
    is_active: true,
    start_date: '',
    end_date: '',
    sort_order: 0,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await commsService.getBanners({ page_size: 100 });
      setBanners(data.results);
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBanner && !imageFile) {
      toast.error('Please select an image');
      return;
    }

    setSaving(true);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          formDataObj.append(key, value.toString());
        }
      });
      
      if (imageFile) {
        formDataObj.append('image', imageFile);
      }

      if (editingBanner) {
        await commsService.updateBanner(editingBanner.id, formDataObj);
        toast.success('Banner updated successfully');
      } else {
        await commsService.createBanner(formDataObj);
        toast.success('Banner created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadBanners();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      link_url: banner.link_url || '',
      target_audience: banner.target_audience || 'all',
      is_active: banner.is_active,
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
      sort_order: banner.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await commsService.deleteBanner(id);
      toast.success('Banner deleted');
      loadBanners();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setImageFile(null);
    setFormData({
      title: '',
      description: '',
      link_url: '',
      target_audience: 'all',
      is_active: true,
      start_date: '',
      end_date: '',
      sort_order: 0,
    });
  };

  if (loading && banners.length === 0) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Banner Management</h1>
          <p className="text-gray-600 mt-1">Manage promotional banners for the app and website</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden flex flex-col">
            <div className="relative">
              <img
                src={banner.image_url || banner.image} // Handles both field names
                alt={banner.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge status={banner.is_active ? 'active' : 'inactive'}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge status="info" className="capitalize">{banner.target_audience}</Badge>
              </div>
            </div>
            
            <div className="p-4 flex-1 space-y-2">
              <h3 className="font-bold text-lg text-gray-900">{banner.title}</h3>
              {banner.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{banner.description}</p>
              )}
              
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-1">
                <div className="flex items-center text-xs text-gray-500 gap-1">
                  <Plus className="w-3 h-3" />
                  <span>Start: {banner.start_date ? formatDate(banner.start_date) : 'Immediate'}</span>
                </div>
                {banner.end_date && (
                  <div className="flex items-center text-xs text-gray-500 gap-1">
                    <X className="w-3 h-3" />
                    <span>End: {formatDate(banner.end_date)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(banner)}>
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(banner.id)}>
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingBanner ? 'Edit Banner' : 'Add Banner'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter banner title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              rows={3}
              placeholder="Enter short description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Image {!editingBanner && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1 flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                required={!editingBanner}
              />
            </div>
            {editingBanner && !imageFile && (
              <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing image</p>
            )}
          </div>

          <Input
            label="Link URL"
            placeholder="https://example.com/promo"
            value={formData.link_url}
            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              >
                <option value="all">All Users</option>
                <option value="consumer">Consumers</option>
                <option value="partner">Partners</option>
              </select>
            </div>
            <Input
              label="Sort Order"
              type="number"
              value={formData.sort_order.toString()}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Set as Active</label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button type="submit" loading={saving} className="flex-1">
              {editingBanner ? 'Update Banner' : 'Create Banner'}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}