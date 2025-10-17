import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader, Play, Music, Download, AlertCircle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import ChecklistPanel from './ChecklistPanel'
import AssetFolderSelector from './AssetFolderSelector.tsx'

interface AssetDetail {
  id: number
  title: string
  platform: string
  folder_id: number | null
  created_at: string
  versions: Array<{ id: number; path: string; created_at: string }>
}

export default function AssetPreview({ id, onError }: { id: number; onError: (msg: string) => void }) {
  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    if (id) fetchAsset()
  }, [id])

  async function fetchAsset() {
    try {
      setIsLoading(true)
      const res = await axios.get(`http://localhost:3001/api/assets/${id}`)
      setAsset(res.data.data)
    } catch (err: any) {
      console.error('Failed to load asset:', err)
      onError(err.response?.data?.message || err.message || 'Failed to load asset')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader size={32} className="text-brand-500 animate-spin mb-3 mx-auto" />
          <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Loading asset...</p>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg border-2 border-dashed ${
        darkMode
          ? 'border-slate-700 bg-slate-800/50 text-slate-400'
          : 'border-slate-300 bg-slate-50 text-slate-600'
      }`}>
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p>Failed to load asset</p>
        </div>
      </div>
    )
  }

  const v = asset.versions && asset.versions[0]
  if (!v) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg border-2 border-dashed ${
        darkMode
          ? 'border-slate-700 bg-slate-800/50 text-slate-400'
          : 'border-slate-300 bg-slate-50 text-slate-600'
      }`}>
        <p>No versions available</p>
      </div>
    )
  }

  const path = `http://localhost:3001${v.path}`
  const isImage = path.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  const isVideo = path.match(/\.(mp4|webm|ogg|mov)$/i)
  const isAudio = path.match(/\.(mp3|wav|ogg|aac)$/i)

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitch: 'bg-purple-600',
      tiktok: 'bg-slate-900',
      youtube: 'bg-red-600',
      instagram: 'bg-pink-600',
      demo: 'bg-blue-600',
    }
    return colors[platform.toLowerCase()] || 'bg-brand-500'
  }

  return (
    <div className="space-y-6">
      {/* Asset Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 break-words">{asset.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm opacity-90">
              <span className={`${getPlatformColor(asset.platform)} text-white px-3 py-1 rounded-full font-semibold text-xs`}>
                {asset.platform.toUpperCase()}
              </span>
              <span>{new Date(asset.created_at).toLocaleDateString('es-ES')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Media Preview */}
      <div className={`rounded-lg overflow-hidden shadow-lg border ${
        darkMode
          ? 'bg-slate-900 border-slate-700'
          : 'bg-slate-100 border-slate-200'
      }`}>
        {isImage && (
          <img
            src={path}
            alt={asset.title}
            className="w-full h-auto max-h-96 object-cover"
            onError={() => onError('Failed to load image')}
          />
        )}
        {isVideo && (
          <video
            src={path}
            controls
            className="w-full h-auto max-h-96 object-contain"
            onError={() => onError('Failed to load video')}
          >
            Your browser does not support the video tag.
          </video>
        )}
        {isAudio && (
          <div className={`p-12 flex flex-col items-center justify-center ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="p-4 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full mb-4">
              <Music size={32} className="text-white" />
            </div>
            <p className={`mb-6 text-center font-medium ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>{asset.title}</p>
            <audio
              src={path}
              controls
              className="w-full max-w-xs"
              onError={() => onError('Failed to load audio')}
            />
          </div>
        )}
        {!isImage && !isVideo && !isAudio && (
          <div className={`p-12 flex flex-col items-center justify-center ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <Download size={48} className={`mb-4 ${
              darkMode ? 'text-slate-600' : 'text-slate-400'
            }`} />
            <p className={`mb-6 ${
              darkMode ? 'text-slate-500' : 'text-slate-600'
            }`}>File preview not available</p>
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <Download size={16} />
              Download
            </a>
          </div>
        )}
      </div>

      {/* Checklist Panel */}
      <ChecklistPanel assetId={asset.id} onError={onError} />

      {/* Move to Folder */}
      <AssetFolderSelector
        assetId={asset.id}
        currentFolderId={asset.folder_id}
        onError={onError}
        onSuccess={() => {
          // Refresh asset data after successful move
          fetchAsset()
        }}
      />
    </div>
  )
}
