import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { usePlatformCategories } from '../../hooks/usePlatformCategories';
import { useAssetFilter } from '../../hooks/useAssetFilter';
import CategorySection from './CategorySection';
import FilterBar from './FilterBar';

interface TikTokViewProps {
  onError?: (error: string) => void;
}

const TIKTOK_COLOR = '#000000';

export default function TikTokView({ onError }: TikTokViewProps) {
  const categories = usePlatformCategories('tiktok');
  const { assets, loading, error } = useAssetFilter({ platform: 'tiktok' });
  const { darkMode } = useTheme();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery('');
  };

  // Apply search filter
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(asset => {
      const titleMatch = asset.title?.toLowerCase().includes(query);
      const tagsMatch = asset.tags?.some(tag => tag.toLowerCase().includes(query));
      return titleMatch || tagsMatch;
    });
  }, [assets, searchQuery]);

  // Filter categories to show
  const categoriesToShow = selectedCategory 
    ? categories.filter(c => c.id === selectedCategory)
    : categories;

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white flex items-center justify-center p-3 shadow-lg">
          <img 
            src="/TikTok_logo.svg" 
            alt="TikTok logo"
            className="w-full h-full object-contain brightness-0 invert dark:brightness-100 dark:invert-0"
          />
        </div>
        <div>
          <h2 className={`text-3xl font-black  tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            TikTok Content
          </h2>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-900'} mt-1`}>
            {loading ? (
              'Loading assets...'
            ) : (
              `${assets.length} total asset${assets.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        platform="tiktok"
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
      />

      {/* Category Sections */}
      <div className="space-y-8">
        {categoriesToShow.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            assets={filteredAssets}
            loading={loading}
            platformColor={TIKTOK_COLOR}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
}

