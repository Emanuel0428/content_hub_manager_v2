import React, { useState } from 'react'
import axios from 'axios'
import { Upload, Loader } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function UploadWidget({ onError }: { onError: (msg: string) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [platform, setPlatform] = useState('demo')
  const { darkMode } = useTheme()

  const handleFile = async (file: File) => {
    if (!file) return
    
    try {
      setIsLoading(true)
      setProgress(0)

      const form = new FormData()
      form.append('file', file, file.name)
      
      // Upload file
      const uploadRes = await axios.post('http://localhost:3001/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / (e.total || 1))
          setProgress(percent)
        }
      })

      // Create asset
      await axios.post('http://localhost:3001/api/assets', {
        title: file.name,
        platform: platform,
        path: uploadRes.data.path
      })

      setProgress(0)
      setIsLoading(false)
    } catch (err: any) {
      setIsLoading(false)
      console.error('Upload error:', err)
      onError(err.response?.data?.message || err.message || 'Upload failed')
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const selectStyles = `w-full px-3 py-2 rounded-lg border transition-all font-medium ${
    darkMode
      ? 'bg-slate-700 border-slate-600 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
  } disabled:opacity-50 disabled:cursor-not-allowed`

  return (
    <div className={`rounded-xl border p-6 transition-colors ${
      darkMode
        ? 'bg-slate-800 border-slate-700'
        : 'bg-white border-slate-200'
    }`}>
      <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${
        darkMode ? 'text-white' : 'text-slate-900'
      }`}>
        <Upload size={20} className="text-brand-500" />
        Upload Asset
      </h3>

      {/* Platform Selector */}
      <div className="mb-4">
        <label className={`block text-sm font-semibold mb-2 ${
          darkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Platform:
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={selectStyles}
          disabled={isLoading}
        >
          <option value="demo">Demo</option>
          <option value="twitch">Twitch</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? darkMode
              ? 'border-brand-500 bg-brand-900/30'
              : 'border-brand-500 bg-brand-50'
            : darkMode
            ? 'border-slate-600 hover:border-brand-400'
            : 'border-slate-300 hover:border-brand-400'
        }`}
      >
        <input
          type="file"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader size={24} className="text-brand-500 animate-spin" />
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Uploading...</p>
            <div className={`w-full rounded-full h-2 mt-2 ${
              darkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}>
              <div
                className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {progress}%
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-lg ${
              darkMode
                ? 'bg-brand-900/30'
                : 'bg-brand-50'
            }`}>
              <Upload size={24} className="text-brand-500" />
            </div>
            <div>
              <p className={`font-semibold ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Drop files here or click to browse
              </p>
              <p className={`text-xs mt-1 ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Supported: Images, Videos, Audio
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
