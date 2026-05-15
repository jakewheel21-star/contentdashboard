import { getContentItems } from '@/lib/db/queries/content'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const platform = url.searchParams.get('platform') ?? undefined
  const content_type = url.searchParams.get('content_type') ?? undefined
  const sort = (url.searchParams.get('sort') ?? 'newest') as 'newest' | 'views' | 'engagement'
  const limit = parseInt(url.searchParams.get('limit') ?? '50')
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  const items = getContentItems({ platform, content_type, sort, limit, offset })
  return Response.json(items)
}
