import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Tag, Smartphone, ListChecks, Plus, TrendingUp } from 'lucide-react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { analyticsService } from '../../services/analytics.service';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';
import { extractErrorMessage } from '../../lib/catalog.utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 👈 FIX 1: Explicitly define the interface here so TypeScript knows what 'data' looks like
interface DashboardData {
  totals?: {
    categories: number;
    brands: number;
    models: number;
    avg_price: number;
  };
  charts?: {
    models_per_category: any[];
    model_status: any[];
    top_searches: any[];
  };
  trends?: {
    new_models_this_month: number;
    new_models_last_month: number;
    active_categories: number;
    active_brands: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CatalogBoard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await analyticsService.getSummary();
      setData(result as any);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark">Catalog Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your device catalog</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Categories</div>
              <div className="text-2xl font-bold text-dark">{data.totals?.categories ?? 0}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <Tag className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Brands</div>
              <div className="text-2xl font-bold text-dark">{data.totals?.brands ?? 0}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Models</div>
              <div className="text-2xl font-bold text-dark">{data.totals?.models ?? 0}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
              <ListChecks className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Avg. Price</div>
              <div className="text-2xl font-bold text-dark">
                {formatCurrency(data.totals?.avg_price ?? 0)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.charts?.models_per_category && data.charts.models_per_category.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Models per Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.charts.models_per_category}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="models" fill="#3b82f6" name="Models" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {data.charts?.model_status && data.charts.model_status.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Model Status Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.charts.model_status}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}                      
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {/* 👈 FIX 3: Ignore 'entry' with an underscore and type 'index' */}
                    {data.charts.model_status.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Top Searches */}
      {data.charts?.top_searches && data.charts.top_searches.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Top Search Terms</h2>
              <Link to="/catalog/search-analytics">
                <Button variant="outline" size="sm">
                  View All Analytics
                </Button>
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.charts.top_searches.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="term" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Searches" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/catalog/categories/new">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </Link>
            <Link to="/catalog/brands/new">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Brand
              </Button>
            </Link>
            <Link to="/catalog/models/new">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Model
              </Button>
            </Link>
            <Link to="/tools/bulk-import">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Bulk Import
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Trends */}
      {data.trends && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Trends</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.trends.new_models_this_month}
                </div>
                <div className="text-sm text-gray-600 mt-1">New Models This Month</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data.trends.new_models_last_month}
                </div>
                <div className="text-sm text-gray-600 mt-1">New Models Last Month</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {data.trends.active_categories}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active Categories</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {data.trends.active_brands}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active Brands</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}