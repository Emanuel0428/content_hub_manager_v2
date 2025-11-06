import { useState, useEffect } from 'react';
import { listAssets, type Asset } from '../services/api';
import type { Platform } from '../types/platform';

/**
 * Filter parameters for asset queries
 */
export interface AssetFilterParams {
  /** Platform to filter by (twitch, youtube, tiktok, or all) */
  platform?: Platform;
  /** Category to filter by (e.g., 'thumbnails', 'emotes') */
  category?: string;
  /** Resolution to filter by (e.g., '1920x1080') */
  resolution?: string;
  /** User ID to filter by - only show assets from this user */
  userId?: string;
}

/**
 * Custom hook to fetch and filter assets by platform and/or category
 * 
 * Fetches data from API with server-side filtering. Re-fetches automatically
 * when filter parameters change.
 * 
 * @param filters - Object with optional platform, category, and resolution filters
 * @returns Object with assets array, loading state, error message, and refetch function
 * 
 * @example
 * ```tsx
 * const { assets, loading, error, refetch } = useAssetFilter({ 
 *   platform: 'twitch',
 *   category: 'thumbnails'
 * });
 * 
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * return <AssetGrid assets={assets} />;
 * ```
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
  }, [filters.platform, filters.category, filters.resolution, filters.userId]);

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

