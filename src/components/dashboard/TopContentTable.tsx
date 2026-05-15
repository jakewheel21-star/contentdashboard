'use client'

import { motion } from 'framer-motion'
import { formatNumber, formatPercent } from '@/lib/utils/format-numbers'
import { formatRelative } from '@/lib/utils/date'
import type { ContentItemWithMetrics } from '@/lib/types'
import { PlayCircle, Camera, Globe } from 'lucide-react'

const PLATFORM_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  youtube: {
    label: 'YouTube',
    bg: '#fef2f2',
    text: '#b91c1c',
    icon: <PlayCircle size={10} />,
  },
  instagram: {
    label: 'Instagram',
    bg: '#faf5ff',
    text: '#7e22ce',
    icon: <Camera size={10} />,
  },
  facebook: {
    label: 'Facebook',
    bg: '#eff6ff',
    text: '#1d4ed8',
    icon: <Globe size={10} />,
  },
}

export default function TopContentTable({ items }: { items: ContentItemWithMetrics[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
        No content yet — connect your accounts and sync to see data here.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Content', 'Platform', 'Views', 'Engagement', 'Published'].map((h, i) => (
              <th
                key={h}
                className={`py-3 px-4 font-semibold text-xs uppercase tracking-wide ${i >= 2 && i !== 4 ? 'text-right' : 'text-left'}`}
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const cfg = PLATFORM_CONFIG[item.platform]
            return (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="group"
                style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : undefined }}
              >
                <td className="py-3.5 px-4">
                  <div className="font-medium line-clamp-1 max-w-xs group-hover:text-indigo-600 transition-colors" style={{ color: 'var(--text)' }}>
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
                <td className="py-3.5 px-4 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                  {formatNumber(item.views)}
                </td>
                <td className="py-3.5 px-4 text-right font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {formatPercent(item.engagement_rate)}
                </td>
                <td className="py-3.5 px-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {formatRelative(item.published_at)}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
