import { getPlatformConnection, updatePlatformConnection } from '@/lib/db/queries/settings'
import { upsertContentItem, insertContentMetrics } from '@/lib/db/queries/content'
import { insertAccountMetrics } from '@/lib/db/queries/metrics'

const TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token'
const API_BASE = 'https://graph.facebook.com/v19.0'

export function getFacebookAuthUrl(): string {
  const appId = process.env.META_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`
  const scope = 'pages_read_engagement,pages_read_user_content,read_insights'

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', appId!)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')

  return url.toString()
}

export async function exchangeFacebookCode(code: string): Promise<boolean> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: appId!, client_secret: appSecret!, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })
  if (!res.ok) return false
  const data = await res.json()

  updatePlatformConnection('facebook', { access_token: data.access_token, is_connected: 1 })

  // Get page info
  try {
    const pages = await fbFetch(`me/accounts`, data.access_token)
    const page = pages.data?.[0]
    if (page) {
      updatePlatformConnection('facebook', { account_id: page.id, account_name: page.name, access_token: page.access_token })
    }
  } catch { /* non-critical */ }

  return true
}

async function fbFetch(path: string, token: string) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API_BASE}/${path}${sep}access_token=${token}`)
  if (!res.ok) throw new Error(`Facebook API error ${res.status}`)
  return res.json()
}

export async function syncFacebookData(): Promise<{ synced: number }> {
  const conn = getPlatformConnection('facebook')
  if (!conn?.access_token || !conn.account_id) return { synced: 0 }

  const token = conn.access_token

  // Page insights
  try {
    const page = await fbFetch(`${conn.account_id}?fields=fan_count,posts.limit(1)`, token)
    insertAccountMetrics({
      platform: 'facebook',
      followers: page.fan_count ?? 0,
      following: 0,
      total_posts: 0,
      total_views: 0,
      avg_engagement: 0,
    })
  } catch { /* non-critical */ }

  // Recent posts
  let synced = 0
  try {
    const posts = await fbFetch(
      `${conn.account_id}/posts?fields=id,message,story,permalink_url,created_time,likes.summary(true),comments.summary(true)&limit=20`,
      token
    )
    for (const p of posts.data ?? []) {
      const { id } = upsertContentItem({
        platform: 'facebook',
        platform_id: p.id,
        content_type: 'post',
        title: (p.message ?? p.story ?? '').slice(0, 100) || null,
        description: p.message ?? null,
        url: p.permalink_url ?? null,
        thumbnail_url: null,
        published_at: p.created_time ?? null,
        is_demo: 0,
      })
      const likes = p.likes?.summary?.total_count ?? 0
      const comments = p.comments?.summary?.total_count ?? 0
      insertContentMetrics({ content_item_id: id, views: 0, likes, comments, engagement_rate: 0 })
      synced++
    }
  } catch { /* non-critical */ }

  return { synced }
}
