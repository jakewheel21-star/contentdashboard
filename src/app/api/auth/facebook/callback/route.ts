import { exchangeFacebookCode, syncFacebookData } from '@/lib/platforms/facebook'
import { redirect } from 'next/navigation'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) redirect('/settings?error=facebook_auth_failed')

  const ok = await exchangeFacebookCode(code!)
  if (!ok) redirect('/settings?error=facebook_token_exchange_failed')

  try { await syncFacebookData() } catch { /* sync failure is non-fatal */ }

  redirect('/settings?connected=facebook')
}
