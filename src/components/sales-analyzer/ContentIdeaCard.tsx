'use client'

import { motion } from 'framer-motion'
import type { ContentIdeaInput } from '@/lib/types'
import { PlayCircle, Camera, Globe, Bookmark, BookmarkCheck, Zap, Clock } from 'lucide-react'

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: '#fef2f2', text: '#b91c1c', label: 'High Priority' },
  medium: { bg: '#fffbeb', text: '#92400e', label: 'Medium' },
  low:    { bg: '#f3f4f6', text: '#4b5563', label: 'Low' },
}

const EFFORT_CONFIG: Record<string, { bg: string; text: string }> = {
  low:    { bg: '#d1fae5', text: '#065f46' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  high:   { bg: '#fee2e2', text: '#991b1b' },
}

const PLATFORM_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  youtube:  { bg: '#fef2f2', text: '#b91c1c', icon: <PlayCircle size={11} /> },
  instagram: { bg: '#faf5ff', text: '#7e22ce', icon: <Camera size={11} /> },
  facebook: { bg: '#eff6ff', text: '#1d4ed8', icon: <Globe size={11} /> },
}

interface Props {
  idea: ContentIdeaInput
  saved?: boolean
  onToggleSave?: () => void
  index?: number
}

export default function ContentIdeaCard({ idea, saved, onToggleSave, index = 0 }: Props) {
  const pCfg = PLATFORM_CONFIG[idea.platform] ?? { bg: '#f3f4f6', text: '#374151', icon: null }
  const priCfg = PRIORITY_CONFIG[idea.priority] ?? PRIORITY_CONFIG.low
  const effCfg = EFFORT_CONFIG[idea.estimated_effort] ?? EFFORT_CONFIG.medium

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      whileHover={{ y: -1 }}
      className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h4 className="font-semibold leading-snug" style={{ color: 'var(--text)' }}>
          {idea.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: pCfg.bg, color: pCfg.text }}
          >
            {pCfg.icon}
            {idea.platform}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
            style={{ background: priCfg.bg, color: priCfg.text }}
          >
            {priCfg.label}
          </span>
        </div>
      </div>

      {/* Hook */}
      {idea.hook && (
        <div
          className="mb-4 p-3.5 rounded-xl"
          style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={11} className="text-violet-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-violet-500">Hook</span>
          </div>
          <p className="text-sm italic" style={{ color: '#4c1d95' }}>
            &ldquo;{idea.hook}&rdquo;
          </p>
        </div>
      )}

      {/* Talking points */}
      {idea.talking_points && idea.talking_points.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Talking Points
          </div>
          <ul className="space-y-1.5">
            {idea.talking_points.map((point, i) => (
              <li key={i} className="text-sm flex gap-2.5">
                <span
                  className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{ background: '#eef2ff', color: '#6366f1' }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--text)' }}>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hashtags */}
      {idea.hashtags && idea.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {idea.hashtags.map((tag, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: '#eef2ff', color: '#6366f1' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <span
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg capitalize"
          style={{ background: effCfg.bg, color: effCfg.text }}
        >
          <Clock size={10} />
          {idea.estimated_effort} effort
        </span>

        {onToggleSave && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleSave}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={
              saved
                ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
                : { background: '#f3f4f6', color: '#6b7280' }
            }
          >
            {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            {saved ? 'Saved' : 'Save'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
