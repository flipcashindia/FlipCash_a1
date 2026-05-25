// pages/communications/CreateNotification.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { commsService } from '../../services/comms.service';
import toast from 'react-hot-toast';

export default function CreateNotification() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    notification_type: 'push',
    title: '',
    body: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const notification = await commsService.createNotification(formData);
      toast.success('Notification created successfully');
      
      if (confirm('Send notification now?')) {
        await commsService.sendNotification(notification.id);
        toast.success('Notification sent');
      }
      
      navigate('/communications/notifications');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/communications/notifications')} className="btn-outline p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-dark">Create Notification</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Recipient User ID"
            placeholder="Enter user ID"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={formData.notification_type}
              onChange={(e) => setFormData({ ...formData, notification_type: e.target.value })}
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="push">Push Notification</option>
              <option value="in_app">In-App</option>
            </select>
          </div>

          <Input
            label="Title"
            placeholder="Enter notification title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Body
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={5}
              placeholder="Enter notification message"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" loading={loading}>
              Create Notification
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/communications/notifications')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}