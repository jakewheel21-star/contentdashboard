import { syncYouTubeData } from '@/lib/platforms/youtube'
import { syncInstagramData } from '@/lib/platforms/instagram'
import { syncFacebookData } from '@/lib/platforms/facebook'
import { getPlatformConnection } from '@/lib/db/queries/settings'

export async function POST(_req: Request, ctx: RouteContext<'/api/platforms/[platform]/sync'>) {
  const { platform } = await ctx.params

  const conn = getPlatformConnection(platform as 'youtube' | 'instagram' | 'facebook')
  if (!conn || conn.is_connected === 0) {
    return Response.json({ error: 'Platform not connected' }, { status: 400 })
  }

  let result: { synced: number }
  if (platform === 'youtube') result = await syncYouTubeData()
  else if (platform === 'instagram') result = await syncInstagramData()
  else if (platform === 'facebook') result = await syncFacebookData()
  else return Response.json({ error: 'Unknown platform' }, { status: 400 })

  return Response.json({ ok: true, ...result })
}
