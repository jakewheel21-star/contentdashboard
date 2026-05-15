import { getAnalysisHistory } from '@/lib/db/queries/analyses'

export async function GET() {
  const history = getAnalysisHistory()
  return Response.json(history)
}
