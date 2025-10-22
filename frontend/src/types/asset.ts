import type { Platform } from './platform';

// Original Asset interface (from 001)
export interface Asset {
  id: string;
  name: string;
  folderId?: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  thumbnailPath?: string;
  uploadDate: string;
  lastModified: string;
  
  // NEW FIELDS for v002
  platform: Platform;
  category?: string;
  resolution?: string;
  tags?: string[]; // Parsed from JSON string in DB
}

// Asset filter parameters
export interface AssetFilterParams {
  platform?: Platform;
  category?: string;
  folderId?: string;
  search?: string;
  sortBy?: 'name' | 'uploadDate' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

// Update Asset Metadata Request
export interface UpdateAssetMetadataRequest {
  platform?: Platform;
  category?: string;
  resolution?: string;
  tags?: string[];
}
