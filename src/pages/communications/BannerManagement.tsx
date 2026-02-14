// pages/communications/BannerManagement.tsx
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
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

    setLoading(true);

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
      setLoading(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      link_url: banner.link_url || '',
      target_audience: banner.target_audience,
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
        <h1 className="text-3xl font-bold text-dark">Banner Management</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge status={banner.is_active ? 'active' : 'inactive'}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge status="info">{banner.target_audience}</Badge>
              </div>
              <h3 className="font-semibold text-lg">{banner.title}</h3>
              {banner.description && (
                <p className="text-sm text-gray-600">{banner.description}</p>
              )}
              {banner.start_date && (
                <p className="text-xs text-gray-500">
                  {formatDate(banner.start_date)} - {banner.end_date ? formatDate(banner.end_date) : 'No end date'}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(banner.id)}>
                  <Trash2 className="w-3 h-3 mr-1" />
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image {!editingBanner && '*'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full"
              required={!editingBanner}
            />
          </div>

          <Input
            label="Link URL"
            placeholder="https://example.com"
            value={formData.link_url}
            onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            >
              <option value="all">All Users</option>
              <option value="consumer">Consumers</option>
              <option value="partner">Partners</option>
            </select>
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

          <Input
            label="Sort Order"
            type="number"
            value={formData.sort_order.toString()}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              {editingBanner ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}