'use client'

import { useRef, useState, useCallback } from 'react'

interface ImageUploadProps {
  label?: string
  previewUrl?: string
  onFileSelect: (file: File) => void
  onRemove: () => void
  uploading?: boolean
  className?: string
}

export function ImageUpload({
  label,
  previewUrl,
  onFileSelect,
  onRemove,
  uploading,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const isAllowed = (file: File) =>
    ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type) ||
    file.name.toLowerCase().endsWith('.svg')

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && isAllowed(file)) onFileSelect(file)
  }, [onFileSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    e.target.value = ''
  }, [onFileSelect])

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {previewUrl ? (
        <div className="relative rounded-lg overflow-hidden border bg-gray-50 h-40">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors select-none ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm text-gray-500">Arraste ou clique para selecionar</span>
          <span className="text-xs text-gray-400 mt-1">PNG, JPG, SVG</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,.svg"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}
    </div>
  )
}
