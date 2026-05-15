import { getSetting, setSetting } from '@/lib/db/queries/settings'

const ALLOWED_KEYS = ['anthropic_api_key', 'youtube_api_key', 'google_client_id', 'google_client_secret', 'meta_app_id', 'meta_app_secret']

export async function GET() {
  const settings: Record<string, string | null> = {}
  for (const key of ALLOWED_KEYS) {
    const val = getSetting(key)
    // Mask secrets
    settings[key] = val ? (val.length > 8 ? val.slice(0, 4) + '••••••••' + val.slice(-4) : '••••••••') : null
  }
  return Response.json(settings)
}

export async function PUT(req: Request) {
  const body = await req.json()
  for (const key of ALLOWED_KEYS) {
    if (key in body && body[key] !== undefined && body[key] !== null && body[key] !== '') {
      setSetting(key, body[key])
    }
  }
  return Response.json({ ok: true })
}
