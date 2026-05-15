import { getPlatformConnection, updatePlatformConnection } from '@/lib/db/queries/settings'
import { upsertContentItem, insertContentMetrics } from '@/lib/db/queries/content'
import { insertAccountMetrics } from '@/lib/db/queries/metrics'

const TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token'
const API_BASE = 'https://graph.facebook.com/v19.0'

export function getInstagramAuthUrl(): string {
  const appId = process.env.META_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`
  const scope = 'instagram_basic,instagram_manage_insights,pages_show_list'

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', appId!)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')

  return url.toString()
}

export async function exchangeInstagramCode(code: string): Promise<boolean> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: appId!, client_secret: appSecret!, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })
  if (!res.ok) return false
  const data = await res.json()

  updatePlatformConnection('instagram', {
    access_token: data.access_token,
    is_connected: 1,
  })

  // Get Instagram Business Account ID
  try {
    const pages = await igFetch('me/accounts?fields=instagram_business_account', data.access_token)
    const igAccount = pages.data?.[0]?.instagram_business_account
    if (igAccount) {
      const profile = await igFetch(`${igAccount.id}?fields=name,username`, data.access_token)
      updatePlatformConnection('instagram', { account_id: igAccount.id, account_name: profile.name ?? profile.username })
    }
  } catch { /* non-critical */ }

  return true
}

async function igFetch(path: string, token: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API_BASE}/${path}${sep}access_token=${token}`)
  if (!res.ok) throw new Error(`Instagram API error ${res.status}`)
  return res.json()
}

export async function syncInstagramData(): Promise<{ synced: number }> {
  const conn = getPlatformConnection('instagram')
  if (!conn?.access_token || !conn.account_id) return { synced: 0 }

  const token = conn.access_token

  // Account insights
  try {
    const profile = await igFetch(`${conn.account_id}?fields=followers_count,media_count`, token)
    insertAccountMetrics({
      platform: 'instagram',
      followers: profile.followers_count ?? 0,
      following: 0,
      total_posts: profile.media_count ?? 0,
      total_views: 0,
      avg_engagement: 0,
    })
  } catch { /* non-critical */ }

  // Recent media
  let synced = 0
  try {
    const media = await igFetch(
      `${conn.account_id}/media?fields=id,caption,media_type,permalink,thumbnail_url,timestamp,like_count,comments_count&limit=20`,
      token
    )
    for (const m of media.data ?? []) {
      const contentType = m.media_type === 'VIDEO' ? 'reel' : 'post'
      const { id } = upsertContentItem({
        platform: 'instagram',
        platform_id: m.id,
        content_type: contentType as 'reel' | 'post',
        title: m.caption?.slice(0, 100) ?? null,
        description: m.caption ?? null,
        url: m.permalink ?? null,
        thumbnail_url: m.thumbnail_url ?? null,
        published_at: m.timestamp ?? null,
        is_demo: 0,
      })
      const likes = m.like_count ?? 0
      const comments = m.comments_count ?? 0
      insertContentMetrics({ content_item_id: id, views: 0, likes, comments, engagement_rate: 0 })
      synced++
    }
  } catch { /* non-critical */ }

  return { synced }
}
