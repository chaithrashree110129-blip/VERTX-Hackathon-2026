import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, CheckCircle, ShieldAlert, AlertCircle, ArrowRight } from 'lucide-react'
import { UploadZone } from '../components/UploadZone'
import { FindingsView } from '../components/FindingsView'
import {
  createInvestigation,
  uploadEvidence,
  runAnalysis,
  getReportDownloadUrl,
  getArtifactUrl
} from '../services/api'
import type { EvidenceItem } from '../types'

export const ImageAnalysisPage: React.FC = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [evidenceResult, setEvidenceResult] = useState<EvidenceItem | null>(null)
  const [investigationId, setInvestigationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = (selected: File) => {
    setFile(selected)
    setEvidenceResult(null)
    setError(null)
    const url = URL.createObjectURL(selected)
    setPreviewUrl(url)
  }

  const handleStartAnalysis = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError(null)
    try {
      // 1. Create a focused single-file investigation container
      const inv = await createInvestigation(`Image Analysis: ${file.name}`, ['image'])
      setInvestigationId(inv.id)

      // 2. Upload file
      const evidence = await uploadEvidence(inv.id, file)

      // 3. Run analysis
      await runAnalysis(inv.id, ['image'])

      // 4. Fetch the completed evidence data
      const refreshRes = await fetch(`/api/investigations/${inv.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('truthlens_token') || ''}` }
      })
      const fullInv = await refreshRes.json()
      const analyzedItem = fullInv.evidence?.find((e: EvidenceItem) => e.id === evidence.id)
      setEvidenceResult(analyzedItem || evidence)
    } catch (err: any) {
      console.error('Image analysis failed:', err)
      setError(err.message || 'Image inspection encountered an unexpected issue.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-dark-primary/10 border border-dark-primary/30 flex items-center justify-center text-dark-primary">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-white">Image Forensic Analysis</h2>
            <p className="font-body text-xs text-dark-on-surface/70">
              Error Level Analysis (ELA), EXIF header metadata inspection, and Laplacian variance.
            </p>
          </div>
        </div>
      </div>

      {/* UPLOAD & CONTROLS */}
      {!evidenceResult && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 flex flex-col gap-4">
            <UploadZone
              accept=".jpg,.jpeg,.png,.webp,.bmp,.tiff"
              title="Drag & drop evidence photograph"
              subtitle="Supports high-resolution RAW exports, JPEG, PNG, and WebP captures up to 50MB."
              onFileSelected={handleFileSelected}
              isProcessing={isAnalyzing}
              maxSizeMB={50}
            />

            {file && (
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 rounded-lg bg-dark-primary text-dark-surface font-headline font-bold text-sm tracking-wide hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(5,213,236,0.3)]"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-dark-surface border-t-transparent rounded-full animate-spin" />
                    <span>Executing OpenCV & ELA Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Image Forensics</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="p-3.5 rounded-lg bg-red-anomaly/10 border border-red-anomaly text-red-anomaly text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="md:col-span-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
            {previewUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <img
                  src={previewUrl}
                  alt="Evidence Preview"
                  className="max-h-72 w-auto object-contain rounded-lg border border-dark-outline"
                />
                <span className="mt-2 text-xs font-mono text-dark-on-surface/60">
                  {file?.name} ({(file!.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <div className="text-center text-xs font-mono text-dark-on-surface/40 flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span>Uploaded photograph preview will render here</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPLETED RESULTS DISPLAY (Exact Stitch references: ELA preview, measurements, indicators) */}
      {evidenceResult && evidenceResult.analysis && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Visual ELA & Artifacts (Left 6 cols) */}
            <div className="md:col-span-6 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs">
                <span className="font-headline font-bold text-white">Visual Artifacts & ELA</span>
                <span className="text-dark-primary font-bold">DIGITAL ARTIFACTS</span>
              </div>

              {/* Artifact image or original */}
              <div className="relative rounded-lg bg-black border border-dark-outline overflow-hidden aspect-video flex items-center justify-center">
                {evidenceResult.analysis.artifacts && evidenceResult.analysis.artifacts[0] ? (
                  <img
                    src={getArtifactUrl(evidenceResult.id, evidenceResult.analysis.artifacts[0].name)}
                    alt="Forensic ELA Overlay"
                    className="w-full h-full object-contain"
                  />
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Original Image" className="w-full h-full object-contain" />
                ) : null}
                <div className="animate-scan-line" />
              </div>

              {/* Artifacts strip */}
              {evidenceResult.analysis.artifacts && evidenceResult.analysis.artifacts.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {evidenceResult.analysis.artifacts.map((art, idx) => (
                    <a
                      key={idx}
                      href={getArtifactUrl(evidenceResult.id, art.name)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded bg-dark-surface border border-dark-outline text-center hover:border-dark-primary transition-all text-xs font-mono text-dark-primary block truncate"
                    >
                      {art.label || art.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Technical Measurements (Right 6 cols) */}
            <div className="md:col-span-6 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs mb-3">
                  <span className="font-headline font-bold text-white">Mathematical Measurements</span>
                  <span className="text-dark-tertiary">DETERMINISTIC DATA</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">DIMENSIONS</span>
                    <span className="text-white font-bold">
                      {evidenceResult.analysis.measurements?.dimensions?.width || '—'} ×{' '}
                      {evidenceResult.analysis.measurements?.dimensions?.height || '—'} px
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">LAPLACIAN VARIANCE (SHARPNESS)</span>
                    <span className="text-dark-primary font-bold">
                      {evidenceResult.analysis.measurements?.sharpness_laplacian?.toFixed?.(1) || '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">ELA MEAN ERROR</span>
                    <span className="text-amber-warning font-bold">
                      {evidenceResult.analysis.measurements?.ela_mean_error?.toFixed?.(2) || '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">COLOR MODE & FORMAT</span>
                    <span className="text-white font-bold">
                      {evidenceResult.analysis.measurements?.mode || 'RGB'} • {evidenceResult.analysis.measurements?.format || 'RAW'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-dark-outline-variant">
                {investigationId && (
                  <a
                    href={getReportDownloadUrl(investigationId)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-lg bg-dark-primary text-dark-surface text-center font-headline font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_12px_rgba(5,213,236,0.25)]"
                  >
                    Download PDF Forensic Report
                  </a>
                )}
                <button
                  onClick={() => {
                    setEvidenceResult(null)
                    setFile(null)
                    setPreviewUrl(null)
                  }}
                  className="px-4 py-2.5 rounded-lg bg-dark-surface border border-dark-outline text-xs font-mono text-dark-on-surface hover:text-white transition-all"
                >
                  Analyze Another
                </button>
              </div>
            </div>
          </div>

          {/* DETAILED FINDINGS VIEW */}
          <FindingsView
            findings={evidenceResult.analysis.findings || []}
            limitations={evidenceResult.analysis.limitations || []}
            moduleName="Image"
          />
        </div>
      )}
    </div>
  )
}
