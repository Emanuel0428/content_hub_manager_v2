import React, { useState, useMemo } from 'react';
import { usePlatformCategories } from '../../hooks/usePlatformCategories';
import { useAssetFilter } from '../../hooks/useAssetFilter';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import CategorySection from './CategorySection';
import FilterBar from './FilterBar';

interface YouTubeViewProps {
  onError?: (error: string) => void;
}

const YOUTUBE_COLOR = '#FF0000';

export default function YouTubeView({ onError }: YouTubeViewProps) {
  const categories = usePlatformCategories('youtube');
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { assets, loading, error, refetch } = useAssetFilter({ 
    platform: 'youtube',
    userId: user?.id 
  });

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
      const nameMatch = asset.name?.toLowerCase().includes(query);
      return nameMatch;
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
        <div className="w-16 h-16 rounded-2xl bg-[#FF0000] flex items-center justify-center p-3 shadow-lg">
          <img 
            src="/Youtube_logo.svg" 
            alt="YouTube logo"
            className="w-full h-full object-contain brightness-0 invert"
          />
        </div>
        <div>
          <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            YouTube Content
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
        platform="youtube"
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
            platformColor={YOUTUBE_COLOR}
            onError={onError}
            onAssetUpdated={refetch}
          />
        ))}
      </div>
    </div>
  );
}

