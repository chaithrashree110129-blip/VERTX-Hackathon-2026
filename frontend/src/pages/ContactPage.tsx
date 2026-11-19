import React from 'react'
import { HelpCircle, Shield, Mail, FileQuestion, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const ContactPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 border-b border-dark-outline-variant pb-3">
        <div className="w-10 h-10 rounded-xl bg-dark-primary/10 border border-dark-primary/30 flex items-center justify-center text-dark-primary">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-headline font-bold text-xl text-white">Contact & Support Center</h2>
          <p className="font-body text-xs text-dark-on-surface/70">
            Frequently asked questions, forensic methodologies, and examiner assistance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-2">
          <span className="font-headline font-bold text-sm text-white">How does Error Level Analysis (ELA) work?</span>
          <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
            ELA re-saves an image at a known 75% JPEG quality factor and subtracts it from the original.
            Uniform error across the frame suggests an untouched original; localized spikes indicate that a region
            was imported or edited at a different compression level.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-2">
          <span className="font-headline font-bold text-sm text-white">Can TruthLens prove an image is real?</span>
          <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
            No. Mathematical analysis can detect inconsistencies, but the absence of obvious manipulation artifacts
            does not constitute definitive proof of authenticity. Forensic conclusions require provenance records.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-2">
          <span className="font-headline font-bold text-sm text-white">Supported File Formats</span>
          <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
            Images: JPEG, PNG, WebP, TIFF, BMP.<br />
            Videos: MP4, MOV, WebM, AVI, MKV.<br />
            Audio: WAV, MP3, FLAC, M4A, OGG.<br />
            Documents: PDF, DOCX, TXT.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-2">
          <span className="font-headline font-bold text-sm text-white">ReportLab Dossier Verification</span>
          <p className="font-body text-xs text-dark-on-surface/70 leading-relaxed">
            Every downloadable PDF report includes a SHA-256 cryptographic digest matching the original uploaded file,
            establishing chain-of-custody integrity for investigative records.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-dark-surface-container border border-dark-primary/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-headline font-bold text-base text-white">Need Examiner Technical Guidance?</h4>
          <p className="font-body text-xs text-dark-on-surface/70">
            TruthLens provides verifiable multimodal analysis pipelines for security research teams.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-dark-primary text-dark-surface font-headline font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
