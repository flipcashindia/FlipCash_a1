// components/Shared/SearchFilter.tsx
import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text';
  options?: Array<{ value: string; label: string }>;
}

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, any>) => void;
  placeholder?: string;
  filterConfigs?: FilterConfig[];
}

export function SearchFilter({
  onSearch,
  onFilter,
  placeholder = 'Search...',
  filterConfigs = [],
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilter({});
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            icon={Search}
          />
        </div>
        {filterConfigs.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        )}
      </div>

      {showFilters && filterConfigs.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-secondary hover:text-secondary-dark"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterConfigs.map((config) => (
              <div key={config.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {config.label}
                </label>
                {config.type === 'select' && config.options && (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filters[config.key] || ''}
                    onChange={(e) => handleFilterChange(config.key, e.target.value)}
                  >
                    <option value="">All</option>
                    {config.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {config.type === 'date' && (
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filters[config.key] || ''}
                    onChange={(e) => handleFilterChange(config.key, e.target.value)}
                  />
                )}
                {config.type === 'text' && (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filters[config.key] || ''}
                    onChange={(e) => handleFilterChange(config.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}