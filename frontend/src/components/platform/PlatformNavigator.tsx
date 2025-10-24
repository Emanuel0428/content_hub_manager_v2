import React from 'react';
import type { Platform } from '../../types/platform';
import { PLATFORMS } from '../../constants/platforms';

interface PlatformNavigatorProps {
  activePlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
}

// Platform logo paths
const PLATFORM_LOGOS: Record<string, string> = {
  twitch: '/Twitch_logo.svg',
  youtube: '/Youtube_logo.svg',
  tiktok: '/TikTok_logo.svg',
};

export default function PlatformNavigator({
  activePlatform,
  onPlatformChange,
}: PlatformNavigatorProps) {
  const platformIds = ['twitch', 'youtube', 'tiktok'] as Platform[];

  return (
    <nav className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        {platformIds.map((platformId) => {
          const platform = PLATFORMS[platformId];
          const isActive = activePlatform === platformId;

          return (
            <button
              key={platformId}
              onClick={() => onPlatformChange(platformId)}
              className={`
                flex items-center gap-3 px-5 py-3 rounded-xl font-bold
                transition-all duration-200 ease-in-out
                ${
                  isActive
                    ? 'shadow-lg scale-105'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-102'
                }
              `}
              style={{
                backgroundColor: isActive ? platform.color : 'transparent',
              }}
              aria-label={`Switch to ${platform.name}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <img 
                src={PLATFORM_LOGOS[platformId]} 
                alt={`${platform.name} logo`}
                className={`h-6 w-6 object-contain transition-all ${
                  isActive 
                    ? 'brightness-0 invert' 
                    : 'opacity-70 dark:opacity-80'
                }`}
                style={{
                  filter: !isActive && platformId === 'twitch' 
                    ? 'invert(31%) sepia(93%) saturate(3555%) hue-rotate(246deg) brightness(95%) contrast(101%)'
                    : !isActive && platformId === 'youtube'
                      ? 'invert(14%) sepia(100%) saturate(7426%) hue-rotate(6deg) brightness(95%) contrast(118%)'
                      : undefined
                }}
              />
              <span className={`text-base font-bold tracking-wide ${
                isActive ? 'text-white' : 'text-slate-700 dark:text-slate-300'
              }`}>{platform.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
