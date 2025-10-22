import React from 'react';
import type { Platform } from '../../types/platform';
import TwitchView from './TwitchView';
import YouTubeView from './YouTubeView';
import TikTokView from './TikTokView';

interface PlatformViewContainerProps {
  activePlatform: Platform;
  onError?: (error: string) => void;
}

export default function PlatformViewContainer({
  activePlatform,
  onError,
}: PlatformViewContainerProps) {
  // Render the appropriate platform view with smooth transitions
  const renderPlatformView = () => {
    switch (activePlatform) {
      case 'twitch':
        return <TwitchView onError={onError} />;
      case 'youtube':
        return <YouTubeView onError={onError} />;
      case 'tiktok':
        return <TikTokView onError={onError} />;
      case 'all':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🌐</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                All Platforms
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Select a specific platform to view and manage assets
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>Unknown platform</p>
          </div>
        );
    }
  };

  return (
    <div className="transition-all duration-300 ease-in-out">
      {renderPlatformView()}
    </div>
  );
}
