import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Shield,
  FileDown,
  Layers,
  AlertTriangle,
  CheckCircle,
  FileText,
  Video,
  Mic,
  Image as ImageIcon,
  ArrowLeft,
  Activity,
  Plus
} from 'lucide-react'
import {
  getInvestigation,
  getReportDownloadUrl,
  runAnalysis,
  runCorrelation,
  uploadEvidence,
  getArtifactUrl
} from '../services/api'
import { FindingsView } from '../components/FindingsView'
import { UploadZone } from '../components/UploadZone'
import type { Investigation, EvidenceItem } from '../types'

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const loadCase = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await getInvestigation(id)
      setInvestigation(data)
      if (data.evidence && data.evidence.length > 0 && !selectedEvidenceId) {
        setSelectedEvidenceId(data.evidence[0].id)
      }
    } catch (err) {
      console.error('Failed to load investigation:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCase()
  }, [id])

  const handleUploadAdditional = async (file: File) => {
    if (!id) return
    setIsProcessing(true)
    try {
      await uploadEvidence(id, file)
      await runAnalysis(id)
      await runCorrelation(id)
      setShowUploadModal(false)
      await loadCase()
    } catch (err) {
      alert('Upload failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] font-mono text-xs text-dark-on-surface/50">
        <Activity className="w-8 h-8 text-dark-primary animate-pulse mb-3" />
        <span>Loading TruthLens Case Dossier...</span>
      </div>
    )
  }

  if (!investigation) {
    return (
      <div className="text-center py-12">
        <p className="font-headline text-base text-white mb-2">Investigation Case Not Found</p>
        <Link to="/dashboard" className="text-dark-primary hover:underline font-mono text-xs">
          Return to Dashboard →
        </Link>
      </div>
    )
  }

  const selectedEvidence = investigation.evidence?.find((e) => e.id === selectedEvidenceId)

  // Calculate overall case risk metrics from findings
  const totalFindings = investigation.evidence?.reduce(
    (acc, e) => acc + (e.analysis?.findings?.length || 0),
    0
  )
  const criticalFindings = investigation.evidence?.reduce(
    (acc, e) => acc + (e.analysis?.findings?.filter((f) => f.severity === 'critical').length || 0),
    0
  )

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full">
      {/* CASE HEADER BAR */}
      <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-dark-on-surface/50 mb-1">
            <span className="text-dark-primary font-bold">CASE #{investigation.id}</span>
            <span>•</span>
            <span>Created {new Date(investigation.created_at).toLocaleString()}</span>
            <span>•</span>
            <span>Examiner: {investigation.investigator_name || 'JS'}</span>
          </div>
          <h2 className="font-headline font-bold text-xl text-white">
            {investigation.title}
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-lg bg-dark-surface border border-dark-outline hover:border-dark-primary text-white font-headline text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-dark-primary" />
            <span>Add Evidence</span>
          </button>

          <a
            href={getReportDownloadUrl(investigation.id)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-dark-primary text-dark-surface font-headline font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_15px_rgba(5,213,236,0.3)] transition-all flex items-center justify-center gap-1.5"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Case Dossier</span>
          </a>
        </div>
      </div>

      {/* MODAL FOR ADDING EVIDENCE */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface-container border border-dark-outline-variant p-6 rounded-2xl max-w-xl w-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
              <h3 className="font-headline font-bold text-base text-white">Attach Multimodal Evidence</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-dark-on-surface/60 hover:text-white font-mono text-xs"
              >
                ✕ Close
              </button>
            </div>
            <UploadZone
              accept="*/*"
              title="Upload supplementary file"
              subtitle="Supports images, video streams, audio clips, and documents."
              onFileSelected={handleUploadAdditional}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}

      {/* EVIDENCE TABS ROW */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-dark-outline-variant">
        {investigation.evidence?.map((item) => {
          const isSelected = item.id === selectedEvidenceId
          const getIcon = () => {
            switch (item.kind) {
              case 'image':
                return <ImageIcon className="w-4 h-4 text-dark-primary" />
              case 'video':
                return <Video className="w-4 h-4 text-amber-warning" />
              case 'audio':
                return <Mic className="w-4 h-4 text-dark-secondary" />
              case 'document':
              default:
                return <FileText className="w-4 h-4 text-dark-tertiary" />
            }
          }

          return (
            <button
              key={item.id}
              onClick={() => setSelectedEvidenceId(item.id)}
              className={`px-3 py-2 rounded-lg font-mono text-xs flex items-center gap-2 whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-dark-primary/15 border-dark-primary text-white shadow-sm'
                  : 'bg-dark-surface-container border-dark-outline-variant text-dark-on-surface/60 hover:text-dark-on-surface hover:bg-dark-surface-container-high'
              }`}
            >
              {getIcon()}
              <span className="font-medium truncate max-w-[140px]">{item.filename}</span>
              <span className="text-[10px] text-dark-on-surface/40">
                ({(item.size_bytes / 1024 / 1024).toFixed(1)}MB)
              </span>
            </button>
          )
        })}
      </div>

      {/* SELECTED EVIDENCE DETAIL & FINDINGS */}
      {selectedEvidence ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Artifact Preview + Metadata (Cols 5) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs">
                <span className="font-headline font-bold text-white">Evidence Overview</span>
                <span className="text-dark-primary font-bold uppercase">{selectedEvidence.kind}</span>
              </div>

              {/* Artifacts Gallery */}
              {selectedEvidence.analysis?.artifacts && selectedEvidence.analysis.artifacts.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-dark-on-surface/60">Generated Visual Overlays:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEvidence.analysis.artifacts.map((art, idx) => (
                      <a
                        key={idx}
                        href={getArtifactUrl(selectedEvidence.id, art.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded border border-dark-outline hover:border-dark-primary overflow-hidden aspect-video bg-black block"
                      >
                        <img
                          src={getArtifactUrl(selectedEvidence.id, art.name)}
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

              {/* File Technical Metadata */}
              <div className="flex flex-col gap-1.5 font-mono text-xs mt-2">
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-outline">
                  <span className="text-dark-on-surface/50">Filename:</span>
                  <span className="text-white font-medium truncate max-w-[180px]">{selectedEvidence.filename}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-outline">
                  <span className="text-dark-on-surface/50">SHA-256 Digest:</span>
                  <span className="text-dark-tertiary font-bold truncate max-w-[160px]">{selectedEvidence.sha256}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-outline">
                  <span className="text-dark-on-surface/50">Size:</span>
                  <span className="text-white">{(selectedEvidence.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-outline">
                  <span className="text-dark-on-surface/50">Engine Status:</span>
                  <span className="text-dark-primary font-bold">{selectedEvidence.analysis?.status || 'Indexed'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Findings & Detailed Indicators (Cols 7) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4">
              <FindingsView
                findings={selectedEvidence.analysis?.findings || []}
                limitations={selectedEvidence.analysis?.limitations || []}
                moduleName={selectedEvidence.kind}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center font-mono text-xs text-dark-on-surface/50">
          No evidence items available in this case yet.
        </div>
      )}
    </div>
  )
}
