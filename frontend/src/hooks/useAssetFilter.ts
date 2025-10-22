import { useState, useEffect } from 'react';
import type { Asset, AssetFilterParams } from '../types/asset';
import type { Platform } from '../types/platform';

/**
 * Custom hook to filter assets by platform and/or category
 * Can be extended to support additional filters
 */
export function useAssetFilter(
  assets: Asset[],
  filters: AssetFilterParams
) {
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

  useEffect(() => {
    let result = [...assets];

    // Filter by platform
    if (filters.platform && filters.platform !== 'all') {
      result = result.filter(
        (asset) => asset.platform === filters.platform || asset.platform === 'all'
      );
    }

    // Filter by category
    if (filters.category) {
      result = result.filter((asset) => asset.category === filters.category);
    }

    // Filter by folder
    if (filters.folderId) {
      result = result.filter((asset) => asset.folderId === filters.folderId);
    }

    // Search by name
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((asset) =>
        asset.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filters.sortBy) {
      result.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;

        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    setFilteredAssets(result);
  }, [assets, filters]);

  return filteredAssets;
}
