---
name: generate-practice
description: 当用户说「出题」「生成练习」「出几道类似的题」「知识点练习」「快问快答」「给 X 出题」时触发。支持基于错题变式和基于知识点出题两种模式。
---

# generate-practice — 生成练习题

## 触发条件

用户说「出题」「生成练习」「出几道类似的题」「知识点练习」「快问快答」「给 X 出题」时触发。

## 模式判断

根据用户指令自动判断模式：

1. **知识点模式** — 用户提到知识点名称、wiki slug、或说「知识点练习」「快问快答」
2. **错题模式** — 用户提到「错题」「类似的题」或未指定时默认

## 模式一：知识点出题

### 第一步：读取知识点页面

1. 根据用户指定的知识点名称，从 `data/wiki/` 目录匹配对应的 Markdown 文件
   - 匹配方式：文件名包含关键词，或 frontmatter 中的 title 匹配
2. 如果用户说「给所有地理知识点出题」→ 扫描 `data/wiki/` 中 `subject: geography` 的所有文件
3. 如果用户说「给所有生物知识点出题」→ 扫描 `data/wiki/` 中 `subject: biology` 的所有文件
4. 如果用户未指定 → 列出所有可用知识点让用户选择

### 第二步：提取出题素材

对每个知识点页面，解析 Markdown 结构：

- `## 核心知识` — 选择题的主要素材（事实、概念、数据）
- `## 易混辨析` — 判断题的最佳素材（对比、辨析）
- `## 考试技巧` — 应用型选择题素材（口诀、方法、答题要点）
- `## 例题` — 可作为变换基础

### 第三步：生成题目

对每个知识点生成 5-8 道题目，题型分布：

- 2-3 道选择题（从核心知识提取）
- 1-2 道判断题（从易混辨析提取）
- 1-2 道应用型选择题（从考试技巧提取）

**判断题格式**：`question_text` 描述一个陈述，`options` 为 `[{label:"A",text:"正确"},{label:"B",text:"错误"}]`，`correct_answer` 为 "A" 或 "B"。

**选择题格式**：`question_text` 描述问题，`options` 为 4 个选项，`correct_answer` 为正确选项的 label。

**干扰项设计规则**：
- 干扰项必须与题干内容相关，不能明显无关
- 每个干扰项反映一种常见错误理解
- 正确答案在 A/B/C/D 之间大致均匀分布

### 第四步：组装 Session 并写入

生成 PracticeSession JSON 写入 `data/practice/{id}.json`：

```json
{
  "id": "2026-06-09-10-30-00",
  "title": "传染源与病原体 - 快问快答",
  "mode": "knowledge",
  "subject": "biology",
  "source_slugs": ["biology-传染源与病原体"],
  "questions": [
    {
      "id": "q-001",
      "subject": "biology",
      "chapter": "第四单元 第七章 健康地生活",
      "knowledge_points": ["传染源", "病原体"],
      "difficulty": "medium",
      "question_type": "choice",
      "question_text": "下列属于传染源的是？",
      "options": [
        { "label": "A", "text": "肝炎病毒" },
        { "label": "B", "text": "结核分枝杆菌" },
        { "label": "C", "text": "患狂犬病的狗" },
        { "label": "D", "text": "蛔虫" }
      ],
      "correct_answer": "C",
      "explanation": "传染源是能够散播病原体的人或动物。A、B、D 都是病原体（微生物或寄生虫），只有 C 是动物且携带病原体，属于传染源。",
      "practice_status": "unattempted",
      "user_answer": null
    }
  ],
  "created_at": "2026-06-09T10:30:00.000Z"
}
```

**关键**：
- `mode` 固定为 `"knowledge"`
- `question_type` 为 `"choice"` 或 `"judge"`
- `practice_status` 初始为 `"unattempted"`
- `user_answer` 初始为 `null`
- 如果覆盖多个知识点，`title` 为「综合练习 - 知识点快问快答」，`source_slugs` 列出所有涉及的 slug

### 第五步：汇报结果

输出统计：生成了 X 道题、覆盖 Y 个知识点、文件路径。

## 模式二：错题变式（原有流程）

### 第一步：读取未掌握错题

1. 扫描 `data/mistakes/` 目录下所有 JSON 文件
2. 筛选 `is_mastered === false` 的记录
3. 可选筛选：用户可指定学科（地理/生物）或章节缩小范围
4. 如果没有未掌握的错题，提示「所有错题已掌握，无需生成练习」并结束

### 第二步：读取原始题目分析

对每道未掌握的错题：

1. 读取 `data/mistakes/{id}.json` 获取关联的题目 ID
2. 读取对应的 `data/questions/{question_id}/meta.json`
3. 提取关键信息：`question_type`、`analysis.key_concept`、`analysis.answer`、`analysis.explanation`、`subject`、`difficulty`

### 第三步：生成练习题

对每道错题，基于相同知识点生成 2-3 道类似练习题：

**变换策略**：
- **换数据**：更改具体数值、地点、物种等
- **换场景**：改变问题背景但考查相同知识点
- **换问法**：改变提问角度（正向→反向、原因→结果）

### 第四步：写入文件

写入 `data/practice/{id}.json`，格式同上，但 `mode` 为 `"mistake"`，`source_mistake_id` 关联原错题。

### 第五步：汇报结果

输出统计。

## 通用规则

1. **题目质量**：考查的知识点必须准确，不能偏离
2. **答案准确**：确保正确答案和解析无误
3. **解析完整**：每道题必须有解析，不能只有答案
4. **学科匹配**：地理知识点只出地理题，生物知识点只出生物题
5. **中文输出**：所有题目和解析使用中文
6. **批量限制**：每次最多生成 30 道题，避免质量下降
7. **格式严格**：严格匹配 PracticeSession 的 JSON 结构，确保前端能正确渲染
