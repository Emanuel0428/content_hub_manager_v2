import React from 'react';
import type { Platform } from '../../types/platform';
import { PLATFORMS } from '../../constants/platforms';

interface PlatformNavigatorProps {
  activePlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

// Platform icons using emoji/symbols (can be replaced with actual icon components later)
const PLATFORM_ICONS: Record<string, string> = {
  twitch: '📺',
  youtube: '🎬',
  tiktok: '📱',
  all: '🌐',
};

export default function PlatformNavigator({
  activePlatform,
  onPlatformChange,
}: PlatformNavigatorProps) {
  const platformIds = ['twitch', 'youtube', 'tiktok'] as Platform[];

  return (
    <nav className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
      <div className="flex items-center gap-1 flex-wrap">
        {platformIds.map((platformId) => {
          const platform = PLATFORMS[platformId];
          const isActive = activePlatform === platformId;

          return (
            <button
              key={platformId}
              onClick={() => onPlatformChange(platformId)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                transition-all duration-200 ease-in-out
                ${
                  isActive
                    ? 'shadow-md'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
              style={{
                backgroundColor: isActive ? platform.color : 'transparent',
                color: isActive ? 'white' : 'inherit',
              }}
              aria-label={`Switch to ${platform.name}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-lg" aria-hidden="true">
                {PLATFORM_ICONS[platformId]}
              </span>
              <span className="text-sm font-semibold">{platform.name}</span>
            </button>
          );
        })}
      </div>

      {/* Optional: All Platforms button */}
      {activePlatform === 'all' && (
        <button
          onClick={() => onPlatformChange('all')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-200 dark:bg-slate-700"
        >
          <span className="text-lg">{PLATFORM_ICONS.all}</span>
          <span className="text-sm font-semibold">All Platforms</span>
        </button>
      )}
    </nav>
  );
}
