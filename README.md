# Content Factory

AI-powered content creation and publishing platform for WeChat, Xiaohongshu, and Twitter.

Content Factory automates the content production pipeline: discover trending topics from Chinese social platforms, generate platform-tailored content with AI, and publish across multiple channels from a single dashboard.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript (strict mode) |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) (base-nova style) |
| Database | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Icons | [Lucide React](https://lucide.dev) |

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

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with sidebar + Geist fonts
│   ├── page.tsx            # Dashboard home page
│   └── globals.css         # Tailwind + theme variables
├── components/
│   ├── sidebar.tsx         # Sidebar navigation (client component)
│   └── ui/
│       ├── button.tsx      # shadcn/ui Button
│       └── card.tsx        # shadcn/ui Card
└── lib/
    ├── db.ts               # SQLite connection, migrations, schema
    └── utils.ts            # Tailwind merge utility (cn)
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
- [ ] Topic Insight module — search, collect, and analyze trending topics
- [ ] Content Creation module — AI-powered multi-platform content generation
- [ ] Quick Publish module — one-click publishing to WeChat, Xiaohongshu, Twitter
- [ ] API integrations (dajiala.com, Xiaohongshu, SiliconFlow AI)
- [ ] Markdown editor for content editing

## API Integrations (Planned)

| Service | Purpose |
|---------|---------|
| [dajiala.com](https://www.dajiala.com) | WeChat article collection |
| Xiaohongshu API | Xiaohongshu data collection |
| [SiliconFlow](https://siliconflow.cn) | AI model for topic analysis and content generation |
| [wx.limyai.com](https://wx.limyai.com) | WeChat Official Account publishing |

## License

Private — not for redistribution.
