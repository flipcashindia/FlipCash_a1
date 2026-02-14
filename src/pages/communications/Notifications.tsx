import { useEffect, useState } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Modal } from '../../components/UI/Modal';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { commsService, type Notification } from '../../services/comms.service';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target_users: [] as string[],
    target_roles: [] as string[],
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await commsService.getNotifications();
      setNotifications(data.results);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await commsService.createNotification(formData);
      toast.success('Notification created successfully');
      setShowModal(false);
      resetForm();
      loadNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create notification');
    }
  };

  const handleSend = async (id: string) => {
    try {
      await commsService.sendNotification(id);
      toast.success('Notification sent successfully');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target_users: [],
      target_roles: [],
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">Notifications</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Notification
        </Button>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold">{notification.title}</h3>
                  <Badge status={notification.type}>{notification.type}</Badge>
                  {notification.is_sent && (
                    <Badge status="success">Sent</Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{notification.message}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Created: {formatDateTime(notification.created_at)}</span>
                  {notification.sent_at && (
                    <span>Sent: {formatDateTime(notification.sent_at)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!notification.is_sent && (
                  <button
                    onClick={() => handleSend(notification.id)}
                    className="p-2 text-gray-600 hover:text-secondary"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 text-gray-600 hover:text-danger">
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
        title="Create Notification"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: 'info', label: 'Info' },
              { value: 'success', label: 'Success' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
            ]}
            required
          />
          <Select
            label="Target Roles"
            value={formData.target_roles[0] || ''}
            onChange={(e) => setFormData({ ...formData, target_roles: e.target.value ? [e.target.value] : [] })}
            options={[
              { value: 'customer', label: 'Customers' },
              { value: 'partner', label: 'Partners' },
              { value: 'all', label: 'All Users' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}