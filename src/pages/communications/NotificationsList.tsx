// pages/communications/NotificationsList.tsx
import { useEffect, useState } from 'react';
import { Plus, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { commsService } from '../../services/comms.service';
import { type Notification, type FilterOptions } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function NotificationsList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ page: 1, page_size: 20 });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  const loadNotifications = async () => {
    try {
      const data = await commsService.getNotifications(filters);
      setNotifications(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this notification?')) return;
    try {
      await commsService.sendNotification(id);
      toast.success('Notification sent successfully');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-dark">Notifications</h1>
        <Button onClick={() => navigate('/communications/notifications/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Notification
        </Button>
      </div>

      <SearchFilter
        onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
        onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
        placeholder="Search notifications..."
        filterConfigs={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'sent', label: 'Sent' },
              { value: 'failed', label: 'Failed' },
            ],
          },
          {
            key: 'notification_type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'sms', label: 'SMS' },
              { value: 'email', label: 'Email' },
              { value: 'push', label: 'Push' },
              { value: 'in_app', label: 'In-App' },
            ],
          },
        ]}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {notification.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status="info">{notification.notification_type}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {notification.recipient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={notification.status}>{notification.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(notification.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {notification.sent_at ? formatDateTime(notification.sent_at) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {notification.status === 'pending' && (
                      <button
                        onClick={() => handleSend(notification.id)}
                        className="text-secondary hover:text-secondary-dark flex items-center gap-1"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={filters.page || 1}
          totalPages={Math.ceil(total / (filters.page_size || 20))}
          totalItems={total}
          itemsPerPage={filters.page_size || 20}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      </Card>
    </div>
  );
}