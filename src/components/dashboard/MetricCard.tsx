'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPercent } from '@/lib/utils/format-numbers'

interface MetricCardProps {
  label: string
  value: number
  delta?: number
  format?: 'number' | 'percent'
  accentColor?: string
  icon?: React.ReactNode
  subtitle?: string
  index?: number
}

function useCountUp(target: number, enabled: boolean, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
      else setValue(target)
    }
    requestAnimationFrame(tick)
  }, [target, enabled, duration])
  return value
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function MetricCard({
  label,
  value,
  delta,
  format = 'number',
  accentColor = '#6366f1',
  icon,
  subtitle,
  index = 0,
}: MetricCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const animated = useCountUp(format === 'number' ? value : 0, inView && format === 'number' && mounted)
  const displayValue = format === 'percent' ? formatPercent(value) : formatCompact(animated)

  const deltaPositive = delta !== undefined && delta > 0
  const deltaNeutral = delta === undefined || delta === 0
  const deltaText = delta !== undefined
    ? `${delta > 0 ? '+' : ''}${format === 'percent' ? delta.toFixed(1) + '%' : formatCompact(Math.abs(delta))} ${delta < 0 ? 'decrease' : 'increase'}`
    : null

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={mounted && inView ? { opacity: 1, y: 0 } : mounted ? { opacity: 0, y: 16 } : {}}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="bg-white rounded-2xl p-5 cursor-default select-none relative overflow-hidden"
      style={{
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Accent top bar */}
      <div
        className="absolute top-0 left-4 right-4 h-0.5 rounded-b-full opacity-60"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        {icon && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}15` }}
          >
            <span style={{ color: accentColor }}>{icon}</span>
          </div>
        )}
      </div>

      <div
        className="text-3xl font-bold tracking-tight"
        style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
      >
        {displayValue}
      </div>

      {subtitle && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}

      {deltaText && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium">
          {deltaNeutral ? (
            <Minus size={12} className="text-gray-400" />
          ) : deltaPositive ? (
            <TrendingUp size={12} className="text-emerald-500" />
          ) : (
            <TrendingDown size={12} className="text-red-400" />
          )}
          <span
            style={{
              color: deltaNeutral ? '#9ca3af' : deltaPositive ? '#10b981' : '#f87171',
            }}
          >
            {deltaText}
          </span>
        </div>
      )}
    </motion.div>
  )
}
