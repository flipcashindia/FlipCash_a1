// pages/operations/TicketsList.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { operationsService } from '../../services/operations.service';
import { type SupportTicket, type FilterOptions } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function TicketsList() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ page: 1, page_size: 20 });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTickets = async () => {
    try {
      const data = await operationsService.getTickets(filters);
      setTickets(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark">Support Tickets</h1>

      <SearchFilter
        onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
        onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
        placeholder="Search tickets..."
        filterConfigs={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'new', label: 'New' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ],
          },
          {
            key: 'priority',
            label: 'Priority',
            type: 'select',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ],
          },
          {
            key: 'category',
            label: 'Category',
            type: 'select',
            options: [
              { value: 'technical', label: 'Technical' },
              { value: 'billing', label: 'Billing' },
              { value: 'account', label: 'Account' },
              { value: 'general', label: 'General' },
            ],
          },
        ]}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ticket.ticket_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.user_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {ticket.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status="info">{ticket.category}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'danger' : 'warning'}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={ticket.status}>{ticket.status.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(ticket.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/operations/tickets/${ticket.id}`}
                      className="text-secondary hover:text-secondary-dark flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
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