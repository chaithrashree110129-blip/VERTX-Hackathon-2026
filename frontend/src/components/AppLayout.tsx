import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Shield,
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  GitFork,
  FileBarChart,
  HelpCircle,
  Settings,
  Bell,
  Activity,
  FolderOpen
} from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Image Analysis', path: '/analyze/image', icon: ImageIcon },
    { name: 'Video Forensics', path: '/analyze/video', icon: Video },
    { name: 'Audio Forensics', path: '/analyze/audio', icon: Mic },
    { name: 'Document Provenance', path: '/analyze/document', icon: FileText },
    { name: 'Evidence Correlation', path: '/correlation', icon: GitFork },
    { name: 'Reports & History', path: '/history', icon: FileBarChart },
    { name: 'About Platform', path: '/about', icon: HelpCircle },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-surface text-dark-on-surface">
      {/* LEFT COMPACT SIDEBAR NAVIGATION (Exact layout as Stitch UI designs) */}
      <aside className="w-16 border-r border-dark-outline-variant bg-dark-surface-container flex flex-col items-center py-4 justify-between z-30 shrink-0 select-none">
        <div className="flex flex-col items-center gap-5 w-full">
          {/* TruthLens Brand Icon */}
          <Link
            to="/"
            className="w-10 h-10 rounded-xl bg-dark-primary/10 border border-dark-primary/40 flex items-center justify-center text-dark-primary shadow-[0_0_15px_rgba(5,213,236,0.3)] hover:scale-105 transition-transform"
            title="TruthLens Home"
          >
            <Shield className="w-5 h-5 text-dark-primary" />
          </Link>

          {/* Nav Icons */}
          <nav className="flex flex-col items-center gap-2.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-dark-primary/20 border border-dark-primary/50 text-dark-primary shadow-[0_0_12px_rgba(5,213,236,0.25)]'
                      : 'text-dark-on-surface/50 hover:text-dark-on-surface hover:bg-dark-surface-container-high'
                  }`}
                  title={item.name}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User avatar / footer status */}
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/help"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-dark-on-surface/50 hover:text-dark-on-surface hover:bg-dark-surface-container-high transition-colors"
            title="Platform Settings & Verification"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <div
            className="w-8 h-8 rounded-full bg-dark-surface-container-highest border border-dark-outline flex items-center justify-center font-bold text-xs text-dark-primary shadow"
            title="Investigator: JS (Lead Examiner)"
          >
            JS
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOP BAR */}
        <header className="h-14 border-b border-dark-outline-variant bg-dark-surface-container/95 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="font-headline font-bold text-lg tracking-wider text-dark-on-surface">TRUTHLENS</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-dark-primary/10 border border-dark-primary/30 text-dark-primary">
                FORENSIC PLATFORM v4.2
              </span>
            </Link>
            <span className="text-dark-on-surface/30 text-sm">/</span>
            <div className="flex items-center gap-2 font-mono text-xs text-dark-on-surface/70 truncate">
              <span>Platform</span>
              <span className="text-dark-on-surface/30">/</span>
              <span className="text-dark-primary font-medium">
                {navItems.find((i) => i.path === location.pathname)?.name || 'Analysis Session'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Operational Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-dark-surface border border-dark-outline text-xs font-mono text-dark-tertiary">
              <span className="w-2 h-2 rounded-full bg-dark-tertiary animate-pulse" />
              <span>ENGINES ONLINE</span>
            </div>

            <div className="h-4 w-px bg-dark-outline-variant hidden sm:block" />

            {/* Quick Upload Action */}
            <Link
              to="/analyze/image"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-dark-primary/15 border border-dark-primary/40 text-dark-primary font-headline text-xs font-semibold hover:bg-dark-primary/25 transition-all shadow-[0_0_10px_rgba(5,213,236,0.2)]"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>New Evidence</span>
            </Link>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg text-dark-on-surface/70 hover:text-white hover:bg-dark-surface-container-high transition-colors"
              title="Forensic Signals"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-warning" />
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 flex flex-col gap-4">
          {children}
        </main>
      </div>
    </div>
  )
}
