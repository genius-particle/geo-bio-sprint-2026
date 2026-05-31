# 地生会考冲刺应用 (geo-bio-sprint-2026) 实施计划

> ⚠️ **历史文档** — 这是项目初期的设计计划，部分内容已过时（如提到 Hono、server.ts 等未采用的方案）。
> 当前架构以 `docs/CODEMAPS/` 为准。

## Context

为初中八年级地生会考准备的局域网学习工具。
1. **拍照录入错题** — 手机/平板通过局域网访问 Web，拍照后框选题目区域
2. **错题管理** — 按地理/生物学科分类，存储在本地文件系统
3. **知识库** — Claude 技能生成知识点解析 + 搜索社交媒体课程视频
4. **练习出题** — Claude 技能根据错题生成类似练习题

**核心架构决策**：
- **个人工具**，不追求产品级闭环，能用就行
- 不使用外部云服务（Supabase、Gemini 等），纯本地化
- 数据以文件形式存储（JSON + 图片），无需数据库
- 独立轻量后端提供 API，手机/平板通过局域网访问
- **所有 AI 能力走 Claude Code 技能**（OCR、分析、出题、搜索），Web 端零 AI
- Web 端保存后仅提示「已保存，待电脑端分析」，不做实时推送
- 纯移动端体验（手机/平板），不做 PC 端适配

---

## 技术方案

**基于 speed-learning 改造**（`/Users/ewinds/App/speed-learning`），大幅简化架构。

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | React 19 + TypeScript + Vite 6 | 移动端优先，从 speed-learning 复用 |
| 后端 | Vite configureServer 中间件 | 单服务器，`/api/*` 路由直接处理文件读写，无需独立后端 |
| 存储 | 本地文件系统 | 题目/错题用 JSON，知识库用 Markdown+YAML frontmatter |
| 认证 | 无 | 局域网内使用，无需登录 |
| AI | Claude Code 技能 | 终端运行脚本，直接操作本地文件 |
| 知识库 | 参考 oh-my-claudecode Wiki | Markdown 页面 + YAML 元数据 + CJK 搜索 + 追加策略 |

**架构**：`npm run dev` 启动一个 Vite 服务器（host: 0.0.0.0），前端 HMR 和 API 路由在同一个进程内。

**移除的依赖**：`@google/genai`、`@supabase/supabase-js`、`mafs`、`remark-math`、`rehype-katex`
**不需要的依赖**：`hono`、`@hono/node-server`（改用 Vite 内置中间件）

---

## 数据存储设计（纯文件，无数据库）

### 存储结构
```
data/
  questions/                          # 所有录入的题目（JSON + 图片）
    2026-05-31_14-30-22/             # 以时间戳为 ID
      image.jpg                      # 裁剪后的题目图片
      meta.json                      # 题目元数据
    2026-05-31_15-12-08/
      image.jpg
      meta.json
  mistakes/                           # 错题标记（JSON 引用）
    2026-05-31_14-30-22.json         # 引用 question + 错误原因 + 复习状态
  wiki/                               # 知识库（参考 oh-my-claudecode Wiki）
    index.md                          # 自动维护的知识点目录
    log.md                            # 操作日志
    geography-中国的自然资源.md        # 知识点 Markdown 页面
    geography-中国的自然环境.md
    biology-生物圈中的绿色植物.md
    ...                               # 每个知识点一个 .md 文件
  practice/                           # 练习题（JSON）
    2026-06-01_10-00-00.json          # 一次练习会话（多道题）
```

### meta.json 结构（题目元数据）
```json
{
  "id": "2026-05-31_14-30-22",
  "subject": "geography",
  "chapter": "中国的自然资源",
  "knowledge_points": [],
  "difficulty": "unknown",
  "question_type": "unknown",
  "ocr_text": "",
  "source": "试卷",
  "source_detail": "2026年济南地生模拟卷",
  "tags": [],
  "is_mistake": true,
  "analysis_status": "pending",
  "notes": "",
  "created_at": "2026-05-31T14:30:22+08:00"
}
```

**说明**：`ocr_text`、`question_type`、`difficulty`、`knowledge_points` 在手机端录入时为空/pending，由 Claude Code `/analyze` 技能填充。

### mistake JSON 结构（错题记录）
```json
{
  "question_id": "2026-05-31_14-30-22",
  "wrong_answer": "B",
  "correct_answer": "A",
  "mistake_type": "knowledge_gap",
  "review_count": 0,
  "last_reviewed_at": null,
  "next_review_at": "2026-06-02T14:30:22+08:00",
  "is_mastered": false,
  "user_notes": "水资源南北分布记反了"
}
```

### 知识库 Wiki 页面格式（参考 oh-my-claudecode）
每个知识点是一个 Markdown 文件，带 YAML frontmatter：

```markdown
---
title: "中国的自然资源"
tags: ["自然资源", "水资源", "土地资源", "南水北调"]
created: "2026-05-31T14:30:22+08:00"
updated: "2026-05-31T14:30:22+08:00"
subject: "geography"
chapter: "中国的自然资源"
confidence: "high"
links: ["geography-中国的自然环境.md", "geography-中国的经济发展.md"]
---

# 中国的自然资源

## 知识要点
- 我国自然资源总量大、人均少
- 水资源：南多北少、夏秋多冬春少
- 土地资源：耕地少、难利用土地多

## 易考点
- 南水北调工程路线（东线、中线、西线）
- 节约资源的意义和措施

## 助记口诀
南方水多北方少，跨流域调水解烦恼

## 相关课程
- [B站: 八年级地理-中国的自然资源](https://www.bilibili.com/video/xxx)
- [小红书: 地生会考自然资源专题](https://www.xiaohongshu.com/xxx)
```

**参考 oh-my-claudecode 的核心模式**：
- **YAML frontmatter** — 元数据（tags、confidence、links 等）
- **追加策略** — Claude 分析新内容时追加到已有页面，不覆盖
- **Wiki 链接** — `[[中国的自然环境]]` 语法关联相关知识点
- **自动索引** — `index.md` 自动生成知识点目录
- **CJK 搜索** — 中文字符级 + 二元组分词，适配中文知识点检索
- 来源：`/Users/ewinds/App/oh-my-claudecode/src/hooks/wiki/`

---

## 项目结构

```
geo-bio-sprint-2026/
├── server.ts                    # Hono API 服务器（~100行）
├── vite.config.ts               # Vite 配置（代理 API）
├── package.json                 # 精简依赖
├── tsconfig.json
├── index.html
│
├── src/                         # 前端代码
│   ├── App.tsx                  # 主路由（简化版）
│   ├── types.ts                 # 数据类型定义
│   ├── main.tsx                 # 入口
│   ├── components/
│   │   ├── ImageCropper.tsx     # 保留：图片裁剪（来自 speed-learning）
│   │   ├── DashboardView.tsx    # 重写：移动端首页
│   │   ├── QuestionCaptureView.tsx  # 新建：拍照录入流程
│   │   ├── QuestionDetailView.tsx   # 新建：题目详情 + 分析
│   │   ├── MistakeBookView.tsx      # 改造：错题本
│   │   ├── KnowledgeBaseView.tsx    # 新建：知识库浏览
│   │   ├── PracticeView.tsx         # 新建：练习模式
│   │   ├── MarkdownRenderer.tsx     # 保留：Markdown 渲染
│   │   └── Common.tsx               # 保留：通用组件
│   ├── services/
│   │   └── api.ts               # 新建：前端 API 调用层
│   └── data/
│       ├── chapters.ts          # 预置章节列表（地理/生物）
│       └── constants.ts         # 常量定义
│
├── server/                      # 后端代码
│   ├── index.ts                 # Hono 应用入口
│   ├── routes/
│   │   ├── questions.ts         # 题目 CRUD API
│   │   ├── mistakes.ts          # 错题 API
│   │   ├── knowledge.ts         # 知识库 API（Wiki 读写）
│   │   └── practice.ts          # 练习 API
│   └── utils/
│       ├── fileStore.ts         # JSON 文件读写工具
│       ├── wiki.ts              # Wiki 工具（frontmatter 解析/序列化，参考 oh-my-claudecode）
│       └── search.ts            # CJK 分词搜索（参考 oh-my-claudecode）
│
├── .claude/                     # Claude Code 配置
│   ├── settings.json            # 钩子配置（SessionStart 提示 pending 题目）
│   └── skills/
│       ├── analyze/SKILL.md     # /analyze 技能：分析错题生成解析
│       ├── search-courses/SKILL.md  # /search-courses 技能：搜索课程视频
│       ├── generate-practice/SKILL.md  # /generate-practice 技能：生成练习题
│       ├── review/SKILL.md      # /review 技能：间隔复习错题
│       ├── import-knowledge/SKILL.md  # /import-knowledge 技能：批量导入知识点
│       └── stats/SKILL.md       # /stats 技能：学习统计报告
│
├── CLAUDE.md                    # 项目指令（数据结构说明、可用技能、规则）
│
├── data/                        # 数据目录（gitignore 图片）
│   ├── questions/               # 题目（图片 + JSON）
│   ├── mistakes/                # 错题记录（JSON）
│   ├── wiki/                    # 知识库（Markdown + YAML frontmatter）
│   │   ├── index.md             # 自动维护的知识点目录
│   │   ├── log.md               # 操作日志
│   │   └── *.md                 # 知识点页面
│   ├── practice/                # 练习题会话（JSON）
│   ├── chapters.json            # 预置章节+知识点结构
│   └── reports/                 # 学习报告
│
└── scripts/                     # Claude Code 技能脚本
    ├── analyze-question.ts      # 分析题目生成解析
    ├── generate-practice.ts     # 生成练习题
    ├── search-courses.ts        # 搜索课程视频
    └── import-knowledge.ts      # 批量导入知识点
```

---

## Phase 1: 项目初始化

**目标**：搭建项目骨架，可运行的最小结构

### 1.1 初始化项目
- 从 speed-learning 复制基础文件：`index.html`、`vite.config.ts`、`tsconfig.json`
- 创建 `package.json`，精简依赖（移除 genai、supabase、mafs、katex）
- 不需要 hono 或额外后端依赖
- 安装依赖，确保 `npm run dev` 可启动

### 1.2 创建 API 中间件（Vite configureServer）
- 在 `vite.config.ts` 中使用 `configureServer` 钩子注册 `/api/*` 路由
- API 处理逻辑写在 `server/` 目录中，vite.config.ts 只负责挂载
- 单服务器架构：`host: '0.0.0.0'` 支持局域网访问
- `server/utils/fileStore.ts`：JSON 文件读写工具
  - `readJson(path)` / `writeJson(path, data)`
  - `listDirs(path)` / `readDir(path)`
  - `writeImage(path, buffer)`

### 1.3 创建数据目录
- `data/` 目录结构（questions、mistakes、knowledge、practice）
- `data/knowledge/index.json`：知识点索引骨架
- `.gitignore`：忽略 `data/questions/*/image.jpg`

### 1.4 重写 `types.ts`
- 移除所有数学类型和 Supabase 类型
- 新增：`Subject`、`Question`、`MistakeRecord`、`KnowledgeEntry`、`PracticeQuestion`、`CourseLink`
- 新增 `ViewMode` 联合类型

---

## Phase 2: API 路由

**目标**：完成 Vite 中间件 CRUD API（单服务器）

### 2.1 `server/routes/questions.ts`
- `GET /api/questions` — 列表（支持 subject/chapter/status 筛选）
- `GET /api/questions/:id` — 详情
- `POST /api/questions` — 新增（multipart: 图片 + JSON 元数据）
- `PUT /api/questions/:id` — 更新元数据
- `DELETE /api/questions/:id` — 删除
- `GET /api/questions/:id/image` — 获取图片

### 2.2 `server/routes/mistakes.ts`
- `GET /api/mistakes` — 列表（支持筛选）
- `POST /api/mistakes` — 标记为错题
- `PUT /api/mistakes/:id` — 更新复习状态
- `DELETE /api/mistakes/:id` — 移出错题本

### 2.3 `server/routes/knowledge.ts`（参考 oh-my-claudecode Wiki）
- `GET /api/knowledge` — 知识点列表（解析 wiki/ 目录所有 .md 的 frontmatter）
- `GET /api/knowledge/:slug` — 单个知识点详情（读取 Markdown + 解析 frontmatter）
- `POST /api/knowledge` — 新增知识点（创建 .md 文件，追加策略）
- `GET /api/knowledge/search?q=关键词` — 搜索（CJK 分词 + tag 匹配）
- 前端 Markdown 渲染使用 MarkdownRenderer

**复用 oh-my-claudecode 的关键模块**（简化移植）：
- frontmatter 解析/序列化 → 参考 `wiki/storage.ts` 的 `parseFrontmatter` / `serializePage`
- CJK 分词搜索 → 参考 `wiki/query.ts` 的 `tokenize` 函数
- 追加式合并 → 参考 `wiki/ingest.ts` 的 `mergePage` 逻辑
- 索引维护 → 参考 `wiki/storage.ts` 的 `updateIndexUnsafe`

### 2.4 `server/routes/practice.ts`
- `GET /api/practice` — 练习题列表
- `POST /api/practice` — 新增练习会话
- `PUT /api/practice/:id` — 更新作答结果

---

## Phase 3: 前端核心（移动端优先）

**目标**：手机端完整的拍照录入流程

### 3.1 重写 `App.tsx`
- **移除**：所有 AI chat 状态、Gemini 调用、Supabase 引用、认证逻辑
- **新增**：底部 Tab 导航（拍照录入、错题本、知识库、练习）
- **保留**：ImageCropper 逻辑（拍照 → 裁剪）
- ViewMode：`home | capture | detail | mistakes | knowledge | practice`

### 3.2 新建 `DashboardView.tsx`（移动端首页）
- 大号「📸 拍照录入」按钮（主 CTA）
- 统计卡片：待复习/已掌握/总题数
- 最近录入的题目列表（缩略图 + 学科标签）
- 无需登录、无聊天界面

### 3.3 新建 `QuestionCaptureView.tsx`（核心流程）
- 步骤 1：拍照/选图 → ImageCropper 裁剪
- 步骤 2：表单填写
  - 学科选择（地理/生物）
  - 章节下拉（预置列表）
  - 难度选择
  - 文字输入（手动键入题目文字）
  - 备注
- 步骤 3：保存 → `POST /api/questions` → 显示「✅ 已保存，待电脑端分析」→ 返回首页
- 可勾选「同时加入错题本」

### 3.4 新建 `QuestionDetailView.tsx`
- 展示题目图片（可缩放）
- 展示 OCR 文字
- 展示分析状态：pending → 灰色标签 / analyzed → 显示解析内容
- 加入/移出错题本按钮
- 从 PhotoAgentView 提取图片查看器复用

### 3.5 `services/api.ts`（前端 API 层）
- 封装所有 `fetch('/api/...')` 调用
- 图片上传使用 FormData
- 简单的错误处理

---

## Phase 4: 知识库 & 练习 & 错题本 UI

### 4.1 改造 `MistakeBookView.tsx`
- 学科 Tab：地理 / 生物
- 子筛选：攻克中 / 已掌握
- 卡片列表：题目图片缩略图 + 章节 + 知识点标签
- 间隔复习指示（到期的题目高亮）
- 点击进入详情

### 4.2 新建 `KnowledgeBaseView.tsx`
- 学科切换
- 章节列表（手风琴展开）
- 知识点卡片：Markdown 渲染解析内容
- 课程链接列表（B站/小红书卡片样式）
- 搜索功能

### 4.3 新建 `PracticeView.tsx`
- 选择学科/章节 → 开始
- 单题卡片：题目文字/图片 + 选项
- 作答后即时反馈（正确/错误 + 解析）
- 练习结束：统计总结

### 4.4 底部 Tab 导航
- 📷 拍照录入
- 📋 错题本
- 📚 知识库
- ✏️ 练习
- 移动端固定底部，不使用侧边栏

---

## 完整使用链路

```
┌─────────────────────────────────────────────────────────────────────┐
│                        手机端（局域网访问）                           │
│                                                                     │
│  📷 拍照录入 → ✂️ 裁剪框选 → 📝 填表(学科/章节/难度) → 💾 保存      │
│                                                                     │
│  ──────────── 保存到电脑项目目录 data/questions/ ──────────────      │
│                                                                     │
│  📋 错题本        📚 知识库         ✏️ 练习                          │
│  (查看/复习)      (查看解析)       (答题)                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ 文件系统
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    电脑端（Claude Code 技能）                         │
│                                                                     │
│  /analyze          → 读取题目图片 → 生成解析 → 写回文件 + 创建Wiki页 │
│  /search-courses   → 读取知识点 → 搜索B站/小红书 → 追加到Wiki页面   │
│  /generate-practice → 读取错题 → 生成练习题 → 写入practice/         │
│  /review           → 读取到期错题 → 展示复习 → 更新复习状态         │
│  /import-knowledge → 批量导入知识点 → 生成Wiki页面                  │
│  /stats            → 汇总学习数据 → 生成报告                        │
└─────────────────────────────────────────────────────────────────────┘
```

**用户日常流程**：
1. **手机录入**：拍照 → 裁剪 → 选学科/章节 → 保存（10秒/题）
2. **电脑分析**：打开 Claude Code → `/analyze` → 所有题目自动解析（批量）
3. **搜索课程**：`/search-courses` → 自动搜索并补充课程链接
4. **生成练习**：`/generate-practice` → 基于错题自动出题
5. **手机复习**：刷新页面 → 看解析/做题/复习错题

---

## Phase 5: Claude Code 技能（SKILL.md）

所有技能文件放在项目 `.claude/skills/` 目录下，作为 Claude Code 的自定义技能。

### 5.1 `/analyze` — OCR + 分析错题（一步到位）

**文件**：`.claude/skills/analyze/SKILL.md`

**触发条件**：用户说「分析题目」「解析错题」「处理 pending 题目」

**工作流**：
1. 扫描 `data/questions/` 中所有 `meta.json`
2. 筛选 `analysis_status === "pending"` 的题目
3. 对每道题目：
   a. 读取 `image.jpg`（Claude 直接看图片）
   b. **OCR 识别**：从图片中提取题目文字，写入 `meta.json.ocr_text`
   c. **题型识别**：判断题型（选择题/填空题/读图题/判断题/简答题），写入 `meta.json.question_type`
   d. 按题型走分析流程：
      - **选择题**：识别选项 → 判断正确答案 → 逐项解析
      - **填空题**：识别空位 → 给出正确答案 → 解释原理
      - **读图题**：描述图片内容 → 分析地理/生物要素 → 解答
      - **判断题**：判断对错 → 给出依据
      - **简答题**：给出参考答案 → 解析思路
   e. 生成结构化分析写入 `meta.json.analysis`：
      - `answer`：正确答案
      - `explanation`：详细解析（面向初中生，通俗易懂）
      - `key_concept`：核心知识点
      - `common_mistakes`：常见错误（2-3条）
      - `related_topics`：相关知识点
   f. 更新 `meta.json`：`analysis_status = "analyzed"`、`knowledge_points`、`difficulty`
   g. 如果对应知识点在 `data/wiki/` 中不存在，创建 Wiki 页面
4. 汇报：分析了 X 道题目，新增 Y 个知识点页面

**学科特定要求**：
- **地理**：注重读图能力、空间思维、因果关系
- **生物**：注重概念理解、结构功能关系、实验思维
- 解析语言通俗，适合八年级学生理解
- 不使用 Tesseract.js 或任何前端 OCR，全部由 Claude 视觉能力完成

### 5.2 `/search-courses` — 搜索社交媒体课程

**文件**：`.claude/skills/search-courses/SKILL.md`

**触发条件**：用户说「搜索课程」「找视频」「补充课程链接」

**工作流**：
1. 读取 `data/wiki/` 中所有 `.md` 文件的 frontmatter
2. 对每个知识点（可指定学科/章节筛选）：
   a. 提取 `title` 和 `tags`
   b. 构建搜索关键词：`"八年级{地理/生物}" + 知识点名称 + "会考/复习/讲解"`
   c. 使用 web_search 搜索 B站（bilibili.com）和小红书（xiaohongshu.com）
   d. 筛选结果：优先选择播放量高、时长适中（5-20分钟）的教学视频
   e. 将课程链接追加到 Wiki 页面的 `## 相关课程` 部分（追加策略，不覆盖）
3. 汇报：为 X 个知识点补充了 Y 个课程链接

### 5.3 `/generate-practice` — 生成练习题

**文件**：`.claude/skills/generate-practice/SKILL.md`

**触发条件**：用户说「出题」「生成练习」「出几道类似的题」

**工作流**：
1. 读取 `data/mistakes/` 中未掌握的错题（可按学科/章节筛选）
2. 对每道错题：
   a. 读取对应 `data/questions/{id}/meta.json` 的分析结果
   b. 基于相同知识点，生成 2-3 道类似练习题：
      - 保持相同题型（选择题/填空题/简答题）
      - 变换考查角度（换数据/换场景/换问法）
      - 标注难度和知识点标签
   c. 每道练习题包含：`question_text`、`options`（选择题）、`correct_answer`、`explanation`
3. 写入 `data/practice/{timestamp}.json`
4. 汇报：生成了 X 道练习题，覆盖 Y 个知识点

### 5.4 `/review` — 错题复习

**文件**：`.claude/skills/review/SKILL.md`

**触发条件**：用户说「复习错题」「该复习了」「看看到期题目」

**工作流**：
1. 读取 `data/mistakes/` 中 `is_mastered === false` 的记录
2. 筛选 `next_review_at <= now()` 的到期题目
3. 逐题展示：
   a. 显示题目图片和 OCR 文字
   b. 先不显示答案，等用户回忆
   c. 用户说「看答案」后展示解析
   d. 用户评价：记住了（更新 review_count++，计算下次复习时间）/ 没记住（保持高频复习）
4. 更新 `data/mistakes/{id}.json` 的复习状态
5. 汇报：复习了 X 道题，掌握了 Y 道

**间隔复习算法**（简化 SM-2）：
```
review_count 0 → 1天后复习
review_count 1 → 3天后复习
review_count 2 → 7天后复习
review_count 3 → 14天后复习
review_count 4+ → 30天后复习
```

### 5.5 `/import-knowledge` — 批量导入知识点

**文件**：`.claude/skills/import-knowledge/SKILL.md`

**触发条件**：用户说「导入知识点」「初始化知识库」

**工作流**：
1. 读取 `data/chapters.json`（预置的章节+知识点结构）
2. 为每个知识点创建 Wiki 页面（`.md` 文件带 frontmatter）
3. 页面包含骨架结构：知识要点、易考点、助记口诀（待 AI 填充）
4. 更新 `data/wiki/index.md` 自动索引
5. 汇报：创建了 X 个知识点页面

### 5.6 `/stats` — 学习统计

**文件**：`.claude/skills/stats/SKILL.md`

**触发条件**：用户说「统计」「学习报告」「看看数据」

**工作流**：
1. 扫描所有数据文件
2. 统计：
   - 总录入题目数（按学科分组）
   - 已分析/未分析比例
   - 错题数量和掌握率
   - 知识点覆盖情况
   - 到期需复习的题目数
   - 练习题完成情况
3. 输出报告（Markdown 格式，保存到 `data/reports/`）

---

## Phase 6: Claude Code 钩子 & 项目配置

### 6.1 CLAUDE.md（项目指令）

**文件**：项目根目录 `CLAUDE.md`

```markdown
# 地生会考冲刺 (geo-bio-sprint-2026)

## 项目概述
八年级地理/生物会考错题录入和学习工具。
- Web 端：手机/平板通过局域网访问，拍照录入错题
- AI 端：通过 Claude Code 技能分析题目、搜索课程、生成练习

## 数据目录
- `data/questions/{id}/` — 题目（image.jpg + meta.json）
- `data/mistakes/{id}.json` — 错题记录
- `data/wiki/` — 知识库（Markdown + YAML frontmatter）
- `data/practice/{session}.json` — 练习题会话

## 可用技能
- `/analyze` — 分析待处理题目
- `/search-courses` — 搜索课程视频
- `/generate-practice` — 生成练习题
- `/review` — 复习到期错题
- `/import-knowledge` — 导入知识点
- `/stats` — 学习统计

## 规则
- 所有数据操作通过读写文件完成，无数据库
- 知识库 Wiki 使用追加策略，不覆盖已有内容
- 解析面向八年级学生，语言通俗易懂
- 地理注重读图/空间思维，生物注重概念/实验思维
```

### 6.2 钩子配置

**文件**：`.claude/settings.json`（项目级）

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const fs=require('fs'),p='data/questions';if(!fs.existsSync(p)){process.exit(0)}const dirs=fs.readdirSync(p);let pending=0;dirs.forEach(d=>{try{const m=JSON.parse(fs.readFileSync(p+'/'+d+'/meta.json','utf8'));if(m.analysis_status==='pending')pending++}catch(e){}});if(pending>0)console.log('📊 有 '+pending+' 道待分析题目，运行 /analyze 处理')\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**SessionStart 钩子行为**：
- 扫描 `data/questions/` 统计 pending 题目数
- 如果有待处理题目，提示用户运行 `/analyze`
- 不阻塞，异步执行

### 6.3 知识点数据文件

**文件**：`data/chapters.json`

预置八年级地理+生物的完整章节和知识点结构：

```json
{
  "geography": {
    "八年级上册": [
      { "chapter": "从世界看中国", "points": ["我国的地理位置", "我国的疆域", "我国的行政区划"] },
      { "chapter": "中国的自然环境", "points": ["地形特征", "气候特征", "河流特征"] },
      { "chapter": "中国的自然资源", "points": ["自然资源概况", "水资源", "土地资源"] },
      { "chapter": "中国的经济发展", "points": ["交通运输", "农业分布", "工业分布"] }
    ],
    "八年级下册": [
      { "chapter": "中国的地理差异", "points": ["四大地理区域", "秦岭-淮河线"] },
      { "chapter": "北方地区", "points": ["自然特征", "农业", "矿产资源"] },
      { "chapter": "南方地区", "points": ["自然特征", "水田农业", "红土地"] },
      { "chapter": "西北地区", "points": ["自然特征", "畜牧业", "绿洲农业"] },
      { "chapter": "青藏地区", "points": ["自然特征", "高寒牧区", "河谷农业"] }
    ]
  },
  "biology": {
    "八年级上册": [
      { "chapter": "生物圈中的绿色植物", "points": ["植物的分类", "被子植物", "裸子植物"] },
      { "chapter": "生物圈中的动物", "points": ["动物的运动", "动物的行为", "动物在生物圈中的作用"] },
      { "chapter": "生物圈中的微生物", "points": ["细菌", "真菌", "病毒"] }
    ],
    "八年级下册": [
      { "chapter": "生物的生殖和发育", "points": ["植物的生殖", "动物的生殖", "人的生殖"] },
      { "chapter": "生物的遗传和变异", "points": ["基因和染色体", "遗传规律", "变异类型"] },
      { "chapter": "生命起源和生物进化", "points": ["生命起源", "生物进化", "自然选择"] },
      { "chapter": "健康地生活", "points": ["传染病", "免疫", "健康生活方式"] }
    ]
  }
}
```

---

## Phase 7: 收尾 & 打磨

### 7.1 品牌和样式
- 应用名「地生冲刺」
- 移动端适配测试（iPhone SE 375px ~ iPad 1024px）
- 裁剪组件触摸优化

### 7.2 MarkdownRenderer 简化
- 移除 KaTeX 相关插件
- 保留 remark-gfm

### 7.3 启动脚本
- `npm run dev` — 启动 Vite 开发服务器（前端 + API 中间件一体）
- 启动时打印局域网 IP 地址（方便手机扫码访问）
- 无需 concurrently，无需双服务器

---

## 关键文件参考

| 来源文件 | 目标 | 操作 |
|----------|------|------|
| `speed-learning/components/ImageCropper.tsx` | `src/components/ImageCropper.tsx` | 保留不变 |
| `speed-learning/components/PhotoAgentView.tsx` | 提取图片查看器到 Common.tsx | 提取复用 |
| `speed-learning/components/Common.tsx` | `src/components/Common.tsx` | 保留 |
| `speed-learning/components/MarkdownRenderer.tsx` | `src/components/MarkdownRenderer.tsx` | 移除 KaTeX |
| `speed-learning/App.tsx` | `src/App.tsx` | 重写：底部Tab + 无AI |
| `speed-learning/types.ts` | `src/types.ts` | 重写：新数据模型 |
| `speed-learning/vite.config.ts` | `vite.config.ts` | 改造：代理API |
| — | `server/index.ts` | 新建：Hono API |
| — | `server/routes/*.ts` | 新建：CRUD 路由 |
| — | `src/services/api.ts` | 新建：前端API层 |
| — | `src/data/chapters.ts` | 新建：章节常量 |
| — | `.claude/skills/analyze/SKILL.md` | 新建：分析技能 |
| — | `.claude/skills/search-courses/SKILL.md` | 新建：课程搜索技能 |
| — | `.claude/skills/generate-practice/SKILL.md` | 新建：练习生成技能 |
| — | `.claude/skills/review/SKILL.md` | 新建：复习技能 |
| — | `.claude/skills/import-knowledge/SKILL.md` | 新建：知识点导入技能 |
| — | `.claude/skills/stats/SKILL.md` | 新建：统计技能 |
| — | `CLAUDE.md` | 新建：项目指令 |
| — | `.claude/settings.json` | 新建：钩子配置 |
| — | `data/chapters.json` | 新建：章节知识点数据 |
| `speed-learning/services/geminiService.ts` | — | 不复制 |
| `speed-learning/services/supabase.ts` | — | 不复制 |
| `speed-learning/components/GeometryVisualizer.tsx` | — | 不复制 |
| `speed-learning/components/MathSession.tsx` | — | 不复制 |
| `speed-learning/components/PdfExportOverlay.tsx` | — | 不复制 |
| `speed-learning/components/LoginScreen.tsx` | — | 不复制（无认证） |
| `speed-learning/components/Sidebar.tsx` | — | 不复制（用底部Tab） |
| `speed-learning/components/GradeSelectionModal.tsx` | — | 不复制（固定初二） |
| `oh-my-claudecode/src/hooks/wiki/storage.ts` | `server/utils/wiki.ts` | 简化移植：frontmatter解析 |
| `oh-my-claudecode/src/hooks/wiki/query.ts` | `server/utils/search.ts` | 简化移植：CJK搜索 |
| `oh-my-claudecode/src/hooks/wiki/ingest.ts` | `server/utils/wiki.ts` | 简化移植：追加合并 |

---

## 验证方案

### 逐步验证
1. **Phase 1**：`npm run dev` 启动，手机浏览器访问 `http://<局域网IP>:3000` 能看到页面
2. **Phase 2**：`curl http://localhost:3001/api/questions` 返回空数组（正常）
3. **Phase 3**：手机拍照 → 裁剪 → 填表 → 保存 → 在 `data/questions/` 中看到图片和 meta.json
4. **Phase 4**：错题本/知识库/练习页面在手机上渲染正确
5. **Phase 5**：在 Claude Code 中输入 `/analyze` → 技能激活 → 读取题目 → 生成解析 → 写回文件
6. **Phase 6**：启动 Claude Code → SessionStart 钩子提示待处理题目数
7. **Phase 7**：`/generate-practice` → 练习题生成 → 手机端可做题

### 完整链路验证
```
1. 手机拍照录入 3 道地理错题
2. 电脑端 Claude Code → /analyze（3道 pending → 3道 analyzed + 3个 wiki 页面）
3. /search-courses（3个知识点补充 B站课程链接）
4. /generate-practice（生成 6-9 道练习题）
5. 手机刷新 → 错题本看到解析 → 知识库看到知识点和课程 → 练习模式做题
6. 第二天 → /review → 复习到期题目 → 更新复习状态
```

---

## 预计工作量

| 阶段 | 内容 | 预计 |
|------|------|------|
| Phase 1 | 项目初始化 + API 服务器 + 文件存储 | 1.5h |
| Phase 2 | API 路由（CRUD）+ Wiki 工具 | 2h |
| Phase 3 | 移动端前端核心 | 2h |
| Phase 4 | 知识库/练习/错题本 UI | 2h |
| Phase 5 | Claude Code 技能（6个 SKILL.md） | 2h |
| Phase 6 | 钩子 + CLAUDE.md + 数据文件 | 1h |
| Phase 7 | 收尾打磨 | 1h |
| **合计** | | **~11.5h** |
