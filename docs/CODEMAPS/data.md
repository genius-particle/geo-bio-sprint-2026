# Data Formats — 地生冲刺

> 更新: 2026-05-31 | 存储: 本地文件系统 (data/)

## 存储布局

```
data/
├── questions/{id}/
│   ├── meta.json        # 题目元数据
│   ├── image-1.jpg      # 题目图片 1 (JPEG)
│   ├── image-2.jpg      # 题目图片 2（可选，跨页题目）
│   └── ...              # image-N.jpg（最多 ~5 张）
├── mistakes/{id}.json   # 错题记录 (id = question_id)
├── wiki/
│   ├── index.md         # 自动维护的目录 (按学科分组)
│   ├── log.md           # 追加式操作日志
│   └── *.md             # 知识页面 (YAML frontmatter + Markdown)
├── practice/{id}.json   # 练习会话
└── reports/             # 统计报告 (Claude Code 生成)
```

## questions meta.json

```json
{
  "id": "2026-05-31-14-30-00",       // ISO 时间戳格式
  "subject": "geography",            // geography | biology
  "chapter": "中国的自然资源",
  "knowledge_points": [],             // 知识点标签
  "difficulty": "unknown",           // easy | medium | hard | unknown
  "question_type": "unknown",        // choice | fill | map | judge | essay | mixed | unknown
  "ocr_text": "",                     // OCR 识别文本 (/analyze 填充)
  "source": "课本",                   // 题目来源
  "source_detail": "P42 第3题",
  "tags": [],                         // 用户标签
  "is_mistake": false,
  "analysis_status": "pending",      // pending | analyzed | failed
  "image_count": 1,                  // 图片数量（多图支持，默认 1）
  "notes": "",
  "created_at": "2026-05-31T14:30:00.000Z",
  "analysis": {                       // /analyze 后填充 (可选)
    "answer": "",
    "explanation": "",
    "key_concept": "",
    "common_mistakes": [],
    "related_topics": []
  },
  "confidence": "high",               // high | medium | low (/analyze 二次校验)
  "needs_manual_review": false,       // confidence 为 low 时 true
  "verification_notes": ""            // 校验备注：分歧点、修正内容
}
```

## mistakes/{id}.json

```json
{
  "question_id": "2026-05-31-14-30-00",  // 关联题目 ID
  "wrong_answer": "",
  "correct_answer": "",
  "mistake_type": "other",                // knowledge_gap | careless | misunderstood | other
  "review_count": 0,
  "last_reviewed_at": null,
  "next_review_at": "2026-06-01T14:30:00.000Z",  // 初始 +24h
  "is_mastered": false,
  "user_notes": ""
}
```

## wiki/*.md

```markdown
---
title: "中国的自然资源"
tags: ["自然资源", "可再生", "非可再生"]
created: "2026-05-31T14:30:00.000Z"
updated: "2026-05-31T15:00:00.000Z"
sources: ["session-abc123"]
links: ["geography-中国的人口.md"]
category: knowledge           # knowledge | chapter | topic | exam-tip | mnemonic | course | session-log
confidence: medium             # high | medium | low
schemaVersion: 1
subject: geography             # geography | biology
chapter: "中国的自然资源"
---

# 中国的自然资源

Markdown 正文内容...

---

## 更新 (2026-05-31T15:00:00.000Z)

追加合并的新内容...
```

frontmatter 字段说明:

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 页面标题 |
| tags | string[] | 搜索标签 |
| created | string | 创建时间 (ISO) |
| updated | string | 更新时间 (ISO) |
| sources | string[] | 来源标识 (会话 ID) |
| links | string[] | 关联页面文件名 (交叉引用) |
| category | enum | knowledge/chapter/topic/exam-tip/mnemonic/course/session-log |
| confidence | enum | high/medium/low |
| schemaVersion | number | 固定 1 |
| subject | enum | geography/biology |
| chapter | string | 所属章节 |

## practice/{id}.json

```json
{
  "id": "2026-06-09-10-30-00",
  "title": "传染源与病原体 - 快问快答",
  "mode": "knowledge",                    // knowledge | mistake
  "subject": "biology",                   // geography | biology
  "source_slugs": ["biology-传染源与病原体"],  // 关联 wiki 页面（knowledge 模式）
  "questions": [
    {
      "id": "q-001",
      "source_mistake_id": "2026-05-31-14-30-00",  // 可选，mistake 模式关联错题
      "subject": "biology",
      "chapter": "第四单元 第七章 健康地生活",
      "knowledge_points": ["传染源", "病原体"],
      "difficulty": "medium",
      "question_type": "choice",           // choice | judge
      "question_text": "下列属于传染源的是？",
      "options": [
        { "label": "A", "text": "肝炎病毒" },
        { "label": "B", "text": "结核分枝杆菌" },
        { "label": "C", "text": "患狂犬病的狗" },
        { "label": "D", "text": "蛔虫" }
      ],
      "correct_answer": "C",
      "explanation": "传染源是能够散播病原体的人或动物...",
      "practice_status": "unattempted",    // unattempted | correct | wrong | skipped
      "user_answer": null
    }
  ],
  "created_at": "2026-06-09T10:30:00.000Z"
}
```

字段说明:

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 显示标题（旧数据兼容：缺失时显示"练习"）|
| mode | enum | knowledge（知识点出题）或 mistake（错题变式）（旧数据兼容：缺失当 mistake）|
| subject | enum | geography 或 biology |
| source_slugs | string[] | 关联 wiki 页面 slug（knowledge 模式）|
| questions[].question_type | enum | choice（选择题）或 judge（判断题）|
| questions[].source_mistake_id | string? | 可选，关联错题 ID（mistake 模式）|

## chapters 配置 (data/chapters.json)

章节数据的唯一来源，前端录入下拉框和 analyze 技能均从此读取。

```json
{
  "geography": {
    "八年级下册": [
      { "chapter": "第七章 北方地区", "points": ["自然特征与农业", "白山黑水——东北三省", "黄土高原", "首都北京"] }
    ]
  },
  "biology": { ... }
}
```

- `chapter`：完整章节名（带编号），录入时写入 meta.json 的 `chapter` 字段
- `points`：该章节下的知识点列表，供 analyze 技能做知识点→章节匹配

## ID 约定

- 所有 ID 格式: `YYYY-MM-DD-HH-mm-ss` (ISO 时间戳替换)
- questions 目录: `data/questions/{id}/`
- mistakes 文件: `data/mistakes/{question_id}.json`
- practice 文件: `data/practice/{id}.json`
- wiki slug: `{subject}-{标题}.md` (CJK 字符保留)
