import React, { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import UploadWidget from './components/UploadWidget'
import AssetList from './components/AssetList'
import ErrorToast from './components/ErrorToast'
import EventsViewer from './components/EventsViewer'
import FolderManager from './components/FolderManager'
import PlatformNavigator from './components/platform/PlatformNavigator'
import PlatformViewContainer from './components/platform/PlatformViewContainer'
import { usePlatform } from './hooks/usePlatform'

function AppContent() {
  const [error, setError] = useState<string | null>(null)
  const { darkMode, toggleDarkMode } = useTheme()
  const { activePlatform, setActivePlatform } = usePlatform()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-slate-900' : 'bg-white'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col gap-0">
            <h1 className="text-2xl font-black bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">
              Content Hub
            </h1>
            <p className={`text-xs font-medium transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Digital Content Manager
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
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

        {/* Platform-Specific Content */}
        <div className="mb-6">
          <PlatformViewContainer
            activePlatform={activePlatform}
            onError={setError}
          />
        </div>

        {/* Original Layout - Keep for now, will integrate with platform views later */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10 pt-10 border-t border-slate-200 dark:border-slate-700">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Upload Widget */}
            <UploadWidget onError={setError} />

            {/* Folder Manager */}
            <div className={`rounded-xl border p-6 transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <FolderManager onError={setError} />
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Asset List */}
            <AssetList onError={setError} />
          </div>
        </div>

        {/* Events Viewer */}
        <div className="mt-10">
          <EventsViewer />
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
