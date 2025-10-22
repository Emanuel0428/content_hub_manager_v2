import type { PlatformConfig, CategoryConfig } from '../types/platform';

// Twitch Platform Configuration
export const TWITCH_CATEGORIES: CategoryConfig[] = [
  {
    id: 'thumbnails',
    name: 'Stream Thumbnails',
    dimensions: '1920x1080',
    description: 'Thumbnails for VODs and clips',
    acceptedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  {
    id: 'emotes',
    name: 'Emotes',
    dimensions: '28x28, 56x56, 112x112',
    description: 'Custom channel emotes',
    acceptedFormats: ['image/png'],
    maxFileSize: 1 * 1024 * 1024, // 1MB
  },
  {
    id: 'badges',
    name: 'Subscriber Badges',
    dimensions: '18x18, 36x36, 72x72',
    description: 'Sub/bit badges',
    acceptedFormats: ['image/png'],
    maxFileSize: 1 * 1024 * 1024, // 1MB
  },
  {
    id: 'overlays',
    name: 'Camera Overlays',
    dimensions: 'Variable (PNG with transparency)',
    description: 'Webcam overlay frames',
    acceptedFormats: ['image/png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  {
    id: 'alerts',
    name: 'Alerts & Animations',
    dimensions: 'Variable',
    description: 'Sub/follow/donation alerts',
    acceptedFormats: ['image/png', 'image/gif', 'video/webm'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  {
    id: 'panels',
    name: 'Info Panels',
    dimensions: '320x100',
    description: 'Channel panels (Schedule, Socials, etc.)',
    acceptedFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
  },
  {
    id: 'offline',
    name: 'Offline Banner',
    dimensions: '1920x1080',
    description: 'Offline screen banner',
    acceptedFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
];

export const TWITCH_PLATFORM: PlatformConfig = {
  id: 'twitch',
  name: 'Twitch',
  color: '#9146FF',
  icon: 'twitch',
  categories: TWITCH_CATEGORIES,
};

// YouTube Platform Configuration
export const YOUTUBE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'thumbnails',
    name: 'Video Thumbnails',
    dimensions: '1280x720',
    description: 'Custom video thumbnails',
    acceptedFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
  },
  {
    id: 'banner',
    name: 'Channel Art',
    dimensions: '2560x1440',
    description: 'Channel banner (safe area: 1546x423)',
    acceptedFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 6 * 1024 * 1024, // 6MB
  },
  {
    id: 'endscreens',
    name: 'End Screens',
    dimensions: '1920x1080',
    description: 'End screen elements',
    acceptedFormats: ['image/png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
  },
  {
    id: 'watermark',
    name: 'Channel Watermark',
    dimensions: '150x150',
    description: 'Branding watermark/logo',
    acceptedFormats: ['image/png'],
    maxFileSize: 1 * 1024 * 1024, // 1MB
  },
];

export const YOUTUBE_PLATFORM: PlatformConfig = {
  id: 'youtube',
  name: 'YouTube',
  color: '#FF0000',
  icon: 'youtube',
  categories: YOUTUBE_CATEGORIES,
};

// TikTok Platform Configuration
export const TIKTOK_CATEGORIES: CategoryConfig[] = [
  {
    id: 'thumbnails',
    name: 'Video Thumbnails',
    dimensions: '1080x1920 (9:16)',
    description: 'Vertical video thumbnails',
    acceptedFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
  },
  {
    id: 'profile',
    name: 'Profile Image',
    dimensions: '200x200',
    description: 'Profile picture',
    acceptedFormats: ['image/png', 'image/jpeg'],
    maxFileSize: 1 * 1024 * 1024, // 1MB
  },
  {
    id: 'clips',
    name: 'Video Clips',
    dimensions: '1080x1920',
    description: 'Short-form video assets',
    acceptedFormats: ['video/mp4'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
];

export const TIKTOK_PLATFORM: PlatformConfig = {
  id: 'tiktok',
  name: 'TikTok',
  color: '#000000',
  icon: 'tiktok',
  categories: TIKTOK_CATEGORIES,
};

// All Platforms Registry
export const PLATFORMS: Record<string, PlatformConfig> = {
  twitch: TWITCH_PLATFORM,
  youtube: YOUTUBE_PLATFORM,
  tiktok: TIKTOK_PLATFORM,
  all: {
    id: 'all',
    name: 'All Platforms',
    color: '#6B7280',
    icon: 'all',
    categories: [],
  },
};

// Helper function to get platform by id
export function getPlatformById(id: string): PlatformConfig | undefined {
  return PLATFORMS[id];
}

// Helper function to get all platform ids
export function getAllPlatformIds(): string[] {
  return Object.keys(PLATFORMS);
}

// Helper function to get categories for a platform
export function getCategoriesForPlatform(platformId: string): CategoryConfig[] {
  const platform = getPlatformById(platformId);
  return platform?.categories || [];
}
