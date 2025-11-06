import React, { useState } from 'react';
import { Image, Video, Music, File, Loader, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Asset } from '../../services/api';
import type { CategoryConfig } from '../../types/platform';


interface CategorySectionProps {
  category: CategoryConfig;
  assets: Asset[];
  loading?: boolean;
  platformColor: string;
  onError?: (error: string) => void;
}

const urlSupabase = `${(import.meta as any).env.VITE_SUPABASE_URL}/storage/v1/object/public/Assets/`;

export default function CategorySection({
  category,
  assets,
  loading = false,
  platformColor,
  onError,
}: CategorySectionProps) {
  const { darkMode } = useTheme();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Filter assets for this category by checking metadata.category
  const categoryAssets = assets.filter(asset => {
    const assetCategory = asset.metadata?.category;
    return assetCategory === category.id;
  });

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
              <div className={`aspect-video relative overflow-hidden flex items-center justify-center ${
                darkMode ? 'bg-slate-900' : 'bg-slate-100'
              }`}>
                {(() => {
                  // Debug logging
                  console.log('Asset data:', asset);
                  console.log('Asset versions:', asset.asset_versions);
                  console.log('Storage path:', asset.asset_versions?.[0]?.storage_path);
                  console.log('MIME type:', asset.metadata?.originalMimeType);
                  
                  const storagePath = asset.asset_versions?.[0]?.storage_path;
                  const imageUrl = storagePath ? `${urlSupabase}${storagePath}` : null;
                  
                  if (asset.metadata?.originalMimeType?.startsWith('image/') && imageUrl) {
                    return (
                      <img
                        src={imageUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', imageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', imageUrl);
                        }}
                      />
                    );
                  } else {
                    return (
                      <div className="text-slate-400">
                        {getAssetIcon(asset.metadata?.originalMimeType)}
                      </div>
                    );
                  }
                })()}
                
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
                  {asset.name}
                </h4>
                
                <div className="flex items-center justify-between text-xs">
                  <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                    {formatFileSize(asset.size_bytes)}
                  </span>
                  {category.dimensions && (
                    <span className="font-mono" style={{ color: platformColor }}>
                      {category.dimensions}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Modal */}
      {selectedAssetId && categoryAssets.find(a => a.id === selectedAssetId) && (
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
                {categoryAssets.find(a => a.id === selectedAssetId)?.name}
              </h3>
              <button
                onClick={() => setSelectedAssetId(null)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-slate-800 text-slate-300'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {categoryAssets.find(a => a.id === selectedAssetId) && (() => {
                const asset = categoryAssets.find(a => a.id === selectedAssetId)!;
                return (
                  <div className="space-y-4">
                    {asset.asset_versions?.[0]?.storage_path && (
                      <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {asset.metadata?.originalMimeType?.startsWith('image/') ? (
                          <img
                            src={`${urlSupabase}${asset.asset_versions[0].storage_path}`}
                            alt={asset.name}
                            className="w-full h-auto"
                          />
                        ) : (
                          <div className="p-12 flex items-center justify-center">
                            <div className="text-slate-400">
                              {getAssetIcon(asset.metadata?.originalMimeType)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Asset Information
                      </h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Name:</dt>
                          <dd className={darkMode ? 'text-slate-300' : 'text-slate-900'}>{asset.name}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Size:</dt>
                          <dd className={darkMode ? 'text-slate-300' : 'text-slate-900'}>{formatFileSize(asset.size_bytes)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Platform:</dt>
                          <dd className={darkMode ? 'text-slate-300' : 'text-slate-900'}>{asset.platform_origin}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Category:</dt>
                          <dd className={darkMode ? 'text-slate-300' : 'text-slate-900'}>{asset.metadata?.category}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Created:</dt>
                          <dd className={darkMode ? 'text-slate-300' : 'text-slate-900'}>
                            {new Date(asset.created_at).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
