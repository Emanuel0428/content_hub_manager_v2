import React, { useState } from 'react';
import { Image, Video, Music, File, Loader, X, Edit2, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Asset } from '../../services/api';
import type { CategoryConfig } from '../../types/platform';
import { updateAsset, deleteAsset } from '../../services/api';


interface CategorySectionProps {
  category: CategoryConfig;
  assets: Asset[];
  loading?: boolean;
  platformColor: string;
  onError?: (error: string) => void;
  onAssetUpdated?: () => void;
}

const urlSupabase = `${(import.meta as any).env.VITE_SUPABASE_URL}/storage/v1/object/public/Assets/`;

export default function CategorySection({
  category,
  assets,
  loading = false,
  platformColor,
  onError,
  onAssetUpdated,
}: CategorySectionProps) {
  const { darkMode } = useTheme();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Get aspect ratio for category or individual asset
  const getDisplayAspectRatio = (asset: any, categoryDimensions: string) => {
    // For Variable dimensions, use the actual image proportions
    if (categoryDimensions.includes('Variable')) {
      const assetDimensions = asset.metadata?.dimensions;
      if (assetDimensions) {
        const [width, height] = assetDimensions.split('x').map(Number);
        if (width && height) {
          // Return decimal ratio for better CSS compatibility
          const ratio = width / height;
          return ratio.toString();
        }
      }
      return 'auto'; // Fallback for Variable without dimensions
    }
    
    // For fixed dimensions, use category dimensions
    const primaryDim = categoryDimensions.split(', ')[0];
    const [width, height] = primaryDim.split('x').map(Number);
    
    if (width && height) {
      const ratio = width / height;
      return ratio.toString();
    }
    return 'auto';
  };

  // Handle asset deletion
  const handleDeleteAsset = async (assetId: string) => {
    setIsDeleting(true);
    try {
      await deleteAsset(assetId);
      setDeleteConfirmId(null);
      onAssetUpdated?.();
    } catch (error) {
      console.error('Delete asset error:', error);
      onError?.('Failed to delete asset');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle asset update
  const handleSaveAsset = async () => {
    if (!editingAsset) return;
    
    setIsSaving(true);
    try {
      await updateAsset(editingAsset.id, {
        name: editingAsset.name,
        metadata: editingAsset.metadata,
      });
      setEditingAsset(null);
      onAssetUpdated?.();
    } catch (error) {
      console.error('Update asset error:', error);
      onError?.('Failed to update asset');
    } finally {
      setIsSaving(false);
    }
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
          {categoryAssets.map((asset) => {
            const assetAspectRatio = getDisplayAspectRatio(asset, category.dimensions || 'Variable');
            
            // Debug aspect ratio calculation
            console.log('🖼️ Asset aspect ratio debug:', {
              assetName: asset.name,
              categoryDimensions: category.dimensions,
              assetMetadataDimensions: asset.metadata?.dimensions,
              calculatedAspectRatio: assetAspectRatio
            });
            
            return (
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
                <div 
                  className={`relative overflow-hidden flex items-center justify-center ${
                    darkMode ? 'bg-slate-900' : 'bg-slate-100'
                  }`}
                  style={{
                    aspectRatio: assetAspectRatio,
                    minHeight: assetAspectRatio === 'auto' ? '12rem' : 'auto'
                  }}
                >
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
                        className="w-full h-full object-contain"
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
                
                {/* Hover Overlay with Action Buttons */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-medium">View Details</span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAsset(asset);
                      }}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      title="Edit asset"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(asset.id);
                      }}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
            );
          })}
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

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className={`max-w-md w-full rounded-xl shadow-2xl ${
              darkMode ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            <div className={`p-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Edit Asset
                </h3>
                <button
                  onClick={() => setEditingAsset(null)}
                  className={`p-1 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                >
                  <X size={20} className={darkMode ? 'text-slate-400' : 'text-slate-600'} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Asset Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Asset Name
                </label>
                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Asset Metadata (Read-only for now) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Platform
                </label>
                <input
                  type="text"
                  value={editingAsset.platform_origin}
                  disabled
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-slate-800/50 border-slate-700 text-slate-400' 
                      : 'bg-slate-50 border-slate-300 text-slate-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Category
                </label>
                <input
                  type="text"
                  value={editingAsset.metadata?.category || ''}
                  disabled
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-slate-800/50 border-slate-700 text-slate-400' 
                      : 'bg-slate-50 border-slate-300 text-slate-500'
                  }`}
                />
              </div>
            </div>

            <div className={`p-6 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex gap-3`}>
              <button
                onClick={() => setEditingAsset(null)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsset}
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className={`max-w-md w-full rounded-xl shadow-2xl ${
              darkMode ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            <div className={`p-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Delete Asset
              </h3>
            </div>

            <div className="p-6">
              <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                Are you sure you want to delete this asset? This action cannot be undone and will permanently remove the asset and all its versions from storage.
              </p>
            </div>

            <div className={`p-6 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex gap-3`}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAsset(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
