'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { formatNumber, formatPercent } from '@/lib/utils/format-numbers'
import { formatRelative } from '@/lib/utils/date'
import type { ContentItemWithMetrics } from '@/lib/types'
import { PlayCircle, Camera, Globe, ExternalLink, Trash2, ChevronDown } from 'lucide-react'

const PLATFORM_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  youtube: { label: 'YouTube', bg: '#fef2f2', text: '#b91c1c', icon: <PlayCircle size={10} /> },
  instagram: { label: 'Instagram', bg: '#faf5ff', text: '#7e22ce', icon: <Camera size={10} /> },
  facebook: { label: 'Facebook', bg: '#eff6ff', text: '#1d4ed8', icon: <Globe size={10} /> },
}

const PLATFORMS = [
  { value: '', label: 'All Platforms' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'views', label: 'Most views' },
  { value: 'engagement', label: 'Best engagement' },
]

interface Props {
  initialItems: ContentItemWithMetrics[]
  initialPlatform?: string
  initialSort?: string
}

export default function ContentLibraryClient({ initialItems, initialPlatform = '', initialSort = 'newest' }: Props) {
  const [items] = useState(initialItems)
  const [platform, setPlatform] = useState(initialPlatform)
  const [sort, setSort] = useState(initialSort)
  const [deleting, setDeleting] = useState<number | null>(null)
  const router = useRouter()

  const filtered = items.filter((i) => !platform || i.platform === platform)
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'views') return b.views - a.views
    if (sort === 'engagement') return b.engagement_rate - a.engagement_rate
    return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
  })

  async function handleDelete(id: number) {
    if (!confirm('Remove this item from the library?')) return
    setDeleting(id)
    await fetch(`/api/content/${id}`, { method: 'DELETE' })
    router.refresh()
    setDeleting(null)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="appearance-none bg-white border rounded-xl px-4 py-2 pr-8 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-white border rounded-xl px-4 py-2 pr-8 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <span
          className="text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: '#eef2ff', color: '#6366f1' }}
        >
          {sorted.length} items
        </span>
      </div>

      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl py-20 text-center text-sm"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          No content found. Connect your accounts and sync to populate this library.
        </motion.div>
      ) : (
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#f9fafb' }}>
                <th className="text-left py-3 px-5 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Title</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Platform</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Views</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Likes</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Comments</th>
                <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Engagement</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Published</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {sorted.map((item, i) => {
                  const cfg = PLATFORM_CONFIG[item.platform]
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="group"
                      style={{ borderBottom: i < sorted.length - 1 ? '1px solid #f9fafb' : undefined }}
                    >
                      <td className="py-3.5 px-5">
                        <div
                          className="font-medium line-clamp-1 max-w-xs group-hover:text-indigo-600 transition-colors"
                          style={{ color: 'var(--text)' }}
                        >
                          {item.title ?? '(untitled)'}
                        </div>
                        <div className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {item.content_type}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: cfg?.bg ?? '#f3f4f6', color: cfg?.text ?? '#374151' }}
                        >
                          {cfg?.icon}
                          {cfg?.label ?? item.platform}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                        {formatNumber(item.views)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatNumber(item.likes)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {formatNumber(item.comments)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums"
                          style={{
                            background: item.engagement_rate >= 5 ? '#d1fae5' : item.engagement_rate >= 3 ? '#fef3c7' : '#f3f4f6',
                            color: item.engagement_rate >= 5 ? '#065f46' : item.engagement_rate >= 3 ? '#92400e' : '#6b7280',
                          }}
                        >
                          {formatPercent(item.engagement_rate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {formatRelative(item.published_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-500 hover:text-indigo-700 transition-colors"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
