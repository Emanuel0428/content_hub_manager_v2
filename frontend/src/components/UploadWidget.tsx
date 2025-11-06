import React, { useState, useEffect } from 'react'
import { Upload, Loader } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { usePlatform } from '../hooks/usePlatform'
import { useAuth } from '../contexts/AuthContext'
import { getCategoriesForPlatform } from '../constants/platforms'
import { getErrorMessage } from '../utils/errorHandling'
import { createAsset, uploadFile } from '../services/api'
import type { Platform } from '../types/platform'

interface UploadWidgetProps {
  onError: (msg: string) => void
  onUploadComplete?: () => void
}

export default function UploadWidget({ onError, onUploadComplete }: UploadWidgetProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { darkMode } = useTheme()
  const { activePlatform } = usePlatform()
  const { user } = useAuth()
  
  // Use active platform from context, but allow manual override
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(activePlatform)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  // Get categories for selected platform
  const categories = getCategoriesForPlatform(selectedPlatform)
  
  // Update selected platform when active platform changes
  useEffect(() => {
    if (activePlatform !== 'all') {
      setSelectedPlatform(activePlatform)
      setSelectedCategory('') // Reset category when platform changes
    }
  }, [activePlatform])
  
  // Auto-select first category when platform changes
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  // Function to validate image dimensions
  const validateImageDimensions = (file: File, category: any): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(true) // Skip validation for non-images
        return
      }

      const img = new Image()
      img.onload = () => {
        const { width, height } = img
        const dimensions = category.dimensions

        // Skip validation for "Variable" dimensions
        if (dimensions.includes('Variable')) {
          resolve(true)
          return
        }

        // Parse expected dimensions (e.g., "1920x1080" or "28x28, 56x56, 112x112")
        const validDimensions = dimensions.split(', ').map((dim: string) => {
          const [w, h] = dim.split('x').map(Number)
          return { width: w, height: h }
        })

        // Check if current image matches any valid dimension (±100px tolerance)
        const tolerance = 100
        const isValid = validDimensions.some((validDim: any) => {
          const widthMatch = Math.abs(width - validDim.width) <= tolerance
          const heightMatch = Math.abs(height - validDim.height) <= tolerance
          return widthMatch && heightMatch
        })

        if (!isValid) {
          const expectedText = validDimensions.map((d: any) => `${d.width}x${d.height}`).join(' or ')
          onError(`Image dimensions (${width}x${height}) don't match expected size: ${expectedText} (±${tolerance}px tolerance)`)
        }

        resolve(isValid)
      }

      img.onerror = () => {
        onError('Failed to read image dimensions')
        resolve(false)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleFile = async (file: File) => {
    if (!file) return
    
    if (!user) {
      onError('Please log in before uploading')
      return
    }
    
    // Validate platform and category
    if (selectedPlatform === 'all') {
      onError('Please select a specific platform before uploading')
      return
    }
    
    if (!selectedCategory) {
      onError('Please select a category before uploading')
      return
    }
    
    // Get selected category details for validation
    const selectedCategoryDetails = categories.find(cat => cat.id === selectedCategory)
    if (!selectedCategoryDetails) {
      onError('Invalid category selected')
      return
    }
    
    // Validate image dimensions
    const dimensionsValid = await validateImageDimensions(file, selectedCategoryDetails)
    if (!dimensionsValid) {
      return // Error already shown in validation function
    }
    
    try {
      setIsLoading(true)
      setProgress(0)

      const form = new FormData()
      form.append('file', file, file.name)
      
      console.log('📤 Uploading file to backend:', file.name)
      
      // Upload file to Supabase Storage using configured api instance
      const uploadRes = await uploadFile(file)
      console.log('✅ File uploaded successfully:', uploadRes)

      // Get image dimensions if it's an image
      let imageDimensions = null
      if (file.type.startsWith('image/')) {
        imageDimensions = await new Promise<{width: number, height: number}>((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ width: img.width, height: img.height })
          img.src = URL.createObjectURL(file)
        })
      }

      // Create asset metadata in Supabase database
      const assetResult = await createAsset({
        name: file.name,
        platform_origin: selectedPlatform,
        type: 'file',
        metadata: {
          category: selectedCategory,
          originalMimeType: file.type,
          dimensions: imageDimensions ? `${imageDimensions.width}x${imageDimensions.height}` : null,
          categoryExpected: selectedCategoryDetails.dimensions
        },
        storagePath: uploadRes.path,
        size_bytes: file.size,
        userId: user.id
      })

      console.log('✅ Asset created:', assetResult)

      setProgress(0)
      setIsLoading(false)
      
      // Notify parent component
      onUploadComplete?.()
    } catch (err: unknown) {
      setIsLoading(false)
      console.error('❌ Upload error:', err)
      onError(getErrorMessage(err))
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
          Platform: <span className="text-brand-500">*</span>
        </label>
        <select
          value={selectedPlatform}
          onChange={(e) => {
            setSelectedPlatform(e.target.value as Platform)
            setSelectedCategory('') // Reset category on platform change
          }}
          className={selectStyles}
          disabled={isLoading}
        >
          {activePlatform === 'all' && <option value="all">Select Platform...</option>}
          <option value="twitch">Twitch</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>

      {/* Category Selector */}
      {selectedPlatform !== 'all' && categories.length > 0 && (
        <div className="mb-4">
          <label className={`block text-sm font-semibold mb-2 ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Category: <span className="text-brand-500">*</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={selectStyles}
            disabled={isLoading}
          >
            <option value="">Select Category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} {cat.dimensions && `(${cat.dimensions})`}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {categories.find(c => c.id === selectedCategory)?.description}
            </p>
          )}
        </div>
      )}

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
