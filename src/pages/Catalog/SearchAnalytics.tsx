import { useEffect, useState } from 'react';
import { Search, TrendingUp, Trash2, RefreshCw, Download } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Pagination } from '../../components/Shared/Pagination';
import { ConfirmDialog } from '../../components/Shared/ConfirmDialog';
import { catalogService } from '../../services/catalog.service';
import { type PopularSearch, type FilterOptions } from '../../types';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../lib/utils';
import { extractErrorMessage, truncateText } from '../../lib/catalog.utils';
import { DEFAULT_CATALOG_PAGE_SIZE } from '../../config/catalog.constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SearchAnalytics() {
  const [searches, setSearches] = useState<PopularSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ 
    page: 1, 
    page_size: 50 
  });
  const [total, setTotal] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; searchId: string | null }>({
    isOpen: false,
    searchId: null,
  });

  useEffect(() => {
    loadSearches();
  }, [filters]);

  const loadSearches = async () => {
    try {
      const data = await catalogService.getPopularSearches(filters);
      setSearches(data.results);
      setTotal(data.count);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.searchId) return;

    try {
      await catalogService.deletePopularSearch(deleteDialog.searchId);
      toast.success('Search term deleted successfully');
      loadSearches();
    } catch (error: any) {
      toast.error(extractErrorMessage(error));
    } finally {
      setDeleteDialog({ isOpen: false, searchId: null });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadSearches();
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Search Term', 'Search Count', 'Last Searched'],
      ...searches.map(s => [
        s.search_term,
        s.search_count.toString(),
        new Date(s.last_searched_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  if (loading) return <Loader />;

  // Calculate metrics
  const totalSearches = searches.reduce((sum, s) => sum + s.search_count, 0);
  const avgSearchesPerTerm = searches.length > 0 
    ? Math.round(totalSearches / searches.length)
    : 0;
  const topSearch = searches[0];

  // Prepare chart data (top 10)
  const chartData = searches.slice(0, 10).map(search => ({
    term: truncateText(search.search_term, 20),
    searches: search.search_count,
  }));

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-dark">Search Analytics</h1>
            <p className="text-gray-600 mt-1">Track and analyze popular search terms</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} disabled={searches.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Search className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Search Terms</div>
                <div className="text-2xl font-bold text-dark">{total}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Searches</div>
                <div className="text-2xl font-bold text-dark">
                  {totalSearches.toLocaleString()}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Avg. Searches/Term</div>
                <div className="text-2xl font-bold text-dark">{avgSearchesPerTerm}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                <Search className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Most Popular</div>
                <div className="text-lg font-bold text-dark truncate">
                  {topSearch ? truncateText(topSearch.search_term, 15) : 'N/A'}
                </div>
                {topSearch && (
                  <div className="text-xs text-gray-500">{topSearch.search_count} searches</div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Chart */}
        {searches.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Top 10 Search Terms</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="term" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="searches" fill="#3b82f6" name="Search Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Search Terms Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Search Terms</h2>
            
            {searches.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No search data available yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Search terms will appear here as users search for products
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Search Term</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Search Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Popularity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Searched</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searches.map((search, index) => {
                        const rank = ((filters.page || 1) - 1) * (filters.page_size || 50) + index + 1;
                        const maxCount = Math.max(...searches.map(s => s.search_count));
                        const popularityPercent = (search.search_count / maxCount) * 100;
                        
                        return (
                          <tr key={search.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                              #{rank}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900">
                                  {search.search_term}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">
                                {search.search_count.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${popularityPercent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 font-medium">
                                  {Math.round(popularityPercent)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {formatDateTime(search.last_searched_at)}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setDeleteDialog({ isOpen: true, searchId: search.id })}
                                className="text-red-600 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <Pagination
                    currentPage={filters.page || 1}
                    totalPages={Math.ceil(total / (filters.page_size || 50))}
                    totalItems={total}
                    itemsPerPage={filters.page_size || 50}
                    onPageChange={(page) => setFilters({ ...filters, page })}
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Insights Card */}
        {searches.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Search Insights & Recommendations
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  • <strong>Most Popular:</strong> "{topSearch?.search_term}" with {topSearch?.search_count} searches
                </p>
                <p>
                  • <strong>Trend Analysis:</strong> Monitor these searches to identify user interests and popular products
                </p>
                <p>
                  • <strong>Action Items:</strong> Consider adding frequently searched items to your catalog if not already present
                </p>
                <p>
                  • <strong>SEO Optimization:</strong> Use popular search terms to optimize product names, descriptions, and meta tags
                </p>
                <p>
                  • <strong>Marketing Strategy:</strong> Feature top-searched models in promotions and homepage banners
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, searchId: null })}
        onConfirm={handleDelete}
        title="Delete Search Term"
        message="Are you sure you want to delete this search term? This will remove it from analytics but won't affect actual search functionality."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}