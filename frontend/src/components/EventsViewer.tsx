import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Activity, RefreshCw, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface Event {
  id: number
  event_type: string
  data: string
  created_at: string
}

export default function EventsViewer() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, 3000)
    return () => clearInterval(interval)
  }, [])

  async function fetchEvents() {
    try {
      setIsLoading(true)
      const r = await axios.get('http://localhost:3001/api/events')
      setEvents((r.data.data || []).reverse()) // Show newest first
    } catch (e) {
      console.error('Failed to fetch events:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventBgColor = (type: string) => {
    const colors: Record<string, string> = {
      'asset.created': darkMode ? 'bg-blue-900/40 border-blue-700' : 'bg-blue-50 border-blue-200',
      'asset.moved': darkMode ? 'bg-purple-900/40 border-purple-700' : 'bg-purple-50 border-purple-200',
      'checklist.updated': darkMode ? 'bg-green-900/40 border-green-700' : 'bg-green-50 border-green-200',
      'folder.created': darkMode ? 'bg-indigo-900/40 border-indigo-700' : 'bg-indigo-50 border-indigo-200',
      'upload.completed': darkMode ? 'bg-amber-900/40 border-amber-700' : 'bg-amber-50 border-amber-200',
    }
    return colors[type] || (darkMode ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-100 border-slate-200')
  }

  const getEventTextColor = (type: string) => {
    const colors: Record<string, string> = {
      'asset.created': darkMode ? 'text-blue-300' : 'text-blue-900',
      'asset.moved': darkMode ? 'text-purple-300' : 'text-purple-900',
      'checklist.updated': darkMode ? 'text-green-300' : 'text-green-900',
      'folder.created': darkMode ? 'text-indigo-300' : 'text-indigo-900',
      'upload.completed': darkMode ? 'text-amber-300' : 'text-amber-900',
    }
    return colors[type] || (darkMode ? 'text-slate-300' : 'text-slate-900')
  }

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      'asset.created': '📤',
      'asset.moved': '🔄',
      'checklist.updated': '✅',
      'folder.created': '📁',
      'upload.completed': '✨',
    }
    return icons[type] || '📌'
  }

  const formatEventData = (data: string) => {
    try {
      const parsed = JSON.parse(data || '{}')
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      return data || '{}'
    }
  }

  const getCardStyles = () => {
    return `rounded-xl border p-6 transition-colors ${
      darkMode
        ? 'bg-slate-800 border-slate-700'
        : 'bg-white border-slate-200'
    }`
  }

  return (
    <div className={getCardStyles()}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between rounded-lg p-3 transition-all ${
          darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-brand-500">
            <Activity size={20} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Activity Log
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {events.length} event{events.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Refresh Button */}
          <button
            onClick={fetchEvents}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode
                ? 'bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white'
                : 'bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-900'
            }`}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Events List */}
          <div className={`space-y-2 max-h-96 overflow-y-auto rounded-lg border ${
            darkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'
          } p-3`}>
            {events.length === 0 ? (
              <div className={`text-center py-12 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Activity size={32} className="mx-auto opacity-50 mb-2" />
                <p className="font-medium">No events yet</p>
                <p className="text-xs mt-1">Events will appear here as they happen</p>
              </div>
            ) : (
              events.map((ev, idx) => {
                const bgColor = getEventBgColor(ev.event_type)
                const textColor = getEventTextColor(ev.event_type)
                const formattedData = formatEventData(ev.data)
                const timestamp = new Date(ev.created_at)
                const timeStr = timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })

                return (
                  <div
                    key={`${ev.id}-${idx}`}
                    className={`border-l-4 p-3 rounded-lg transition-all hover:shadow-md ${bgColor}`}
                  >
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">{getEventIcon(ev.event_type)}</span>
                      <div className="flex-1 min-w-0">
                        {/* Event Type */}
                        <p className={`font-bold text-sm ${textColor} uppercase tracking-wide`}>
                          {ev.event_type}
                        </p>
                        {/* Event Data */}
                        <pre className={`text-xs mt-2 p-2 rounded overflow-x-auto ${
                          darkMode
                            ? 'bg-slate-900/60 text-slate-200'
                            : 'bg-white text-slate-800'
                        }`}>
                          {formattedData}
                        </pre>
                        {/* Timestamp */}
                        <p className={`text-xs mt-2 ${
                          darkMode ? 'text-slate-500' : 'text-slate-600'
                        }`}>
                          {timeStr}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
