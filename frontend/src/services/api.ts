import axios from 'axios'
import { authService } from './auth'
import type { Platform } from '../types/platform'

const api = axios.create({
  baseURL:(import.meta as any).VITE_SUPABASE_URL || 'http://localhost:3001'
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader() as { Authorization?: string }
  if (authHeader && authHeader.Authorization) {
    config.headers.Authorization = authHeader.Authorization
  }
  // Only set Content-Type for non-multipart requests
  if (!config.data || !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await authService.refreshSession()
        const authHeader = authService.getAuthHeader() as { Authorization?: string }
        if (authHeader && authHeader.Authorization) {
          originalRequest.headers.Authorization = authHeader.Authorization
        }
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

// Asset interfaces
export interface Asset {
  id: string
  name: string
  type: string
  platform_origin: string
  size_bytes?: number
  metadata?: Record<string, any>
  created_at: string
  updated_at?: string
  asset_versions?: AssetVersion[]
}

export interface AssetVersion {
  id: string
  asset_id: string
  version_number: number
  storage_path: string
  created_at: string
  created_by?: string
}

export interface CreateAssetPayload {
  name: string
  platform_origin: string
  type?: string
  metadata?: Record<string, any>
  storagePath: string
  size_bytes?: number
  userId?: string
}

export interface UpdateAssetPayload {
  name?: string
  platform_origin?: string
  metadata?: Record<string, any>
}

export interface PlatformStats {
  platform_origin: string
  count: number
}

// Assets API
export async function listAssets(filters?: {
  platform?: Platform
  category?: string
  resolution?: string
  userId?: string
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
  if (filters?.userId) {
    params.append('userId', filters.userId)
  }
  
  const r = await api.get<{ success: boolean; data: Asset[] }>(`/api/assets?${params.toString()}`)
  return r.data
}

export async function getAsset(id: string) {
  const r = await api.get<{ success: boolean; data: Asset }>(`/api/assets/${id}`)
  return r.data
}

export async function createAsset(payload: CreateAssetPayload) {
  const r = await api.post<{ success: boolean; id: string }>('/api/assets', payload)
  return r.data
}

export async function updateAsset(id: string, payload: UpdateAssetPayload) {
  const r = await api.patch<{ success: boolean }>(`/api/assets/${id}`, payload)
  return r.data
}

// Upload API
export async function uploadFile(file: File, onProgress?: (progress: number) => void) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Statistics API
export async function getPlatformStats() {
  const r = await api.get<{ success: boolean; data: PlatformStats[] }>('/api/stats/platforms')
  return r.data
}

export default api

