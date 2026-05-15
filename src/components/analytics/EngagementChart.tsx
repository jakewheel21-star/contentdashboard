'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { AccountMetrics } from '@/lib/types'

interface Props {
  data: AccountMetrics[]
  color?: string
}

export default function EngagementChart({ data, color = '#10b981' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  const chartData = data.map((d) => ({
    date: new Date(d.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    engagement: parseFloat(d.avg_engagement.toFixed(2)),
  }))

  const avg =
    chartData.reduce((s, d) => s + d.engagement, 0) / (chartData.length || 1)

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={38}
          />
          <ReferenceLine
            y={avg}
            stroke={color}
            strokeDasharray="4 4"
            strokeOpacity={0.35}
            label={{ value: 'avg', fill: color, fontSize: 10, opacity: 0.5 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              padding: '8px 12px',
            }}
            formatter={(v) => [`${v}%`, 'Avg Engagement']}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 2' }}
          />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            isAnimationActive
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
