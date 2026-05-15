'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import FollowerGrowthChart from '@/components/analytics/FollowerGrowthChart'
import EngagementChart from '@/components/analytics/EngagementChart'
import PageWrapper from '@/components/ui/PageWrapper'
import { formatNumber, formatPercent } from '@/lib/utils/format-numbers'
import Link from 'next/link'
import type { AccountMetrics } from '@/lib/types'
import { PlayCircle, Camera, Globe, TrendingUp, Eye, Users, MessageCircle, BarChart3 } from 'lucide-react'

const PLATFORM_CONFIG: Record<string, {
  label: string
  color: string
  gradient: string
  icon: React.ReactNode
  accentCards: Array<{ key: string; label: string; icon: React.ReactNode }>
}> = {
  youtube: {
    label: 'YouTube',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    icon: <PlayCircle size={18} className="text-white" />,
    accentCards: [
      { key: 'subscribers', label: 'Subscribers', icon: <Users size={14} /> },
      { key: 'total_posts', label: 'Videos', icon: <Eye size={14} /> },
      { key: 'avg_engagement', label: 'Avg Engagement', icon: <TrendingUp size={14} /> },
      { key: 'total_views', label: 'Total Views', icon: <BarChart3 size={14} /> },
    ],
  },
  instagram: {
    label: 'Instagram',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
    icon: <Camera size={18} className="text-white" />,
    accentCards: [
      { key: 'followers', label: 'Followers', icon: <Users size={14} /> },
      { key: 'total_posts', label: 'Posts', icon: <Eye size={14} /> },
      { key: 'avg_engagement', label: 'Avg Engagement', icon: <TrendingUp size={14} /> },
      { key: 'dm_count', label: 'DM Inbox', icon: <MessageCircle size={14} /> },
    ],
  },
  facebook: {
    label: 'Facebook',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    icon: <Globe size={18} className="text-white" />,
    accentCards: [
      { key: 'followers', label: 'Page Likes', icon: <Users size={14} /> },
      { key: 'total_posts', label: 'Posts', icon: <Eye size={14} /> },
      { key: 'avg_engagement', label: 'Avg Engagement', icon: <TrendingUp size={14} /> },
      { key: 'dm_count', label: 'DM Inbox', icon: <MessageCircle size={14} /> },
    ],
  },
}

function getMetricValue(latest: AccountMetrics | null, key: string): string {
  if (!latest) return '—'
  if (key === 'subscribers' || key === 'followers') return formatNumber(latest.followers ?? 0)
  if (key === 'total_posts') return String(latest.total_posts ?? 0)
  if (key === 'avg_engagement') return formatPercent(latest.avg_engagement ?? 0)
  if (key === 'total_views') return formatNumber(latest.total_views ?? 0)
  if (key === 'dm_count') return formatNumber(latest.dm_count ?? 0)
  if (key === 'total_watch_time') return `${(latest.total_watch_time_hours ?? 0).toFixed(0)}h`
  return '—'
}

type ContentRow = {
  id: number
  title: string | null
  content_type: string
  views: number
  likes: number
  comments: number
  engagement_rate: number
}

type MetricsData = {
  history: AccountMetrics[]
  latest: AccountMetrics | null
  topContent: ContentRow[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())
const PLATFORMS = ['youtube', 'instagram', 'facebook']

export default function AnalyticsClient({ platform }: { platform: string }) {
  const config = PLATFORM_CONFIG[platform]

  const { data, mutate } = useSWR<MetricsData>(
    `/api/platforms/${platform}/metrics?days=30`,
    fetcher,
    { refreshInterval: 5 * 60 * 1000 }
  )

  useEffect(() => {
    fetch(`/api/auto-sync?platforms=${platform}`, { method: 'POST' })
      .then(() => mutate())
      .catch(() => {})
  }, [platform])

  const history = data?.history ?? []
  const latest = data?.latest ?? null
  const content = data?.topContent ?? []

  if (!config) return null

  return (
    <PageWrapper>
      {/* Platform tabs */}
      <div className="flex gap-2 mb-8">
        {PLATFORMS.map((p) => {
          const isActive = p === platform
          const cfg = PLATFORM_CONFIG[p]
          return (
            <Link
              key={p}
              href={`/analytics/${p}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isActive ? config.gradient : 'white',
                color: isActive ? 'white' : 'var(--text-muted)',
                border: isActive ? 'none' : '1px solid var(--border)',
                boxShadow: isActive ? `0 4px 12px ${config.color}30` : 'var(--shadow-card)',
              }}
            >
              {cfg?.label ?? p}
            </Link>
          )
        })}
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: config.gradient }}
        >
          {config.icon}
        </div>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ letterSpacing: '-0.03em', color: 'var(--text)' }}
          >
            {config.label} Analytics
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Last 30 days performance
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {config.accentCards.map(({ key, label, icon }) => {
          const value = getMetricValue(latest, key)
          return (
            <div
              key={key}
              className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${config.color}15`, color: config.color }}
                >
                  {icon}
                </div>
              </div>
              <div
                className="text-2xl font-bold tabular-nums"
                style={{ letterSpacing: '-0.02em', color: 'var(--text)' }}
              >
                {value}
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
            {platform === 'youtube' ? 'Subscriber' : 'Follower'} Growth
          </h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            30-day trend
          </p>
          {history.length > 0 ? (
            <FollowerGrowthChart data={history} color={config.color} />
          ) : (
            <div
              className="flex items-center justify-center h-[220px] text-sm rounded-xl"
              style={{ color: 'var(--text-muted)', background: '#f9fafb' }}
            >
              No data yet — sync your account to see trends.
            </div>
          )}
        </div>

        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Engagement Rate
          </h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            30-day trend with average
          </p>
          {history.length > 0 ? (
            <EngagementChart data={history} color={config.color} />
          ) : (
            <div
              className="flex items-center justify-center h-[220px] text-sm rounded-xl"
              style={{ color: 'var(--text-muted)', background: '#f9fafb' }}
            >
              No data yet — sync your account to see trends.
            </div>
          )}
        </div>
      </div>

      {/* Top content table */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
            Top Content
          </h2>
          <Link
            href={`/content-library?platform=${platform}`}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ color: config.color, background: `${config.color}12` }}
          >
            View all →
          </Link>
        </div>
        {content.length === 0 ? (
          <div
            className="text-center py-10 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            No content synced yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 px-6 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Title</th>
                <th className="text-right py-3 px-6 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Views</th>
                <th className="text-right py-3 px-6 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Likes</th>
                <th className="text-right py-3 px-6 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {content.map((item, i) => (
                <tr
                  key={item.id}
                  className="group"
                  style={{ borderBottom: i < content.length - 1 ? '1px solid #f9fafb' : undefined }}
                >
                  <td className="py-3.5 px-6">
                    <div
                      className="font-medium line-clamp-1 group-hover:text-indigo-600 transition-colors"
                      style={{ color: 'var(--text)' }}
                    >
                      {item.title ?? '(untitled)'}
                    </div>
                    <div className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {item.content_type}
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-right tabular-nums font-medium" style={{ color: 'var(--text)' }}>
                    {formatNumber(item.views)}
                  </td>
                  <td className="py-3.5 px-6 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {formatNumber(item.likes)}
                  </td>
                  <td className="py-3.5 px-6 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {formatPercent(item.engagement_rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  )
}
