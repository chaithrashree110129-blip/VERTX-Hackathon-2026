import React, { useEffect, useState } from 'react'
import { GitFork, AlertTriangle, Layers, ArrowUpRight, Activity } from 'lucide-react'
import { getInvestigations, getInvestigation } from '../services/api'
import type { Investigation, CorrelationPayload } from '../types'

export const CorrelationPage: React.FC = () => {
  const [cases, setCases] = useState<Array<{ id: string; title: string; created_at: string }>>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string>('')
  const [currentCase, setCurrentCase] = useState<Investigation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getInvestigations()
      .then((res) => {
        setCases(res)
        if (res.length > 0) {
          setSelectedCaseId(res[0].id)
        }
      })
      .catch((e) => console.error(e))
  }, [])

  useEffect(() => {
    if (!selectedCaseId) return
    setLoading(true)
    getInvestigation(selectedCaseId)
      .then((data) => setCurrentCase(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [selectedCaseId])

  const correlation = currentCase?.correlation

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-dark-primary/10 border border-dark-primary/30 flex items-center justify-center text-dark-primary">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-white">Cross-Modal Correlation Topology</h2>
            <p className="font-body text-xs text-dark-on-surface/70">
              Interconnected verification of image EXIF, video audio-tracks, and document timestamps.
            </p>
          </div>
        </div>

        {/* Case selector dropdown */}
        <select
          value={selectedCaseId}
          onChange={(e) => setSelectedCaseId(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-dark-surface-container border border-dark-outline text-xs font-mono text-white focus:outline-none focus:border-dark-primary"
        >
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.id})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-dark-on-surface/50">
          Mapping cross-modal topology...
        </div>
      ) : !currentCase ? (
        <div className="py-12 text-center text-xs font-mono text-dark-on-surface/50">
          No case selected
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* TOPOLOGY VISUAL CANVAS (Exact SVG visual as Stitch reference) */}
          <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2 font-mono text-xs">
              <span className="font-headline font-bold text-white">Multimodal Graph Network</span>
              <span className="text-dark-primary font-bold">
                {correlation?.nodes?.length || 0} NODES • {correlation?.edges?.length || 0} RELATIONSHIPS
              </span>
            </div>

            {/* SVG Network Visual */}
            <div className="relative w-full h-80 rounded-lg bg-dark-surface border border-dark-outline overflow-hidden flex items-center justify-center p-4">
              <svg className="w-full h-full" viewBox="0 0 900 300">
                <defs>
                  <linearGradient id="linkGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#05D5EC" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>

                {/* Graph Connection Lines */}
                <path d="M 160 80 C 260 80, 260 150, 380 150" fill="none" stroke="url(#linkGrad)" strokeWidth="2" strokeDasharray="4,2" />
                <path d="M 160 220 C 260 220, 260 150, 380 150" fill="none" stroke="url(#linkGrad)" strokeWidth="2" />
                <path d="M 520 150 C 620 150, 620 90, 720 90" fill="none" stroke="#F59E0B" strokeWidth="2" />
                <path d="M 520 150 C 620 150, 620 210, 720 210" fill="none" stroke="#05D5EC" strokeWidth="2" />

                {/* Left Nodes */}
                <g transform="translate(40, 50)">
                  <rect width="140" height="55" rx="8" fill="#0C2E38" stroke="#05D5EC" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#05D5EC" fontFamily="Wix Madefor Display" fontSize="11" fontWeight="bold">VIDEO EVIDENCE</text>
                  <text x="12" y="42" fill="#F1F5F9" fontFamily="Spline Sans Mono" fontSize="9">Frame Track</text>
                </g>

                <g transform="translate(40, 190)">
                  <rect width="140" height="55" rx="8" fill="#2E1F52" stroke="#A78BFA" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#A78BFA" fontFamily="Wix Madefor Display" fontSize="11" fontWeight="bold">AUDIO EVIDENCE</text>
                  <text x="12" y="42" fill="#F1F5F9" fontFamily="Spline Sans Mono" fontSize="9">PCM Waveform</text>
                </g>

                {/* Central Correlation Node */}
                <g transform="translate(360, 110)">
                  <rect width="160" height="80" rx="10" fill="#162035" stroke="#F59E0B" strokeWidth="2" />
                  <text x="16" y="28" fill="#F59E0B" fontFamily="Wix Madefor Display" fontSize="12" fontWeight="bold">CROSS-DISCORD</text>
                  <text x="16" y="48" fill="#F1F5F9" fontFamily="Spline Sans Mono" fontSize="10">Δ Disparity Check</text>
                  <text x="16" y="66" fill="#34D399" fontFamily="Spline Sans Mono" fontSize="9">Automated Verification</text>
                </g>

                {/* Right Nodes */}
                <g transform="translate(700, 60)">
                  <rect width="160" height="55" rx="8" fill="#2B0B0B" stroke="#EF4444" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#EF4444" fontFamily="Wix Madefor Display" fontSize="11" fontWeight="bold">IMAGE STILL</text>
                  <text x="12" y="42" fill="#F1F5F9" fontFamily="Spline Sans Mono" fontSize="9">ELA High Variance</text>
                </g>

                <g transform="translate(700, 180)">
                  <rect width="160" height="55" rx="8" fill="#042517" stroke="#34D399" strokeWidth="1.5" />
                  <text x="12" y="24" fill="#34D399" fontFamily="Wix Madefor Display" fontSize="11" fontWeight="bold">BRIEFING DOC</text>
                  <text x="12" y="42" fill="#F1F5F9" fontFamily="Spline Sans Mono" fontSize="9">SHA Verified</text>
                </g>
              </svg>
            </div>
          </div>

          {/* CORRELATION FINDINGS & EDGES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Edge relationships */}
            <div className="p-4 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-3">
              <span className="font-headline font-bold text-sm text-white border-b border-dark-outline pb-2">
                Established Cross-Modal Relationships ({correlation?.edges?.length || 0})
              </span>
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {correlation?.edges && correlation.edges.length > 0 ? (
                  correlation.edges.map((edge, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-dark-surface border border-dark-outline text-xs font-mono">
                      <div className="flex items-center justify-between text-dark-primary font-bold mb-1">
                        <span>{edge.relation.toUpperCase()}</span>
                        <span className="text-[10px] text-dark-on-surface/40">LINK</span>
                      </div>
                      <p className="text-dark-on-surface/70 text-[11px]">{edge.note || 'Linked in this case'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-dark-on-surface/50">
                    Submit multiple evidence files to identify shared hashes or timing deltas.
                  </p>
                )}
              </div>
            </div>

            {/* Inconsistency findings */}
            <div className="p-4 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-3">
              <span className="font-headline font-bold text-sm text-white border-b border-dark-outline pb-2">
                Correlated Inconsistencies & Signals
              </span>
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {correlation?.findings && correlation.findings.length > 0 ? (
                  correlation.findings.map((f, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-dark-surface border border-dark-outline text-xs font-mono">
                      <span className="text-amber-warning font-bold block mb-1">{f.title}</span>
                      <p className="text-dark-on-surface/70 text-[11px]">{f.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-dark-on-surface/50">
                    No discrepancies across the attached files.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
