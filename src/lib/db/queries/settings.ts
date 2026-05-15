import getDb from '@/lib/db/client'
import type { Platform, PlatformConnection } from '@/lib/types'

export function getSetting(key: string): string | null {
  const row = getDb().prepare(`SELECT value FROM app_settings WHERE key = ?`).get(key) as { value: string } | null
  return row?.value ?? null
}

export function setSetting(key: string, value: string) {
  getDb().prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value)
}

export function getPlatformConnections(): PlatformConnection[] {
  return getDb().prepare(`SELECT * FROM platform_connections ORDER BY platform`).all() as PlatformConnection[]
}

export function getPlatformConnection(platform: Platform): PlatformConnection | null {
  return getDb().prepare(`SELECT * FROM platform_connections WHERE platform = ?`).get(platform) as PlatformConnection | null
}

export function updatePlatformConnection(platform: Platform, data: Partial<PlatformConnection>) {
  const db = getDb()
  const sets: string[] = []
  const params: Record<string, string | number | null> = { platform }

  const allowed = ['access_token', 'refresh_token', 'token_expiry', 'account_id', 'account_name', 'is_connected'] as const
  for (const key of allowed) {
    if (key in data) {
      sets.push(`${key} = @${key}`)
      params[key] = data[key] as string | number | null
    }
  }
  if (sets.length === 0) return

  sets.push(`updated_at = datetime('now')`)
  db.prepare(`UPDATE platform_connections SET ${sets.join(', ')} WHERE platform = @platform`).run(params)
}

export function disconnectPlatform(platform: Platform) {
  getDb().prepare(`
    UPDATE platform_connections
    SET access_token = NULL, refresh_token = NULL, token_expiry = NULL,
        account_id = NULL, account_name = NULL, is_connected = 0,
        updated_at = datetime('now')
    WHERE platform = ?
  `).run(platform)
}

export function isAnyPlatformConnected(): boolean {
  const row = getDb().prepare(`SELECT COUNT(*) as count FROM platform_connections WHERE is_connected = 1`).get() as { count: number }
  return row.count > 0
}
