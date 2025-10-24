import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Platform } from '../../types/platform';
import { getCategoriesForPlatform } from '../../constants/platforms';

/**
 * Props for FilterBar component
 */
interface FilterBarProps {
  /** Current active platform */
  platform: Platform;
  /** Current selected category filter */
  selectedCategory?: string;
  /** Callback when category filter changes */
  onCategoryChange: (category: string | undefined) => void;
  /** Current search query */
  searchQuery?: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
}

/**
 * FilterBar Component
 * 
 * Displays search bar and category filters for the active platform.
 * Allows users to:
 * - Search assets by title/tags
 * - Filter by category
 * - Clear all filters
 * 
 * @example
 * ```tsx
 * <FilterBar
 *   platform="twitch"
 *   selectedCategory={category}
 *   onCategoryChange={setCategory}
 *   searchQuery={query}
 *   onSearchChange={setQuery}
 *   onClearFilters={handleClear}
 * />
 * ```
 */
export default function FilterBar({
  platform,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
}: FilterBarProps) {
  const { darkMode } = useTheme();
  const [showFilters, setShowFilters] = useState(true);
  
  const categories = platform !== 'all' ? getCategoriesForPlatform(platform) : [];
  const hasActiveFilters = selectedCategory || (searchQuery && searchQuery.length > 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search 
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`} 
            size={20} 
          />
          <input
            type="text"
            placeholder="Search assets by title or tags..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all font-medium ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            }`}
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-lg border font-medium flex items-center gap-2 transition-all ${
            showFilters
              ? darkMode
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-brand-500 border-brand-500 text-white'
              : darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter size={18} />
          Filters
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className={`px-4 py-2.5 rounded-lg border font-medium flex items-center gap-2 transition-all ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <X size={18} />
            Clear
          </button>
        )}
      </div>

      {/* Category Filters */}
      {showFilters && categories.length > 0 && (
        <div className={`p-4 rounded-lg border ${
          darkMode
            ? 'bg-slate-800/50 border-slate-700'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-sm font-bold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Filter by Category
            </h4>
            {selectedCategory && (
              <button
                onClick={() => onCategoryChange(undefined)}
                className={`text-xs font-medium ${
                  darkMode
                    ? 'text-brand-400 hover:text-brand-300'
                    : 'text-brand-600 hover:text-brand-700'
                }`}
              >
                Show All
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(isActive ? undefined : category.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? darkMode
                        ? 'bg-brand-600 text-white'
                        : 'bg-brand-500 text-white'
                      : darkMode
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {category.name}
                  {category.dimensions && (
                    <span className={`ml-1.5 text-xs ${
                      isActive ? 'opacity-80' : 'opacity-60'
                    }`}>
                      {category.dimensions.split(' ')[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className={`flex items-center gap-2 text-sm ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <span className="font-medium">Active filters:</span>
          {selectedCategory && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {categories.find(c => c.id === selectedCategory)?.name}
            </span>
          )}
          {searchQuery && searchQuery.length > 0 && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              Search: "{searchQuery}"
            </span>
          )}
        </div>
      )}
    </div>
  );
}
