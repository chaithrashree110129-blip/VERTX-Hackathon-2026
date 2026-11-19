import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  Search,
  CheckCircle2,
  FileText,
  Video,
  Mic,
  Image as ImageIcon,
  ArrowRight,
  Fingerprint,
  Layers,
  Lock,
  DownloadCloud,
  ChevronRight,
  Activity
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-surface text-dark-on-surface overflow-x-hidden select-none">
      {/* TOP NAVIGATION BAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-dark-outline-variant/80 bg-dark-surface/90 backdrop-blur-md px-6 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-dark-primary/10 border border-dark-primary/40 flex items-center justify-center text-dark-primary shadow-[0_0_15px_rgba(5,213,236,0.3)]">
            <Shield className="w-5 h-5 text-dark-primary" />
          </div>
          <div>
            <span className="font-headline font-bold text-lg tracking-wider text-white">TRUTHLENS</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-dark-primary/10 text-dark-primary border border-dark-primary/20">
              MULTIMODAL FORENSICS
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-headline text-sm font-medium text-dark-on-surface/70">
          <a href="#features" className="hover:text-dark-primary transition-colors">Capabilities</a>
          <a href="#modalities" className="hover:text-dark-primary transition-colors">Modalities</a>
          <a href="#how-it-works" className="hover:text-dark-primary transition-colors">Methodology</a>
          <Link to="/about" className="hover:text-dark-primary transition-colors">Forensic Policy</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-lg bg-dark-primary text-dark-surface font-headline font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_15px_rgba(5,213,236,0.4)] transition-all flex items-center gap-1.5"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 lg:px-16 flex flex-col items-center text-center overflow-hidden">
        {/* Animated Background Mesh & Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-dark-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-dark-secondary/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-surface-container border border-dark-primary/30 text-dark-primary font-mono text-xs mb-6 shadow-md">
          <Activity className="w-3.5 h-3.5 animate-pulse text-dark-primary" />
          <span>PRODUCTION-READY CONTENT AUTHENTICITY INTELLIGENCE</span>
        </div>

        {/* Headline */}
        <h1 className="font-headline font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight max-w-4xl leading-tight mb-6">
          See Beyond the Surface. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-dark-primary via-teal-scan to-dark-secondary">
            Discover the Evidence.
          </span>
        </h1>

        <p className="font-body text-base sm:text-lg text-dark-on-surface/70 max-w-2xl mb-10 leading-relaxed">
          TruthLens inspects digital media using multi-tiered signals: Error Level Analysis,
          spatial noise consistency, facial landmark geometry, acoustic spectral discontinuity,
          and cryptographic provenance chains.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-dark-primary text-dark-surface font-headline font-bold text-sm tracking-wide hover:brightness-110 shadow-[0_0_25px_rgba(5,213,236,0.45)] transition-all flex items-center justify-center gap-2"
          >
            <span>Open Forensic Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#modalities"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-dark-surface-container-high border border-dark-outline hover:border-dark-primary text-dark-on-surface font-headline font-semibold text-sm transition-all"
          >
            Explore 4 Modalities
          </a>
        </div>

        {/* Live UI Mockup Card (Inspired by cheguri.jpeg & video recognition Stitch references) */}
        <div className="w-full max-w-5xl rounded-2xl bg-dark-surface-container border border-dark-outline-variant p-4 lg:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative group">
          <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3 mb-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-dark-primary animate-ping" />
              <span className="text-dark-primary font-bold">CASE #F-2291 // STREAM_SESSION_14MAY.mp4</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-warning/20 text-amber-warning border border-amber-warning font-bold">
              CROSS-MODAL DISCORD (94.2%)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-left">
            {/* Visual Scan Mockup */}
            <div className="md:col-span-7 rounded-xl bg-black border border-dark-outline-variant aspect-video relative overflow-hidden flex items-center justify-center">
              <div className="animate-scan-line" />
              <div className="absolute inset-0 bg-[radial-gradient(#05d5ec15_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Overlays */}
              <div className="absolute top-4 left-[25%] w-[50%] h-[65%] border-2 border-dashed border-amber-warning rounded bg-amber-warning/10 pointer-events-none p-2 flex flex-col justify-between">
                <span className="font-mono text-[10px] text-amber-warning font-bold bg-black/90 px-2 py-0.5 rounded border border-amber-warning w-max">
                  ELA ANOMALY: PERIORBITAL REGION
                </span>
                <span className="font-mono text-[9px] text-dark-primary self-end">
                  Δ 3.8x baseline variance
                </span>
              </div>

              <div className="absolute bottom-3 left-4 font-mono text-xs text-white bg-black/80 px-2 py-1 rounded border border-dark-outline">
                Frame: 847 / 2,340 • Time: 00:28.3 • FPS: 29.97
              </div>
            </div>

            {/* Telemetry Panel */}
            <div className="md:col-span-5 flex flex-col justify-between gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-dark-surface border border-dark-outline-variant flex items-center justify-between">
                <div>
                  <span className="text-dark-on-surface/50 text-[10px] block">ESTIMATED RISK GAUGE</span>
                  <span className="font-headline font-bold text-2xl text-amber-warning">72 / 100</span>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-amber-warning border-t-dark-surface flex items-center justify-center font-bold text-xs text-white">
                  HIGH
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-outline-variant">
                  <span className="text-dark-on-surface/70">Visual Splicing Delta</span>
                  <span className="text-red-anomaly font-bold">94.1% Critical</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-outline-variant">
                  <span className="text-dark-on-surface/70">Audio Spectral Cutoff</span>
                  <span className="text-amber-warning font-bold">2.3 kHz Drop</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-dark-surface border border-dark-outline-variant">
                  <span className="text-dark-on-surface/70">EXIF Device Consistency</span>
                  <span className="text-dark-tertiary font-bold">Verified Origin</span>
                </div>
              </div>

              <Link
                to="/dashboard"
                className="w-full py-2.5 rounded-lg bg-dark-primary/10 border border-dark-primary/40 text-dark-primary text-center font-headline font-bold text-xs hover:bg-dark-primary/20 transition-all"
              >
                Inspect Live Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4 CONTENT MODALITIES */}
      <section id="modalities" className="py-20 px-6 lg:px-16 border-t border-dark-outline-variant bg-dark-surface-container/40">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white mb-4">
            Four Multimodal Analysis Engines
          </h2>
          <p className="font-body text-base text-dark-on-surface/70 max-w-2xl mx-auto">
            Uploaded files undergo deterministic mathematical scrutiny through OpenCV, Pillow,
            pypdf, python-docx, and audio spectral processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Image */}
          <Link
            to="/analyze/image"
            className="p-6 rounded-xl bg-dark-surface border border-dark-outline-variant hover:border-dark-primary/60 hover:shadow-[0_0_20px_rgba(5,213,236,0.15)] transition-all flex flex-col justify-between text-left group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-dark-primary/10 border border-dark-primary/30 flex items-center justify-center text-dark-primary mb-4 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-lg text-white mb-2">Image Analysis</h3>
              <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed mb-4">
                Error Level Analysis (ELA), EXIF metadata inspection, channel noise variance, and
                compression artifact detection.
              </p>
            </div>
            <span className="font-mono text-xs text-dark-primary flex items-center gap-1 font-semibold">
              Analyze Image <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Video */}
          <Link
            to="/analyze/video"
            className="p-6 rounded-xl bg-dark-surface border border-dark-outline-variant hover:border-amber-warning/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all flex flex-col justify-between text-left group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-warning/10 border border-amber-warning/30 flex items-center justify-center text-amber-warning mb-4 group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-lg text-white mb-2">Video Forensics</h3>
              <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed mb-4">
                Frame extraction, Laplacian sharpness degradation, frame-difference scene shifts, and
                embedded audio track extraction.
              </p>
            </div>
            <span className="font-mono text-xs text-amber-warning flex items-center gap-1 font-semibold">
              Inspect Video <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Audio */}
          <Link
            to="/analyze/audio"
            className="p-6 rounded-xl bg-dark-surface border border-dark-outline-variant hover:border-dark-secondary/60 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] transition-all flex flex-col justify-between text-left group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-dark-secondary/10 border border-dark-secondary/30 flex items-center justify-center text-dark-secondary mb-4 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-lg text-white mb-2">Audio Forensics</h3>
              <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed mb-4">
                PCM waveform properties, zero-crossing rate calculation, spectral discontinuities, and
                acoustic clipping indicators.
              </p>
            </div>
            <span className="font-mono text-xs text-dark-secondary flex items-center gap-1 font-semibold">
              Decode Waveform <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Document */}
          <Link
            to="/analyze/document"
            className="p-6 rounded-xl bg-dark-surface border border-dark-outline-variant hover:border-dark-tertiary/60 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all flex flex-col justify-between text-left group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-dark-tertiary/10 border border-dark-tertiary/30 flex items-center justify-center text-dark-tertiary mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-lg text-white mb-2">Document Provenance</h3>
              <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed mb-4">
                PDF font structure & revision history, DOCX metadata inspection, hidden editing timestamps,
                and text extraction.
              </p>
            </div>
            <span className="font-mono text-xs text-dark-tertiary flex items-center gap-1 font-semibold">
              Inspect Document <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* METHODOLOGY & PHILOSOPHY */}
      <section id="how-it-works" className="py-20 px-6 lg:px-16 border-t border-dark-outline-variant">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline font-bold text-3xl sm:text-4xl text-white mb-4">
              Ethical AI & Forensic Methodology
            </h2>
            <p className="font-body text-base text-dark-on-surface/70">
              TruthLens strictly adheres to evidence-based reporting without fabricating ungrounded certainty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-primary/10 text-dark-primary flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h4 className="font-headline font-bold text-base text-white">Indicators, Not Verdicts</h4>
              <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
                We clearly differentiate between detected mathematical anomalies and confirmed real-world facts.
                Human analysts retain full oversight.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-secondary/10 text-dark-secondary flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h4 className="font-headline font-bold text-base text-white">Cross-Modal Correlation</h4>
              <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
                Audio streams from video containers are checked against standalone audio evidence to identify
                time-shift disconnections or dubbing.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-tertiary/10 text-dark-tertiary flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h4 className="font-headline font-bold text-base text-white">Cryptographic Dossiers</h4>
              <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
                Every analysis is hashed with SHA-256 and exportable into an audit-ready PDF forensic dossier via
                ReportLab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-dark-outline-variant py-10 px-6 lg:px-16 bg-dark-surface text-xs font-mono text-dark-on-surface/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white font-headline font-bold">
          <Shield className="w-4 h-4 text-dark-primary" />
          <span>TruthLens Multimodal Platform</span>
        </div>
        <p className="text-center sm:text-right">
          Built for researchers, fact-checkers, and digital forensics examiners.
        </p>
      </footer>
    </div>
  )
}
