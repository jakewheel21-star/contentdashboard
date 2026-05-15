import SettingsClient from '@/components/settings/SettingsClient'
import PageWrapper from '@/components/ui/PageWrapper'
import { getPlatformConnections } from '@/lib/db/queries/settings'

export default async function SettingsPage(props: PageProps<'/settings'>) {
  const searchParams = await props.searchParams
  const connected = searchParams?.connected as string | undefined
  const error = searchParams?.error as string | undefined
  const connections = getPlatformConnections()

  return (
    <PageWrapper>
      <div className="mb-7">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ letterSpacing: '-0.03em', color: 'var(--text)' }}
        >
          Settings
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Connect your social media accounts and manage API keys
        </p>
      </div>
      <SettingsClient connections={connections} successPlatform={connected} errorMessage={error} />
    </PageWrapper>
  )
}
