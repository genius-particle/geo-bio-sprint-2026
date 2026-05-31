# 地生冲刺 — Claude Code 行为规则

## 构建 & 运行

```bash
npm run dev          # 启动 Vite 开发服务器（前端 + API 中间件，port 3000，host 0.0.0.0）
npm run build        # 生产构建
npx tsc --noEmit     # 类型检查（必须零错误）
```

- 单服务器架构：Vite `configureServer` 中间件处理 `/api/*`，不需要独立后端
- 架构详情见 `docs/CODEMAPS/`

## 编码约定

- React 19 函数组件 + TypeScript，无 class 组件
- 状态管理只用 `useState`，不用 Redux/Context
- 样式用 Tailwind CSS（CDN），不写 CSS 文件
- 移动端优先，不做 PC 端适配
- 中文注释，中文 UI 文案
- 后端路由风格参考 `server/routes/questions.ts`：同步 fs、`sendJson`/`parseBody`
- Wiki 模块风格参考 `server/utils/wiki/storage.ts`：原子写入、文件锁、frontmatter
- 不引入新 npm 依赖（当前零运行时外部依赖，保持这个状态）

## 数据操作规则

- 所有数据在 `data/` 目录，JSON + 图片 + Markdown，无数据库
- 工具函数：`server/utils/fileStore.ts`
- Wiki 操作：`server/utils/wiki/` 模块，**必须走 withWikiLock** 加锁
- 数据格式、ID 约定、JSON 结构详见 `docs/CODEMAPS/data.md`

## 技能（修改数据的标准操作）

| 技能 | 改什么 | 写哪里 |
|------|--------|--------|
| `/analyze` | OCR + 解析 | `data/questions/*/meta.json` + `data/wiki/*.md` |
| `/search-courses` | 搜索视频链接 | `data/wiki/*.md`（追加到相关课程段） |
| `/generate-practice` | 生成练习题 | `data/practice/*.json` |
| `/review` | 更新复习状态 | `data/mistakes/*.json` |
| `/import-knowledge` | 创建知识骨架 | `data/wiki/*.md` |
| `/stats` | 生成统计报告 | `data/reports/*.md` |

## 内容规则

- 解析面向八年级学生，语言通俗易懂
- 地理注重读图/空间思维，生物注重概念/实验思维
- Wiki 链接用 `[[知识点名]]` 语法
- 所有 AI 能力走 Claude Code 技能，Web 端零 AI
- 技能产出优先写回文件系统，不输出到终端让用户手动复制
