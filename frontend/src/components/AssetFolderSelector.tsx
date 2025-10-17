import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FolderOpen, ArrowRight, Loader, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface Folder {
  id: number
  name: string
}

export default function AssetFolderSelector({
  assetId,
  currentFolderId,
  onError,
  onSuccess
}: {
  assetId: number
  currentFolderId: number | null
  onError: (msg: string) => void
  onSuccess?: () => void
}) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMoving, setIsMoving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { darkMode } = useTheme()

  console.log('🏗️ AssetFolderSelector montado:', { assetId, currentFolderId })

  useEffect(() => {
    console.log('📋 useEffect: Cargando carpetas...')
    fetchFolders()
  }, [])

  async function fetchFolders() {
    try {
      setIsLoading(true)
      const res = await axios.get('http://localhost:3001/api/folders')
      console.log('📁 Carpetas cargadas:', res.data.data)
      setFolders(res.data.data || [])
    } catch (err: any) {
      console.error('❌ Error al cargar carpetas:', err)
      onError(err.response?.data?.message || err.message || 'No se pudieron cargar las carpetas')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMove() {
    console.log('🔄 INICIO handleMove()')
    console.log('🔄 Movimiento solicitado:', { 
      assetId, 
      selectedFolderId, 
      currentFolderId,
      sameFolder: selectedFolderId === currentFolderId
    })

    // Validaciones
    if (selectedFolderId === null) {
      const msg = 'Por favor selecciona una carpeta'
      console.warn('⚠️ ' + msg)
      onError(msg)
      return
    }

    if (selectedFolderId === currentFolderId) {
      const msg = 'El asset ya está en esta carpeta'
      console.warn('⚠️ ' + msg)
      onError(msg)
      return
    }

    try {
      setIsMoving(true)
      setSuccessMessage(null)
      
      console.log(`📤 Enviando PUT a /api/assets/${assetId}/move`)
      console.log('📦 Payload:', { folder_id: selectedFolderId })

      const response = await axios.put(
        `http://localhost:3001/api/assets/${assetId}/move`,
        { folder_id: selectedFolderId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('✅ Asset movido exitosamente:', response.data)
      console.log('Status:', response.status)
      
      setSuccessMessage('¡Asset movido exitosamente!')
      
      // Clear success message después de 3 segundos
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      
      // Llamar callback de éxito para refrescar datos
      if (onSuccess) {
        console.log('🔄 Llamando onSuccess callback...')
        onSuccess()
      }

      return () => clearTimeout(timer)
    } catch (err: any) {
      console.error('❌ Error al mover asset:')
      console.error('  Error message:', err.message)
      console.error('  Status:', err.response?.status)
      console.error('  Response data:', err.response?.data)
      console.error('  Config:', err.config)
      
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error desconocido'
      onError(errorMsg)
    } finally {
      setIsMoving(false)
    }
  }

  const selectStyles = `w-full px-3 py-2 rounded-lg border transition-all font-medium ${
    darkMode
      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
  } disabled:opacity-50 disabled:cursor-not-allowed`

  const canMove = selectedFolderId !== null && selectedFolderId !== currentFolderId && folders.length > 0

  return (
    <div className={`border-l-4 border-l-blue-500 rounded-lg p-4 transition-colors ${
      darkMode
        ? 'bg-blue-900/20 border border-blue-700/50'
        : 'bg-blue-50 border border-blue-200'
    }`}>
      <label className={`text-sm font-bold mb-3 flex items-center gap-2 ${
        darkMode ? 'text-blue-300' : 'text-blue-900'
      }`}>
        <FolderOpen size={18} />
        Mover a Carpeta
      </label>

      {/* Loading State */}
      {isLoading && (
        <div className={`text-sm p-2 rounded mb-2 flex items-center gap-2 ${
          darkMode
            ? 'bg-slate-700/50 text-slate-300'
            : 'bg-white/50 text-slate-700'
        }`}>
          <Loader size={14} className="animate-spin" />
          Cargando carpetas...
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className={`text-sm p-2 rounded mb-2 flex items-center gap-2 ${
          darkMode
            ? 'bg-green-900/40 text-green-300 border border-green-700'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <CheckCircle2 size={14} />
          {successMessage}
        </div>
      )}

      {/* No Folders Message */}
      {!isLoading && folders.length === 0 && (
        <div className={`text-sm p-2 rounded mb-2 flex items-center gap-2 ${
          darkMode
            ? 'bg-amber-900/40 text-amber-300 border border-amber-700'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <AlertCircle size={14} />
          No hay carpetas. ¡Crea una primero!
        </div>
      )}

      {/* Select + Button */}
      {!isLoading && folders.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2 items-stretch">
            <select
              value={selectedFolderId ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null
                console.log('📂 Carpeta seleccionada:', val, '(valor string: ' + e.target.value + ')')
                console.log('📂 canMove será:', val !== null && val !== currentFolderId && folders.length > 0)
                setSelectedFolderId(val)
              }}
              className={selectStyles}
              disabled={isMoving}
            >
              <option value="">-- Selecciona una carpeta --</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.id === currentFolderId ? '✓ Actual' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleMove}
              disabled={!canMove || isMoving}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                darkMode
                  ? `${canMove && !isMoving ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed`
                  : `${canMove && !isMoving ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'} disabled:opacity-50 disabled:cursor-not-allowed`
              }`}
              title={
                !canMove
                  ? selectedFolderId === currentFolderId
                    ? 'El asset ya está en esta carpeta'
                    : 'Selecciona una carpeta diferente'
                  : 'Mover asset a la carpeta seleccionada'
              }
            >
              {isMoving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Moviendo...</span>
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  <span>Mover</span>
                </>
              )}
            </button>
          </div>

          {/* Debug Info */}
          <div className={`text-xs p-1 rounded opacity-60 ${
            darkMode ? 'bg-slate-700/30 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}>
            Asset: {assetId} | Actual: {currentFolderId ?? 'Ninguna'} | Seleccionada: {selectedFolderId ?? 'Ninguna'} | Carpetas: {folders.length}
          </div>
        </div>
      )}
    </div>
  )
}
