import { getDashboardSummary } from '@/lib/db/queries/metrics'
import { getTopContent } from '@/lib/db/queries/content'

export async function GET() {
  const summary = getDashboardSummary()
  const topContent = getTopContent(8)
  return Response.json({ summary, topContent })
}
