import { getAnalysisById, deleteAnalysis } from '@/lib/db/queries/analyses'

export async function GET(_req: Request, ctx: RouteContext<'/api/analyze/[id]'>) {
  const { id } = await ctx.params
  const analysis = getAnalysisById(parseInt(id))
  if (!analysis) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(analysis)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/analyze/[id]'>) {
  const { id } = await ctx.params
  deleteAnalysis(parseInt(id))
  return Response.json({ ok: true })
}
