import { getInstagramAuthUrl } from '@/lib/platforms/instagram'

export async function POST() {
  if (!process.env.META_APP_ID) {
    return Response.json({ error: 'META_APP_ID not configured. Add it in Settings or .env.local.' }, { status: 422 })
  }
  const url = getInstagramAuthUrl()
  return Response.json({ url })
}
