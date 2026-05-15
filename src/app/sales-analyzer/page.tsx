import SalesAnalyzerClient from '@/components/sales-analyzer/SalesAnalyzerClient'
import PageWrapper from '@/components/ui/PageWrapper'
import { getAnalysisHistory } from '@/lib/db/queries/analyses'
import { Sparkles } from 'lucide-react'

export default function SalesAnalyzerPage() {
  const history = getAnalysisHistory()
  return (
    <PageWrapper>
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Sparkles size={17} className="text-white" />
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ letterSpacing: '-0.03em', color: 'var(--text)' }}
          >
            Sales Analyzer
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Paste a sales call transcript — Claude AI will generate platform-specific content ideas from it.
        </p>
      </div>
      <SalesAnalyzerClient initialHistory={history} />
    </PageWrapper>
  )
}
