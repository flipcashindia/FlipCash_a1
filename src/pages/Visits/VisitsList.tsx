// pages/visits/VisitsList.tsx
import { useEffect, useState } from 'react';
import { Eye, MapPin, Calendar, Smartphone, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Badge } from '../../components/UI/Badge';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { SearchFilter } from '../../components/Shared/SearchFilter';
import { Pagination } from '../../components/Shared/Pagination';
import { visitsService } from '../../services/visits.service';
import { type Visit, type FilterOptions } from '../../types';
import { formatDateTime, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function VisitsList() {
  // Initialize with empty array
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: 20,
    ordering: '-scheduled_date'
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadVisits();
  }, [filters]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await visitsService.getVisits(filters);
      console.log(data);
      
      // FIX: Defensive check for response structure
      // Handle both paginated response ({ results: [...] }) and plain array ([...])
      const results = Array.isArray(data) ? data : (data.results || []);
      const count = Array.isArray(data) ? data.length : (data.count || 0);

      setVisits(results);
      setTotal(count);
    } catch (error) {
      console.error("Failed to load visits:", error);
      toast.error('Failed to load visits');
      setVisits([]); // Ensure it's reset to array on error
    } finally {
      setLoading(false);
    }
  };

  if (loading && (!visits || visits.length === 0)) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark">Visits Control Tower</h1>
          <p className="text-gray-500 mt-1">Manage partner visits, inspections, and status updates.</p>
        </div>
        <Button variant="primary" onClick={() => loadVisits()}>Refresh Data</Button>
      </div>

      <Card className="p-4">
        <SearchFilter
          onSearch={(query) => setFilters({ ...filters, search: query, page: 1 })}
          onFilter={(newFilters) => setFilters({ ...filters, ...newFilters, page: 1 })}
          placeholder="Search by Visit ID, Partner, or Lead..."
          filterConfigs={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'en_route', label: 'En Route' },
                { value: 'arrived', label: 'Arrived' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'no_show', label: 'No Show' },
              ],
            },
            {
                key: 'ordering',
                label: 'Sort By',
                type: 'select',
                options: [
                  { value: '-scheduled_date', label: 'Newest Scheduled' },
                  { value: 'scheduled_date', label: 'Oldest Scheduled' },
                  { value: '-created_at', label: 'Recently Created' },
                ]
            }
          ]}
        />
      </Card>

      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visit Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {/* FIX: Check (visits || []) to ensure map always runs on an array */}
              {(visits || []).map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{visit.visit_number}</span>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                            <Smartphone className="w-3.5 h-3.5" />
                            {/* Safe access for nested properties */}
                            <span>{visit.lead?.device_model?.name || visit.lead?.device_name || 'Unknown Device'}</span>
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5">Lead: {visit.lead?.lead_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {visit.partner?.business_name?.substring(0,2).toUpperCase() || '??'}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-900">{visit.partner?.business_name || 'Unassigned'}</div>
                            <div className="text-xs text-gray-500">{visit.partner?.phone}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{visit.scheduled_date}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-5">{visit.scheduled_time_slot}</div>
                        {visit.estimated_arrival_time && (
                             <div className="text-xs text-orange-600 ml-5">ETA: {formatDateTime(visit.estimated_arrival_time)}</div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(visit.status)} px-3 py-1`}>
                        {visit.status?.replace(/_/g, ' ') || 'Unknown'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/visits/${visit.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            Manage
                        </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              
              {(!visits || visits.length === 0) && (
                 <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No visits found.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="border-t border-gray-100 p-4">
            <Pagination
            currentPage={filters.page || 1}
            totalPages={Math.ceil(total / (filters.page_size || 20))}
            totalItems={total}
            itemsPerPage={filters.page_size || 20}
            onPageChange={(page) => setFilters({ ...filters, page })}
            />
        </div>
      </Card>
    </div>
  );
}