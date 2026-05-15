import AnalyticsClient from '@/components/analytics/AnalyticsClient'
import { notFound } from 'next/navigation'

const VALID_PLATFORMS = ['youtube', 'instagram', 'facebook']

export default async function AnalyticsPlatformPage(props: PageProps<'/analytics/[platform]'>) {
  const { platform } = await props.params
  if (!VALID_PLATFORMS.includes(platform)) notFound()
  return <AnalyticsClient platform={platform} />
}
