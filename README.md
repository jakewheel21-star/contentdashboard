# ContentIQ — Social Media Content Tracker

Track and analyze your content across YouTube, Instagram, and Facebook. Paste sales call transcripts to get AI-generated content ideas. Track competitors. All in one dashboard.

---

## Quick Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app starts in **Demo Mode** with sample data so you can explore everything immediately.

---

## Setup: Connect Your Accounts

### 1. YouTube

1. Go to [Google Cloud Console](https://console.cloud.google.com) → create/select a project
2. Enable **YouTube Data API v3**
3. Create **OAuth 2.0 credentials** → Web Application type
4. Add redirect URI: `http://localhost:3000/api/auth/youtube/callback`
5. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   YOUTUBE_API_KEY=your_api_key
   ```

### 2. Instagram + Facebook

Both use the same Meta app:

1. Go to [Meta for Developers](https://developers.facebook.com) → Create App (Consumer type)
2. Add **Instagram Graph API** and **Facebook Login** products
3. Add redirect URIs:
   - `http://localhost:3000/api/auth/instagram/callback`
   - `http://localhost:3000/api/auth/facebook/callback`
4. Add to `.env.local`:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   ```

> Instagram requires a **Business or Creator account** linked to a Facebook Page.

### 3. Anthropic API (Sales Analyzer)

1. Get a key at [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env.local` or paste it directly in **Settings → API Keys**:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

---

## Full `.env.local` Template

```bash
# Google / YouTube
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YOUTUBE_API_KEY=

# Meta / Instagram / Facebook
META_APP_ID=
META_APP_SECRET=

# Anthropic
ANTHROPIC_API_KEY=

# App URL (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart the dev server after editing `.env.local`.

---

## Features

| Section | What it does |
|---|---|
| **Dashboard** | KPI cards, follower counts, top-performing content across all platforms |
| **Analytics** | Per-platform charts — follower growth, engagement rate trends (30-day history) |
| **Content Library** | All posts/videos with filtering by platform, type, and sort by views or engagement |
| **Sales Analyzer** | Paste a sales call transcript → Claude AI generates platform-specific content ideas |
| **Competitor Hub** | Add competitor handles; YouTube competitors auto-sync public metrics |
| **Settings** | Connect accounts via OAuth, enter API keys |

---

## Database

Data is stored in `social_tracker.db` (SQLite) in the project root. No server needed.

The database is auto-created on first run. Demo data is seeded automatically when no accounts are connected.

To reset: delete `social_tracker.db` and restart the dev server.
