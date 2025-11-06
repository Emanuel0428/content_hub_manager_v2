import React, { useState } from 'react'
import { Moon, Sun, User, LogIn, LogOut, X } from 'lucide-react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { AuthProvider, useAuth, Protected } from './contexts/AuthContext'
import ErrorToast from './components/ErrorToast'
import Login from './components/Login'
import PlatformNavigator from './components/platform/PlatformNavigator'
import PlatformViewContainer from './components/platform/PlatformViewContainer'
import { usePlatform } from './hooks/usePlatform'
import UploadWidget from './components/UploadWidget'

function AppContent() {
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()
  const { activePlatform, setActivePlatform } = usePlatform()
  const { user, isAuthenticated, logout } = useAuth()

  const handleUploadComplete = () => {
    // Trigger refresh of asset lists
    setRefreshKey(prev => prev + 1)
  }

  const handleLoginSuccess = () => {
    setShowLogin(false)
    setRefreshKey(prev => prev + 1) // Refresh content after login
  }

  const handleLogout = async () => {
    try {
      await logout()
      setRefreshKey(prev => prev + 1) // Refresh content after logout
    } catch (error) {
      setError('Failed to logout')
    }
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
          
          <div className="flex items-center gap-4">
            {/* User Info and Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                  <User size={16} />
                  <span className="text-sm font-medium">{user?.displayName || user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105 ${darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
              >
                <LogIn size={16} />
                <span className="text-sm font-medium">Sign In</span>
              </button>
            )}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl transition-all hover:scale-105 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
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

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Authentication
              </h2>
              <button
                onClick={() => setShowLogin(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <Login onLoginSuccess={() => setShowLogin(false)} onClose={() => setShowLogin(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
