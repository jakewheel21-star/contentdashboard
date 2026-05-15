import { analyzeTranscript } from '@/lib/ai/analyze-transcript'
import { insertAnalysis, insertContentIdeas } from '@/lib/db/queries/analyses'

export async function POST(req: Request) {
  const body = await req.json()
  const { transcript, title, platforms = [] } = body

  if (!transcript || transcript.trim().length < 50) {
    return Response.json({ error: 'Transcript must be at least 50 characters' }, { status: 400 })
  }

  let fullText = ''
  let savedAnalysisId: number | null = null

  const { stream, saveResult } = await analyzeTranscript(transcript, platforms, title)

  const responseStream = new ReadableStream({
    async start(controller) {
      const reader = stream.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += new TextDecoder().decode(value)
        controller.enqueue(value)
      }

      // Save to DB after streaming completes
      try {
        const result = await saveResult(savedAnalysisId ?? 0)
        const analysisId = insertAnalysis({
          raw_transcript: transcript,
          title: title ?? null,
          platform_targets: JSON.stringify(platforms),
          analysis_json: JSON.stringify(result),
        })
        savedAnalysisId = analysisId
        insertContentIdeas(analysisId, result.content_ideas ?? [])

        // Append the analysis ID so the client can redirect
        const meta = JSON.stringify({ __analysisId: analysisId })
        controller.enqueue(new TextEncoder().encode(`\n\n${meta}`))
      } catch {
        // non-critical
      }

      controller.close()
    }
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
