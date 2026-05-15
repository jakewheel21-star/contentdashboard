'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { TranscriptAnalysis, AnalysisResult, ContentIdeaInput } from '@/lib/types'
import ContentIdeaCard from './ContentIdeaCard'
import { Sparkles, PlayCircle, Camera, Globe, History, ChevronRight } from 'lucide-react'

const PLATFORM_CONFIG: Record<string, { label: string; icon: React.ReactNode; activeGradient: string }> = {
  youtube:  { label: 'YouTube',  icon: <PlayCircle size={12} />, activeGradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  instagram: { label: 'Instagram', icon: <Camera size={12} />,    activeGradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  facebook: { label: 'Facebook', icon: <Globe size={12} />,      activeGradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
}

interface Props {
  initialHistory: TranscriptAnalysis[]
}

export default function SalesAnalyzerClient({ initialHistory }: Props) {
  const [transcript, setTranscript] = useState('')
  const [title, setTitle] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube', 'instagram'])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState('')
  const [savedAnalysisId, setSavedAnalysisId] = useState<number | null>(null)
  const [history] = useState(initialHistory)
  const router = useRouter()

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  async function handleAnalyze() {
    if (!transcript.trim() || transcript.length < 50) {
      setError('Please paste a transcript of at least 50 characters.')
      return
    }
    setError('')
    setLoading(true)
    setStreamText('')
    setResult(null)

    try {
      const res = await fetch('/api/analyze/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, title, platforms: selectedPlatforms }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Analysis failed.')
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreamText(full)
      }

      const metaMatch = full.match(/\n\n({"__analysisId":\d+})$/)
      if (metaMatch) {
        const meta = JSON.parse(metaMatch[1])
        setSavedAnalysisId(meta.__analysisId)
        full = full.replace(metaMatch[0], '')
      }

      try {
        setResult(JSON.parse(full) as AnalysisResult)
      } catch {
        const jsonMatch = full.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try { setResult(JSON.parse(jsonMatch[0]) as AnalysisResult) } catch { /* show raw */ }
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Input + Results */}
      <div className="lg:col-span-2 space-y-5">
        {/* Input card */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                Call Title
                <span className="text-xs font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Enterprise prospect — pricing discussion"
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            {/* Platform selector */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Target Platforms
              </label>
              <div className="flex gap-2">
                {Object.entries(PLATFORM_CONFIG).map(([p, cfg]) => {
                  const active = selectedPlatforms.includes(p)
                  return (
                    <motion.button
                      key={p}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => togglePlatform(p)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={
                        active
                          ? { background: cfg.activeGradient, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }
                          : { background: '#f3f4f6', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                      }
                    >
                      {cfg.icon}
                      {cfg.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Transcript */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Paste Transcript
                </label>
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {transcript.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your sales call transcript here..."
                rows={11}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono transition-shadow"
                style={{ border: '1px solid var(--border)', color: 'var(--text)', background: '#fafafa' }}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm px-4 py-3 rounded-xl"
                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              onClick={handleAnalyze}
              disabled={loading}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Analyzing transcript...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate Content Ideas
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Streaming indicator */}
        <AnimatePresence>
          {loading && !result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-indigo-500"
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Analyzing your transcript...
                </span>
              </div>
              <div
                className="text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto rounded-xl p-3"
                style={{ color: 'var(--text-muted)', background: '#f9fafb' }}
              >
                {streamText || 'Waiting for response...'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* Themes & pain points */}
              {(result.themes?.length > 0 || result.pain_points?.length > 0) && (
                <div
                  className="bg-white rounded-2xl p-6"
                  style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                >
                  {result.themes?.length > 0 && (
                    <>
                      <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Themes Identified</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.themes.map((t, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ background: '#eef2ff', color: '#6366f1' }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {result.pain_points?.length > 0 && (
                    <>
                      <div
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Pain Points
                      </div>
                      <ul className="space-y-2">
                        {result.pain_points.map((p, i) => (
                          <li key={i} className="text-sm flex gap-2.5">
                            <span className="text-red-400 mt-0.5 shrink-0">•</span>
                            <span style={{ color: 'var(--text)' }}>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Content ideas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                    Content Ideas
                    <span
                      className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                      style={{ background: '#eef2ff', color: '#6366f1' }}
                    >
                      {result.content_ideas?.length ?? 0}
                    </span>
                  </h3>
                  {savedAnalysisId && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Saved to history
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {(result.content_ideas ?? []).map((idea, i) => (
                    <ContentIdeaCard key={i} idea={idea} index={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: History */}
      <div>
        <div
          className="bg-white rounded-2xl p-5 sticky top-0"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <History size={15} style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Analysis History</h3>
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No analyses yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {history.map((h) => (
                <a
                  key={h.id}
                  href={`/sales-analyzer/${h.id}`}
                  className="flex items-center justify-between p-3 rounded-xl transition-colors group"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = '#f9fafb'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text)' }}>
                      {h.title ?? 'Untitled Analysis'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(h.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <ChevronRight size={13} className="shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
