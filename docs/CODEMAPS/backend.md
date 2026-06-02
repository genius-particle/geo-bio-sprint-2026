# Backend — 地生冲刺

> 更新: 2026-05-31 | 运行时: Node.js (Vite 内置)

## API 路由映射

```
server/index.ts → registerApiRoutes(server)
  ├── /api/questions  → questionRoutes()
  ├── /api/mistakes   → mistakeRoutes()
  ├── /api/knowledge  → knowledgeRoutes()
  └── /api/practice   → practiceRoutes()
```

### questions.ts

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/` | 列出所有题目 (listDirs + readJson) |
| POST | `/` | 新增题目 (ID=时间戳, 含 image_base64_list, 最多5张, 可自动建错题) |
| GET | `/:id` | 获取单个题目 meta.json |
| GET | `/:id/images` | 获取题目图片索引列表 `{images: [1,2,3]}` |
| GET | `/:id/image/:index` | 获取指定序号的图片 (image-N.jpg, index=1回退image.jpg) |
| GET | `/:id/image` | 获取第一张图片 (缩略图兼容, image-1.jpg → image.jpg) |
| PUT | `/:id` | 更新题目 (merge) |
| DELETE | `/:id` | 删除题目 (meta + 所有 image-N.jpg + image.jpg) |

### mistakes.ts

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/` | 列出所有错题 (join questions meta) |
| POST | `/` | 新增错题 (自动标记 question.is_mistake=true) |
| PUT | `/:id` | 更新错题记录 |
| DELETE | `/:id` | 删除错题 (自动清除 question.is_mistake) |

### knowledge.ts (使用 wiki 模块)

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/` | 列出所有知识页面 (listPages + readPage) |
| GET | `/search?q=` | 加权搜索 (queryWiki) |
| GET | `/:slug` | 读取单个页面 |
| POST | `/` | 新增/追加知识 (ingestKnowledge) |

### practice.ts

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/` | 列出所有练习 |
| POST | `/` | 创建练习会话 |
| PUT | `/:id` | 更新练习 |

## Wiki 模块 (server/utils/wiki/)

```
storage.ts  → 文件 I/O + frontmatter 解析/序列化
ingest.ts   → 知识摄入 (创建或追加合并)
query.ts    → CJK 分词 + 加权搜索
lint.ts     → 6 类健康检查
types.ts    → 类型定义 (WikiPage, WikiIngestInput 等)
index.ts    → 统一导出
```

### 关键函数签名

```ts
// storage.ts
readPage(root, filename): WikiPage | null
listPages(root): string[]
readAllPages(root): WikiPage[]
writePage(root, page): void          // 自动加锁 + 更新索引
deletePage(root, filename): boolean  // 自动加锁 + 更新索引
withWikiLock<T>(root, fn): T         // 跨进程互斥
parseFrontmatter(raw): { frontmatter, content } | null

// ingest.ts
ingestKnowledge(root, input: WikiIngestInput): WikiIngestResult
// 相同 slug → 追加合并 (tags 并集, content 时间戳分隔, confidence 取高)

// query.ts
tokenize(text): string[]              // Latin 单词 + CJK 单字/二元组
queryWiki(root, queryText, options?): WikiQueryMatch[]
// 评分: 标题包含+5, 标题分词+2/词, tag匹配+3/标签, 内容分词+1/词

// lint.ts
lintWiki(root, config?): WikiLintReport
// 检测: orphan, stale, broken-ref, low-confidence, oversized, structural-contradiction
```

## 基础设施

```
atomic-write.ts
  atomicWriteFileSync(path, content)   // O_EXCL 临时文件 + rename + fsync
  ensureDirSync(dir)                    // 递归 mkdir

file-lock.ts
  acquireFileLockSync(path, opts): FileLockHandle | null  // O_EXCL + PID 过期检测
  releaseFileLockSync(handle)
  withFileLockSync<T>(path, fn, opts): T

fileStore.ts
  readJson<T>(path): T | null           // data/ 前缀
  writeJson(path, data): void
  listDirs(dir): string[]              // 子目录列表
  listFiles(dir, ext?): string[]
  writeImage/readImage(path, buffer)
  deleteFile(path): boolean
```

## 中间件链

无认证/日志中间件。每个路由返回 `(req, res, next) => {}` 函数，
手动匹配 URL + method。未匹配调用 `next()` 传递。

## 钩子脚本 (scripts/)

| 脚本 | 触发时机 | 功能 |
|------|---------|------|
| wiki-session-start.mjs | SessionStart | wiki 状态恢复/同步 |
| wiki-session-end.mjs | SessionEnd | wiki 状态持久化 |
| wiki-pre-compact.mjs | PreCompact | 压缩前保存 wiki 摘要 |
