'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PlatformConnection } from '@/lib/types'

interface PlatformConfig {
  label: string
  icon: string
  iconBg: string
  description: string
  setupUrl: string
  setupSteps: string[]
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  youtube: {
    label: 'YouTube',
    icon: '▶',
    iconBg: 'bg-red-500',
    description: 'Track video analytics, subscriber growth, and engagement.',
    setupUrl: 'https://console.cloud.google.com',
    setupSteps: [
      'Go to Google Cloud Console and create/select a project',
      'Enable the YouTube Data API v3',
      'Create OAuth 2.0 credentials (Web Application)',
      'Add redirect URI: http://localhost:3000/api/auth/youtube/callback',
      'Copy Client ID and Secret into the fields below',
    ],
  },
  instagram: {
    label: 'Instagram',
    icon: '◉',
    iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    description: 'Track posts, reels, reach, and engagement metrics.',
    setupUrl: 'https://developers.facebook.com',
    setupSteps: [
      'Go to Meta for Developers and create an app (Consumer type)',
      'Add the Instagram Graph API product',
      'Add redirect URI: http://localhost:3000/api/auth/instagram/callback',
      'Copy App ID and App Secret into the fields below',
      'Note: Requires an Instagram Business or Creator account linked to a Facebook Page',
    ],
  },
  facebook: {
    label: 'Facebook',
    icon: '◈',
    iconBg: 'bg-blue-600',
    description: 'Track page engagement, post performance, and audience insights.',
    setupUrl: 'https://developers.facebook.com',
    setupSteps: [
      'Same Meta app as Instagram — no separate setup needed if Instagram is configured',
      'Add redirect URI: http://localhost:3000/api/auth/facebook/callback',
      'Requires a Facebook Page (not a personal profile)',
    ],
  },
}

interface Props {
  connections: PlatformConnection[]
  successPlatform?: string
  errorMessage?: string
}

export default function SettingsClient({ connections, successPlatform, errorMessage }: Props) {
  const router = useRouter()
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null)
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null)
  const [expandedSetup, setExpandedSetup] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState({
    anthropic_api_key: '',
    youtube_api_key: '',
  })
  const [savingKeys, setSavingKeys] = useState(false)
  const [keysSaved, setKeysSaved] = useState(false)

  const connMap = Object.fromEntries(connections.map((c) => [c.platform, c]))

  async function handleConnect(platform: string) {
    setConnectingPlatform(platform)
    const res = await fetch(`/api/auth/${platform}`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json()
      alert(`Setup required: ${err.error}`)
      setConnectingPlatform(null)
      setExpandedSetup(platform)
      return
    }
    const { url } = await res.json()
    window.location.href = url
  }

  async function handleDisconnect(platform: string) {
    if (!confirm(`Disconnect ${PLATFORM_CONFIGS[platform]?.label}?`)) return
    setDisconnectingPlatform(platform)
    await fetch(`/api/auth/${platform}/disconnect`, { method: 'POST' })
    router.refresh()
    setDisconnectingPlatform(null)
  }

  async function handleSync(platform: string) {
    setSyncingPlatform(platform)
    const res = await fetch(`/api/platforms/${platform}/sync`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      alert(`Synced ${data.synced} items from ${PLATFORM_CONFIGS[platform]?.label}.`)
    } else {
      alert(data.error ?? 'Sync failed.')
    }
    router.refresh()
    setSyncingPlatform(null)
  }

  async function handleSaveKeys() {
    setSavingKeys(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiKeys),
    })
    setKeysSaved(true)
    setSavingKeys(false)
    setApiKeys({ anthropic_api_key: '', youtube_api_key: '' })
    setTimeout(() => setKeysSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Success/error messages */}
      {successPlatform && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 text-sm">
          ✓ {PLATFORM_CONFIGS[successPlatform]?.label ?? successPlatform} connected successfully!
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm">
          Connection failed: {errorMessage.replace(/_/g, ' ')}
        </div>
      )}

      {/* Platform Connections */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Connections</h2>
        <div className="space-y-4">
          {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => {
            const conn = connMap[platform]
            const connected = conn?.is_connected === 1

            return (
              <div key={platform} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center text-white text-sm`}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{config.label}</div>
                      <div className="text-sm text-gray-500">
                        {connected ? (conn?.account_name ?? 'Connected') : config.description}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {connected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {connected ? (
                      <>
                        <button
                          onClick={() => handleSync(platform)}
                          disabled={syncingPlatform === platform}
                          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          {syncingPlatform === platform ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button
                          onClick={() => handleDisconnect(platform)}
                          disabled={disconnectingPlatform === platform}
                          className="text-xs text-red-500 hover:text-red-700 px-2"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setExpandedSetup(expandedSetup === platform ? null : platform)}
                          className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                          Setup Guide
                        </button>
                        <button
                          onClick={() => handleConnect(platform)}
                          disabled={connectingPlatform === platform}
                          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {connectingPlatform === platform ? 'Redirecting...' : 'Connect'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Setup guide */}
                {expandedSetup === platform && !connected && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Setup Steps
                    </div>
                    <ol className="space-y-2">
                      {config.setupSteps.map((step, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2">
                          <span className="text-indigo-400 font-medium shrink-0">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <a
                      href={config.setupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-xs text-indigo-600 hover:underline"
                    >
                      Open {config.label} Developer Console →
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* API Keys */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Anthropic API Key
              <span className="text-xs text-gray-400 font-normal ml-2">Required for Sales Analyzer</span>
            </label>
            <input
              type="password"
              value={apiKeys.anthropic_api_key}
              onChange={(e) => setApiKeys((prev) => ({ ...prev, anthropic_api_key: e.target.value }))}
              placeholder="sk-ant-..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get your key at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">console.anthropic.com</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              YouTube API Key
              <span className="text-xs text-gray-400 font-normal ml-2">Required for competitor tracking</span>
            </label>
            <input
              type="password"
              value={apiKeys.youtube_api_key}
              onChange={(e) => setApiKeys((prev) => ({ ...prev, youtube_api_key: e.target.value }))}
              placeholder="AIza..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">From Google Cloud Console — same project as your YouTube OAuth credentials</p>
          </div>

          <button
            onClick={handleSaveKeys}
            disabled={savingKeys}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {keysSaved ? '✓ Saved' : savingKeys ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>
      </div>

      {/* .env.local instructions */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-2">Alternative: .env.local File</h3>
        <p className="text-sm text-gray-600 mb-3">
          You can also set credentials in a <code className="bg-gray-200 px-1 rounded text-xs">.env.local</code> file in the project root.
          Restart the dev server after editing.
        </p>
        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">{`# Google / YouTube
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
YOUTUBE_API_KEY=your_api_key

# Meta / Instagram / Facebook
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</pre>
      </div>
    </div>
  )
}
