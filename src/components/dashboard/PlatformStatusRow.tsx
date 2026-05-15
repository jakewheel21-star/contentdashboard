'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { PlayCircle, Camera, Globe, CheckCircle, Circle } from 'lucide-react'

const PLATFORM_META: Record<string, { label: string; gradient: string; icon: React.ReactNode; ring: string }> = {
  youtube: {
    label: 'YouTube',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    icon: <PlayCircle size={16} className="text-white" />,
    ring: 'rgba(239,68,68,0.2)',
  },
  instagram: {
    label: 'Instagram',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
    icon: <Camera size={16} className="text-white" />,
    ring: 'rgba(168,85,247,0.2)',
  },
  facebook: {
    label: 'Facebook',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    icon: <Globe size={16} className="text-white" />,
    ring: 'rgba(59,130,246,0.2)',
  },
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PlatformStatusRow() {
  const { data } = useSWR('/api/platforms/status', fetcher, { refreshInterval: 30000 })

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {Object.entries(PLATFORM_META).map(([platform, meta], i) => {
        const info = data?.platforms?.[platform]
        const connected = info?.connected ?? false

        return (
          <motion.div
            key={platform}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ y: -1 }}
            className="bg-white rounded-2xl p-4 flex items-center gap-3"
            style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: meta.gradient }}
            >
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                {meta.label}
              </div>
              <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {connected ? (info?.accountName ?? 'Connected') : 'Not connected'}
              </div>
            </div>
            <div>
              {connected ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <CheckCircle size={16} className="text-emerald-500" />
                </motion.div>
              ) : (
                <Link href="/settings">
                  <Circle size={16} className="text-gray-300 hover:text-gray-400 transition-colors" />
                </Link>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
