# Frontend — 地生冲刺

> 更新: 2026-06-01 | 框架: React 19 SPA

## 组件树

```
App.tsx (入口)
├── ImageCropper              # 图片裁剪弹层
├── DashboardView             # 首页：题目列表 + 快捷操作
├── QuestionCaptureView       # 拍照录入：填写科目/章节/来源
├── QuestionDetailView        # 题目详情：OCR + 分析结果
├── MistakeBookView           # 错题本：列表 + 筛选
├── KnowledgeBaseView         # 知识库：搜索 + 详情 (react-markdown)
└── PracticeView              # 练习：答题 + 结果

通用组件
├── Common.tsx                # Badge, Button, Modal 等基础 UI
└── Icons.tsx                 # lucide-react 图标封装
```

## 路由 (App.tsx useState)

| ViewMode | 组件 | 触发 |
|----------|------|------|
| `home` | DashboardView | 默认页 |
| `capture` | QuestionCaptureView | 拍照后裁剪完成 |
| `detail` | QuestionDetailView | 点击题目卡片 |
| `mistakes` | MistakeBookView | 底部 Tab |
| `knowledge` | KnowledgeBaseView | 底部 Tab |
| `practice` | PracticeView | 底部 Tab |

底部 Tab 栏: home / mistakes / knowledge / practice

## 状态管理

全部使用 `useState`，无 Redux/Zustand。

```
App.tsx 状态:
  view: ViewMode              # 当前页面
  croppingImage: string|null  # 待裁剪图片 base64
  croppedImages: string[]     # 裁剪后图片 base64 数组（支持多图）
  selectedQuestionId: string|null  # 查看的题目 ID
  refreshKey: number          # 列表刷新触发器
  fileInputRef: RefObject     # 隐藏文件输入
```

子组件各自管理内部状态 (如 KnowledgeBaseView 的搜索词)。

## 数据流

```
组件 → api.ts → fetch('/api/*') → Vite 中间件 → fileStore/wiki

api.ts 导出:
  fetchQuestions()          GET  /api/questions
  fetchQuestion(id)         GET  /api/questions/:id
  createQuestion(data)      POST /api/questions        (含 image_base64_list)
  updateQuestion(id, data)  PUT  /api/questions/:id
  deleteQuestion(id)        DELETE /api/questions/:id
  fetchMistakes()           GET  /api/mistakes
  addMistake(data)          POST /api/mistakes
  updateMistake(id, data)   PUT  /api/mistakes/:id
  removeMistake(id)         DELETE /api/mistakes/:id
  fetchKnowledge()          GET  /api/knowledge
  fetchKnowledgePage(slug)  GET  /api/knowledge/:slug
  searchKnowledge(q)        GET  /api/knowledge/search?q=
  fetchPractice()           GET  /api/practice
  createPractice(questions)  POST /api/practice
```

## 图片处理流程（多图支持）

```
手机拍照 → input[capture=environment]
  → FileReader.readAsDataURL → base64
  → fixExifRotation (解析 EXIF Orientation 1/3/6/8)
    → Image + Canvas 旋转修正
  → setCroppingImage → ImageCropper 弹层
  → 裁剪确认 → 追加到 croppedImages[] → QuestionCaptureView
  → "再拍一张" → 重复上述流程（可多次）
  → 保存时 image_base64_list[] POST 到 /api/questions
  → 后端存储为 image-1.jpg, image-2.jpg, ...
```

旧数据兼容: 仅存在 image.jpg 的题目通过 GET /:id/image 回退读取。

## 样式

- Tailwind CSS (CDN link，无本地编译)
- 无 CSS Modules / styled-components
- `safe-area-bottom` 适配 iPhone 底部安全区
