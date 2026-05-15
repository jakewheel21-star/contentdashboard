import getDb from '@/lib/db/client'
import type { AccountMetrics, Platform } from '@/lib/types'

export function getAccountMetrics(platform: Platform, days = 30): AccountMetrics[] {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM account_metrics
    WHERE platform = ?
      AND recorded_at >= datetime('now', ? || ' days')
    ORDER BY recorded_at ASC
  `).all(platform, `-${days}`) as AccountMetrics[]
}

export function getLatestAccountMetrics(platform: Platform): AccountMetrics | null {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM account_metrics
    WHERE platform = ?
    ORDER BY recorded_at DESC
    LIMIT 1
  `).get(platform) as AccountMetrics | null
}

export function insertAccountMetrics(
  metrics: Pick<AccountMetrics, 'platform' | 'followers' | 'following' | 'total_posts' | 'total_views' | 'avg_engagement'>
) {
  getDb().prepare(`
    INSERT INTO account_metrics (platform, followers, following, total_posts, total_views, avg_engagement)
    VALUES (@platform, @followers, @following, @total_posts, @total_views, @avg_engagement)
  `).run(metrics)
}

export function getContentMetricsHistory(contentItemId: number, days = 30) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM content_metrics
    WHERE content_item_id = ?
      AND recorded_at >= datetime('now', ? || ' days')
    ORDER BY recorded_at ASC
  `).all(contentItemId, `-${days}`)
}

export function getDashboardSummary() {
  const db = getDb()

  const platforms: Platform[] = ['youtube', 'instagram', 'facebook']
  const summary: Record<string, {
    followers: number
    followersDelta: number
    totalViews: number
    avgEngagement: number
    totalContent: number
  }> = {}

  for (const platform of platforms) {
    const latest = db.prepare(`
      SELECT * FROM account_metrics WHERE platform = ? ORDER BY recorded_at DESC LIMIT 1
    `).get(platform) as AccountMetrics | null

    const prev = db.prepare(`
      SELECT * FROM account_metrics WHERE platform = ? ORDER BY recorded_at DESC LIMIT 1 OFFSET 1
    `).get(platform) as AccountMetrics | null

    const contentCount = (db.prepare(`
      SELECT COUNT(*) as count FROM content_items WHERE platform = ?
    `).get(platform) as { count: number }).count

    summary[platform] = {
      followers: latest?.followers ?? 0,
      followersDelta: latest && prev ? latest.followers - prev.followers : 0,
      totalViews: latest?.total_views ?? 0,
      avgEngagement: latest?.avg_engagement ?? 0,
      totalContent: contentCount,
    }
  }

  return summary
}
