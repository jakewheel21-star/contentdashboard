'use client'

import { motion } from 'framer-motion'
import { useTheme, type Theme } from './ThemeProvider'

const THEMES: { id: Theme; color: string; label: string }[] = [
  { id: 'light',     color: '#e2e8f0', label: 'Clean Light' },
  { id: 'aurora',    color: '#8b5cf6', label: 'Aurora' },
  { id: 'neon',      color: '#06b6d4', label: 'Neon City' },
  { id: 'ocean',     color: '#0d9488', label: 'Deep Ocean' },
  { id: 'matrix',    color: '#00ff41', label: 'Matrix' },
  { id: 'synthwave', color: '#ff71ce', label: 'Synthwave' },
  { id: 'galaxy',    color: '#a78bfa', label: 'Galaxy' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2">
      {THEMES.map(({ id, color, label }) => {
        const active = theme === id
        return (
          <motion.button
            key={id}
            title={label}
            onClick={() => setTheme(id)}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.8 }}
            className="relative w-3.5 h-3.5 rounded-full shrink-0 transition-shadow"
            style={{
              background: color,
              boxShadow: active ? `0 0 0 2px #0a0a14, 0 0 0 3.5px ${color}` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
