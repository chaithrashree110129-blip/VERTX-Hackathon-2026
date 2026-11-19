import React, { useRef, useState } from 'react'
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react'

interface UploadZoneProps {
  accept: string
  title: string
  subtitle: string
  onFileSelected: (file: File) => void
  isProcessing?: boolean
  maxSizeMB?: number
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  accept,
  title,
  subtitle,
  onFileSelected,
  isProcessing = false,
  maxSizeMB = 100,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const validateAndSelect = (file: File) => {
    setError(null)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds the ${maxSizeMB}MB limit.`)
      return
    }
    setSelectedFile(file)
    onFileSelected(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0])
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-dark-primary bg-dark-primary/10 shadow-[0_0_20px_rgba(5,213,236,0.2)]'
            : 'border-dark-outline-variant bg-dark-surface-container/70 hover:border-dark-primary/60 hover:bg-dark-surface-container-high/60'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="w-14 h-14 rounded-full bg-dark-primary/10 border border-dark-primary/30 flex items-center justify-center text-dark-primary mb-3 shadow-[0_0_15px_rgba(5,213,236,0.15)]">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="font-headline font-bold text-base text-dark-on-surface mb-1">
          {title}
        </h3>
        <p className="font-body text-xs text-dark-on-surface/60 text-center max-w-sm mb-3">
          {subtitle}
        </p>

        {selectedFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-dark-surface-container-highest border border-dark-primary/40 text-xs font-mono text-dark-primary mt-2">
            <CheckCircle2 className="w-4 h-4 text-dark-tertiary" />
            <span className="font-medium truncate max-w-xs">{selectedFile.name}</span>
            <span className="text-dark-on-surface/50">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 text-[11px] font-mono text-dark-on-surface/50">
          <span>Supported: {accept.replace(/\./g, ' ').toUpperCase()}</span>
          <span>•</span>
          <span>Max Size: {maxSizeMB}MB</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mt-3 rounded-lg bg-red-anomaly/10 border border-red-anomaly text-red-anomaly text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
