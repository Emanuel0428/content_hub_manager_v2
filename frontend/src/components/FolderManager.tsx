import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Folder, Plus, Trash2, FolderOpen, Loader } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface FolderType {
  id: number
  name: string
  assets: Array<{ id: number; title: string; platform: string }>
  created_at: string
}

export default function FolderManager({ onError }: { onError: (msg: string) => void }) {
  const [folders, setFolders] = useState<FolderType[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const { darkMode } = useTheme()

  useEffect(() => {
    fetchFolders()
  }, [])

  async function fetchFolders() {
    try {
      setIsFetching(true)
      const res = await axios.get('http://localhost:3001/api/folders')
      setFolders(res.data.data || [])
    } catch (err: any) {
      console.error('Failed to load folders:', err)
      onError(err.response?.data?.message || err.message || 'Failed to load folders')
    } finally {
      setIsFetching(false)
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    try {
      setIsLoading(true)
      await axios.post('http://localhost:3001/api/folders', { name: newFolderName })
      setNewFolderName('')
      await fetchFolders()
    } catch (err: any) {
      console.error('Failed to create folder:', err)
      onError(err.response?.data?.message || err.message || 'Failed to create folder')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteFolder(id: number) {
    if (confirm('Are you sure you want to delete this folder? Assets in it will be unlinked.')) {
      try {
        await axios.delete(`http://localhost:3001/api/folders/${id}`)
        await fetchFolders()
      } catch (err: any) {
        console.error('Failed to delete folder:', err)
        onError(err.response?.data?.message || err.message || 'Failed to delete folder')
      }
    }
  }

  const inputStyles = `w-full px-3 py-2 rounded-lg border transition-all font-medium ${
    darkMode
      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
  } disabled:opacity-50 disabled:cursor-not-allowed`

  const buttonStyles = `px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
    darkMode
      ? 'bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
      : 'bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
  }`

  return (
    <div className="space-y-4">
      <h3 className={`font-bold text-lg flex items-center gap-2 ${
        darkMode ? 'text-white' : 'text-slate-900'
      }`}>
        <Folder size={20} className="text-brand-500" />
        Folders
      </h3>

      {/* Create Folder Input */}
      <div className="flex gap-2">
        <input
          placeholder="New folder name..."
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleCreateFolder()}
          className={inputStyles}
          disabled={isLoading}
        />
        <button
          onClick={handleCreateFolder}
          disabled={isLoading || !newFolderName.trim()}
          className={buttonStyles}
          title="Create new folder"
        >
          {isLoading ? (
            <>
              <Loader size={16} className="animate-spin" />
              <span className="hidden sm:inline">Creating...</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span className="hidden sm:inline">Add</span>
            </>
          )}
        </button>
      </div>

      {/* Folders List */}
      <div className={`space-y-2 max-h-80 overflow-y-auto rounded-lg border ${
        darkMode
          ? 'border-slate-700 bg-slate-900/30 p-3'
          : 'border-slate-200 bg-slate-50 p-3'
      }`}>
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={20} className="text-brand-500 animate-spin mr-2" />
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Loading folders...</span>
          </div>
        ) : folders.length === 0 ? (
          <div className={`text-center py-8 ${
            darkMode ? 'text-slate-500' : 'text-slate-600'
          }`}>
            <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No folders yet</p>
            <p className="text-xs mt-1">Create one to organize your assets!</p>
          </div>
        ) : (
          folders.map(folder => (
            <div
              key={folder.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                darkMode
                  ? 'border-slate-600 bg-slate-700/50 hover:bg-slate-600 hover:border-slate-500'
                  : 'border-slate-200 bg-white hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Folder size={18} className="text-brand-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className={`font-semibold truncate ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {folder.name}
                  </p>
                  <p className={`text-xs ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {folder.assets?.length || 0} asset{folder.assets?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteFolder(folder.id)}
                className={`p-2 rounded-lg flex-shrink-0 transition-all ml-2 ${
                  darkMode
                    ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                    : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                }`}
                title="Delete folder"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
