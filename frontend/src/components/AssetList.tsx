import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Fuse from 'fuse.js'
import { Search, Loader, Grid, List as ListIcon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import AssetPreview from './AssetPreview'

interface Asset {
  id: number
  title: string
  platform: string
}

const getPlatformColor = (platform: string, darkMode: boolean) => {
  const platform_lower = platform.toLowerCase()
  const colors: Record<string, { light: string; dark: string }> = {
    twitch: {
      light: 'bg-purple-100 text-purple-700 border-purple-200',
      dark: 'bg-purple-900/30 text-purple-300 border-purple-700'
    },
    tiktok: {
      light: 'bg-slate-900 text-white border-slate-900',
      dark: 'bg-slate-700 text-slate-100 border-slate-600'
    },
    youtube: {
      light: 'bg-red-100 text-red-700 border-red-200',
      dark: 'bg-red-900/30 text-red-300 border-red-700'
    },
    instagram: {
      light: 'bg-pink-100 text-pink-700 border-pink-200',
      dark: 'bg-pink-900/30 text-pink-300 border-pink-700'
    },
    demo: {
      light: 'bg-blue-100 text-blue-700 border-blue-200',
      dark: 'bg-blue-900/30 text-blue-300 border-blue-700'
    },
  }
  const colorSet = colors[platform_lower] || colors.demo
  return darkMode ? colorSet.dark : colorSet.light
}

export default function AssetList({ onError }: { onError: (err: string) => void }) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const { darkMode } = useTheme()

  useEffect(() => {
    fetchAssets()
  }, [])

  async function fetchAssets() {
    try {
      setIsLoading(true)
      const res = await axios.get('http://localhost:3001/api/assets')
      setAssets(res.data.data || [])
    } catch (err: any) {
      console.error('Failed to load assets:', err)
      onError && onError(err.response?.data?.message || err.message || 'Failed to load assets')
    } finally {
      setIsLoading(false)
    }
  }

  const fuse = new Fuse(assets, { keys: ['title', 'platform'] })
  const filtered = query ? fuse.search(query).map(r => r.item) : assets

  const inputStyles = `w-full px-3 py-2 pl-10 rounded-lg border transition-all font-medium ${
    darkMode
      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
  }`

  return (
    <div className={`rounded-xl border p-6 transition-colors ${
      darkMode
        ? 'bg-slate-800 border-slate-700'
        : 'bg-white border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`font-bold text-lg m-0 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          <Grid size={20} className="text-brand-500" />
          Assets ({filtered.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-brand-600 text-white'
                : darkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="List view"
          >
            <ListIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-brand-600 text-white'
                : darkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className={`absolute left-3 top-3 ${
          darkMode ? 'text-slate-500' : 'text-slate-400'
        }`} size={18} />
        <input
          placeholder="Search assets..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={inputStyles}
        />
      </div>

      {/* Layout */}
      <div className={`grid gap-6 ${
        viewMode === 'list'
          ? 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1 gap-4'
      }`}>
        {/* Assets List */}
        <div className={viewMode === 'list' ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <div className={`space-y-2 max-h-96 overflow-y-auto rounded-lg border ${
            darkMode
              ? 'border-slate-700 bg-slate-900/30 p-3'
              : 'border-slate-200 bg-slate-50 p-3'
          }`}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader size={24} className="text-brand-500 animate-spin mx-auto mb-2" />
                  <p className={`text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>Loading assets...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className={`text-center py-12 ${
                darkMode ? 'text-slate-500' : 'text-slate-600'
              }`}>
                <p className="text-sm font-medium">
                  {assets.length === 0 ? 'No assets yet' : 'No results'}
                </p>
                <p className="text-xs mt-1">
                  {assets.length === 0 ? 'Upload one to get started!' : 'Try a different search'}
                </p>
              </div>
            ) : (
              filtered.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => setSelected(asset.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all border-2 ${
                    selected === asset.id
                      ? darkMode
                        ? 'border-brand-500 bg-brand-900/20'
                        : 'border-brand-500 bg-brand-50'
                      : darkMode
                      ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className={`font-semibold truncate ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {asset.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${
                      getPlatformColor(asset.platform, darkMode)
                    }`}>
                      {asset.platform.toUpperCase()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Preview */}
        <div className={viewMode === 'list' ? 'lg:col-span-1' : 'lg:col-span-2'}>
          {selected && filtered.some(a => a.id === selected) ? (
            <div className={`rounded-lg p-4 sticky top-0 max-h-96 overflow-y-auto border ${
              darkMode
                ? 'bg-slate-900/30 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <AssetPreview id={selected} onError={onError} />
            </div>
          ) : (
            <div className={`flex items-center justify-center h-96 rounded-lg border-2 border-dashed ${
              darkMode
                ? 'border-slate-700 bg-slate-900/30 text-slate-500'
                : 'border-slate-300 bg-slate-50 text-slate-600'
            }`}>
              <p className="text-center text-sm font-medium">
                {selected ? 'Asset not found' : 'Select an asset to preview'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
