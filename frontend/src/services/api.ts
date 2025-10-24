import axios from 'axios'
import type { Platform } from '../types/platform'

const api = axios.create({ baseURL: 'http://localhost:3001' })

// Asset interfaces
export interface Asset {
  id: number
  title: string
  platform: string
  category?: string
  resolution?: string
  width?: number
  height?: number
  tags?: string[]
  description?: string
  file_size?: number
  mime_type?: string
  folder_id?: number
  created_at: string
  version_id?: number
  version_path?: string
  versions?: AssetVersion[]
}

export interface AssetVersion {
  id: number
  path: string
  created_at: string
}

export interface CreateAssetPayload {
  title: string
  platform: string
  category?: string
  resolution?: string
  width?: number
  height?: number
  tags?: string[]
  description?: string
  file_size?: number
  mime_type?: string
  path: string
}

export interface UpdateAssetPayload {
  title?: string
  category?: string
  resolution?: string
  width?: number
  height?: number
  tags?: string[]
  description?: string
}

export interface PlatformStats {
  platform: string
  total_assets: number
  categories_used: number
}

export interface CategoryStats {
  category: string
  asset_count: number
}

// Assets API
export async function listAssets(filters?: {
  platform?: Platform
  category?: string
  resolution?: string
}) {
  const params = new URLSearchParams()
  if (filters?.platform && filters.platform !== 'all') {
    params.append('platform', filters.platform)
  }
  if (filters?.category) {
    params.append('category', filters.category)
  }
  if (filters?.resolution) {
    params.append('resolution', filters.resolution)
  }
  
  const r = await api.get<{ data: Asset[] }>(`/api/assets?${params.toString()}`)
  return r.data
}

export async function getAsset(id: number) {
  const r = await api.get<{ data: Asset }>(`/api/assets/${id}`)
  return r.data
}

export async function createAsset(payload: CreateAssetPayload) {
  const r = await api.post<{ id: number }>('/api/assets', payload)
  return r.data
}

export async function updateAsset(id: number, payload: UpdateAssetPayload) {
  const r = await api.patch<{ ok: boolean }>(`/api/assets/${id}`, payload)
  return r.data
}

export async function moveAsset(id: number, folderId: number | null) {
  const r = await api.put<{ ok: boolean }>(`/api/assets/${id}/move`, { folder_id: folderId })
  return r.data
}

// Statistics API
export async function getPlatformStats() {
  const r = await api.get<{ data: PlatformStats[] }>('/api/stats/platforms')
  return r.data
}

export async function getCategoryStats(platform: string) {
  const r = await api.get<{ data: CategoryStats[] }>(`/api/stats/categories?platform=${platform}`)
  return r.data
}

// Events API
export async function listEvents() {
  const r = await api.get<{ data: any[] }>('/api/events')
  return r.data
}

// Upload API
export async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const r = await api.post<{ path: string }>('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return r.data
}

// Folders API
export async function listFolders() {
  const r = await api.get<{ data: any[] }>('/api/folders')
  return r.data
}

export async function createFolder(name: string) {
  const r = await api.post<{ id: number }>('/api/folders', { name })
  return r.data
}

export async function getFolder(id: number) {
  const r = await api.get<{ data: any }>(`/api/folders/${id}`)
  return r.data
}

export async function updateFolder(id: number, name: string) {
  const r = await api.put<{ ok: boolean }>(`/api/folders/${id}`, { name })
  return r.data
}

export async function deleteFolder(id: number) {
  const r = await api.delete<{ ok: boolean }>(`/api/folders/${id}`)
  return r.data
}

export default api

