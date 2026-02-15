import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Eye, Clock, AlertCircle } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button'; // Added Button for actions
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { opsService } from '../../services/ops.service';
import { type SupportTicket as Ticket, type FilterOptions } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast'; // Added for user feedback

export default function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: 15 // Standardized page size
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await opsService.getTickets(filters);
      setTickets(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error('Failed to load support tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to handle filter changes and reset page to 1
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page on search/filter
    }));
  };

  if (loading && tickets.length === 0) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage and respond to customer inquiries</p>
        </div>
      </div>

      <SearchFilter
        onSearch={(query) => handleFilterChange({ search: query })}
        onFilter={(newFilters) => handleFilterChange(newFilters)}
        placeholder="Search by ticket #, subject or customer..."
        filterConfigs={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'open', label: 'Open' },
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
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-mono font-medium text-primary">#{ticket.ticket_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</div>
                      <div className="text-xs text-gray-400 capitalize">{ticket.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* 👈 FIX: Use type casting to any to allow object access */}
                      <div className="text-sm text-gray-900">{(ticket.user as any).name}</div>
                      <div className="text-sm text-gray-500">{(ticket.user as any).phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={ticket.status}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge status={ticket.priority}>{ticket.priority}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(ticket.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/operations/tickets/${ticket.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2 ml-auto">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle className="w-12 h-12 mb-2" />
                      <p className="text-lg">No tickets found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > (filters.page_size || 15) && (
          <div className="px-6 py-4 border-t border-gray-100">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={Math.ceil(total / (filters.page_size || 15))}
              totalItems={total}
              itemsPerPage={filters.page_size || 15}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          </div>
        )}
      </Card>
    </div>
  );
}