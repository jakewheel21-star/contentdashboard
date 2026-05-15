'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { formatNumber, formatPercent } from '@/lib/utils/format-numbers'
import { formatRelative } from '@/lib/utils/date'
import type { CompetitorWithMetrics } from '@/lib/types'
import {
  PlayCircle, Camera, Globe, RefreshCw, Trash2, ExternalLink,
  Users, Heart, TrendingUp, ChevronDown, Plus
} from 'lucide-react'

const PLATFORM_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  youtube:  { label: 'YouTube',   bg: '#fef2f2', text: '#b91c1c', icon: <PlayCircle size={10} /> },
  instagram: { label: 'Instagram', bg: '#faf5ff', text: '#7e22ce', icon: <Camera size={10} /> },
  facebook: { label: 'Facebook',  bg: '#eff6ff', text: '#1d4ed8', icon: <Globe size={10} /> },
}

const PLATFORMS = ['youtube', 'instagram', 'facebook']

interface Props {
  initialCompetitors: CompetitorWithMetrics[]
}

export default function CompetitorsClient({ initialCompetitors }: Props) {
  const [competitors, setCompetitors] = useState(initialCompetitors)
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [syncMessages, setSyncMessages] = useState<Record<number, string>>({})
  const router = useRouter()

  async function handleAdd() {
    if (!handle.trim()) { setError('Handle is required'); return }
    setAdding(true)
    setError('')
    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, handle: handle.trim(), notes }),
    })
    if (res.ok) {
      setHandle('')
      setNotes('')
      router.refresh()
    } else {
      const err = await res.json()
      setError(err.error ?? 'Failed to add competitor')
    }
    setAdding(false)
  }

  async function handleSync(id: number) {
    setSyncing(id)
    setSyncMessages((prev) => ({ ...prev, [id]: '' }))
    const res = await fetch(`/api/competitors/${id}/sync`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      setSyncMessages((prev) => ({
        ...prev,
        [id]: `Updated: ${data.displayName ?? ''} (${data.subscribers?.toLocaleString() ?? '?'} subscribers)`,
      }))
      router.refresh()
    } else {
      setSyncMessages((prev) => ({ ...prev, [id]: data.message ?? data.error ?? 'Sync failed' }))
    }
    setSyncing(null)
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this competitor?')) return
    await fetch(`/api/competitors/${id}`, { method: 'DELETE' })
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Add Competitor</h3>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="appearance-none bg-white border rounded-xl px-4 py-2.5 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle or channel URL"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 min-w-[200px] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-44 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
            }}
          >
            <Plus size={14} />
            {adding ? 'Adding...' : 'Add'}
          </motion.button>
        </div>
        {error && (
          <div className="text-sm mt-3 px-3 py-2 rounded-xl" style={{ background: '#fef2f2', color: '#b91c1c' }}>
            {error}
          </div>
        )}
        {platform !== 'youtube' && (
          <div
            className="mt-3 text-xs px-4 py-2.5 rounded-xl"
            style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}
          >
            Auto-sync is only available for YouTube. Instagram and Facebook competitors can be tracked manually.
          </div>
        )}
      </div>

      {/* Competitor list */}
      {competitors.length === 0 ? (
        <div
          className="bg-white rounded-2xl py-20 text-center text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          No competitors added yet. Add handles above to start benchmarking.
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {competitors.map((c, i) => {
              const meta = PLATFORM_META[c.platform]
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5"
                  style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: '#f3f4f6', color: 'var(--text-muted)' }}
                      >
                        {(c.display_name ?? c.handle).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: 'var(--text)' }}>
                          {c.display_name ?? c.handle}
                        </div>
                        <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {c.handle}
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ background: meta?.bg ?? '#f3f4f6', color: meta?.text ?? '#374151' }}
                      >
                        {meta?.icon}
                        {c.platform}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.platform === 'youtube' && (
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleSync(c.id)}
                          disabled={syncing === c.id}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                          <motion.span
                            animate={syncing === c.id ? { rotate: 360 } : {}}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <RefreshCw size={11} />
                          </motion.span>
                          {syncing === c.id ? 'Syncing…' : 'Sync'}
                        </motion.button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div
                    className="grid grid-cols-3 gap-4 mt-4 pt-4"
                    style={{ borderTop: '1px solid #f3f4f6' }}
                  >
                    <div>
                      <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                        <Users size={10} />
                        Followers
                      </div>
                      <div className="font-bold" style={{ color: 'var(--text)' }}>
                        {c.followers > 0 ? formatNumber(c.followers) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                        <Heart size={10} />
                        Avg Likes
                      </div>
                      <div className="font-bold" style={{ color: 'var(--text)' }}>
                        {c.avg_likes > 0 ? formatNumber(c.avg_likes) : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                        <TrendingUp size={10} />
                        Engagement
                      </div>
                      <div className="font-bold" style={{ color: 'var(--text)' }}>
                        {c.engagement_rate > 0 ? formatPercent(c.engagement_rate) : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Recent posts */}
                  {c.recent_posts.length > 0 && (
                    <div className="mt-4 pt-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                      <div
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Recent Posts
                      </div>
                      <div className="space-y-2">
                        {c.recent_posts.slice(0, 3).map((post) => (
                          <div key={post.id} className="flex items-center justify-between gap-3 group">
                            <div className="text-sm line-clamp-1 flex-1" style={{ color: 'var(--text)' }}>
                              {post.url ? (
                                <a
                                  href={post.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-indigo-600 flex items-center gap-1"
                                >
                                  {post.title ?? '(untitled)'}
                                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                              ) : (
                                post.title ?? '(untitled)'
                              )}
                            </div>
                            <div className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                              {post.views > 0 && `${formatNumber(post.views)} views · `}
                              {formatRelative(post.published_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sync message */}
                  {syncMessages[c.id] && (
                    <div
                      className="mt-3 text-xs px-3 py-2 rounded-xl"
                      style={{ background: '#f9fafb', color: 'var(--text-muted)' }}
                    >
                      {syncMessages[c.id]}
                    </div>
                  )}

                  {c.last_synced && (
                    <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Last synced {formatRelative(c.last_synced)}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
