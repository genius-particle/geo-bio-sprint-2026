# Architecture — 地生冲刺

> 更新: 2026-05-31 | 文件: 30+

## 系统架构

```
┌─────────────────────────────────────────┐
│     手机浏览器 (http://LAN_IP:3000)       │
│  React 19 SPA + Tailwind CSS (CDN)      │
├─────────────────────────────────────────┤
│     Vite Dev Server (port 3000)          │
│  ├── Serves React SPA (src/)            │
│  └── /api/* → configureServer 中间件      │
├─────────────────────────────────────────┤
│     API Routes (server/routes/)          │
│  ├── questions.ts → 题目 CRUD + 图片      │
│  ├── mistakes.ts  → 错题 CRUD            │
│  ├── knowledge.ts → Wiki 读写 + 搜索     │
│  └── practice.ts  → 练习 CRUD            │
├─────────────────────────────────────────┤
│     Wiki Engine (server/utils/wiki/)     │
│  ├── storage.ts   → 文件 I/O + frontmatter │
│  ├── ingest.ts    → 知识摄入 + 追加合并    │
│  ├── query.ts     → CJK 分词 + 加权搜索    │
│  └── lint.ts      → 健康检查             │
├─────────────────────────────────────────┤
│     Infrastructure (server/utils/)       │
│  ├── atomic-write.ts → temp+rename+fsync │
│  ├── file-lock.ts    → O_EXCL + PID 检测  │
│  └── fileStore.ts    → JSON 文件读写      │
├─────────────────────────────────────────┤
│     Local Filesystem (data/)             │
│  ├── questions/{id}/ → image.jpg + meta.json │
│  ├── mistakes/{id}.json                  │
│  ├── wiki/*.md → YAML frontmatter + Markdown │
│  ├── practice/{id}.json                  │
│  └── chapters.json                       │
└─────────────────────────────────────────┘

     Claude Code (电脑端)
  ┌────────────────────────┐
  │ /analyze → OCR + 解析   │──→ data/questions/*/meta.json
  │ /search-courses → 视频  │──→ data/wiki/*.md
  │ /generate-practice → 题目│──→ data/practice/*.json
  │ /review → 复习错题      │──→ data/mistakes/*.json
  │ /import-knowledge → 初始化│──→ data/wiki/*.md
  │ /stats → 统计报告       │──→ data/reports/
  └────────────────────────┘
```

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 后端 | Vite configureServer 中间件 | 单服务器，无独立后端依赖 |
| 存储 | 本地文件系统 (JSON + Markdown) | 个人工具，无需数据库 |
| AI | Claude Code 技能 (SKILL.md) | Web 端零 AI，所有 AI 走终端 |
| Wiki | oh-my-claudecode 移植 | 追加策略 + CJK 搜索 + 原子写入 |
| 图片 | Canvas 压缩 (1200px/0.7) + EXIF 旋转 | A4 基准，减少存储 |

## 依赖

| 包 | 版本 | 用途 |
|----|------|------|
| react | 19 | UI 框架 |
| vite | 6 | 构建 + API 中间件 |
| lucide-react | 0.561 | 图标 |
| react-markdown | 10 | Markdown 渲染 |
| remark-gfm | 4 | GFM 表格/删除线 |

无外部云服务依赖。

## 钩子系统

```
SessionStart
  ├── 检测 pending 分析题目 → 提示运行 /analyze
  └── wiki-session-start.mjs → wiki 状态同步
SessionEnd
  └── wiki-session-end.mjs → wiki 状态持久化
PreCompact
  └── wiki-pre-compact.mjs → 压缩前保存 wiki 摘要
```

## 目录结构

```
geo-bio-sprint-2026/
├── src/                      # 前端源码
│   ├── components/           # 6 个页面组件 + 3 个通用组件
│   ├── services/api.ts       # 前端 API 调用层
│   ├── data/chapters.ts      # 章节常量
│   ├── types.ts              # 全局类型定义
│   ├── App.tsx               # 入口 + 路由 + EXIF 处理
│   └── main.tsx              # React 挂载
├── server/                   # 后端源码
│   ├── index.ts              # 路由注册 + data 目录初始化
│   ├── routes/               # 4 个路由文件
│   └── utils/                # 基础设施 + wiki 引擎
├── scripts/                  # 钩子脚本 (wiki session 管理)
├── data/                     # 运行时数据 (gitignored)
│   ├── questions/{id}/       # meta.json + image.jpg
│   ├── mistakes/{id}.json
│   ├── wiki/*.md             # index.md + log.md + 知识页面
│   ├── practice/{id}.json
│   └── reports/
└── .claude/                  # Claude Code 配置 + 技能
```
