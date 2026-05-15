import { getPlatformConnection, updatePlatformConnection } from '@/lib/db/queries/settings'
import { upsertContentItem, insertContentMetrics } from '@/lib/db/queries/content'
import { insertAccountMetrics } from '@/lib/db/queries/metrics'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API_BASE = 'https://www.googleapis.com/youtube/v3'

export function getYouTubeAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`
  const scope = 'https://www.googleapis.com/auth/youtube.readonly'
  const state = Math.random().toString(36).slice(2)

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId!)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scope)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'consent')

  return url.toString()
}

export async function exchangeYouTubeCode(code: string): Promise<boolean> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId!, client_secret: clientSecret!, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })

  if (!res.ok) return false
  const data = await res.json()

  const expiry = new Date(Date.now() + data.expires_in * 1000).toISOString()
  updatePlatformConnection('youtube', {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    token_expiry: expiry,
    is_connected: 1,
  })

  // Fetch channel info
  try {
    const me = await ytFetch('channels?part=snippet,statistics&mine=true', data.access_token)
    const channel = me.items?.[0]
    if (channel) {
      updatePlatformConnection('youtube', {
        account_id: channel.id,
        account_name: channel.snippet.title,
      })
    }
  } catch { /* non-critical */ }

  return true
}

async function refreshYouTubeToken(): Promise<string | null> {
  const conn = getPlatformConnection('youtube')
  if (!conn?.refresh_token) return null

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: conn.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const expiry = new Date(Date.now() + data.expires_in * 1000).toISOString()
  updatePlatformConnection('youtube', { access_token: data.access_token, token_expiry: expiry })
  return data.access_token
}

async function getValidToken(): Promise<string | null> {
  const conn = getPlatformConnection('youtube')
  if (!conn?.access_token) return null
  if (conn.token_expiry && new Date(conn.token_expiry) < new Date(Date.now() + 60000)) {
    return refreshYouTubeToken()
  }
  return conn.access_token
}

async function ytFetch(path: string, token: string) {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`YouTube API error ${res.status}`)
  return res.json()
}

export async function syncYouTubeData(): Promise<{ synced: number }> {
  const token = await getValidToken()
  if (!token) return { synced: 0 }

  const conn = getPlatformConnection('youtube')
  const channelId = conn?.account_id
  if (!channelId) return { synced: 0 }

  // Channel stats
  const channelData = await ytFetch(`channels?part=statistics&id=${channelId}`, token)
  const stats = channelData.items?.[0]?.statistics
  if (stats) {
    insertAccountMetrics({
      platform: 'youtube',
      followers: parseInt(stats.subscriberCount ?? '0'),
      following: 0,
      total_posts: parseInt(stats.videoCount ?? '0'),
      total_views: parseInt(stats.viewCount ?? '0'),
      avg_engagement: 0,
    })
  }

  // Recent videos
  const videosData = await ytFetch(`search?part=id&channelId=${channelId}&order=date&maxResults=20&type=video`, token)
  const videoIds: string[] = (videosData.items ?? []).map((v: { id: { videoId: string } }) => v.id.videoId)

  let synced = 0
  if (videoIds.length > 0) {
    const statsData = await ytFetch(`videos?part=statistics,snippet&id=${videoIds.join(',')}`, token)
    for (const v of statsData.items ?? []) {
      const { id } = upsertContentItem({
        platform: 'youtube',
        platform_id: v.id,
        content_type: (v.snippet?.title?.toLowerCase().includes('#shorts') ? 'short' : 'video') as 'video' | 'short',
        title: v.snippet?.title ?? null,
        description: v.snippet?.description?.slice(0, 500) ?? null,
        url: `https://youtube.com/watch?v=${v.id}`,
        thumbnail_url: v.snippet?.thumbnails?.medium?.url ?? null,
        published_at: v.snippet?.publishedAt ?? null,
        is_demo: 0,
      })
      const viewCount = parseInt(v.statistics?.viewCount ?? '0')
      const likeCount = parseInt(v.statistics?.likeCount ?? '0')
      const commentCount = parseInt(v.statistics?.commentCount ?? '0')
      const engRate = viewCount > 0 ? Math.round(((likeCount + commentCount) / viewCount) * 100 * 10) / 10 : 0
      insertContentMetrics({ content_item_id: id, views: viewCount, likes: likeCount, comments: commentCount, engagement_rate: engRate })
      synced++
    }
  }

  return { synced }
}
