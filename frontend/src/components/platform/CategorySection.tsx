import React, { useState } from 'react';
import { Image, Video, Music, File, Loader } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import AssetPreview from '../AssetPreview';
import type { Asset } from '../../services/api';
import type { CategoryConfig } from '../../types/platform';

/**
 * Props for CategorySection component
 */
interface CategorySectionProps {
  /** Category configuration with name, description, and dimensions */
  category: CategoryConfig;
  /** Array of assets to display (will be filtered by category) */
  assets: Asset[];
  /** Whether assets are currently loading */
  loading?: boolean;
  /** Platform color for styling accent elements */
  platformColor: string;
  /** Error callback for handling errors in child components */
  onError?: (error: string) => void;
}

/**
 * CategorySection Component
 * 
 * Displays a category of assets with:
 * - Category header with name, description, and recommended dimensions
 * - Responsive grid of asset cards (1-4 columns based on screen size)
 * - Empty state when no assets in category
 * - Loading state with spinner
 * - Modal preview when asset is clicked
 * 
 * @example
 * ```tsx
 * <CategorySection
 *   category={thumbnailsCategory}
 *   assets={allAssets}
 *   platformColor="#9146FF"
 *   onError={handleError}
 * />
 * ```
 */
export default function CategorySection({
  category,
  assets,
  loading = false,
  platformColor,
  onError,
}: CategorySectionProps) {
  const { darkMode } = useTheme();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  // Filter assets for this category
  const categoryAssets = assets.filter(asset => asset.category === category.id);

  // Get icon for asset type
  const getAssetIcon = (mimeType?: string) => {
    if (!mimeType) return <File size={20} />;
    if (mimeType.startsWith('image/')) return <Image size={20} />;
    if (mimeType.startsWith('video/')) return <Video size={20} />;
    if (mimeType.startsWith('audio/')) return <Music size={20} />;
    return <File size={20} />;
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className={`p-4 rounded-lg border ${
        darkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-1 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {category.name}
            </h3>
            {category.description && (
              <p className={`text-sm mb-2 ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {category.description}
              </p>
            )}
            {category.dimensions && (
              <p className="text-xs font-mono" style={{ color: platformColor }}>
                📐 {category.dimensions}
              </p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {loading ? '...' : `${categoryAssets.length} asset${categoryAssets.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin" style={{ color: platformColor }} size={32} />
        </div>
      )}

      {/* Empty State */}
      {!loading && categoryAssets.length === 0 && (
        <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
          darkMode 
            ? 'border-slate-700 bg-slate-800/30 text-slate-400' 
            : 'border-slate-300 bg-slate-50 text-slate-600'
        }`}>
          <div className="text-4xl mb-3 opacity-50">📦</div>
          <p className="text-sm font-medium mb-1">No assets in this category yet</p>
          <p className="text-xs">Upload files to get started</p>
        </div>
      )}

      {/* Assets Grid */}
      {!loading && categoryAssets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categoryAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAssetId(asset.id)}
              className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              style={{
                borderColor: selectedAssetId === asset.id ? platformColor : undefined,
              }}
            >
              {/* Thumbnail/Preview */}
              <div className={`aspect-video relative overflow-hidden ${
                darkMode ? 'bg-slate-900' : 'bg-slate-100'
              }`}>
                {asset.version_path && asset.mime_type?.startsWith('image/') ? (
                  <img
                    src={`http://localhost:3001${asset.version_path}`}
                    alt={asset.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    {getAssetIcon(asset.mime_type)}
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-medium">View Details</span>
                </div>
              </div>

              {/* Asset Info */}
              <div className="p-3">
                <h4 className={`font-medium text-sm truncate mb-1 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {asset.title}
                </h4>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                    {formatFileSize(asset.file_size)}
                  </span>
                  {asset.resolution && (
                    <span className="font-mono" style={{ color: platformColor }}>
                      {asset.resolution}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {asset.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded ${
                          darkMode
                            ? 'bg-slate-700 text-slate-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="text-xs text-slate-400">
                        +{asset.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Modal */}
      {selectedAssetId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
              darkMode ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b backdrop-blur-sm" style={{
              backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: darkMode ? '#334155' : '#e2e8f0'
            }}>
              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Asset Details
              </h3>
              <button
                onClick={() => setSelectedAssetId(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <AssetPreview 
                id={selectedAssetId} 
                onError={(err) => {
                  onError?.(err);
                  setSelectedAssetId(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
