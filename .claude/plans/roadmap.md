# 地生冲刺 — 迭代路线图

> 最后更新: 2026-05-31

## 已完成

### v0.1.0 (2026-05-31)
- [x] 项目初始化（React 19 + Vite 6 + TypeScript）
- [x] API 路由（题目/错题/知识库/练习 CRUD）
- [x] 移动端前端（首页/拍照录入/错题本/知识库/练习 4 个 Tab）
- [x] 图片裁剪组件（旋转/缩放/平移/裁剪框）
- [x] EXIF 自动旋转 + A4 基准压缩（最大 1200px，质量 0.7）
- [x] oh-my-claudecode Wiki 系统完整移植
  - 原子写入 + 文件锁 + CJK 二元组分词 + 加权搜索
  - 6 类 lint 健康检查 + 追加合并策略
  - SessionStart/End/PreCompact 钩子
- [x] 6 个 Claude Code 技能（/analyze, /search-courses, /generate-practice, /review, /import-knowledge, /stats）
- [x] CLAUDE.md + README.md + chapters.json
- [x] 竖图智能裁剪区域

## 进行中

- [ ] （无）

## 待实现（按优先级）

### P0 — 核心体验
- [ ] 手机端实际测试和 UI 打磨
- [ ] /analyze 技能实际运行验证（OCR + 解题 + 创建 Wiki）
- [ ] /import-knowledge 初始化知识库骨架

### P1 — 增强功能
- [ ] Markdown 渲染器增强（当前 KnowledgeBaseView 只用 whitespace-pre-wrap）
- [ ] 练习模式完整实现（当前只有列表，无做题交互）
- [ ] 错题本间隔复习提醒（到期的题目高亮）
- [ ] 题目搜索/筛选功能

### P2 — 打磨
- [ ] 移动端适配测试（iPhone SE 375px ~ iPad 1024px）
- [ ] 图片查看器增强（缩放、手势）
- [ ] 添加测试（当前零测试）
- [ ] 性能优化（大列表虚拟滚动等）

### P3 — 未来
- [ ] 离线 PWA 支持
- [ ] 多用户/多设备数据同步
- [ ] 导出功能（PDF/打印）
