# 开发路线图

> Phase 1–6 已完成（v0.1.0），Phase 7 部分待打磨

## ✅ Phase 1: 项目初始化

- [x] Vite + React 19 项目骨架
- [x] API 中间件（configureServer）
- [x] 数据目录结构
- [x] TypeScript 类型定义

## ✅ Phase 2: API 路由

- [x] `server/routes/questions.ts` — CRUD + 图片
- [x] `server/routes/mistakes.ts` — CRUD
- [x] `server/routes/knowledge.ts` — Wiki 读写 + CJK 搜索
- [x] `server/routes/practice.ts` — CRUD

## ✅ Phase 3: 前端核心

- [x] App.tsx — 底部 Tab 导航
- [x] DashboardView — 首页
- [x] QuestionCaptureView — 拍照录入
- [x] QuestionDetailView — 题目详情
- [x] `src/services/api.ts` — 前端 API 层

## ✅ Phase 4: 知识库 & 练习 & 错题本

- [x] MistakeBookView — 错题本
- [x] KnowledgeBaseView — 知识库
- [x] PracticeView — 练习
- [x] 底部 Tab 导航（4 Tab）

## ✅ Phase 5: Claude Code 技能

- [x] `/analyze` — OCR + 分析
- [x] `/search-courses` — 搜索课程
- [x] `/generate-practice` — 生成练习
- [x] `/review` — 复习错题
- [x] `/import-knowledge` — 导入知识点
- [x] `/stats` — 学习统计

## ✅ Phase 6: 钩子 & 项目配置

- [x] CLAUDE.md
- [x] SessionStart / SessionEnd / PreCompact 钩子
- [x] chapters.json

## 🔲 Phase 7: 收尾 & 打磨

- [ ] 移动端适配测试（iPhone SE ~ iPad）
- [ ] 裁剪组件触摸优化
- [ ] 完整链路端到端验证
