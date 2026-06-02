---
name: reset
description: 当用户说「重置数据」「清空数据」「重新开始」时触发。保留题目图片，清除所有分析数据、错题记录和知识库。
---

# reset — 重置学习数据

## 触发条件

用户说「重置数据」「清空数据」「重新开始」「reset」时触发。

## ⚠️ 确认步骤

执行前**必须**向用户确认：

1. 告知用户将要清除的内容：
   - 所有题目的分析数据（OCR 文本、题型、难度、解析、知识点标签等），恢复为 `pending` 状态
   - 所有错题记录重置为初始状态（`data/mistakes/*.json`）
   - 所有知识库页面（`data/wiki/*.md`，保留 `index.md` 和 `log.md` 骨架）
2. 明确说明**图片不会被删除**
3. 等用户确认后才执行

## 工作流

### 第一步：修复无效 JSON（如有）

扫描所有 `data/questions/*/meta.json`，检查 JSON 有效性。如果发现无效文件：
- 常见原因：`ocr_text` 中包含未转义的 ASCII 引号 `""`
- 修复方式：将 ASCII 引号替换为中文智能引号 `""`，确保 JSON 可解析
- 修复后重新验证

### 第二步：重置题目数据

对每道题目的 `meta.json`，只保留以下字段，其余全部删除：

```json
{
  "id": "保持原值",
  "subject": "保持原值",
  "analysis_status": "pending",
  "difficulty": "unknown",
  "question_type": "unknown",
  "image_count": "保持原值，默认 1",
  "notes": "",
  "created_at": "保持原值"
}
```

清除的字段包括但不限于：`chapter`、`knowledge_points`、`tags`、`source`、`source_detail`、`ocr_text`、`ocr_quality`、`analyzed_at`、`analysis`、`confidence`、`needs_manual_review`、`verification_notes`。

### 第三步：重置错题记录

对 `data/mistakes/` 下的每个 `.json` 文件，重置为初始状态（与录入时一致）：

```json
{
  "question_id": "保持原值",
  "wrong_answer": "",
  "correct_answer": "",
  "mistake_type": "other",
  "review_count": 0,
  "last_reviewed_at": null,
  "next_review_at": "{当前时间 + 24h}",
  "is_mastered": false,
  "user_notes": ""
}
```

如果某道题目在 `data/questions/` 中存在但 `data/mistakes/` 中缺少对应文件（如之前误删），则自动补建。

如果 `data/mistakes/` 中有文件对应的题目已不存在，则删除该孤立文件。

### 第四步：清除知识库

删除 `data/wiki/` 下所有 `.md` 文件，然后重建骨架文件：

**`data/wiki/log.md`**：
```markdown
---
title: "操作日志"
tags: []
created: "{当前时间 ISO}"
updated: "{当前时间 ISO}"
category: session-log
schemaVersion: 1
---

# 操作日志

数据已重置，准备重新分析。
```

**`data/wiki/index.md`**：
```markdown
---
title: "知识点目录"
tags: []
created: "{当前时间 ISO}"
updated: "{当前时间 ISO}"
category: chapter
schemaVersion: 1
---

# 知识点目录

暂无知识点。
```

### 第五步：汇报结果

输出重置统计：
- 重置了 X 道题目（保留图片，清除分析数据）
- 重置了 Y 条错题记录
- 删除了 Z 个知识库页面
- 修复了 N 个无效 JSON 文件（如有）

## 规则

1. **不删除图片**：`image.jpg`、`image-1.jpg` 等图片文件必须保留
2. **不删除题目目录**：`data/questions/{id}/` 目录结构保留
3. **先修复后重置**：遇到无效 JSON 先修复再处理，不要跳过
4. **必须确认**：执行前必须获得用户确认
5. **不可恢复**：提醒用户此操作不可恢复（除非有 git 备份）
