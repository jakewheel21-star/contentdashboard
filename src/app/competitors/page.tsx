import CompetitorsClient from '@/components/competitors/CompetitorsClient'
import PageWrapper from '@/components/ui/PageWrapper'
import { getCompetitors } from '@/lib/db/queries/competitors'
import { Users } from 'lucide-react'

export default function CompetitorsPage() {
  const competitors = getCompetitors()
  return (
    <PageWrapper>
      <div className="mb-7">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ letterSpacing: '-0.03em', color: 'var(--text)' }}
        >
          Competitor Hub
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Track competitor accounts and benchmark against your performance
        </p>
      </div>
      <CompetitorsClient initialCompetitors={competitors} />
    </PageWrapper>
  )
}
