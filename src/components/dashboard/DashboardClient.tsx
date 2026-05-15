'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import MetricCard from '@/components/dashboard/MetricCard'
import PlatformStatusRow from '@/components/dashboard/PlatformStatusRow'
import TopContentTable from '@/components/dashboard/TopContentTable'
import FunnelInsightCard from '@/components/dashboard/FunnelInsightCard'
import PageWrapper from '@/components/ui/PageWrapper'
import { Users, Film, Play, Activity } from 'lucide-react'
import Link from 'next/link'
import type { ContentItemWithMetrics } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type PlatformSummary = {
  followers: number
  followersDelta: number
  totalViews: number
  avgEngagement: number
  totalContent: number
}

type SummaryData = {
  summary: Record<string, PlatformSummary>
  topContent: ContentItemWithMetrics[]
}

const PLATFORM_CARDS = [
  {
    key: 'youtube',
    label: 'YouTube',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
]

export default function DashboardClient() {
  const { data, mutate } = useSWR<SummaryData>('/api/dashboard/summary', fetcher, {
    refreshInterval: 5 * 60 * 1000,
  })

  useEffect(() => {
    fetch('/api/auto-sync', { method: 'POST' })
      .then(() => mutate())
      .catch(() => {})
  }, [])

  const summary = data?.summary ?? {}
  const topContent = data?.topContent ?? []

  const totalFollowers = Object.values(summary).reduce((s, p) => s + p.followers, 0)
  const totalContent = Object.values(summary).reduce((s, p) => s + p.totalContent, 0)
  const engagingPlatforms = Object.values(summary).filter(p => p.avgEngagement > 0)
  const avgEngagement = engagingPlatforms.length
    ? engagingPlatforms.reduce((s, p) => s + p.avgEngagement, 0) / engagingPlatforms.length
    : 0

  function getPlatformStats(key: string) {
    const s = summary[key]
    if (key === 'youtube') {
      return [
        { label: 'Subscribers', value: s ? s.followers.toLocaleString() : '—' },
        { label: 'Total Videos', value: s ? String(s.totalContent) : '—' },
        { label: 'Avg Engagement', value: s?.avgEngagement ? `${s.avgEngagement.toFixed(1)}%` : '—' },
        { label: 'Total Views', value: s?.totalViews ? `${(s.totalViews / 1000).toFixed(0)}K` : '—' },
      ]
    }
    if (key === 'instagram') {
      return [
        { label: 'Followers', value: s ? s.followers.toLocaleString() : '—' },
        { label: 'Total Posts', value: s ? String(s.totalContent) : '—' },
        { label: 'Avg Engagement', value: s?.avgEngagement ? `${s.avgEngagement.toFixed(1)}%` : '—' },
        { label: 'Reach/Post', value: '—' },
      ]
    }
    return [
      { label: 'Page Likes', value: s ? s.followers.toLocaleString() : '—' },
      { label: 'Total Posts', value: s ? String(s.totalContent) : '—' },
      { label: 'Avg Engagement', value: s?.avgEngagement ? `${s.avgEngagement.toFixed(1)}%` : '—' },
      { label: 'Impressions', value: '—' },
    ]
  }

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, var(--text) 60%, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Your content performance at a glance
        </p>
      </div>

      <PlatformStatusRow />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Followers"
          value={totalFollowers}
          accentColor="#6366f1"
          icon={<Users size={14} />}
          index={0}
        />
        <MetricCard
          label="Total Content"
          value={totalContent}
          accentColor="#8b5cf6"
          icon={<Film size={14} />}
          index={1}
        />
        <MetricCard
          label="YouTube Views"
          value={summary.youtube?.totalViews ?? 0}
          accentColor="#ef4444"
          icon={<Play size={14} />}
          index={2}
        />
        <MetricCard
          label="Avg Engagement"
          value={avgEngagement}
          format="percent"
          accentColor="#10b981"
          icon={<Activity size={14} />}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {PLATFORM_CARDS.map(({ key, label, gradient }) => (
          <Link key={key} href={`/analytics/${key}`} className="block group">
            <div
              className="rounded-2xl p-5 h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: gradient }}
                />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {label}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {getPlatformStats(key).map(({ label: statLabel, value }) => (
                  <div key={statLabel}>
                    <div className="text-[11px] font-medium uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      {statLabel}
                    </div>
                    <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-8">
        <FunnelInsightCard />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
              Top Performing Content
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Ranked by total views
            </p>
          </div>
          <Link
            href="/content-library"
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#6366f1', background: '#eef2ff' }}
          >
            View all →
          </Link>
        </div>
        <TopContentTable items={topContent} />
      </div>
    </PageWrapper>
  )
}
