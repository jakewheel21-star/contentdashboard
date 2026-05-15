'use client'

import { useRef } from 'react'
import useSWR from 'swr'
import { motion, useInView } from 'framer-motion'
import type { AccountMetrics } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function calcTofScore(metrics: AccountMetrics[]): number {
  if (metrics.length < 2) return 50
  const latest = metrics[metrics.length - 1]
  const oldest = metrics[0]
  if (!oldest.followers) return 50
  const growthRate = (latest.followers - oldest.followers) / oldest.followers
  return Math.max(0, Math.min(100, growthRate * 100 * 8 + 50))
}

function calcMofScore(metrics: AccountMetrics[]): number {
  if (!metrics.length) return 50
  const avg = metrics.reduce((s, m) => s + m.avg_engagement, 0) / metrics.length
  return Math.min(100, avg * 20)
}

function calcBofScore(metrics: AccountMetrics[]): number {
  if (!metrics.length) return 30
  const latest = metrics[metrics.length - 1]
  const ratio = (latest.dm_count ?? 0) / Math.max(latest.followers, 1)
  return Math.min(100, ratio * 10000)
}

function scoreColor(score: number) {
  if (score >= 65) return '#10b981'
  if (score >= 35) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(score: number) {
  if (score >= 65) return 'Healthy'
  if (score >= 35) return 'Watch'
  return 'Needs work'
}

interface FunnelStageProps {
  label: string
  sublabel: string
  score: number
  reco: string
  widthClass: string
  index: number
}

function FunnelStage({ label, sublabel, score, reco, widthClass, index }: FunnelStageProps) {
  const color = scoreColor(score)
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      className={`mb-2 ${widthClass} mx-auto`}
    >
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: `${color}18`, border: `1px solid ${color}40` }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sublabel}</div>
        </div>
        <div className="text-right ml-3 shrink-0">
          <div className="text-lg font-bold tabular-nums" style={{ color, letterSpacing: '-0.02em' }}>
            {score.toFixed(0)}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color }}>{scoreLabel(score)}</div>
        </div>
      </div>
      {score < 65 && (
        <div className="flex items-start gap-1.5 mt-1.5 px-1">
          <span style={{ color }} className="text-xs mt-px shrink-0">→</span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{reco}</p>
        </div>
      )}
    </motion.div>
  )
}

export default function FunnelInsightCard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const { data: ytData } = useSWR<{ history: AccountMetrics[] }>('/api/platforms/youtube/metrics?days=30', fetcher)
  const { data: igData } = useSWR<{ history: AccountMetrics[] }>('/api/platforms/instagram/metrics?days=30', fetcher)
  const { data: fbData } = useSWR<{ history: AccountMetrics[] }>('/api/platforms/facebook/metrics?days=30', fetcher)

  const allMetrics = [...(ytData?.history ?? []), ...(igData?.history ?? []), ...(fbData?.history ?? [])]

  const byPlatform = (data: { history: AccountMetrics[] } | undefined) => data?.history ?? []
  const tofScore = Math.round(
    (calcTofScore(byPlatform(ytData)) + calcTofScore(byPlatform(igData)) + calcTofScore(byPlatform(fbData))) / 3
  )
  const mofScore = Math.round(
    (calcMofScore(byPlatform(ytData)) + calcMofScore(byPlatform(igData)) + calcMofScore(byPlatform(fbData))) / 3
  )
  const bofScore = Math.round(calcBofScore(allMetrics))

  const tofReco = tofScore < 65
    ? 'Post more discovery-focused content — short-form videos, trending hooks, broad topic coverage — to expand reach and attract new followers.'
    : 'Your audience is growing well. Keep your reach content consistent.'

  const mofReco = mofScore < 65
    ? 'Engagement is low. Post more interactive content: polls, Q&As, carousels with value, behind-the-scenes, and content that invites comments.'
    : 'Engagement is strong. Your audience connects with your content.'

  const bofReco = bofScore < 65
    ? 'DMs are low relative to audience size. Add clear CTAs to your posts — "DM me [keyword]", link-in-bio offers, or stories with swipe-up prompts — to drive direct conversion.'
    : 'Strong DM conversion. Keep your CTA game sharp.'

  const isLoading = !ytData && !igData && !fbData

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', background: 'var(--surface)' }}
    >
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Content Funnel Analysis</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Based on follower growth, engagement, and DM activity
          </p>
        </div>
        <div
          className="px-3 py-1 rounded-lg text-xs font-medium"
          style={{ background: '#eef2ff', color: '#6366f1' }}
        >
          Rule-based
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
            ))}
          </div>
        ) : (
          <div>
            <div className="mb-5">
              <FunnelStage
                label="Top of Funnel — Awareness"
                sublabel="Follower growth rate"
                score={tofScore}
                reco={tofReco}
                widthClass="w-full"
                index={0}
              />
              <div className="flex justify-center my-0.5">
                <div className="w-0 h-0" style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '8px solid var(--border)' }} />
              </div>
              <FunnelStage
                label="Mid Funnel — Engagement"
                sublabel="Avg engagement rate"
                score={mofScore}
                reco={mofReco}
                widthClass="w-11/12"
                index={1}
              />
              <div className="flex justify-center my-0.5">
                <div className="w-0 h-0" style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '8px solid var(--border)' }} />
              </div>
              <FunnelStage
                label="Bottom of Funnel — Conversion"
                sublabel="DM count relative to audience"
                score={bofScore}
                reco={bofReco}
                widthClass="w-10/12"
                index={2}
              />
            </div>

            <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              {([['Healthy', '#10b981'], ['Watch', '#f59e0b'], ['Needs work', '#ef4444']] as [string, string][]).map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
