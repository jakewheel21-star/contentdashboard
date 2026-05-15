import Anthropic from '@anthropic-ai/sdk'
import type { AnalysisResult } from '@/lib/types'
import { getSetting } from '@/lib/db/queries/settings'

const SYSTEM_PROMPT = `You are an expert social media content strategist who specializes in sales content.
You analyze sales call transcripts to extract content ideas that address the pain points, questions, and objections raised by prospects.

When analyzing a transcript, identify:
1. The core problems/pain points mentioned by the prospect
2. Questions they asked (these become FAQ-style content)
3. Objections raised (these become trust-building and objection-handling content)
4. Success criteria they described (outcome-focused content)
5. Industry jargon and terminology (informs SEO and hashtag strategy)

Return ONLY valid JSON matching this exact schema — no other text:
{
  "themes": ["theme1", "theme2"],
  "pain_points": ["pain1", "pain2"],
  "content_ideas": [
    {
      "platform": "youtube|instagram|facebook|all",
      "content_type": "video|post|reel|carousel|short",
      "title": "compelling content title",
      "hook": "opening line or hook",
      "description": "brief description of the content",
      "talking_points": ["point1", "point2", "point3"],
      "hashtags": ["#tag1", "#tag2"],
      "estimated_effort": "low|medium|high",
      "priority": "high|medium|low",
      "rationale": "why this idea directly addresses something from the transcript"
    }
  ]
}`

export async function analyzeTranscript(
  transcript: string,
  platforms: string[],
  title?: string
): Promise<{ stream: ReadableStream; saveResult: (analysisId: number) => Promise<AnalysisResult> }> {
  const apiKey = getSetting('anthropic_api_key') || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    const mockResult = getMockAnalysis()
    const text = JSON.stringify(mockResult)
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text))
        controller.close()
      }
    })
    return { stream, saveResult: async () => mockResult }
  }

  const client = new Anthropic({ apiKey })
  const platformList = platforms.length > 0 ? platforms.join(', ') : 'all platforms'

  const message = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Analyze this sales call transcript and generate content ideas for: ${platformList}.\n\nTranscript title: ${title ?? 'Sales Call'}\n\nTranscript:\n${transcript}`
    }]
  })

  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of message) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          fullText += chunk.delta.text
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    }
  })

  const saveResult = async (): Promise<AnalysisResult> => {
    await message.finalMessage()
    try {
      return JSON.parse(fullText) as AnalysisResult
    } catch {
      return getMockAnalysis()
    }
  }

  return { stream, saveResult }
}

function getMockAnalysis(): AnalysisResult {
  return {
    themes: ['pricing objections', 'trust building', 'discovery process'],
    pain_points: [
      'Prospects ask "why are you more expensive than competitors?"',
      'Hard to get decision-makers on calls',
      'Follow-ups often go unanswered',
    ],
    content_ideas: [
      {
        platform: 'youtube',
        content_type: 'video',
        title: 'How to Justify Your Premium Pricing (Without Being Pushy)',
        hook: 'Your prospect just asked why you cost more. Here\'s exactly what to say.',
        description: 'A framework for explaining premium pricing that converts skeptics into buyers.',
        talking_points: ['Value vs. price distinction', 'ROI calculation technique', 'Competitor comparison reframe'],
        hashtags: ['#salesstrategy', '#premiumpricing', '#salestips'],
        estimated_effort: 'medium',
        priority: 'high',
        rationale: 'Price objection came up multiple times — this would directly address a common prospect concern.',
      },
      {
        platform: 'instagram',
        content_type: 'reel',
        title: '3 Ways to Get the Decision-Maker on the Call',
        hook: 'Tired of talking to gatekeepers? Try this.',
        description: 'Quick tactics for getting to the actual buyer faster.',
        talking_points: ['The reverse referral technique', 'LinkedIn pre-call strategy', 'The "2 people needed" opener'],
        hashtags: ['#b2bsales', '#salesreel', '#saleshacks'],
        estimated_effort: 'low',
        priority: 'high',
        rationale: 'Connecting with decision-makers was a recurring theme in the transcript.',
      },
      {
        platform: 'all',
        content_type: 'post',
        title: 'Why Your Follow-Up Emails Aren\'t Getting Replies (And The Fix)',
        hook: 'Add this one sentence to every follow-up and watch your reply rate double.',
        description: 'The psychology behind follow-up timing and messaging.',
        talking_points: ['The "pattern interrupt" email', 'Optimal follow-up timing', 'Breaking the ghosting cycle'],
        hashtags: ['#followup', '#salesemails', '#closingdeals'],
        estimated_effort: 'low',
        priority: 'medium',
        rationale: 'Follow-up issues were directly mentioned in the call.',
      },
    ],
  }
}
