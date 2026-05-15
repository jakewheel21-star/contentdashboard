import { getYouTubeAuthUrl } from '@/lib/platforms/youtube'

export async function POST() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return Response.json({ error: 'GOOGLE_CLIENT_ID not configured. Add it in Settings or .env.local.' }, { status: 422 })
  }
  const url = getYouTubeAuthUrl()
  return Response.json({ url })
}
