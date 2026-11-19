import React, { useEffect, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle2, Cpu, HelpCircle } from 'lucide-react'
import { getCapabilities } from '../services/api'
import type { SystemCapabilities } from '../types'

export const AboutPage: React.FC = () => {
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null)

  useEffect(() => {
    getCapabilities()
      .then((data) => setCapabilities(data))
      .catch((e) => console.error(e))
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 border-b border-dark-outline-variant pb-3">
        <div className="w-10 h-10 rounded-xl bg-dark-primary/10 border border-dark-primary/30 flex items-center justify-center text-dark-primary">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-headline font-bold text-xl text-white">About TruthLens Multimodal Forensics</h2>
          <p className="font-body text-xs text-dark-on-surface/70">
            Design principles, analytical limitations, and deterministic system telemetry.
          </p>
        </div>
      </div>

      {/* CORE MISSION */}
      <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-6 flex flex-col gap-3">
        <h3 className="font-headline font-bold text-base text-white">Platform Objective</h3>
        <p className="font-body text-sm text-dark-on-surface/80 leading-relaxed">
          TruthLens is an AI-assisted multimodal content analysis platform designed to inspect digital content
          and surface detectable indicators of synthetic generation, visual tampering, acoustic splicing,
          and metadata modification.
        </p>
        <p className="font-body text-sm text-dark-on-surface/80 leading-relaxed">
          The platform operates strictly on verifiable, reproducible technical methods. We explicitly distinguish
          detected mathematical indicators from confirmed facts. AI systems cannot establish absolute truth;
          they provide structured evidence to support human investigator judgment.
        </p>
      </div>

      {/* LIVE ENGINE TELEMETRY */}
      <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-dark-outline-variant pb-2">
          <h3 className="font-headline font-bold text-base text-white">Integrated Backend Engines</h3>
          <span className="font-mono text-xs text-dark-primary">LIVE VERIFICATION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-dark-surface border border-dark-outline flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">OpenCV & NumPy</span>
              <span className="text-dark-tertiary">Operational</span>
            </div>
            <p className="text-dark-on-surface/60 text-[11px]">{capabilities?.opencv.detail || 'Computer vision frame processing'}</p>
          </div>

          <div className="p-3 rounded-lg bg-dark-surface border border-dark-outline flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Pillow (PIL)</span>
              <span className="text-dark-tertiary">Operational</span>
            </div>
            <p className="text-dark-on-surface/60 text-[11px]">{capabilities?.pillow.detail || 'EXIF extraction & ELA compression error'}</p>
          </div>

          <div className="p-3 rounded-lg bg-dark-surface border border-dark-outline flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">imageio-ffmpeg</span>
              <span className="text-dark-tertiary">Operational</span>
            </div>
            <p className="text-dark-on-surface/60 text-[11px]">{capabilities?.ffmpeg.detail || 'Demuxing & container decoding'}</p>
          </div>

          <div className="p-3 rounded-lg bg-dark-surface border border-dark-outline flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold">Document Parsers</span>
              <span className="text-dark-tertiary">Operational</span>
            </div>
            <p className="text-dark-on-surface/60 text-[11px]">pypdf (PDF streams) & python-docx (OpenXML metadata)</p>
          </div>
        </div>
      </div>

      {/* COMPLIANCE & LIMITATIONS NOTICE */}
      <div className="rounded-xl bg-dark-surface-container border border-amber-warning/40 p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-warning font-headline font-bold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>FORENSIC ETHICS & NON-HALLUCINATION COMMITMENT</span>
        </div>
        <p className="font-body text-xs text-dark-on-surface/80 leading-relaxed">
          TruthLens never invents a deepfake percentage or fabricates confidence levels without a calibrated,
          installed local classifier. When a capability is unconfigured, the platform transparently discloses the
          limitation in every report rather than simulating a fictitious score.
        </p>
      </div>
    </div>
  )
}
