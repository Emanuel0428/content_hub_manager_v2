import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { CheckCircle2, Circle, Loader } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface ChecklistItem {
  key: string
  label: string
  completed: boolean
}

interface ChecklistData {
  assetId: number
  platform: string
  items: ChecklistItem[]
}

export default function ChecklistPanel({
  assetId,
  onError
}: {
  assetId: number
  onError: (msg: string) => void
}) {
  const [checklist, setChecklist] = useState<ChecklistData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { darkMode } = useTheme()

  useEffect(() => {
    if (assetId) fetchChecklist()
  }, [assetId])

  async function fetchChecklist() {
    try {
      setIsLoading(true)
      const res = await axios.get(`http://localhost:3001/api/checklists/${assetId}`)
      setChecklist(res.data.data)
    } catch (err: any) {
      console.error('Failed to load checklist:', err)
      onError(err.response?.data?.message || err.message || 'Failed to load checklist')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggle(itemKey: string, completed: boolean) {
    try {
      await axios.post(`http://localhost:3001/api/checklists/${assetId}/mark`, {
        item_key: itemKey,
        completed: !completed
      })
      await fetchChecklist()
    } catch (err: any) {
      console.error('Failed to update checklist:', err)
      onError(err.response?.data?.message || err.message || 'Failed to update checklist')
    }
  }

  if (isLoading) {
    return (
      <div className={`rounded-lg p-4 text-center border ${
        darkMode
          ? 'border-slate-700 bg-slate-800/50 text-slate-400'
          : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}>
        <Loader size={20} className="animate-spin mx-auto mb-2" />
        <p className="text-sm font-medium">Loading checklist...</p>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className={`rounded-lg p-4 text-center border-2 border-dashed ${
        darkMode
          ? 'border-slate-700 bg-slate-800/50 text-slate-500'
          : 'border-slate-300 bg-slate-50 text-slate-600'
      }`}>
        <p className="text-sm font-medium">No checklist available</p>
      </div>
    )
  }

  const completedCount = checklist.items.filter(i => i.completed).length
  const progress = checklist.items.length > 0 ? Math.round((completedCount / checklist.items.length) * 100) : 0

  return (
    <div className={`border-l-4 border-l-green-500 rounded-lg p-4 transition-colors ${
      darkMode
        ? 'bg-green-900/20 border border-green-700/50'
        : 'bg-green-50 border border-green-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-bold flex items-center gap-2 ${
          darkMode ? 'text-green-300' : 'text-green-900'
        }`}>
          <CheckCircle2 size={18} />
          {checklist.platform.charAt(0).toUpperCase() + checklist.platform.slice(1)} Checklist
        </h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          darkMode
            ? 'bg-green-900/60 text-green-300'
            : 'bg-green-100 text-green-700'
        }`}>
          {completedCount}/{checklist.items.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full rounded-full h-2.5 mb-4 overflow-hidden ${
        darkMode
          ? 'bg-green-900/40'
          : 'bg-green-200'
      }`}>
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.items.map(item => (
          <button
            key={item.key}
            onClick={() => handleToggle(item.key, item.completed)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all border text-left ${
              darkMode
                ? item.completed
                  ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                  : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-green-600'
                : item.completed
                ? 'bg-slate-100 border-slate-200 hover:border-slate-300'
                : 'bg-white border-green-200 hover:bg-green-50 hover:border-green-400'
            }`}
          >
            {item.completed ? (
              <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
            ) : (
              <Circle size={20} className={`flex-shrink-0 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`} />
            )}
            <span className={`flex-1 transition-all font-medium ${
              item.completed
                ? darkMode
                  ? 'text-slate-500 line-through'
                  : 'text-slate-600 line-through'
                : darkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Completion Message */}
      {progress === 100 && (
        <div className={`mt-4 p-3 rounded-lg text-center border ${
          darkMode
            ? 'bg-green-900/40 border-green-700 text-green-300'
            : 'bg-green-100 border-green-300 text-green-700'
        }`}>
          <p className="text-sm font-bold">
            ✨ All set! Ready to publish
          </p>
        </div>
      )}
    </div>
  )
}
