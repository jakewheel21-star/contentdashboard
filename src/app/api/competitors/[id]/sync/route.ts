import { getCompetitorById, updateCompetitorInfo, insertCompetitorMetrics, insertCompetitorPosts } from '@/lib/db/queries/competitors'
import { fetchYouTubeCompetitorMetrics } from '@/lib/competitors/fetch-public-metrics'

export async function POST(_req: Request, ctx: RouteContext<'/api/competitors/[id]/sync'>) {
  const { id } = await ctx.params
  const competitor = getCompetitorById(parseInt(id))
  if (!competitor) return Response.json({ error: 'Not found' }, { status: 404 })

  if (competitor.platform === 'youtube') {
    const data = await fetchYouTubeCompetitorMetrics(competitor.handle)
    if (!data) {
      return Response.json({ error: 'Could not fetch YouTube data. Make sure your YouTube API key is configured in Settings.' }, { status: 422 })
    }

    updateCompetitorInfo(parseInt(id), {
      display_name: data.displayName,
      profile_url: data.profileUrl,
    })

    insertCompetitorMetrics({
      competitor_id: parseInt(id),
      followers: data.subscribers,
      total_posts: data.totalVideos,
      avg_likes: data.avgLikes,
      engagement_rate: data.engagementRate,
    })

    if (data.recentVideos.length > 0) {
      insertCompetitorPosts(data.recentVideos.map((v) => ({
        competitor_id: parseInt(id),
        platform_post_id: v.id,
        title: v.title,
        url: v.url,
        likes: v.likes,
        comments: v.comments,
        views: v.views,
        published_at: v.publishedAt,
      })))
    }

    return Response.json({ ok: true, displayName: data.displayName, subscribers: data.subscribers })
  }

  // Instagram / Facebook — limited public data
  return Response.json({
    ok: false,
    message: 'Automatic sync is only available for YouTube competitors. Instagram and Facebook do not allow reading other accounts\' data via their APIs.',
  })
}
