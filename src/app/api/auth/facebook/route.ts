import { getFacebookAuthUrl } from '@/lib/platforms/facebook'

export async function POST() {
  if (!process.env.META_APP_ID) {
    return Response.json({ error: 'META_APP_ID not configured. Add it in Settings or .env.local.' }, { status: 422 })
  }
  const url = getFacebookAuthUrl()
  return Response.json({ url })
}
