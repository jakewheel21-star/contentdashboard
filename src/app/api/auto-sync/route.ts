import { syncYouTubeData } from '@/lib/platforms/youtube'
import { syncInstagramData } from '@/lib/platforms/instagram'
import { syncFacebookData } from '@/lib/platforms/facebook'
import { getPlatformConnections } from '@/lib/db/queries/settings'
import { getLatestAccountMetrics } from '@/lib/db/queries/metrics'
import type { Platform } from '@/lib/types'

const STALE_MS = 30 * 60 * 1000

const syncFns: Record<Platform, () => Promise<{ synced: number }>> = {
  youtube: syncYouTubeData,
  instagram: syncInstagramData,
  facebook: syncFacebookData,
}

export async function POST(req: Request) {
  const url = new URL(req.url)
  const platformsParam = url.searchParams.get('platforms')

  const connected = getPlatformConnections().filter(c => c.is_connected === 1)
  const targets = platformsParam
    ? platformsParam.split(',').filter(p => connected.some(c => c.platform === p))
    : connected.map(c => c.platform)

  const synced: string[] = []
  const skipped: string[] = []

  await Promise.allSettled(
    targets.map(async (platform) => {
      const latest = getLatestAccountMetrics(platform as Platform)
      const isStale = !latest || Date.now() - new Date(latest.recorded_at).getTime() > STALE_MS
      if (isStale) {
        try {
          await syncFns[platform as Platform]()
          synced.push(platform)
        } catch {
          skipped.push(platform)
        }
      } else {
        skipped.push(platform)
      }
    })
  )

  return Response.json({ synced, skipped })
}
