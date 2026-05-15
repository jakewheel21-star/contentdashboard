import { getCompetitorById, deleteCompetitor } from '@/lib/db/queries/competitors'

export async function GET(_req: Request, ctx: RouteContext<'/api/competitors/[id]'>) {
  const { id } = await ctx.params
  const competitor = getCompetitorById(parseInt(id))
  if (!competitor) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(competitor)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/competitors/[id]'>) {
  const { id } = await ctx.params
  deleteCompetitor(parseInt(id))
  return Response.json({ ok: true })
}
