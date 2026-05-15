'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Film,
  BarChart3,
  Sparkles,
  Users,
  Users2,
  Settings,
  Zap,
} from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/content-library', label: 'Content Library', icon: Film },
  { href: '/analytics/youtube', label: 'Analytics', icon: BarChart3 },
  { href: '/audience', label: 'Audience', icon: Users2 },
  { href: '/sales-analyzer', label: 'Sales Analyzer', icon: Sparkles },
  { href: '/competitors', label: 'Competitors', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{ background: 'var(--color-sidebar)', borderRight: '1px solid var(--color-sidebar-border)' }}
      className="w-60 min-h-screen flex flex-col shrink-0"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">ContentIQ</div>
            <div className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--color-sidebar-text)' }}>
              Social Analytics
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' &&
              pathname.startsWith(href.split('/').slice(0, 2).join('/')))

          return (
            <div key={href} className="relative">
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))' }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Link
                href={href}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors z-10"
                style={{ color: isActive ? '#fff' : 'var(--color-sidebar-text)' }}
              >
                <motion.span
                  whileHover={!isActive ? { x: 1 } : {}}
                  className="flex items-center gap-3 w-full"
                >
                  <Icon
                    size={16}
                    className="shrink-0"
                    style={{ opacity: isActive ? 1 : 0.7 }}
                  />
                  <span className={isActive ? 'font-medium' : ''}>{label}</span>
                </motion.span>
              </Link>

              {/* hover layer for non-active items */}
              {!isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-sidebar-border)' }}>
        <div className="text-[11px]" style={{ color: 'var(--color-sidebar-text)' }}>
          v0.1.0
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}
