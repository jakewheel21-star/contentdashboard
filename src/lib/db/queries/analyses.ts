import getDb from '@/lib/db/client'
import type { ContentIdea, TranscriptAnalysis } from '@/lib/types'

export function getAnalysisHistory(): TranscriptAnalysis[] {
  const db = getDb()
  return db.prepare(`
    SELECT id, title, platform_targets, created_at,
      SUBSTR(raw_transcript, 1, 200) AS raw_transcript,
      analysis_json
    FROM transcript_analyses
    ORDER BY created_at DESC
    LIMIT 50
  `).all() as TranscriptAnalysis[]
}

export function getAnalysisById(id: number): (TranscriptAnalysis & { ideas: ContentIdea[] }) | null {
  const db = getDb()
  const analysis = db.prepare(`SELECT * FROM transcript_analyses WHERE id = ?`).get(id) as TranscriptAnalysis | null
  if (!analysis) return null

  const ideas = db.prepare(`SELECT * FROM content_ideas WHERE analysis_id = ? ORDER BY priority DESC, id ASC`).all(id) as ContentIdea[]

  return { ...analysis, ideas }
}

export function insertAnalysis(data: {
  raw_transcript: string
  title: string | null
  platform_targets: string
  analysis_json: string
}): number {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO transcript_analyses (raw_transcript, title, platform_targets, analysis_json)
    VALUES (@raw_transcript, @title, @platform_targets, @analysis_json)
  `).run(data)
  return result.lastInsertRowid as number
}

export function insertContentIdeas(analysisId: number, ideas: Array<{
  platform?: string
  content_type?: string
  title: string
  hook?: string
  description?: string
  talking_points?: string[]
  hashtags?: string[]
  estimated_effort?: string
  priority?: string
}>) {
  const db = getDb()
  const insert = db.prepare(`
    INSERT INTO content_ideas (analysis_id, platform, content_type, title, hook, description, talking_points, hashtags, estimated_effort, priority)
    VALUES (@analysis_id, @platform, @content_type, @title, @hook, @description, @talking_points, @hashtags, @estimated_effort, @priority)
  `)
  const insertAll = db.transaction((items: typeof ideas) => {
    for (const idea of items) {
      insert.run({
        analysis_id: analysisId,
        platform: idea.platform ?? null,
        content_type: idea.content_type ?? null,
        title: idea.title,
        hook: idea.hook ?? null,
        description: idea.description ?? null,
        talking_points: JSON.stringify(idea.talking_points ?? []),
        hashtags: JSON.stringify(idea.hashtags ?? []),
        estimated_effort: idea.estimated_effort ?? null,
        priority: idea.priority ?? null,
      })
    }
  })
  insertAll(ideas)
}

export function toggleSaveIdea(id: number) {
  const db = getDb()
  db.prepare(`UPDATE content_ideas SET is_saved = CASE WHEN is_saved = 1 THEN 0 ELSE 1 END WHERE id = ?`).run(id)
}

export function deleteAnalysis(id: number) {
  getDb().prepare('DELETE FROM transcript_analyses WHERE id = ?').run(id)
}
