import { exchangeInstagramCode, syncInstagramData } from '@/lib/platforms/instagram'
import { redirect } from 'next/navigation'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) redirect('/settings?error=instagram_auth_failed')

  const ok = await exchangeInstagramCode(code!)
  if (!ok) redirect('/settings?error=instagram_token_exchange_failed')

  try { await syncInstagramData() } catch { /* sync failure is non-fatal */ }

  redirect('/settings?connected=instagram')
}
