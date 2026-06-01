# Content Factory

**AI 驱动的多平台内容创作与发布系统** —— 支持微信公众号、小红书、Twitter。

Content Factory 自动化内容生产全流程：从中文社交平台发现热点话题，用 AI 生成平台定制内容，再到单面板多渠道发布。

[English](./README.md) | **中文**

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [Next.js 16](https://nextjs.org)（App Router）|
| 语言 | TypeScript（严格模式）|
| UI | [React 19](https://react.dev)、[Tailwind CSS v4](https://tailwindcss.com)、[shadcn/ui](https://ui.shadcn.com)（base-nova 风格）|
| 数据库 | SQLite（[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)）|
| 图标 | [Lucide React](https://lucide.dev) |
| Markdown | [marked](https://marked.js.org)（内容解析与渲染）|

## 快速开始

### 环境要求

- Node.js 18+
- npm（或 yarn / pnpm / bun）

### 安装

```bash
git clone <repo-url>
cd content-factory-agent
npm install
```

### 环境变量配置

复制环境变量模板并填入你的 API 密钥：

```bash
cp .env.example .env
```

必填变量：

| 变量名 | 说明 |
|--------|------|
| `SILICONFLOW_API_KEY` | [SiliconFlow](https://cloud.siliconflow.cn/account/ak) API 密钥 —— 用于 AI 话题分析和内容生成 |
| `DAJIALA_API_KEY` | [大嘉拉](https://www.dajiala.com) API 密钥 —— 用于微信公众号文章采集 |
| `WECHAT_APPID` | 微信公众号 AppID —— 用于通过 wx.limyai.com 发布（也可在请求时单独传入）|
| `XHS_API_KEY` | 小红书 API 密钥 —— 用于小红书发布 |

可选变量详见 `.env.example`。

### 开发

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看控制面板。

### 其他命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 生产构建 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint |
| `npm test` | 运行测试（Vitest）|
| `npm run test:watch` | 监听模式运行测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |

## 项目结构

```
src/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx                  # 根布局（侧边栏 + Geist 字体）
│   ├── page.tsx                    # 控制面板首页
│   ├── topic-insight/
│   │   └── page.tsx                # 话题洞察页（搜索 + 结果 + 分析）
│   ├── content-create/
│   │   └── page.tsx                # 内容创作页（输入 + 生成 + 编辑器）
│   ├── publish/
│   │   └── page.tsx                # 快速发布页（微信 + 小红书）
│   └── api/
│       ├── topic/
│       │   └── analyze/
│       │       └── route.ts        # POST /api/topic/analyze — AI 话题分析
│       ├── content/
│       │   ├── generate/
│       │   │   └── route.ts        # POST /api/content/generate — AI 内容生成
│       │   └── list/
│       │       └── route.ts        # GET /api/content/list — 内容列表
│       └── publish/
│           ├── wechat/
│           │   └── route.ts        # POST /api/publish/wechat — 微信发布
│           ├── xhs/
│           │   └── route.ts        # POST /api/publish/xhs — 小红书发布
│           └── history/
│               └── route.ts        # GET /api/publish/history — 发布历史（分页）
├── components/
│   ├── sidebar.tsx                 # 侧边栏导航（客户端组件）
│   ├── topic/
│   │   ├── TopicAnalysisPanel.tsx  # AI 分析展示面板
│   │   ├── TopicResultsList.tsx    # 搜索结果列表
│   │   ├── TopicSearchBar.tsx      # 搜索输入框（含来源筛选）
│   │   └── types.ts                # 话题类型、接口、Mock 数据
│   ├── content/
│   │   └── MarkdownEditor.tsx      # Markdown 编辑器（@uiw/react-md-editor 封装）
│   └── ui/
│       ├── button.tsx              # shadcn/ui 按钮
│       ├── card.tsx                # shadcn/ui 卡片
│       └── loading-spinner.tsx     # 通用加载动画
└── lib/
    ├── ai.ts                       # SiliconFlow AI 封装（分析 + 生成）
    ├── api-clients.ts              # 大嘉拉微信文章采集客户端
    ├── db.ts                       # SQLite 连接、迁移、Schema
    ├── publish.ts                  # 平台发布客户端
    ├── utils.ts                    # Tailwind 合并工具（cn）
    ├── utils.test.ts               # cn() 工具函数单元测试
    └── __tests__/
        └── db.test.ts              # 数据库模块测试（迁移、Schema）
├── test/
│   └── setup.ts                    # Vitest 配置（jest-dom 匹配器）
└── __tests__/
    └── smoke.test.ts               # 基础冒烟测试
```

### 数据库 Schema

SQLite 数据库（`data/content-factory.db`）在首次运行时自动创建，包含以下表：

- **topics** — 采集的话题（来自微信、小红书或手动输入）
- **content_pieces** — AI 生成的内容片段（按平台分类，关联话题）
- **publish_history** — 发布记录（含平台返回信息追踪）
- **api_config** — API 密钥和端点配置（大嘉拉、小红书、SiliconFlow）

迁移通过 `src/lib/db.ts` 中的版本追踪系统自动执行。

## 路线图

Content Factory 正在积极开发中，当前进度：

- [x] 项目脚手架（Next.js + TypeScript + Tailwind + shadcn/ui）
- [x] 侧边栏导航（模块链接）
- [x] 控制面板（模块卡片 + 统计）
- [x] SQLite 数据库层（含迁移系统）
- [x] 话题洞察页 — 搜索、结果列表、AI 分析面板
- [x] SiliconFlow AI 集成 — 话题分析与内容生成
- [x] 内容创作模块 — AI 多平台内容生成
- [x] Markdown 编辑器
- [x] Vitest + React Testing Library 测试基础设施
- [x] 微信发布页及 API 集成（wx.limyai.com）
- [x] 发布状态追踪（SQLite 持久化）
- [x] 快速发布模块 — 小红书发布端点
- [x] 环境变量文档与 .env.example 对齐
- [ ] 小红书数据采集客户端
- [ ] 真实话题搜索 API 集成（当前为 Mock 驱动）
- [ ] 控制面板统计接入数据库
- [ ] 完整测试覆盖（lib、API 路由、组件）

## API 集成

| 服务 | 用途 | 状态 |
|------|------|------|
| [大嘉拉](https://www.dajiala.com) | 微信公众号文章采集 | ✅ 已实现 |
| [SiliconFlow](https://siliconflow.cn) | AI 模型（话题分析 + 内容生成）| ✅ 已实现 |
| [wx.limyai.com](https://wx.limyai.com) | 微信公众号发布 | ✅ 已实现 |
| 小红书 API | 小红书数据采集与发布 | 🔲 计划中 |

## 许可证

私有项目 — 禁止再分发。
