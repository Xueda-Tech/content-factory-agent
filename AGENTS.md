# 全域内容工厂 Agent - 开发指南

## 项目目标
构建一个完整的内容生产自动化系统，包含三大模块：
1. **选题洞察**：采集公众号+小红书数据，AI分析选题
2. **内容二创**：基于选题用AI生成多平台内容
3. **快速发布**：自动发布到公众号和小红书

## 技术栈
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- SQLite (better-sqlite3)
- 硅基流动 API (AI模型)

## 开发任务优先级

### P0 - 核心架构（立即开始）
1. 初始化 Next.js 项目 + TypeScript + Tailwind
2. 搭建 SQLite 数据库 + 基础表结构
3. 创建基础布局（侧边栏导航 + 主内容区）

### P1 - 选题洞察模块
1. 页面原型：搜索框 + 结果列表 + 分析面板
2. 公众号采集 API 对接（dajiala.com）
3. 小红书采集 API 对接
4. AI 选题分析功能

### P2 - 内容创作模块
1. 页面原型：输入面板 + 生成结果
2. 接入硅基流动 API
3. 多平台内容生成（公众号/小红书/Twitter）
4. Markdown 编辑器

### P3 - 快速发布模块
1. 公众号发布 API 对接（wx.limyai.com）
2. 小红书发布 API 对接
3. 发布状态追踪

## 关键 API 文档

### 公众号发布 API
```
POST https://wx.limyai.com/api/openapi/wechat-accounts
Header: X-API-Key: your-key

POST https://wx.limyai.com/api/openapi/wechat-publish
Header: X-API-Key: your-key
Body: { wechatAppid, title, content, contentFormat, articleType }
```

### AI 模型 API（硅基流动）
```
POST https://api.siliconflow.cn/v1/chat/completions
Header: Authorization: Bearer your-key
Body: { model, messages, stream }
```

## 代码规范
- 使用 TypeScript 严格模式
- 组件使用 React Server Components 优先
- API Routes 处理后端逻辑
- 所有异步操作需要 loading/error 状态
- 环境变量存储 API Keys

## 项目结构
```
app/
├── page.tsx              # 首页/仪表盘
├── layout.tsx            # 根布局
├── topic-insight/        # 选题洞察
├── content-create/       # 内容创作
├── publish/              # 快速发布
└── api/                  # API路由
components/               # 共享组件
lib/
├── db.ts                 # SQLite
├── ai.ts                 # AI集成
└── api-clients.ts        # 第三方API
```

## 立即开始
先创建 Next.js 项目，然后实现基础布局和数据库。
