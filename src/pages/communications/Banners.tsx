import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { commsService, type Banner } from '../../services/comms.service';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    banner_type: '',
    position: '',
    action_url: '',
    action_text: '',
    start_date: '',
    end_date: '',
    target_user_roles: [] as string[],
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await commsService.getBanners();
      setBanners(data.results);
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await commsService.updateBanner(editingBanner.id, formData);
        toast.success('Banner updated successfully');
      } else {
        await commsService.createBanner(formData);
        toast.success('Banner created successfully');
      }
      setShowModal(false);
      resetForm();
      loadBanners();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      image_url: banner.image_url,
      banner_type: banner.banner_type,
      position: banner.position,
      action_url: banner.action_url || '',
      action_text: banner.action_text || '',
      start_date: banner.start_date,
      end_date: banner.end_date,
      target_user_roles: banner.target_user_roles,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await commsService.deleteBanner(id);
      toast.success('Banner deleted successfully');
      loadBanners();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      banner_type: '',
      position: '',
      action_url: '',
      action_text: '',
      start_date: '',
      end_date: '',
      target_user_roles: [],
      is_active: true,
      sort_order: 0,
    });
    setEditingBanner(null);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">Banners Management</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Banner
        </Button>
      </div>

      <div className="grid gap-4">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <div className="flex items-start gap-4">
              {banner.image_url && (
                <img src={banner.image_url} alt={banner.title} className="w-32 h-32 object-cover rounded-lg" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold">{banner.title}</h3>
                  <Badge status={banner.banner_type}>{banner.banner_type}</Badge>
                  <Badge status={banner.is_active ? 'active' : 'inactive'}>
                    {banner.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-3">{banner.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Position</p>
                    <p className="font-semibold capitalize">{banner.position.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-semibold">{formatDateTime(banner.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">End Date</p>
                    <p className="font-semibold">{formatDateTime(banner.end_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {banner.view_count} views
                  </span>
                  <span>👆 {banner.click_count} clicks</span>
                  <span>Order: {banner.sort_order}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(banner)} className="p-2 text-gray-600 hover:text-secondary">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(banner.id)} className="p-2 text-gray-600 hover:text-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
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
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingBanner ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <Input
            label="Image URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Banner Type"
              value={formData.banner_type}
              onChange={(e) => setFormData({ ...formData, banner_type: e.target.value })}
              options={[
                { value: 'promotional', label: 'Promotional' },
                { value: 'announcement', label: 'Announcement' },
                { value: 'alert', label: 'Alert' },
                { value: 'info', label: 'Information' },
              ]}
              required
            />
            <Select
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              options={[
                { value: 'home_top', label: 'Home Top' },
                { value: 'home_middle', label: 'Home Middle' },
                { value: 'home_bottom', label: 'Home Bottom' },
                { value: 'wallet', label: 'Wallet Screen' },
                { value: 'profile', label: 'Profile Screen' },
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Action URL"
              value={formData.action_url}
              onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
              placeholder="https://..."
            />
            <Input
              label="Action Text"
              value={formData.action_text}
              onChange={(e) => setFormData({ ...formData, action_text: e.target.value })}
              placeholder="Learn More"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>
          <Input
            label="Sort Order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Active</label>
          </div>
        </form>
      </Modal>
    </div>
  );
}