import React, { useState, useMemo } from 'react';
import { usePlatformCategories } from '../../hooks/usePlatformCategories';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAssetFilter } from '../../hooks/useAssetFilter';
import CategorySection from './CategorySection';
import FilterBar from './FilterBar';

interface TwitchViewProps {
  onError?: (error: string) => void;
}

const TWITCH_COLOR = '#9146FF';

export default function TwitchView({ onError }: TwitchViewProps) {
  const categories = usePlatformCategories('twitch');
  const { user } = useAuth();
  const { assets, loading, error } = useAssetFilter({ 
    platform: 'twitch',
    userId: user?.id 
  });
  const { darkMode } = useTheme();
  
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery('');
  };

  // Filter assets by search query
  const filteredAssets = useMemo(() => {
    let filtered = assets;
    
    if (searchQuery && searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [assets, searchQuery]);

  // Filter categories to show
  const categoriesToShow = selectedCategory 
    ? categories.filter(c => c.id === selectedCategory)
    : categories;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#9146FF] flex items-center justify-center p-3 shadow-lg">
          <img 
            src="/Twitch_logo.svg" 
            alt="Twitch logo"
            className="w-full h-full object-contain brightness-0 invert"
          />
        </div>
        <div>
          <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Twitch Content
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

      {/* Filter Bar */}
      <FilterBar
        platform="twitch"
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
            platformColor={TWITCH_COLOR}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
}

