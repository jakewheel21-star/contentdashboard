'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'aurora' | 'neon' | 'ocean' | 'matrix' | 'synthwave' | 'galaxy'

const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'light',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeCtx)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const saved = (localStorage.getItem('ciq-theme') as Theme | null) ?? 'light'
    apply(saved)
  }, [])

  function apply(t: Theme) {
    setThemeState(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('ciq-theme', t)
  }

  return <ThemeCtx.Provider value={{ theme, setTheme: apply }}>{children}</ThemeCtx.Provider>
}
