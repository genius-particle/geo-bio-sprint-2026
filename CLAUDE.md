# 地生会考冲刺 (geo-bio-sprint-2026)

## 项目概述
八年级地理/生物会考错题录入和学习工具。
- Web 端：手机/平板通过局域网访问，拍照录入错题
- AI 端：通过 Claude Code 技能分析题目、搜索课程、生成练习

## 技术栈
- React 19 + TypeScript + Vite 6
- 后端：Vite configureServer 中间件（单服务器，/api/* 路由）
- 存储：本地文件系统（JSON + 图片），无数据库
- 样式：Tailwind CSS（CDN）
- 无外部云服务、无认证

## 数据目录
- `data/questions/{id}/` — 题目（image.jpg + meta.json）
- `data/mistakes/{id}.json` — 错题记录
- `data/wiki/` — 知识库（Markdown + YAML frontmatter）
- `data/practice/{session}.json` — 练习题会话

## 项目结构
- `src/` — 前端 React 组件
- `server/` — API 路由（Vite 中间件）
- `server/utils/fileStore.ts` — JSON/图片文件读写
- `.claude/skills/` — Claude Code 技能

## 可用技能
- `/analyze` — 分析待处理题目（OCR + 解题 + 知识点提取）
- `/search-courses` — 搜索 B站/小红书课程视频
- `/generate-practice` — 根据错题生成练习题
- `/review` — 间隔复习到期错题
- `/import-knowledge` — 批量导入知识点
- `/stats` — 学习统计报告

## 数据格式

### meta.json（题目元数据）
- `id`: 时间戳格式 "2026-05-31_14-30-22"
- `subject`: "geography" | "biology"
- `chapter`: 章节名
- `analysis_status`: "pending" | "analyzed" | "failed"
- `ocr_text`: OCR 识别文字（由 /analyze 填充）
- `analysis`: { answer, explanation, key_concept, common_mistakes, related_topics }

### mistake JSON（错题记录）
- 间隔复习算法：review_count 0→1天, 1→3天, 2→7天, 3→14天, 4+→30天

### 知识库 Wiki
- Markdown 文件 + YAML frontmatter（title, tags, subject, chapter, confidence, links）
- 追加策略：新内容追加到已有页面，不覆盖
- Wiki 链接：[[知识点名]] 语法

## 规则
- 所有数据操作通过读写文件完成，无数据库
- 知识库 Wiki 使用追加策略，不覆盖已有内容
- 解析面向八年级学生，语言通俗易懂
- 地理注重读图/空间思维，生物注重概念/实验思维
- 所有 AI 能力走 Claude Code 技能，Web 端零 AI
- 手机端体验优先，不做 PC 端适配
