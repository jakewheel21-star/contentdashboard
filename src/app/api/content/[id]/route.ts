import { getContentItemById, deleteContentItem } from '@/lib/db/queries/content'

export async function GET(_req: Request, ctx: RouteContext<'/api/content/[id]'>) {
  const { id } = await ctx.params
  const item = getContentItemById(parseInt(id))
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(item)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/content/[id]'>) {
  const { id } = await ctx.params
  deleteContentItem(parseInt(id))
  return Response.json({ ok: true })
}
