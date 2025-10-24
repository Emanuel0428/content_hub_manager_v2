import { useState, useEffect } from 'react';
import { listAssets, type Asset } from '../services/api';
import type { Platform } from '../types/platform';

export interface AssetFilterParams {
  platform?: Platform;
  category?: string;
  resolution?: string;
}

/**
 * Custom hook to fetch and filter assets by platform and/or category
 * Fetches data from API with server-side filtering
 */
export function useAssetFilter(filters: AssetFilterParams = {}) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await listAssets(filters);
        setAssets(response.data);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assets');
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [filters.platform, filters.category, filters.resolution]);

  return {
    assets,
    loading,
    error,
    refetch: () => {
      // Trigger re-fetch by forcing effect
      const fetchAssets = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const response = await listAssets(filters);
          setAssets(response.data);
        } catch (err) {
          console.error('Failed to fetch assets:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch assets');
          setAssets([]);
        } finally {
          setLoading(false);
        }
      };
      fetchAssets();
    }
  };
}

