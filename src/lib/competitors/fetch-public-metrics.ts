import { getSetting } from '@/lib/db/queries/settings'

interface YouTubeChannelData {
  channelId: string
  displayName: string
  profileUrl: string
  subscribers: number
  totalViews: number
  totalVideos: number
  recentVideos: Array<{
    id: string
    title: string
    url: string
    views: number
    likes: number
    comments: number
    publishedAt: string
  }>
  avgLikes: number
  engagementRate: number
}

export async function fetchYouTubeCompetitorMetrics(handle: string): Promise<YouTubeChannelData | null> {
  const apiKey = getSetting('youtube_api_key') || process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    // Resolve handle to channel ID
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${apiKey}`
    )
    const searchData = await searchRes.json()
    const channelId: string = searchData.items?.[0]?.id?.channelId
    if (!channelId) return null

    // Get channel stats
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
    )
    const channelData = await channelRes.json()
    const channel = channelData.items?.[0]
    if (!channel) return null

    const subscribers = parseInt(channel.statistics.subscriberCount ?? '0')
    const totalViews = parseInt(channel.statistics.viewCount ?? '0')
    const totalVideos = parseInt(channel.statistics.videoCount ?? '0')

    // Get recent videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`
    )
    const videosData = await videosRes.json()
    const videoIds: string[] = (videosData.items ?? []).map((v: { id: { videoId: string } }) => v.id.videoId)

    let recentVideos: YouTubeChannelData['recentVideos'] = []
    if (videoIds.length > 0) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${apiKey}`
      )
      const statsData = await statsRes.json()
      recentVideos = (statsData.items ?? []).map((v: {
        id: string
        snippet: { title: string; publishedAt: string }
        statistics: { viewCount?: string; likeCount?: string; commentCount?: string }
      }) => ({
        id: v.id,
        title: v.snippet.title,
        url: `https://youtube.com/watch?v=${v.id}`,
        views: parseInt(v.statistics.viewCount ?? '0'),
        likes: parseInt(v.statistics.likeCount ?? '0'),
        comments: parseInt(v.statistics.commentCount ?? '0'),
        publishedAt: v.snippet.publishedAt,
      }))
    }

    const avgLikes = recentVideos.length > 0
      ? Math.round(recentVideos.reduce((s, v) => s + v.likes, 0) / recentVideos.length)
      : 0

    const avgViews = recentVideos.length > 0
      ? Math.round(recentVideos.reduce((s, v) => s + v.views, 0) / recentVideos.length)
      : 0

    const engagementRate = avgViews > 0 ? Math.round((avgLikes / avgViews) * 100 * 10) / 10 : 0

    return {
      channelId,
      displayName: channel.snippet.title,
      profileUrl: `https://youtube.com/channel/${channelId}`,
      subscribers,
      totalViews,
      totalVideos,
      recentVideos,
      avgLikes,
      engagementRate,
    }
  } catch {
    return null
  }
}

export async function fetchInstagramCompetitorMetrics() {
  // Instagram Graph API does not allow reading other accounts' data.
  // We can only read our own connected account.
  return null
}

export async function fetchFacebookCompetitorMetrics() {
  // Same limitation as Instagram.
  return null
}
