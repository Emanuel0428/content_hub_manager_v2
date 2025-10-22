import { useMemo } from 'react';
import type { CategoryConfig } from '../types/platform';
import { getCategoriesForPlatform } from '../constants/platforms';

/**
 * Custom hook to get categories for a specific platform
 */
export function usePlatformCategories(platformId: string): CategoryConfig[] {
  const categories = useMemo(() => {
    return getCategoriesForPlatform(platformId);
  }, [platformId]);

  return categories;
}
