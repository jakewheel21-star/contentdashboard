import getDb from '@/lib/db/client'
import type { ContentItem, ContentItemWithMetrics, Platform } from '@/lib/types'

export function getContentItems(opts: {
  platform?: string
  content_type?: string
  sort?: 'newest' | 'views' | 'engagement'
  limit?: number
  offset?: number
} = {}): ContentItemWithMetrics[] {
  const db = getDb()
  const conditions: string[] = []
  const params: (string | number)[] = []

  if (opts.platform) {
    conditions.push('ci.platform = ?')
    params.push(opts.platform)
  }
  if (opts.content_type) {
    conditions.push('ci.content_type = ?')
    params.push(opts.content_type)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  let orderBy = 'ci.published_at DESC'
  if (opts.sort === 'views') orderBy = 'COALESCE(cm.views, 0) DESC'
  if (opts.sort === 'engagement') orderBy = 'COALESCE(cm.engagement_rate, 0) DESC'

  const limit = opts.limit ?? 50
  const offset = opts.offset ?? 0

  return db.prepare(`
    SELECT
      ci.*,
      COALESCE(cm.views, 0) AS views,
      COALESCE(cm.likes, 0) AS likes,
      COALESCE(cm.comments, 0) AS comments,
      COALESCE(cm.engagement_rate, 0) AS engagement_rate
    FROM content_items ci
    LEFT JOIN (
      SELECT content_item_id, views, likes, comments, engagement_rate
      FROM content_metrics
      WHERE id IN (
        SELECT MAX(id) FROM content_metrics GROUP BY content_item_id
      )
    ) cm ON cm.content_item_id = ci.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as ContentItemWithMetrics[]
}

export function getContentItemById(id: number): ContentItemWithMetrics | null {
  const db = getDb()
  return db.prepare(`
    SELECT
      ci.*,
      COALESCE(cm.views, 0) AS views,
      COALESCE(cm.likes, 0) AS likes,
      COALESCE(cm.comments, 0) AS comments,
      COALESCE(cm.engagement_rate, 0) AS engagement_rate
    FROM content_items ci
    LEFT JOIN (
      SELECT content_item_id, views, likes, comments, engagement_rate
      FROM content_metrics
      WHERE id IN (
        SELECT MAX(id) FROM content_metrics GROUP BY content_item_id
      )
    ) cm ON cm.content_item_id = ci.id
    WHERE ci.id = ?
  `).get(id) as ContentItemWithMetrics | null
}

export function upsertContentItem(item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>) {
  const db = getDb()
  return db.prepare(`
    INSERT INTO content_items (platform, platform_id, content_type, title, description, url, thumbnail_url, published_at, is_demo)
    VALUES (@platform, @platform_id, @content_type, @title, @description, @url, @thumbnail_url, @published_at, @is_demo)
    ON CONFLICT(platform, platform_id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      url = excluded.url,
      thumbnail_url = excluded.thumbnail_url,
      published_at = excluded.published_at,
      updated_at = datetime('now')
    RETURNING id
  `).get(item) as { id: number }
}

export function insertContentMetrics(metrics: {
  content_item_id: number
  views: number
  likes: number
  comments: number
  shares?: number
  saves?: number
  watch_time_sec?: number
  reach?: number
  impressions?: number
  engagement_rate: number
}) {
  const db = getDb()
  db.prepare(`
    INSERT INTO content_metrics (content_item_id, views, likes, comments, shares, saves, watch_time_sec, reach, impressions, engagement_rate)
    VALUES (@content_item_id, @views, @likes, @comments, @shares, @saves, @watch_time_sec, @reach, @impressions, @engagement_rate)
  `).run({
    shares: 0,
    saves: 0,
    watch_time_sec: 0,
    reach: 0,
    impressions: 0,
    ...metrics,
  })
}

export function getTopContent(limit = 5): ContentItemWithMetrics[] {
  const db = getDb()
  return db.prepare(`
    SELECT
      ci.*,
      COALESCE(cm.views, 0) AS views,
      COALESCE(cm.likes, 0) AS likes,
      COALESCE(cm.comments, 0) AS comments,
      COALESCE(cm.engagement_rate, 0) AS engagement_rate
    FROM content_items ci
    LEFT JOIN (
      SELECT content_item_id, views, likes, comments, engagement_rate
      FROM content_metrics
      WHERE id IN (
        SELECT MAX(id) FROM content_metrics GROUP BY content_item_id
      )
    ) cm ON cm.content_item_id = ci.id
    ORDER BY COALESCE(cm.views, 0) DESC
    LIMIT ?
  `).all(limit) as ContentItemWithMetrics[]
}

export function deleteContentItem(id: number) {
  getDb().prepare('DELETE FROM content_items WHERE id = ?').run(id)
}
