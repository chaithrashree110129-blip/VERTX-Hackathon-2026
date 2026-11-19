import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  FileDown
} from 'lucide-react'
import {
  getInvestigations,
  createInvestigation,
  getCapabilities,
  getReportDownloadUrl,
  ensureSession
} from '../services/api'
import type { SystemCapabilities } from '../types'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [investigations, setInvestigations] = useState<Array<{ id: string; title: string; created_at: string }>>([])
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      await ensureSession()
      const [invList, caps] = await Promise.all([
        getInvestigations().catch(() => []),
        getCapabilities().catch(() => null),
      ])
      setInvestigations(invList)
      setCapabilities(caps)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setIsCreating(true)
    try {
      const created = await createInvestigation(newTitle.trim())
      setNewTitle('')
      navigate(`/results/${created.id}`)
    } catch (err) {
      alert('Could not create investigation case')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full">
      {/* SECTION 1: TOP CASE INTELLIGENCE & HUD METRICS (Exact Stitch reference styling) */}
      <div className="grid grid-cols-12 gap-4">
        {/* RISK ASSESSMENT GAUGE CARD (Cols 12 -> 3) */}
        <div className="col-span-12 md:col-span-3 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 shadow-xl flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-mono text-dark-on-surface/70">
            <span>PLATFORM HEALTH</span>
            <span className="text-dark-primary font-bold">TRUTHLENS v4.2</span>
          </div>

          {/* Radar Ring Visual */}
          <div className="relative w-36 h-36 my-2 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#1E2B45" stroke-width="8" />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#05D5EC"
                stroke-width="8"
                stroke-dasharray="301.6"
                stroke-dashoffset="65"
                stroke-linecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="font-headline font-bold text-3xl text-white">4</span>
              <span className="text-[10px] text-dark-on-surface/50">MODALITIES READY</span>
            </div>
          </div>

          <div className="w-full">
            <span className="inline-block px-3 py-1 rounded-full bg-dark-primary/20 border border-dark-primary text-dark-primary font-headline text-xs font-bold tracking-wider mb-2">
              ACTIVE DETECTORS
            </span>
            <p className="font-body text-xs text-dark-on-surface/70">
              OpenCV Laplacian, Pillow ELA, wave spectrum, and Document Provenance engines ready.
            </p>
          </div>
        </div>

        {/* 4 MODALITY COUNTERS (Cols 12 -> 6) */}
        <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-3">
          {/* Card 1: Image Analysis */}
          <Link
            to="/analyze/image"
            className="p-3.5 rounded-xl bg-dark-surface-container border border-dark-outline-variant hover:border-dark-primary/60 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="font-headline text-xs font-bold text-dark-on-surface/70">IMAGE ANALYSIS</span>
              <span className="p-1.5 rounded bg-dark-primary/10 text-dark-primary border border-dark-primary/20 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </span>
            </div>
            <div className="my-2">
              <span className="font-headline font-bold text-2xl text-white">ELA & Noise</span>
              <span className="block font-mono text-[11px] text-dark-tertiary">Pillow + OpenCV ready</span>
            </div>
            <div className="w-full bg-dark-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-dark-primary h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </Link>

          {/* Card 2: Video Forensics */}
          <Link
            to="/analyze/video"
            className="p-3.5 rounded-xl bg-dark-surface-container border border-dark-outline-variant hover:border-amber-warning/60 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="font-headline text-xs font-bold text-dark-on-surface/70">VIDEO FRAMES</span>
              <span className="p-1.5 rounded bg-amber-warning/10 text-amber-warning border border-amber-warning/20 group-hover:scale-105 transition-transform">
                <Video className="w-4 h-4" />
              </span>
            </div>
            <div className="my-2">
              <span className="font-headline font-bold text-2xl text-white">Kinematics</span>
              <span className="block font-mono text-[11px] text-amber-warning">Frame extraction ready</span>
            </div>
            <div className="w-full bg-dark-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-amber-warning h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </Link>

          {/* Card 3: Audio Analysis */}
          <Link
            to="/analyze/audio"
            className="p-3.5 rounded-xl bg-dark-surface-container border border-dark-outline-variant hover:border-dark-secondary/60 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="font-headline text-xs font-bold text-dark-on-surface/70">AUDIO SPECTRA</span>
              <span className="p-1.5 rounded bg-dark-secondary/10 text-dark-secondary border border-dark-secondary/20 group-hover:scale-105 transition-transform">
                <Mic className="w-4 h-4" />
              </span>
            </div>
            <div className="my-2">
              <span className="font-headline font-bold text-2xl text-white">Waveform PCM</span>
              <span className="block font-mono text-[11px] text-dark-secondary">Discontinuity scanner</span>
            </div>
            <div className="w-full bg-dark-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-dark-secondary h-full rounded-full" style={{ width: '90%' }} />
            </div>
          </Link>

          {/* Card 4: Document Analysis */}
          <Link
            to="/analyze/document"
            className="p-3.5 rounded-xl bg-dark-surface-container border border-dark-outline-variant hover:border-dark-tertiary/60 transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="font-headline text-xs font-bold text-dark-on-surface/70">DOCUMENTS</span>
              <span className="p-1.5 rounded bg-dark-tertiary/10 text-dark-tertiary border border-dark-tertiary/20 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <div className="my-2">
              <span className="font-headline font-bold text-2xl text-white">PDF / DOCX</span>
              <span className="block font-mono text-[11px] text-dark-tertiary">pypdf & python-docx</span>
            </div>
            <div className="w-full bg-dark-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-dark-tertiary h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </Link>
        </div>

        {/* RADAR SWEEPER & CAPABILITIES (Cols 12 -> 3) */}
        <div className="col-span-12 md:col-span-3 rounded-xl bg-dark-surface-container border border-dark-outline-variant p-4 shadow-xl flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between text-xs font-mono text-dark-on-surface/70">
            <span>DETECTION RADAR</span>
            <span className="text-dark-tertiary font-bold">OPERATIONAL</span>
          </div>

          <div className="relative w-32 h-32 my-1 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1E2B45" stroke-width="1" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#1E2B45" stroke-width="1" />
              <circle cx="50" cy="50" r="15" fill="none" stroke="#1E2B45" stroke-width="1" />
              <line x1="50" y1="5" x2="50" y2="95" stroke="#1E2B45" stroke-width="0.75" />
              <line x1="5" y1="50" x2="95" y2="50" stroke="#1E2B45" stroke-width="0.75" />
              <line x1="50" y1="50" x2="88" y2="20" stroke="#05D5EC" stroke-width="1.5" className="animate-radar-sweep" />
              <circle cx="68" cy="38" r="2.5" fill="#EF4444" />
              <circle cx="42" cy="62" r="2" fill="#F59E0B" />
              <circle cx="34" cy="32" r="2" fill="#34D399" />
            </svg>
          </div>

          <div className="w-full font-mono text-[11px] flex flex-col gap-1 text-dark-on-surface/80">
            <div className="flex items-center justify-between">
              <span>OpenCV Core:</span>
              <strong className="text-dark-primary">{capabilities?.opencv.available ? 'Ready' : 'Checking'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>imageio-ffmpeg:</span>
              <strong className="text-dark-tertiary">{capabilities?.ffmpeg.available ? 'Ready' : 'Fallback'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Integrity Audit:</span>
              <strong className="text-dark-primary font-bold">SHA-256 SEALED</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CREATE NEW INVESTIGATION CASE */}
      <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-headline font-bold text-base text-white">Create New Forensic Investigation Case</h3>
          <p className="font-body text-xs text-dark-on-surface/70">
            Bundle multimodal evidence (images, audio, video recordings, briefing documents) into one linked case dossier.
          </p>
        </div>

        <form onSubmit={handleCreateCase} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="e.g. Case #F-2291 Press Release Verification"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="px-3.5 py-2 rounded-lg bg-dark-surface border border-dark-outline-variant text-sm font-body text-white placeholder:text-dark-on-surface/40 focus:outline-none focus:border-dark-primary w-full md:w-80"
          />
          <button
            type="submit"
            disabled={isCreating || !newTitle.trim()}
            className="px-4 py-2 rounded-lg bg-dark-primary text-dark-surface font-headline font-bold text-xs uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isCreating ? 'Creating...' : 'Initialize Case'}</span>
          </button>
        </form>
      </div>

      {/* SECTION 3: RECENT INVESTIGATION CASES LIST */}
      <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-dark-primary" />
            <h3 className="font-headline font-bold text-base text-white">Active Case Dossiers</h3>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg text-dark-on-surface/60 hover:text-dark-on-surface hover:bg-dark-surface-container-high transition-colors"
            title="Refresh case records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center font-mono text-xs text-dark-on-surface/50">
            Syncing database records...
          </div>
        ) : investigations.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-dark-on-surface/30 mb-1" />
            <p className="font-headline font-semibold text-sm text-white">No Forensic Investigations Found</p>
            <p className="font-body text-xs text-dark-on-surface/60 max-w-sm">
              Create an investigation case or click any of the analysis tools above to inspect a single evidence file.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {investigations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-lg bg-dark-surface border border-dark-outline-variant hover:border-dark-primary/50 transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-dark-on-surface/50 mb-1.5">
                    <span className="text-dark-primary font-bold">{inv.id}</span>
                    <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-headline font-bold text-sm text-white line-clamp-1 group-hover:text-dark-primary transition-colors">
                    {inv.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-dark-outline-variant/60 font-mono text-xs">
                  <Link
                    to={`/results/${inv.id}`}
                    className="text-dark-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Inspect Case</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>

                  <a
                    href={getReportDownloadUrl(inv.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-dark-on-surface/60 hover:text-dark-on-surface flex items-center gap-1"
                    title="Download sealed PDF Dossier"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
