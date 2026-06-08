---
name: clean-books
description: 当用户说「清洗 books」「清洗教材知识点」时触发。从 data/books-raw 读取 MinerU 解析产物，对图片做视觉分类与 OCR，合并为规范 Markdown 写入 data/books/。
---

# clean-books — 教材知识点清洗

## 触发条件

用户说「清洗 books」「清洗教材知识点」时触发。

## 数据源

- 输入：`data/books-raw/{书名}.docx-{uuid}/`（只读，不修改）
  - `*_model.json`：块序列（text / table / image / title / list）
  - `images/`：图片文件
  - `full.md`：图片引用顺序（`![](images/xxx.jpg)`）
- OCR 缓存：`data/books/.ocr-cache/{bookSlug}/{imageFilename}.json`
- 输出：`data/books/{标准书名}.md`

## 工作流

### 第一步：扫描待 OCR 图片

运行 `node .claude/skills/clean-books/clean-books.mjs --list-pending` 列出缺少缓存的图片。

对每本书：
1. 读取 `*_model.json` 块序列
2. 按 `full.md` 中 `![](images/...)` 顺序建立 image 块 → 文件名映射
3. 收集每张图的前后各 2 条 text 块作为上下文

### 第二步：逐图视觉分类与 OCR

对每张待处理图片：

**a. 读取图片**

- 路径：`data/books-raw/{bookDir}/images/{filename}`
- 同时读取上下文（前文、后文各 2 条）

**b. 分类与提取**

使用 Claude 视觉能力，按以下规则输出 JSON：

```json
{
  "action": "extract",
  "type": "text_page",
  "markdown": "## 第一章 ...\n\n..."
}
```

| 类型 | 判定 | action |
|------|------|--------|
| `text_page` | 整页/大块印刷知识点（复习提纲扫描页） | `extract`，完整 OCR 为 Markdown |
| `illustration` | 纯示意图/照片，上下文已有充分说明 | `skip`，markdown 为空字符串 |
| `mixed` | 示意图含重要标注文字 | `extract`，仅提取标注和说明文字 |

**跳过启发式**（辅助判断，非硬规则）：
- 前文含「示意图」「结构图」「如图」「照片」，且后文已有完整解释 → 倾向 `skip`
- 该书 model.json 仅有 image 块、无 text 块（如生物七上）→ 全部 `extract`

**OCR 输出要求**：
- 使用 Markdown：章 `##`、节 `###`、列表 `-` 或 `1.`
- 表格用 GFM 格式（`| col | col |`）
- 保留原文措辞，面向八年级学生
- 不要描述图形外观，只提取文字内容
- `action: skip` 时 `markdown` 为 `""`

**c. 写入缓存**

路径：`data/books/.ocr-cache/{bookSlug}/{imageFilename}.json`

```json
{
  "action": "extract",
  "type": "text_page",
  "markdown": "...",
  "context_before": ["...", "..."],
  "context_after": ["...", "..."],
  "processed_at": "2026-06-08T12:00:00.000Z"
}
```

`bookSlug` 与 `scripts/clean-books.mjs` 中映射一致（如 `bio-7a`）。

### 第三步：合并输出

所有图片缓存就绪后，运行：

```bash
node .claude/skills/clean-books/clean-books.mjs
```

脚本读取 model.json + OCR 缓存，输出 8 个规范 MD 文件和 `data/books/clean-report.md`。

### 第四步：验收

```bash
rg '<table|<p>|<u>|<img|!\[\]\(' data/books/*.md
```

目标：0 匹配（`clean-report.md` 除外）。

## bookSlug 对照

| bookSlug | 输出文件 |
|----------|----------|
| geo-7a | 人教版初中地理七年级上册知识点.md |
| geo-7b | 人教版初中地理七年级下册知识点.md |
| geo-8a | 人教版初中地理八年级上册知识点.md |
| geo-8b | 人教版初中地理八年级下册知识点.md |
| bio-7a | 人教版初中生物七年级上册知识点.md |
| bio-7b | 人教版初中生物七年级下册知识点.md |
| bio-8a | 人教版初中生物八年级上册知识点.md |
| bio-8b | 人教版初中生物八年级下册知识点.md |

## 注意事项

- 已存在缓存的文件跳过 OCR（支持中断续跑）
- 误判可手动编辑缓存 JSON 后重跑 `npm run clean-books`
- 不修改 `data/books-raw/`
- 不引入新 npm 依赖
