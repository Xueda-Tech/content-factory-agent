# Changelog

All notable changes to Content Factory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Next.js 16 project scaffold with TypeScript (strict mode) and App Router.
- Tailwind CSS v4 with PostCSS integration.
- shadcn/ui design system (base-nova style) with Button and Card components.
- Sidebar navigation component with links to Dashboard, Topic Insight, Content Creation, Quick Publish, and Settings. Active-route highlighting via `usePathname()`.
- Root layout with Geist font family (sans + mono), sidebar + main content area shell.
- Dashboard home page (`/`) with:
  - Module quick-access cards (Topic Insight, Content Creation, Quick Publish).
  - Stats row (Topics Collected, Content Pieces, Published) — currently hardcoded to zero.
  - Recent Activity placeholder section.
- SQLite database layer (`src/lib/db.ts`) with:
  - Singleton connection via better-sqlite3, WAL mode, foreign keys enabled.
  - Version-tracked migration system.
  - Tables: `topics`, `content_pieces`, `publish_history`, `api_config`, `schema_version`.
- Lucide React icon library integration.
- `marked` markdown parsing library (v18) — foundation for content rendering.
- ESLint configuration with Next.js core-web-vitals and TypeScript rules.
- Topic Insight page (`/topic-insight`) with search bar, results list, and AI analysis panel. Source filtering by platform (WeChat, Xiaohongshu, manual). Mock data for development.
- Topic Insight UI components: `TopicSearchBar`, `TopicResultsList`, `TopicAnalysisPanel`.
- Topic types and interfaces (`src/components/topic/types.ts`) with mock data for development.
- SiliconFlow AI wrapper (`src/lib/ai.ts`) with:
  - `analyzeTopic()` — structured topic analysis via SiliconFlow chat completions.
  - `generateContent()` — platform-tailored content generation for WeChat, Xiaohongshu, and Twitter.
  - Automatic retry with exponential backoff, timeout handling, and JSON response validation.
  - Custom error hierarchy: `AIError`, `AIAPIError`, `AIResponseError`, `AIRequestError`.
- POST `/api/topic/analyze` route handler — accepts collected content, returns structured AI topic analysis via SiliconFlow.
- POST `/api/content/generate` route handler — accepts topic + platform + optional generation params, returns AI-generated content.
- dajiala.com WeChat article collection client (`src/lib/api-clients.ts`) with:
  - `searchArticles()` — keyword and account-based search with pagination and date filtering.
  - `getArticleContent()` — full article retrieval by URL.
  - Rate limiter (max 2 req/s), automatic retry with exponential backoff, timeout handling.
  - Custom error hierarchy: `CollectionError`, `CollectionAPIError`.
- Shared UI components:
  - `LoadingSpinner` — configurable SVG spinner with size variants (sm/default/lg) and optional label.
- `.env.example` — documents all required and optional environment variables with descriptions and links.
- Content Creation page (`/content-create`) with topic input panel, content type selector (WeChat / Xiaohongshu / Twitter), generation button, and output display area.
- Vitest + React Testing Library test infrastructure with jsdom environment, setup file, and smoke tests.
- Quick Publish page (`/publish`) with:
  - Content selector dropdown, platform toggle (WeChat / Xiaohongshu), publish button, and result status card.
  - Publish history placeholder section.
- POST `/api/publish/wechat` route handler — validates input, logs to `publish_history` table, calls `publishToWeChat`, returns structured JSON with external ID and URL.
- wx.limyai.com WeChat publish client (`src/lib/api-clients.ts`) with:
  - `publishToWeChat()` — article publishing with configurable appid, title, content, format, and article type.
  - Timeout handling and structured error responses.
  - Custom error hierarchy: `PublishError`, `PublishAPIError`.

### Changed

- Nothing yet — this is the initial project state.

### Deprecated

- Nothing yet.

### Removed

- Nothing yet.

### Fixed

- Nothing yet.

### Security

- Nothing yet.
