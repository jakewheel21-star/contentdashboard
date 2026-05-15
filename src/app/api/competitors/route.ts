import { getCompetitors, addCompetitor } from '@/lib/db/queries/competitors'

export async function GET() {
  const competitors = getCompetitors()
  return Response.json(competitors)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { platform, handle, notes } = body

  if (!platform || !handle) {
    return Response.json({ error: 'platform and handle are required' }, { status: 400 })
  }

  try {
    const id = addCompetitor({ platform, handle: handle.trim().replace(/^@/, '@').replace(/^(?!@)/, '@'), notes })
    return Response.json({ id })
  } catch {
    return Response.json({ error: 'Competitor already exists for this platform' }, { status: 409 })
  }
}
