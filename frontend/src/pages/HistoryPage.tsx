import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileBarChart, FileDown, ArrowUpRight, RefreshCw, Shield, Trash2 } from 'lucide-react'
import { getInvestigations, getReportDownloadUrl } from '../services/api'

export const HistoryPage: React.FC = () => {
  const [cases, setCases] = useState<Array<{ id: string; title: string; created_at: string }>>([])
  const [loading, setLoading] = useState(true)

  const loadCases = async () => {
    setLoading(true)
    try {
      const res = await getInvestigations()
      setCases(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-dark-outline-variant pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-dark-primary/10 border border-dark-primary/30 flex items-center justify-center text-dark-primary">
            <FileBarChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg text-white">Forensic Investigation History</h2>
            <p className="font-body text-xs text-dark-on-surface/70">
              Archived case files, cryptographic logs, and sealed ReportLab PDF dossiers.
            </p>
          </div>
        </div>

        <button
          onClick={loadCases}
          className="p-2 rounded-lg bg-dark-surface border border-dark-outline hover:border-dark-primary text-dark-on-surface/70 hover:text-white transition-all text-xs font-mono flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Ledger</span>
        </button>
      </div>

      <div className="rounded-xl bg-dark-surface-container border border-dark-outline-variant overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-dark-surface-container-high border-b border-dark-outline text-[11px] text-dark-on-surface/60 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Investigation Title</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-outline-variant/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-dark-on-surface/50">
                    Querying forensic ledger records...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-dark-on-surface/50">
                    No completed case dossiers found. Start an image, video, audio, or document analysis.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c.id} className="hover:bg-dark-surface-container-high/40 transition-colors">
                    <td className="py-3.5 px-4 text-dark-primary font-bold">{c.id}</td>
                    <td className="py-3.5 px-4 text-white font-medium max-w-xs truncate">{c.title}</td>
                    <td className="py-3.5 px-4 text-dark-on-surface/60">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-dark-tertiary/15 border border-dark-tertiary/40 text-dark-tertiary font-bold text-[10px]">
                        SEALED
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/results/${c.id}`}
                          className="px-2.5 py-1 rounded bg-dark-surface border border-dark-outline hover:border-dark-primary text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3 h-3 text-dark-primary" />
                        </Link>
                        <a
                          href={getReportDownloadUrl(c.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-dark-primary/10 border border-dark-primary/30 text-dark-primary hover:bg-dark-primary/20 text-[11px] font-semibold flex items-center gap-1 transition-all"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
