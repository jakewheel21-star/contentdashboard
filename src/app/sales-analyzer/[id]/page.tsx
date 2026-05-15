import { getAnalysisById } from '@/lib/db/queries/analyses'
import ContentIdeaCard from '@/components/sales-analyzer/ContentIdeaCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ContentIdeaInput } from '@/lib/types'

export default async function AnalysisDetailPage(props: PageProps<'/sales-analyzer/[id]'>) {
  const { id } = await props.params
  const analysis = getAnalysisById(parseInt(id))
  if (!analysis) notFound()

  let parsedResult: { themes?: string[]; pain_points?: string[] } = {}
  try {
    parsedResult = JSON.parse(analysis.analysis_json)
  } catch { /* ignore */ }

  const ideas = analysis.ideas.map((idea) => {
    let talking_points: string[] = []
    let hashtags: string[] = []
    try { talking_points = JSON.parse(idea.talking_points) } catch { /* ignore */ }
    try { hashtags = JSON.parse(idea.hashtags) } catch { /* ignore */ }
    return {
      platform: idea.platform ?? 'all',
      content_type: idea.content_type ?? 'post',
      title: idea.title,
      hook: idea.hook ?? '',
      description: idea.description ?? '',
      talking_points,
      hashtags,
      estimated_effort: (idea.estimated_effort ?? 'medium') as 'low' | 'medium' | 'high',
      priority: (idea.priority ?? 'medium') as 'high' | 'medium' | 'low',
      rationale: '',
    } satisfies ContentIdeaInput
  })

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/sales-analyzer" className="text-sm text-gray-500 hover:text-gray-700">← Back</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {analysis.title ?? 'Untitled Analysis'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {' · '}
            {ideas.length} content ideas
          </p>
        </div>
      </div>

      {(parsedResult.themes ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Themes</h3>
          <div className="flex flex-wrap gap-2">
            {parsedResult.themes!.map((t, i) => (
              <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{t}</span>
            ))}
          </div>
          {(parsedResult.pain_points ?? []).length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pain Points</div>
              <ul className="space-y-1.5">
                {parsedResult.pain_points!.map((p, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-red-400">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {ideas.map((idea, i) => <ContentIdeaCard key={i} idea={idea} />)}
      </div>
    </div>
  )
}
