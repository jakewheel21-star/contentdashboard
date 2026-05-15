'use client'

import { useState, useRef } from 'react'
import useSWR from 'swr'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area,
} from 'recharts'
import MetricCard from '@/components/dashboard/MetricCard'
import {
  PlayCircle, Camera, Globe, Users, Eye, TrendingUp,
  Clock, MessageCircle, MousePointerClick,
} from 'lucide-react'
import type { AudienceDemographic, AccountMetrics } from '@/lib/types'

interface AudienceData {
  accountMetrics: AccountMetrics[]
  demographics: AudienceDemographic[]
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#10b981']
const PLAT_COLOR: Record<string, string> = {
  youtube: '#ef4444',
  instagram: '#a855f7',
  facebook: '#3b82f6',
}

function ChartCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.38, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {children}
    </motion.div>
  )
}

export default function AudienceClient({ initialPlatform }: { initialPlatform: string }) {
  const [platform, setPlatform] = useState(initialPlatform)
  const { data, isLoading } = useSWR<AudienceData>(`/api/audience/${platform}`, fetcher)

  const accountMetrics = data?.accountMetrics ?? []
  const demographics = data?.demographics ?? []
  const latest = accountMetrics[accountMetrics.length - 1]

  const byType = (type: string) => demographics.filter(d => d.demo_type === type)

  const ageDemographics = byType('age')
  const genderDemographics = byType('gender')
  const countryDemographics = byType('country').slice(0, 6)
  const deviceDemographics = byType('device')
  const trafficDemographics = byType('traffic_source')
  const onlineHours = byType('online_hour').sort((a, b) => Number(a.label) - Number(b.label))

  const followerChartData = accountMetrics.map(m => ({
    date: new Date(m.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    followers: m.followers,
  }))

  const platColor = PLAT_COLOR[platform] ?? '#6366f1'

  const PLATFORMS = [
    { id: 'youtube', label: 'YouTube', icon: PlayCircle },
    { id: 'instagram', label: 'Instagram', icon: Camera },
    { id: 'facebook', label: 'Facebook', icon: Globe },
  ]

  const kpiCards =
    platform === 'youtube'
      ? [
          { label: 'Subscribers', value: latest?.followers ?? 0, icon: <Users size={14} />, color: platColor },
          { label: 'Watch Hours', value: Math.round(latest?.total_watch_time_hours ?? 0), icon: <Clock size={14} />, color: '#f59e0b' },
          { label: 'Impressions', value: latest?.impressions ?? 0, icon: <Eye size={14} />, color: '#8b5cf6' },
          { label: 'Reach', value: latest?.reach ?? 0, icon: <TrendingUp size={14} />, color: '#10b981' },
        ]
      : platform === 'instagram'
      ? [
          { label: 'Followers', value: latest?.followers ?? 0, icon: <Users size={14} />, color: platColor },
          { label: 'Reach', value: latest?.reach ?? 0, icon: <Eye size={14} />, color: '#10b981' },
          { label: 'Profile Visits', value: latest?.profile_visits ?? 0, icon: <MousePointerClick size={14} />, color: '#f59e0b' },
          { label: 'DMs', value: latest?.dm_count ?? 0, icon: <MessageCircle size={14} />, color: '#6366f1' },
        ]
      : [
          { label: 'Page Fans', value: latest?.followers ?? 0, icon: <Users size={14} />, color: platColor },
          { label: 'Reach', value: latest?.reach ?? 0, icon: <Eye size={14} />, color: '#10b981' },
          { label: 'Impressions', value: latest?.impressions ?? 0, icon: <Eye size={14} />, color: '#8b5cf6' },
          { label: 'DMs', value: latest?.dm_count ?? 0, icon: <MessageCircle size={14} />, color: '#6366f1' },
        ]

  const chartTooltipStyle = {
    borderRadius: 10,
    border: '1px solid var(--border)',
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    padding: '8px 12px',
    background: 'var(--surface)',
    color: 'var(--text)',
  }

  return (
    <div>
      {/* Platform tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {PLATFORMS.map(({ id, label, icon: Icon }) => {
          const active = platform === id
          const c = PLAT_COLOR[id]
          return (
            <button
              key={id}
              onClick={() => setPlatform(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: active ? c : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${active ? c : 'var(--border)'}`,
                boxShadow: active ? `0 4px 14px ${c}50` : 'var(--shadow-card)',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
              ))}
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpiCards.map((card, i) => (
                  <MetricCard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    accentColor={card.color}
                    icon={card.icon}
                    index={i}
                  />
                ))}
              </div>

              {/* Row 1: Growth + Gender */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <ChartCard title={platform === 'youtube' ? 'Subscriber Growth (30 days)' : 'Follower Growth (30 days)'} delay={0.05}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={followerChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`aud-grad-${platform}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={platColor} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={platColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f3f4f6)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={44}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [String(v), platform === 'youtube' ? 'Subscribers' : 'Followers']} />
                      <Area type="monotone" dataKey="followers" stroke={platColor} strokeWidth={2.5}
                        fill={`url(#aud-grad-${platform})`} dot={false} activeDot={{ r: 4, fill: platColor, strokeWidth: 0 }}
                        isAnimationActive animationDuration={1200} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Gender Breakdown" delay={0.1}>
                  {genderDemographics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={genderDemographics.map(d => ({ name: d.label, value: d.value }))}
                          cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value"
                          isAnimationActive animationDuration={1000}>
                          {genderDemographics.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend iconType="circle" iconSize={8}
                          formatter={(value) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{value}</span>} />
                        <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </ChartCard>
              </div>

              {/* Row 2: Age + Country */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <ChartCard title="Age Distribution" delay={0.12}>
                  {ageDemographics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={ageDemographics.map(d => ({ label: d.label, value: d.value }))}
                        layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f3f4f6)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={44} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Audience']} contentStyle={chartTooltipStyle} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1000}>
                          {ageDemographics.map((_, i) => (
                            <Cell key={i} fill={platColor} fillOpacity={0.4 + 0.6 * ((ageDemographics.length - i) / ageDemographics.length)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title="Top Countries" delay={0.15}>
                  {countryDemographics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={countryDemographics.map(d => ({ label: d.label, value: d.value }))}
                        layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f3f4f6)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={90} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Audience']} contentStyle={chartTooltipStyle} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1000} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </ChartCard>
              </div>

              {/* Row 3: Device + Traffic/Online Hours */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title="Device Breakdown" delay={0.18}>
                  {deviceDemographics.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={deviceDemographics.map(d => ({ name: d.label, value: d.value }))}
                          cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value"
                          isAnimationActive animationDuration={1000}>
                          {deviceDemographics.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend iconType="circle" iconSize={8}
                          formatter={(value) => <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{value}</span>} />
                        <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart />}
                </ChartCard>

                {platform === 'youtube' ? (
                  <ChartCard title="Traffic Sources" delay={0.2}>
                    {trafficDemographics.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={trafficDemographics.map(d => ({ label: d.label, value: d.value }))}
                          layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f3f4f6)" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                          <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={110} />
                          <Tooltip formatter={(v) => [`${v}%`, 'Views']} contentStyle={chartTooltipStyle} />
                          <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={1000} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>
                ) : (
                  <ChartCard title="When Your Audience is Online" delay={0.2}>
                    {onlineHours.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={onlineHours.map(d => ({ hour: `${d.label}h`, value: d.value }))}
                          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #f3f4f6)" vertical={false} />
                          <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={3} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={28} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [v, 'Activity']} />
                          <Bar dataKey="value" fill={platColor} radius={[3, 3, 0, 0]} isAnimationActive animationDuration={1000} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart />}
                  </ChartCard>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data available</p>
    </div>
  )
}
