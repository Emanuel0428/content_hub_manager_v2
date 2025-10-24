import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Loader, Play, Music, Download, AlertCircle, Edit2, Save, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import ChecklistPanel from './ChecklistPanel'
import { PLATFORMS, getCategoriesForPlatform } from '../constants/platforms'
import { getErrorMessage } from '../utils/errorHandling'
import type { Platform } from '../types/platform'

interface AssetDetail {
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
  created_at: string
  versions: Array<{ id: number; path: string; created_at: string }>
}

export default function AssetPreview({ id, onError }: { id: number; onError: (msg: string) => void }) {
  const [asset, setAsset] = useState<AssetDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { darkMode } = useTheme()

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    platform: '' as Platform,
    category: '',
    resolution: '',
    width: '',
    height: '',
    tags: '',
    description: ''
  })

  useEffect(() => {
    if (id) fetchAsset()
  }, [id])

  async function fetchAsset() {
    try {
      setIsLoading(true)
      const res = await axios.get(`http://localhost:3001/api/assets/${id}`)
      const data = res.data.data
      setAsset(data)
      
      // Initialize edit form
      setEditForm({
        title: data.title || '',
        platform: data.platform || 'twitch',
        category: data.category || '',
        resolution: data.resolution || '',
        width: data.width?.toString() || '',
        height: data.height?.toString() || '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        description: data.description || ''
      })
    } catch (err: unknown) {
      console.error('Failed to load asset:', err)
      onError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true)
      
      // Parse tags from comma-separated string
      const tagsArray = editForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
      
      await axios.patch(`http://localhost:3001/api/assets/${id}`, {
        title: editForm.title,
        category: editForm.category || null,
        resolution: editForm.resolution || null,
        width: editForm.width ? parseInt(editForm.width) : null,
        height: editForm.height ? parseInt(editForm.height) : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        description: editForm.description || null
      })
      
      setIsEditing(false)
      await fetchAsset() // Refresh data
    } catch (err: unknown) {
      console.error('Failed to update asset:', err)
      onError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
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
  const isAudio = path.match(/\.(mp3|wav|ogg|aac|m4a)$/i)

  const platformConfig = PLATFORMS[asset.platform]
  const platformColor = platformConfig?.color || '#6366f1'
  const categories = getCategoriesForPlatform(editForm.platform)

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-all ${
    darkMode
      ? 'bg-slate-700 border-slate-600 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
  }`

  return (
    <div className="space-y-6">
      {/* Asset Header */}
      <div className="rounded-lg p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${platformColor} 0%, ${platformColor}dd 100%)` }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="bg-white/20 text-white placeholder-white/60 border-white/30 w-full px-3 py-2 rounded-lg text-xl font-bold"
                placeholder="Asset title"
              />
            ) : (
              <h2 className="text-2xl font-bold mb-2 break-words">{asset.title}</h2>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm opacity-90 mt-2">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold text-xs">
                {platformConfig?.name || asset.platform.toUpperCase()}
              </span>
              {asset.category && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                  {asset.category}
                </span>
              )}
              <span>{new Date(asset.created_at).toLocaleDateString('es-ES')}</span>
            </div>
          </div>
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}
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

      {/* Metadata Section */}
      {isEditing && (
        <div className={`p-6 rounded-lg border ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Edit Metadata
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Platform Selector (Read-only for now) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Platform
              </label>
              <input
                type="text"
                value={platformConfig?.name || asset.platform}
                disabled
                className={`${inputStyles} opacity-60 cursor-not-allowed`}
              />
              <p className="text-xs mt-1 text-slate-500">Platform cannot be changed</p>
            </div>

            {/* Category Selector */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Category
              </label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className={inputStyles}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Resolution */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Resolution
              </label>
              <input
                type="text"
                value={editForm.resolution}
                onChange={(e) => setEditForm({ ...editForm, resolution: e.target.value })}
                placeholder="e.g., 1920x1080"
                className={inputStyles}
              />
            </div>

            {/* Width */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Width (px)
              </label>
              <input
                type="number"
                value={editForm.width}
                onChange={(e) => setEditForm({ ...editForm, width: e.target.value })}
                placeholder="1920"
                className={inputStyles}
              />
            </div>

            {/* Height */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Height (px)
              </label>
              <input
                type="number"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                placeholder="1080"
                className={inputStyles}
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="gaming, overlay, purple"
                className={inputStyles}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add a description..."
                rows={3}
                className={inputStyles}
              />
            </div>
          </div>
        </div>
      )}

      {/* Display Metadata (when not editing) */}
      {!isEditing && (
        <div className={`p-6 rounded-lg border ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`font-bold text-lg mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Asset Information
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Platform:</span>
              <p className={`mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{platformConfig?.name || asset.platform}</p>
            </div>
            
            {asset.category && (
              <div>
                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Category:</span>
                <p className={`mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{asset.category}</p>
              </div>
            )}
            
            {asset.resolution && (
              <div>
                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Resolution:</span>
                <p className={`mt-1 font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>{asset.resolution}</p>
              </div>
            )}
            
            {(asset.width || asset.height) && (
              <div>
                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Dimensions:</span>
                <p className={`mt-1 font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {asset.width}x{asset.height}px
                </p>
              </div>
            )}
            
            {asset.file_size && (
              <div>
                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>File Size:</span>
                <p className={`mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {(asset.file_size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
            
            {asset.mime_type && (
              <div>
                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Type:</span>
                <p className={`mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{asset.mime_type}</p>
              </div>
            )}
            
            {asset.tags && asset.tags.length > 0 && (
              <div className="col-span-2">
                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tags:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {asset.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded text-xs ${
                        darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {asset.description && (
              <div className="col-span-2">
                <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Description:</span>
                <p className={`mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{asset.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checklist Panel */}
      <ChecklistPanel assetId={asset.id} onError={onError} />
    </div>
  )
}
