import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Eye } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { opsService } from '../../services/ops.service';
import { type Dispute, type FilterOptions } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ page: 1, page_size: 20 });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadDisputes();
  }, [filters]);

  const loadDisputes = async () => {
    try {
      const data = await opsService.getDisputes(filters);
      setDisputes(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Disputes Management</h1>
          <p className="text-gray-600 mt-1">Manage and resolve customer disputes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Disputes</p>
              <p className="text-2xl font-bold text-dark">{total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-orange-600">
                {disputes.filter((d) => d.status === 'open').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {disputes.filter((d) => d.status === 'in_progress').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {disputes.filter((d) => d.status === 'resolved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <SearchFilter
        onSearch={(query) => setFilters({ ...filters, search: query })}
        onFilter={(newFilters) => setFilters({ ...filters, ...newFilters })}
        placeholder="Search disputes by number, lead, or customer..."
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
            key: 'type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'pricing', label: 'Pricing' },
              { value: 'quality', label: 'Quality' },
              { value: 'service', label: 'Service' },
              { value: 'payment', label: 'Payment' },
              { value: 'other', label: 'Other' },
            ],
          },
        ]}
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispute #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Raised By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{dispute.dispute_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/leads/${dispute.lead.id}`}
                      className="text-secondary hover:text-secondary-dark font-medium"
                    >
                      {dispute.lead.lead_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{dispute.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{dispute.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{dispute.raised_by.name}</div>
                      <div className="text-gray-500 capitalize">{dispute.raised_by.role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={dispute.status}>{dispute.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={dispute.priority}>{dispute.priority}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(dispute.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/disputes/${dispute.id}`}
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