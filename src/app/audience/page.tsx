import PageWrapper from '@/components/ui/PageWrapper'
import AudienceClient from '@/components/audience/AudienceClient'

export default function AudiencePage() {
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
          Audience Insights
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Demographics, behavior, and growth metrics for every platform
        </p>
      </div>
      <AudienceClient initialPlatform="youtube" />
    </PageWrapper>
  )
}
