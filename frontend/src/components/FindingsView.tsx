import React from 'react'
import { ShieldAlert, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { Finding } from '../types'

interface FindingsViewProps {
  findings: Finding[]
  limitations?: string[]
  moduleName?: string
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  findings,
  limitations = [],
  moduleName = 'Content',
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-anomaly/20 border border-red-anomaly text-red-anomaly">
            <ShieldAlert className="w-3 h-3" />
            CRITICAL ANOMALY
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-warning/20 border border-amber-warning text-amber-warning">
            <AlertTriangle className="w-3 h-3" />
            SUSPICIOUS SIGNAL
          </span>
        )
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-dark-primary/10 border border-dark-primary/30 text-dark-primary">
            <Info className="w-3 h-3" />
            TECHNICAL PROPERTY
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Findings List */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2">
          <h4 className="font-headline font-bold text-sm text-dark-on-surface uppercase tracking-wider">
            Detected Signals & Technical Findings ({findings.length})
          </h4>
          <span className="text-xs font-mono text-dark-on-surface/50">
            Engine: TruthLens Multimodal Core
          </span>
        </div>

        {findings.length === 0 ? (
          <div className="p-4 rounded-lg bg-dark-surface border border-dark-outline-variant text-center text-xs font-mono text-dark-on-surface/60">
            No manipulation flags or unexpected anomalies detected in this artifact.
          </div>
        ) : (
          findings.map((item, index) => (
            <div
              key={index}
              className="p-3.5 rounded-lg bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-2 transition-colors hover:border-dark-primary/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-headline font-bold text-sm text-white">
                  {item.title}
                </span>
                {getSeverityBadge(item.severity)}
              </div>

              <p className="font-body text-xs text-dark-on-surface/80 leading-relaxed">
                {item.detail}
              </p>

              {item.basis && (
                <div className="mt-1 pt-1.5 border-t border-dark-outline-variant/60 flex items-center justify-between text-[11px] font-mono text-dark-on-surface/50">
                  <span>Analytical Basis:</span>
                  <span className="text-dark-primary/90">{item.basis}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Limitations Disclosure (Compliant with Project Directive: Never Claim Absolute Truth) */}
      <div className="p-3.5 rounded-lg bg-dark-surface-container-high border border-amber-warning/30 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-warning font-headline font-semibold text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>FORENSIC SCOPE & BOUNDARIES OF THIS ANALYSIS</span>
        </div>
        <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
          TruthLens identifies physical, mathematical, and structural discrepancies in content.
          Technical indicators do not establish malicious intent or confirmed falsification without
          cross-corroborating primary source records and chain-of-custody verification.
        </p>
        {limitations.length > 0 && (
          <ul className="list-disc list-inside text-[11px] font-mono text-dark-on-surface/60 space-y-1">
            {limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
