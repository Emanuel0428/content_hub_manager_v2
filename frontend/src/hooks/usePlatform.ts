import { useState, useEffect } from 'react';
import type { Platform } from '../types/platform';

const STORAGE_KEY = 'selected-platform';
const DEFAULT_PLATFORM: Platform = 'twitch';

/**
 * Custom hook to manage active platform state
 * Persists selection to localStorage
 */
export function usePlatform() {
  const [activePlatform, setActivePlatform] = useState<Platform>(() => {
    // Initialize from localStorage or default
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Platform) || DEFAULT_PLATFORM;
  });

  useEffect(() => {
    // Persist to localStorage whenever platform changes
    localStorage.setItem(STORAGE_KEY, activePlatform);
  }, [activePlatform]);

  return {
    activePlatform,
    setActivePlatform,
  };
}
