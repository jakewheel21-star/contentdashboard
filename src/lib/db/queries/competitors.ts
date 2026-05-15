import getDb from '@/lib/db/client'
import type { Competitor, CompetitorMetrics, CompetitorPost, CompetitorWithMetrics } from '@/lib/types'

export function getCompetitors(): CompetitorWithMetrics[] {
  const db = getDb()
  const competitors = db.prepare(`
    SELECT * FROM competitors WHERE is_active = 1 ORDER BY created_at DESC
  `).all() as Competitor[]

  return competitors.map((c) => {
    const metrics = db.prepare(`
      SELECT * FROM competitor_metrics WHERE competitor_id = ? ORDER BY recorded_at DESC LIMIT 1
    `).get(c.id) as CompetitorMetrics | null

    const recentPosts = db.prepare(`
      SELECT * FROM competitor_posts WHERE competitor_id = ? ORDER BY published_at DESC LIMIT 5
    `).all(c.id) as CompetitorPost[]

    const lastSyncedRow = db.prepare(`
      SELECT recorded_at FROM competitor_metrics WHERE competitor_id = ? ORDER BY recorded_at DESC LIMIT 1
    `).get(c.id) as { recorded_at: string } | null

    return {
      ...c,
      followers: metrics?.followers ?? 0,
      avg_likes: metrics?.avg_likes ?? 0,
      engagement_rate: metrics?.engagement_rate ?? 0,
      last_synced: lastSyncedRow?.recorded_at ?? null,
      recent_posts: recentPosts,
    }
  })
}

export function getCompetitorById(id: number): CompetitorWithMetrics | null {
  const db = getDb()
  const c = db.prepare(`SELECT * FROM competitors WHERE id = ?`).get(id) as Competitor | null
  if (!c) return null

  const metrics = db.prepare(`
    SELECT * FROM competitor_metrics WHERE competitor_id = ? ORDER BY recorded_at DESC LIMIT 1
  `).get(id) as CompetitorMetrics | null

  const recentPosts = db.prepare(`
    SELECT * FROM competitor_posts WHERE competitor_id = ? ORDER BY published_at DESC LIMIT 10
  `).all(id) as CompetitorPost[]

  const lastSyncedRow = db.prepare(`
    SELECT recorded_at FROM competitor_metrics WHERE competitor_id = ? ORDER BY recorded_at DESC LIMIT 1
  `).get(id) as { recorded_at: string } | null

  return {
    ...c,
    followers: metrics?.followers ?? 0,
    avg_likes: metrics?.avg_likes ?? 0,
    engagement_rate: metrics?.engagement_rate ?? 0,
    last_synced: lastSyncedRow?.recorded_at ?? null,
    recent_posts: recentPosts,
  }
}

export function addCompetitor(data: { platform: string; handle: string; notes?: string }): number {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO competitors (platform, handle, notes)
    VALUES (@platform, @handle, @notes)
  `).run({ notes: null, ...data })
  return result.lastInsertRowid as number
}

export function updateCompetitorInfo(id: number, data: {
  display_name?: string
  profile_url?: string
  avatar_url?: string
}) {
  const db = getDb()
  const sets: string[] = []
  const params: Record<string, string | number | null> = { id }

  if (data.display_name !== undefined) { sets.push('display_name = @display_name'); params.display_name = data.display_name }
  if (data.profile_url !== undefined) { sets.push('profile_url = @profile_url'); params.profile_url = data.profile_url }
  if (data.avatar_url !== undefined) { sets.push('avatar_url = @avatar_url'); params.avatar_url = data.avatar_url }

  if (sets.length) {
    db.prepare(`UPDATE competitors SET ${sets.join(', ')} WHERE id = @id`).run(params)
  }
}

export function insertCompetitorMetrics(metrics: {
  competitor_id: number
  followers: number
  following?: number
  total_posts?: number
  avg_likes?: number
  avg_comments?: number
  engagement_rate: number
}) {
  getDb().prepare(`
    INSERT INTO competitor_metrics (competitor_id, followers, following, total_posts, avg_likes, avg_comments, engagement_rate)
    VALUES (@competitor_id, @followers, @following, @total_posts, @avg_likes, @avg_comments, @engagement_rate)
  `).run({ following: 0, total_posts: 0, avg_likes: 0, avg_comments: 0, ...metrics })
}

export function insertCompetitorPosts(posts: Array<{
  competitor_id: number
  platform_post_id?: string
  title?: string
  url?: string
  thumbnail_url?: string
  likes?: number
  comments?: number
  views?: number
  published_at?: string
}>) {
  const db = getDb()
  const insert = db.prepare(`
    INSERT OR REPLACE INTO competitor_posts (competitor_id, platform_post_id, title, url, thumbnail_url, likes, comments, views, published_at)
    VALUES (@competitor_id, @platform_post_id, @title, @url, @thumbnail_url, @likes, @comments, @views, @published_at)
  `)
  const insertAll = db.transaction((items: typeof posts) => {
    for (const p of items) {
      insert.run({
        platform_post_id: null,
        title: null,
        url: null,
        thumbnail_url: null,
        likes: 0,
        comments: 0,
        views: 0,
        published_at: null,
        ...p,
      })
    }
  })
  insertAll(posts)
}

export function deleteCompetitor(id: number) {
  getDb().prepare('UPDATE competitors SET is_active = 0 WHERE id = ?').run(id)
}
