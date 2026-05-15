import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import ThemeProvider from '@/components/ui/ThemeProvider'
import ThemeBackground from '@/components/ui/ThemeBackground'

export const metadata: Metadata = {
  title: 'ContentIQ — Social Media Tracker',
  description: 'Track and analyze your content across YouTube, Instagram, and Facebook',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('ciq-theme');if(t&&t!=='light')document.documentElement.setAttribute('data-theme',t)})()` }} />
      </head>
      <body className="h-full flex">
        <ThemeProvider>
          <ThemeBackground />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
