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
  }
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
  "id": "2026-05-31-14-30-00",
  "questions": [
    {
      "id": "q-001",
      "source_mistake_id": "2026-05-31-14-30-00",
      "subject": "geography",
      "chapter": "中国的自然资源",
      "knowledge_points": [],
      "difficulty": "medium",
      "question_text": "以下哪个属于可再生资源？",
      "options": [
        { "label": "A", "text": "煤炭" },
        { "label": "B", "text": "太阳能" }
      ],
      "correct_answer": "B",
      "explanation": "太阳能是可再生资源...",
      "practice_status": "unattempted",  // unattempted | correct | wrong | skipped
      "user_answer": null
    }
  ],
  "created_at": "2026-05-31T14:30:00.000Z"
}
```

## chapters 常量 (src/data/chapters.ts)

```ts
CHAPTERS = {
  geography: {
    '八年级上册': ['从世界看中国', '中国的自然环境', '中国的自然资源', '中国的经济发展'],
    '八年级下册': ['中国的地理差异', '北方地区', '南方地区', '西北地区', '青藏地区'],
  },
  biology: {
    '八年级上册': ['生物圈中的绿色植物', '生物圈中的动物', '生物圈中的微生物'],
    '八年级下册': ['生物的生殖和发育', '生物的遗传和变异', '生命起源和生物进化', '健康地生活'],
  },
}
```

## ID 约定

- 所有 ID 格式: `YYYY-MM-DD-HH-mm-ss` (ISO 时间戳替换)
- questions 目录: `data/questions/{id}/`
- mistakes 文件: `data/mistakes/{question_id}.json`
- practice 文件: `data/practice/{id}.json`
- wiki slug: `{subject}-{标题}.md` (CJK 字符保留)
