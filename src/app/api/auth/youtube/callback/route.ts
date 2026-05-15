import { exchangeYouTubeCode, syncYouTubeData } from '@/lib/platforms/youtube'
import { redirect } from 'next/navigation'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    redirect('/settings?error=youtube_auth_failed')
  }

  const ok = await exchangeYouTubeCode(code!)
  if (!ok) redirect('/settings?error=youtube_token_exchange_failed')

  try { await syncYouTubeData() } catch { /* sync failure is non-fatal */ }

  redirect('/settings?connected=youtube')
}
