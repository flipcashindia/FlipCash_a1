// pages/operations/DisputesList.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { operationsService } from '../../services/operations.service';
import { type Dispute, type FilterOptions } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function DisputesList() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ page: 1, page_size: 20 });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadDisputes();
  }, [filters]);

  const loadDisputes = async () => {
    try {
      const data = await operationsService.getDisputes(filters);
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
      <h1 className="text-3xl font-bold text-dark">Disputes</h1>

      <SearchFilter
        onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
        onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
        placeholder="Search disputes..."
        filterConfigs={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'escalated', label: 'Escalated' },
            ],
          },
          {
            key: 'dispute_type',
            label: 'Type',
            type: 'select',
            options: [
              { value: 'price_mismatch', label: 'Price Mismatch' },
              { value: 'quality_issue', label: 'Quality Issue' },
              { value: 'service_issue', label: 'Service Issue' },
              { value: 'payment_issue', label: 'Payment Issue' },
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raised By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dispute.lead}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status="info">{dispute.dispute_type.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispute.raised_by}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {dispute.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge status={dispute.status}>{dispute.status.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(dispute.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/operations/disputes/${dispute.id}`}
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