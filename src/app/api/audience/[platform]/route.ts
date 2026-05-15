import getDb from '@/lib/db/client'
import { getAccountMetrics } from '@/lib/db/queries/metrics'
import type { AudienceDemographic, Platform } from '@/lib/types'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ platform: string }> }
) {
  const { platform } = await ctx.params
  const db = getDb()

  const accountMetrics = getAccountMetrics(platform as Platform, 30)
  const demographics = db
    .prepare(
      `SELECT * FROM audience_demographics WHERE platform = ? ORDER BY demo_type, value DESC`
    )
    .all(platform) as AudienceDemographic[]

  return Response.json({ accountMetrics, demographics })
}
