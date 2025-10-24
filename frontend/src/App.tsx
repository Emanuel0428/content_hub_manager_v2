import React, { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import UploadWidget from './components/UploadWidget'
import ErrorToast from './components/ErrorToast'
import PlatformNavigator from './components/platform/PlatformNavigator'
import PlatformViewContainer from './components/platform/PlatformViewContainer'
import { usePlatform } from './hooks/usePlatform'

function AppContent() {
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { darkMode, toggleDarkMode } = useTheme()
  const { activePlatform, setActivePlatform } = usePlatform()

  const handleUploadComplete = () => {
    // Trigger refresh of asset lists
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className={`text-3xl font-black bg-gradient-to-r from-brand-500 to-brand-600 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Content Hub
            </h1>
            <p className={`text-xs font-semibold uppercase tracking-wider transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Multi-Platform Asset Manager
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl transition-all hover:scale-105 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Platform Navigation */}
        <PlatformNavigator
          activePlatform={activePlatform}
          onPlatformChange={setActivePlatform}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Upload Widget */}
          <div className="lg:col-span-1">
            <UploadWidget 
              onError={setError}
              onUploadComplete={handleUploadComplete}
            />
          </div>

          {/* Main Content - Platform Views */}
          <div className="lg:col-span-3">
            <PlatformViewContainer
              key={refreshKey} // Force re-render on upload
              activePlatform={activePlatform}
              onError={setError}
            />
          </div>
        </div>
      </main>

      {/* Error Toast */}
      <ErrorToast error={error} onClose={() => setError(null)} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
