import { toggleSaveIdea } from '@/lib/db/queries/analyses'

export async function PUT(_req: Request, ctx: RouteContext<'/api/analyze/ideas/[id]'>) {
  const { id } = await ctx.params
  toggleSaveIdea(parseInt(id))
  return Response.json({ ok: true })
}
