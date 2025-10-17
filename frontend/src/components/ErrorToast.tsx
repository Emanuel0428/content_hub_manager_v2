import React, { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export default function ErrorToast({
  error,
  onClose
}: {
  error: string | null
  onClose: () => void
}) {
  const [isVisible, setIsVisible] = useState(!!error)
  const { darkMode } = useTheme()

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, onClose])

  if (!error || !isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-right-4">
      <div className={`flex items-start gap-4 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
        darkMode
          ? 'bg-red-900/30 border-red-700/50'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle size={20} className="text-red-500" />
        </div>
        <div className="flex-1 max-w-xs">
          <p className={`text-sm font-semibold ${
            darkMode ? 'text-red-200' : 'text-red-900'
          }`}>
            Error
          </p>
          <p className={`text-sm mt-1 ${
            darkMode ? 'text-red-300' : 'text-red-800'
          }`}>
            {error}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            onClose()
          }}
          className={`flex-shrink-0 transition-colors ${
            darkMode
              ? 'text-red-400 hover:text-red-300'
              : 'text-red-600 hover:text-red-700'
          }`}
          aria-label="Close error"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
