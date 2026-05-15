import { getPlatformConnections, isAnyPlatformConnected } from '@/lib/db/queries/settings'

export async function GET() {
  const connections = getPlatformConnections()
  const anyConnected = isAnyPlatformConnected()

  return Response.json({
    anyConnected,
    platforms: Object.fromEntries(
      connections.map((c) => [c.platform, {
        connected: c.is_connected === 1,
        accountName: c.account_name,
        accountId: c.account_id,
      }])
    ),
  })
}
