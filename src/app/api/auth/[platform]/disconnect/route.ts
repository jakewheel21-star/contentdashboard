import { disconnectPlatform } from '@/lib/db/queries/settings'
import type { Platform } from '@/lib/types'

export async function POST(_req: Request, ctx: RouteContext<'/api/auth/[platform]/disconnect'>) {
  const { platform } = await ctx.params
  disconnectPlatform(platform as Platform)
  return Response.json({ ok: true })
}
