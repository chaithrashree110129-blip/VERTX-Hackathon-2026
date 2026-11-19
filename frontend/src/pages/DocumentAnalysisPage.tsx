import React, { useState } from 'react'
import { FileText, AlertCircle, ArrowRight, FileCheck, Layers, Hash } from 'lucide-react'
import { UploadZone } from '../components/UploadZone'
import { FindingsView } from '../components/FindingsView'
import {
  createInvestigation,
  uploadEvidence,
  runAnalysis,
  getReportDownloadUrl
} from '../services/api'
import type { EvidenceItem } from '../types'

export const DocumentAnalysisPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [evidenceResult, setEvidenceResult] = useState<EvidenceItem | null>(null)
  const [investigationId, setInvestigationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = (selected: File) => {
    setFile(selected)
    setEvidenceResult(null)
    setError(null)
  }

  const handleStartAnalysis = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError(null)
    try {
      const inv = await createInvestigation(`Document Provenance: ${file.name}`, ['document'])
      setInvestigationId(inv.id)

      const evidence = await uploadEvidence(inv.id, file)
      await runAnalysis(inv.id, ['document'])

      const refreshRes = await fetch(`/api/investigations/${inv.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('truthlens_token') || ''}` }
      })
      const fullInv = await refreshRes.json()
      const analyzedItem = fullInv.evidence?.find((e: EvidenceItem) => e.id === evidence.id)
      setEvidenceResult(analyzedItem || evidence)
    } catch (err: any) {
      console.error('Document analysis failed:', err)
      setError(err.message || 'Document provenance analysis encountered an error.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-dark-tertiary/10 border border-dark-tertiary/30 flex items-center justify-center text-dark-tertiary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-white">Document Structure & Provenance</h2>
            <p className="font-body text-xs text-dark-on-surface/70">
              PDF producer string inspection, embedded metadata inconsistencies, and DOCX revision cycles.
            </p>
          </div>
        </div>
      </div>

      {!evidenceResult && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 flex flex-col gap-4">
            <UploadZone
              accept=".pdf,.docx,.txt"
              title="Upload PDF, DOCX or Briefing Document"
              subtitle="Inspect internal PDF object streams, author stamps, modifying application signatures, and font tables."
              onFileSelected={handleFileSelected}
              isProcessing={isAnalyzing}
              maxSizeMB={50}
            />

            {file && (
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                className="w-full py-3 rounded-lg bg-dark-tertiary text-dark-surface font-headline font-bold text-sm tracking-wide hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-dark-surface border-t-transparent rounded-full animate-spin" />
                    <span>Parsing Document Headers & Text Trees...</span>
                  </>
                ) : (
                  <>
                    <span>Inspect Document Provenance</span>
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

          <div className="md:col-span-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 flex flex-col items-center justify-center min-h-[260px] text-center">
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-dark-tertiary/10 border border-dark-tertiary/30 flex items-center justify-center text-dark-tertiary">
                  <FileCheck className="w-8 h-8" />
                </div>
                <span className="font-headline font-bold text-sm text-white max-w-xs truncate">
                  {file.name}
                </span>
                <span className="text-xs font-mono text-dark-on-surface/50">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div className="text-center text-xs font-mono text-dark-on-surface/40 flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 opacity-40" />
                <span>Select a document to begin structural verification</span>
              </div>
            )}
          </div>
        </div>
      )}

      {evidenceResult && evidenceResult.analysis && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs">
              <span className="font-headline font-bold text-white">Metadata & Structural Signatures</span>
              <span className="text-dark-tertiary font-bold">SHA-256 VERIFIED</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-dark-surface border border-dark-outline">
                <span className="text-dark-on-surface/50 text-[10px] block">PAGE / PARAGRAPH COUNT</span>
                <span className="text-white font-bold text-base">
                  {evidenceResult.analysis.measurements?.page_count || evidenceResult.analysis.measurements?.paragraph_count || '1'}
                </span>
              </div>

              <div className="p-3 rounded bg-dark-surface border border-dark-outline">
                <span className="text-dark-on-surface/50 text-[10px] block">WORD COUNT</span>
                <span className="text-dark-primary font-bold text-base">
                  {evidenceResult.analysis.measurements?.word_count || '—'}
                </span>
              </div>

              <div className="p-3 rounded bg-dark-surface border border-dark-outline">
                <span className="text-dark-on-surface/50 text-[10px] block">PRODUCING APPLICATION</span>
                <span className="text-amber-warning font-bold truncate block">
                  {evidenceResult.analysis.measurements?.producer || evidenceResult.analysis.measurements?.creator || 'Direct Export'}
                </span>
              </div>

              <div className="p-3 rounded bg-dark-surface border border-dark-outline">
                <span className="text-dark-on-surface/50 text-[10px] block">ENCRYPTED / RESTRICTED</span>
                <span className="text-dark-tertiary font-bold text-base">
                  {evidenceResult.analysis.measurements?.is_encrypted ? 'YES' : 'NO'}
                </span>
              </div>
            </div>

            {/* Cryptographic Hash Badge */}
            <div className="p-2.5 rounded bg-dark-surface border border-dark-outline flex items-center justify-between font-mono text-xs text-dark-on-surface/80">
              <span className="flex items-center gap-1.5 text-dark-tertiary">
                <Hash className="w-4 h-4" />
                <span>SHA-256 Digest:</span>
              </span>
              <span className="font-bold text-white truncate max-w-sm">{evidenceResult.sha256}</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {investigationId && (
                <a
                  href={getReportDownloadUrl(investigationId)}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-4 rounded-lg bg-dark-tertiary text-dark-surface font-headline font-bold text-xs hover:brightness-110 transition-all shadow-sm"
                >
                  Download Dossier Report
                </a>
              )}
              <button
                onClick={() => {
                  setEvidenceResult(null)
                  setFile(null)
                }}
                className="py-2 px-4 rounded-lg bg-dark-surface border border-dark-outline text-xs font-mono text-dark-on-surface hover:text-white transition-all"
              >
                Inspect Another File
              </button>
            </div>
          </div>

          <FindingsView
            findings={evidenceResult.analysis.findings || []}
            limitations={evidenceResult.analysis.limitations || []}
            moduleName="Document"
          />
        </div>
      )}
    </div>
  )
}
