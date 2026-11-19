import React, { useState } from 'react'
import { Video, AlertCircle, ArrowRight, Play, Film, Layers } from 'lucide-react'
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

export const VideoAnalysisPage: React.FC = () => {
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
      const inv = await createInvestigation(`Video Forensics: ${file.name}`, ['video'])
      setInvestigationId(inv.id)

      const evidence = await uploadEvidence(inv.id, file)
      await runAnalysis(inv.id, ['video'])

      const refreshRes = await fetch(`/api/investigations/${inv.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('truthlens_token') || ''}` }
      })
      const fullInv = await refreshRes.json()
      const analyzedItem = fullInv.evidence?.find((e: EvidenceItem) => e.id === evidence.id)
      setEvidenceResult(analyzedItem || evidence)
    } catch (err: any) {
      console.error('Video analysis failed:', err)
      setError(err.message || 'Video analysis encountered an error.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-warning/10 border border-amber-warning/30 flex items-center justify-center text-amber-warning">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-white">Video Forensic Stream Analysis</h2>
            <p className="font-body text-xs text-dark-on-surface/70">
              Frame extraction, Laplacian temporal sharpness, frame difference shifts, and audio track separation.
            </p>
          </div>
        </div>
      </div>

      {!evidenceResult && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 flex flex-col gap-4">
            <UploadZone
              accept=".mp4,.webm,.mov,.avi,.mkv"
              title="Upload Video Recording or Stream"
              subtitle="Inspect video streams up to 200MB. Analyzed with OpenCV and imageio-ffmpeg."
              onFileSelected={handleFileSelected}
              isProcessing={isAnalyzing}
              maxSizeMB={200}
            />

            {file && (
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 rounded-lg bg-amber-warning text-dark-surface font-headline font-bold text-sm tracking-wide hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-dark-surface border-t-transparent rounded-full animate-spin" />
                    <span>Extracting Frames & Analyzing Stream...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Video Forensics</span>
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

          <div className="md:col-span-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
            {previewUrl ? (
              <div className="w-full flex flex-col items-center gap-2">
                <video
                  src={previewUrl}
                  controls
                  className="w-full rounded-lg border border-dark-outline max-h-64 bg-black"
                />
                <span className="text-xs font-mono text-dark-on-surface/60">
                  {file?.name} ({(file!.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <div className="text-center text-xs font-mono text-dark-on-surface/40 flex flex-col items-center gap-2">
                <Video className="w-8 h-8 opacity-40" />
                <span>Video stream player will initialize here</span>
              </div>
            )}
          </div>
        </div>
      )}

      {evidenceResult && evidenceResult.analysis && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left 6 cols: Extracted Frames strip */}
            <div className="md:col-span-7 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs">
                <span className="font-headline font-bold text-white">Extracted Video Frames & Visual Artifacts</span>
                <span className="text-amber-warning font-bold">OPENCV PIPELINE</span>
              </div>

              {previewUrl && (
                <div className="relative rounded-lg bg-black border border-dark-outline overflow-hidden aspect-video">
                  <video src={previewUrl} controls className="w-full h-full object-contain" />
                </div>
              )}

              {/* Artifacts grid */}
              {evidenceResult.analysis.artifacts && evidenceResult.analysis.artifacts.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-mono text-dark-on-surface/60">Sampled Keyframes:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {evidenceResult.analysis.artifacts.map((art, idx) => (
                      <a
                        key={idx}
                        href={getArtifactUrl(evidenceResult.id, art.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded border border-dark-outline hover:border-amber-warning overflow-hidden aspect-video bg-black block"
                      >
                        <img
                          src={getArtifactUrl(evidenceResult.id, art.name)}
                          alt={art.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-0.5 left-1 text-[9px] font-mono text-white bg-black/80 px-1 rounded truncate max-w-full">
                          {art.label || art.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 cols: Video Metadata & Kinematics */}
            <div className="md:col-span-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs mb-3">
                  <span className="font-headline font-bold text-white">Stream Telemetry</span>
                  <span className="text-dark-primary">OPEN-CV METRICS</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">DURATION</span>
                    <span className="text-white font-bold">
                      {evidenceResult.analysis.measurements?.duration_s?.toFixed?.(2) || '—'}s
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">FRAME RATE</span>
                    <span className="text-dark-primary font-bold">
                      {evidenceResult.analysis.measurements?.fps?.toFixed?.(2) || '29.97'} FPS
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">TOTAL FRAMES</span>
                    <span className="text-white font-bold">
                      {evidenceResult.analysis.measurements?.frame_count || '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">RESOLUTION</span>
                    <span className="text-amber-warning font-bold">
                      {evidenceResult.analysis.measurements?.width} × {evidenceResult.analysis.measurements?.height}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-dark-outline-variant">
                {investigationId && (
                  <a
                    href={getReportDownloadUrl(investigationId)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 rounded-lg bg-amber-warning text-dark-surface text-center font-headline font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  >
                    Download Dossier
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

          <FindingsView
            findings={evidenceResult.analysis.findings || []}
            limitations={evidenceResult.analysis.limitations || []}
            moduleName="Video"
          />
        </div>
      )}
    </div>
  )
}
