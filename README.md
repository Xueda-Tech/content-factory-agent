# Content Factory

AI-powered content creation and publishing platform for WeChat, Xiaohongshu, and Twitter.

Content Factory automates the content production pipeline: discover trending topics from Chinese social platforms, generate platform-tailored content with AI, and publish across multiple channels from a single dashboard.

**English** | [中文](./README.zh-CN.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript (strict mode) |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (base-nova style) |
| Database | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Icons | [Lucide React](https://lucide.dev) |
| Markdown | [marked](https://marked.js.org) (content parsing & rendering) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm / bun)

### Installation

```bash
git clone <repo-url>
cd content-factory-agent
npm install
```

### Environment Setup

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `SILICONFLOW_API_KEY` | API key for [SiliconFlow](https://cloud.siliconflow.cn/account/ak) — used for AI topic analysis and content generation |
| `DAJIALA_API_KEY` | API key for [dajiala.com](https://www.dajiala.com) — used for WeChat article collection |
| `WECHAT_APPID` | WeChat Official Account AppID — used for publishing via wx.limyai.com (can also be passed per-request) |
| `XHS_API_KEY` | Xiaohongshu API key — used for publishing to Xiaohongshu |

Optional variables are documented in `.env.example`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Other Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx                  # Root layout with sidebar + Geist fonts
│   ├── page.tsx                    # Dashboard home page
│   ├── topic-insight/
│   │   └── page.tsx                # Topic Insight page (search + results + analysis)
│   ├── content-create/
│   │   └── page.tsx                # Content Creation page (input + generation + editor)
│   ├── publish/
│   │   └── page.tsx                # Quick Publish page (WeChat + Xiaohongshu)
│   └── api/
│       ├── topic/
│       │   └── analyze/
│       │       └── route.ts        # POST /api/topic/analyze — AI topic analysis
│       ├── content/
│       │   ├── generate/
│       │   │   └── route.ts        # POST /api/content/generate — AI content generation
│       │   └── list/
│       │       └── route.ts        # GET /api/content/list — list all content pieces
│       └── publish/
│           ├── wechat/
│           │   └── route.ts        # POST /api/publish/wechat — WeChat publishing
│           ├── xhs/
│           │   └── route.ts        # POST /api/publish/xhs — Xiaohongshu publishing
│           └── history/
│               └── route.ts        # GET /api/publish/history — publish history with pagination
├── components/
│   ├── sidebar.tsx                 # Sidebar navigation (client component)
│   ├── topic/
│   │   ├── TopicAnalysisPanel.tsx  # AI analysis display panel
│   │   ├── TopicResultsList.tsx    # Search results list
│   │   ├── TopicSearchBar.tsx      # Search input with source filter
│   │   └── types.ts                # Topic types, interfaces, mock data
│   ├── content/
│   │   └── MarkdownEditor.tsx      # Markdown editor (@uiw/react-md-editor wrapper)
│   └── ui/
│       ├── button.tsx              # shadcn/ui Button
│       ├── card.tsx                # shadcn/ui Card
│       └── loading-spinner.tsx     # Reusable loading spinner
└── lib/
    ├── ai.ts                       # SiliconFlow AI wrapper (analyze + generate)
    ├── api-clients.ts              # dajiala.com WeChat article collection client
    ├── db.ts                       # SQLite connection, migrations, schema
    ├── publish.ts                  # Platform publishing clients
    ├── utils.ts                    # Tailwind merge utility (cn)
    ├── utils.test.ts               # Unit tests for cn() utility
    └── __tests__/
        └── db.test.ts              # Database module tests (migrations, schema)
├── test/
│   └── setup.ts                    # Vitest setup (jest-dom matchers)
└── __tests__/
    └── smoke.test.ts               # Smoke test for test infrastructure
```

### Database Schema

The SQLite database (`data/content-factory.db`) is auto-created on first run with these tables:

- **topics** — Collected topics from WeChat, Xiaohongshu, or manual entry
- **content_pieces** — AI-generated content pieces tied to topics, per platform
- **publish_history** — Publishing events with platform response tracking
- **api_config** — API keys and endpoint configuration (dajiala, xiaohongshu, siliconflow)

Migrations run automatically via a version-tracked migration system in `src/lib/db.ts`.

## Roadmap

Content Factory is under active development. Current status:

- [x] Project scaffold (Next.js + TypeScript + Tailwind + shadcn/ui)
- [x] Sidebar navigation with module links
- [x] Dashboard page with module cards and stats
- [x] SQLite database layer with migration system
- [x] Topic Insight page — search, results list, and AI analysis panel
- [x] SiliconFlow AI integration — topic analysis and content generation
- [x] Content Creation module — AI-powered multi-platform content generation
- [x] Markdown editor for content editing
- [x] Vitest + React Testing Library test infrastructure
- [x] WeChat publish page and API integration (wx.limyai.com)
- [x] Publish status tracking with SQLite persistence
- [x] Quick Publish module — Xiaohongshu publishing endpoint
- [x] Environment setup documentation and .env.example alignment
- [ ] Xiaohongshu data collection client
- [ ] Real topic search API integration (currently mock-driven)
- [ ] Dashboard stats wired to database
- [ ] Comprehensive test coverage for lib, API routes, and components

## API Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| [dajiala.com](https://www.dajiala.com) | WeChat article collection | ✅ Implemented |
| [SiliconFlow](https://siliconflow.cn) | AI model for topic analysis and content generation | ✅ Implemented |
| [wx.limyai.com](https://wx.limyai.com) | WeChat Official Account publishing | ✅ Implemented |
| Xiaohongshu API | Xiaohongshu data collection and publishing | 🔲 Planned |

## License

Private — not for redistribution.
