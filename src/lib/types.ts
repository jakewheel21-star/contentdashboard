export type Platform = 'youtube' | 'instagram' | 'facebook'
export type ContentType = 'video' | 'reel' | 'post' | 'story' | 'short'
export type Priority = 'high' | 'medium' | 'low'
export type Effort = 'low' | 'medium' | 'high'

export interface PlatformConnection {
  id: number
  platform: Platform
  access_token: string | null
  refresh_token: string | null
  token_expiry: string | null
  account_id: string | null
  account_name: string | null
  is_connected: number
  created_at: string
  updated_at: string
}

export interface ContentItem {
  id: number
  platform: Platform
  platform_id: string
  content_type: ContentType
  title: string | null
  description: string | null
  url: string | null
  thumbnail_url: string | null
  published_at: string | null
  is_demo: number
  created_at: string
  updated_at: string
}

export interface ContentMetrics {
  id: number
  content_item_id: number
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  watch_time_sec: number
  reach: number
  impressions: number
  engagement_rate: number
  ctr: number
  avg_view_duration_sec: number
  video_complete_rate: number
  profile_visits_from_post: number
  recorded_at: string
}

export interface AccountMetrics {
  id: number
  platform: Platform
  followers: number
  following: number
  total_posts: number
  total_views: number
  avg_engagement: number
  dm_count: number
  website_clicks: number
  profile_visits: number
  subscribers_gained: number
  subscribers_lost: number
  total_watch_time_hours: number
  impressions: number
  reach: number
  recorded_at: string
}

export interface Competitor {
  id: number
  platform: Platform
  handle: string
  display_name: string | null
  profile_url: string | null
  avatar_url: string | null
  notes: string | null
  is_active: number
  created_at: string
}

export interface CompetitorMetrics {
  id: number
  competitor_id: number
  followers: number
  following: number
  total_posts: number
  avg_likes: number
  avg_comments: number
  engagement_rate: number
  recorded_at: string
}

export interface CompetitorPost {
  id: number
  competitor_id: number
  platform_post_id: string | null
  title: string | null
  url: string | null
  thumbnail_url: string | null
  likes: number
  comments: number
  views: number
  published_at: string | null
  fetched_at: string
}

export interface TranscriptAnalysis {
  id: number
  raw_transcript: string
  title: string | null
  platform_targets: string
  analysis_json: string
  created_at: string
}

export interface ContentIdea {
  id: number
  analysis_id: number
  platform: string | null
  content_type: string | null
  title: string
  hook: string | null
  description: string | null
  talking_points: string
  hashtags: string
  estimated_effort: string | null
  priority: string | null
  is_saved: number
  created_at: string
}

export interface AnalysisResult {
  themes: string[]
  pain_points: string[]
  content_ideas: ContentIdeaInput[]
}

export interface ContentIdeaInput {
  platform: string
  content_type: string
  title: string
  hook: string
  description: string
  talking_points: string[]
  hashtags: string[]
  estimated_effort: Effort
  priority: Priority
  rationale: string
}

export interface AudienceDemographic {
  id: number
  platform: Platform
  demo_type: 'age' | 'gender' | 'country' | 'device' | 'traffic_source' | 'online_hour'
  label: string
  value: number
  is_demo: number
  recorded_at: string
}

export interface ContentItemWithMetrics extends ContentItem {
  views: number
  likes: number
  comments: number
  engagement_rate: number
}

export interface CompetitorWithMetrics extends Competitor {
  followers: number
  avg_likes: number
  engagement_rate: number
  last_synced: string | null
  recent_posts: CompetitorPost[]
}
