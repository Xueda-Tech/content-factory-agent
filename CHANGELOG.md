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
