import React from 'react';
import { usePlatformCategories } from '../../hooks/usePlatformCategories';

interface TwitchViewProps {
  onError?: (error: string) => void;
}

export default function TwitchView({ onError }: TwitchViewProps) {
  const categories = usePlatformCategories('twitch');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#9146FF] flex items-center justify-center text-2xl">
          📺
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Twitch Content
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your Twitch streaming assets
          </p>
        </div>
      </div>

      {/* Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 
                       bg-white dark:bg-slate-800 hover:border-[#9146FF] 
                       dark:hover:border-[#9146FF] transition-colors cursor-pointer"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              {category.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              {category.description}
            </p>
            {category.dimensions && (
              <p className="text-xs font-mono text-[#9146FF]">
                {category.dimensions}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* TODO: Add CategorySection components for each category */}
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <p className="text-sm">Category content will be displayed here</p>
        <p className="text-xs mt-1">Select a category above to view assets</p>
      </div>
    </div>
  );
}
