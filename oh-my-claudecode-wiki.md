I'll help you organize the wiki-related functionality in this repository. Let me first explore the repository structure and code to understand what wiki-related features exist.现在让我获取更多关于 wiki 功能的详细信息：Let me search for more wiki-related files:## 项目 Wiki 功能总结

根据代码搜索结果，**Yeachan-Heo/oh-my-claudecode** 项目中有一套完整的 LLM Wiki 知识库系统。以下是 wiki 相关功能的组织总结：

### 📁 核心结构

Wiki 系统位于 `src/hooks/wiki/` 目录，主要由以下模块组成：

| 模块 | 功能 |
|------|------|
| **types.ts** | 类型定义（页面、操作、查询选项等） |
| **storage.ts** | 文件 I/O 层、读写操作、文件锁 |
| **ingest.ts** | 知识摄入（创建/更新/合并页面） |
| **query.ts** | 页面搜索（关键词+标签匹配、CJK 支持） |
| **lint.ts** | 健康检查（孤立页、过期、断裂链接等） |
| **session-hooks.ts** | 会话生命周期钩子 |
| **index.ts** | 公共 API 导出 |

### 🎯 主要功能

#### 1. **知识摄入（Ingest）**
- 创建新页面或合并到现有页面（追加策略）
- 自动提取 wiki 链接（`[[page-name]]` 语法）
- 支持置信度级别（high/medium/low）

#### 2. **搜索查询（Query）**
- 关键词+标签搜索
- **CJK 多语言支持**（韩文、中文、日文）
  - 韩文：二元组分词
  - 中文：字符级别+二元组
  - 日文：假名二元组
- 无向量嵌入（纯关键词匹配）

#### 3. **健康检查（Lint）**
检测 6 类问题：
- 孤立页面（无入站链接）
- 过期内容（未更新超过 N 天）
- 断裂交叉引用（指向不存在的页面）
- 低置信度页面
- 超大页面
- 结构矛盾

#### 4. **存储结构**
```
.omc/wiki/
├── index.md          # 自维护目录
├── log.md            # 追加式操作日志
├── environment.md    # 项目内存/环境
├── page-slug.md      # 知识页面
└── ...
```

#### 5. **会话生命周期钩子**
- **SessionStart**：注入 wiki 上下文、延迟索引重建
- **SessionEnd**：捕获会话元数据
- **PreCompact**：为会话压缩注入 wiki 摘要

### 📋 页面元数据

```yaml
title: "Page Title"
tags: [tag1, tag2]
created: "2025-01-01T00:00:00Z"
updated: "2025-01-01T00:00:00Z"
sources: ["session-id"]
links: ["linked-page.md"]
category: "architecture|decision|pattern|debugging|environment|session-log|reference|convention"
confidence: "high|medium|low"
schemaVersion: 1
```

### 🔧 CLI 命令

位于 `commands/wiki.md` 和 `scripts/` 中的相关脚本：
- `wiki-session-start.mjs`
- `wiki-session-end.mjs`
- `wiki-pre-compact.mjs`

### ✅ 测试覆盖

- `__tests__/ingest.test.ts` - 摄入操作
- `__tests__/cjk-tokenize.test.ts` - CJK 分词
- `__tests__/crlf-parse.test.ts` - 换行符兼容性

---

**注**：搜索结果限制为 10 项，可能不完整。查看完整结果：[Code Search Results](https://github.com/search?q=repo:Yeachan-Heo/oh-my-claudecode+wiki&type=code)