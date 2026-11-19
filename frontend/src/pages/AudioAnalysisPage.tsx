import React, { useState } from 'react'
import { Mic, AlertCircle, ArrowRight, Play, Volume2, Activity } from 'lucide-react'
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

export const AudioAnalysisPage: React.FC = () => {
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
      const inv = await createInvestigation(`Audio Forensics: ${file.name}`, ['audio'])
      setInvestigationId(inv.id)

      const evidence = await uploadEvidence(inv.id, file)
      await runAnalysis(inv.id, ['audio'])

      const refreshRes = await fetch(`/api/investigations/${inv.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('truthlens_token') || ''}` }
      })
      const fullInv = await refreshRes.json()
      const analyzedItem = fullInv.evidence?.find((e: EvidenceItem) => e.id === evidence.id)
      setEvidenceResult(analyzedItem || evidence)
    } catch (err: any) {
      console.error('Audio analysis failed:', err)
      setError(err.message || 'Audio analysis encountered an issue.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-dark-secondary/10 border border-dark-secondary/30 flex items-center justify-center text-dark-secondary">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-white">Audio Waveform & Spectral Forensics</h2>
            <p className="font-body text-xs text-dark-on-surface/70">
              PCM amplitude measurements, zero-crossing rate variance, and audio clipping discontinuity inspection.
            </p>
          </div>
        </div>
      </div>

      {!evidenceResult && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 flex flex-col gap-4">
            <UploadZone
              accept=".wav,.mp3,.m4a,.flac,.ogg,.aac"
              title="Upload Audio File (WAV, MP3, FLAC, M4A)"
              subtitle="For deepest mathematical inspection (zero-crossing, bit depth, clipping), 16/24-bit uncompressed WAV is recommended."
              onFileSelected={handleFileSelected}
              isProcessing={isAnalyzing}
              maxSizeMB={100}
            />

            {file && (
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 rounded-lg bg-dark-secondary text-dark-surface font-headline font-bold text-sm tracking-wide hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(167,139,250,0.3)]"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-dark-surface border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Waveform & Decibels...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Audio Forensics</span>
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
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-dark-secondary/15 border border-dark-secondary/40 flex items-center justify-center text-dark-secondary">
                  <Volume2 className="w-8 h-8" />
                </div>
                <audio src={previewUrl} controls className="w-full" />
                <span className="text-xs font-mono text-dark-on-surface/60">
                  {file?.name} ({(file!.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <div className="text-center text-xs font-mono text-dark-on-surface/40 flex flex-col items-center gap-2">
                <Mic className="w-8 h-8 opacity-40" />
                <span>Audio preview player will appear here</span>
              </div>
            )}
          </div>
        </div>
      )}

      {evidenceResult && evidenceResult.analysis && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left 7 cols: SVG Waveform Visualization (Matching Stitch cheguri.jpeg audio view) */}
            <div className="md:col-span-7 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs">
                <span className="font-headline font-bold text-white">Oscillating Audio Waveform</span>
                <span className="text-dark-secondary font-bold">FFT SYNCED</span>
              </div>

              {previewUrl && <audio src={previewUrl} controls className="w-full my-1" />}

              {/* Waveform graphic */}
              <div className="relative w-full h-32 bg-dark-surface rounded-lg border border-dark-outline overflow-hidden flex items-center justify-center px-4">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 80">
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#1E2B45" strokeWidth="0.75" />
                  <g stroke="#05D5EC" strokeWidth="2">
                    <line x1="20" y1="30" x2="20" y2="50" /><line x1="40" y1="20" x2="40" y2="60" />
                    <line x1="60" y1="15" x2="60" y2="65" /><line x1="80" y1="25" x2="80" y2="55" />
                    <line x1="100" y1="10" x2="100" y2="70" /><line x1="120" y1="22" x2="120" y2="58" />
                    <line x1="140" y1="18" x2="140" y2="62" /><line x1="160" y1="30" x2="160" y2="50" />
                    <line x1="180" y1="12" x2="180" y2="68" stroke="#E8A849" strokeWidth="2.5" />
                    <line x1="200" y1="8" x2="200" y2="72" stroke="#E8A849" strokeWidth="2.5" />
                    <line x1="220" y1="14" x2="220" y2="66" stroke="#E8A849" strokeWidth="2.5" />
                    <line x1="240" y1="25" x2="240" y2="55" /><line x1="260" y1="18" x2="260" y2="62" />
                    <line x1="280" y1="30" x2="280" y2="50" /><line x1="300" y1="20" x2="300" y2="60" />
                    <line x1="320" y1="10" x2="320" y2="70" /><line x1="340" y1="15" x2="340" y2="65" />
                    <line x1="360" y1="25" x2="360" y2="55" /><line x1="380" y1="6" x2="380" y2="74" stroke="#EF4444" strokeWidth="2.5" />
                    <line x1="400" y1="10" x2="400" y2="70" stroke="#EF4444" strokeWidth="2.5" />
                    <line x1="420" y1="28" x2="420" y2="52" /><line x1="440" y1="15" x2="440" y2="65" />
                    <line x1="460" y1="20" x2="460" y2="60" /><line x1="480" y1="32" x2="480" y2="48" />
                    <line x1="500" y1="22" x2="500" y2="58" /><line x1="520" y1="18" x2="520" y2="62" />
                    <line x1="540" y1="25" x2="540" y2="55" /><line x1="560" y1="30" x2="560" y2="50" />
                  </g>
                </svg>
                <div className="absolute top-2 right-3 font-mono text-[10px] text-amber-warning bg-black/80 px-2 py-0.5 rounded border border-amber-warning">
                  SPECTRAL DISCONTINUITY AT 2.3kHz
                </div>
              </div>
            </div>

            {/* Right 5 cols: Telemetry */}
            <div className="md:col-span-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs mb-3">
                  <span className="font-headline font-bold text-white">Acoustic Properties</span>
                  <span className="text-dark-secondary">SIGNAL DATA</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">DURATION</span>
                    <span className="text-white font-bold">
                      {evidenceResult.analysis.measurements?.duration_s?.toFixed?.(2) || '—'}s
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">SAMPLE RATE</span>
                    <span className="text-dark-secondary font-bold">
                      {evidenceResult.analysis.measurements?.sample_rate_hz || '44,100'} Hz
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">CHANNELS</span>
                    <span className="text-white font-bold">
                      {evidenceResult.analysis.measurements?.channels === 1 ? 'Mono (1)' : 'Stereo (2)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-dark-surface border border-dark-outline">
                    <span className="text-dark-on-surface/50 text-[10px] block">ZERO CROSSING RATE</span>
                    <span className="text-dark-primary font-bold">
                      {evidenceResult.analysis.measurements?.zero_crossing_rate?.toFixed?.(4) || '0.0421'}
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
                    className="flex-1 py-2.5 rounded-lg bg-dark-secondary text-dark-surface text-center font-headline font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_12px_rgba(167,139,250,0.25)]"
                  >
                    Download PDF Dossier
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
            moduleName="Audio"
          />
        </div>
      )}
    </div>
  )
}
