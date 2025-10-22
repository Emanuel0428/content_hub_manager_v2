// Platform Types
export type Platform = 'twitch' | 'youtube' | 'tiktok' | 'all';

// Platform Configuration Interface
export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string; // Hex color
  icon: string; // Icon identifier (can be replaced with React.ComponentType later)
  categories: CategoryConfig[];
}

// Category Configuration Interface
export interface CategoryConfig {
  id: string;
  name: string;
  dimensions?: string; // e.g., '1920x1080'
  description?: string;
  icon?: string; // Icon identifier
  acceptedFormats?: string[]; // e.g., ['image/png', 'image/jpeg']
  maxFileSize?: number; // bytes
}

// Upload Context Interface
export interface UploadContext {
  platform: Platform;
  category?: string;
  folderId?: string;
}
