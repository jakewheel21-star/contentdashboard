import { getAccountMetrics, getLatestAccountMetrics } from '@/lib/db/queries/metrics'
import { getContentItems } from '@/lib/db/queries/content'
import type { Platform } from '@/lib/types'

export async function GET(req: Request, ctx: RouteContext<'/api/platforms/[platform]/metrics'>) {
  const { platform } = await ctx.params
  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') ?? '30')

  return Response.json({
    history: getAccountMetrics(platform as Platform, days),
    latest: getLatestAccountMetrics(platform as Platform),
    topContent: getContentItems({ platform, sort: 'views', limit: 10 }),
  })
}
