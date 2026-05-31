/**
 * Wiki 类型定义
 *
 * 地生会考知识库的核心类型。
 * 灵感来自 Karpathy 的 LLM Wiki 概念 — 持久化、自维护的 Markdown 知识库。
 */

// ============================================================================
// 页面 Schema
// ============================================================================

/** 当前 Wiki 页面 Schema 版本 */
export const WIKI_SCHEMA_VERSION = 1;

/** Wiki 页面类别 */
export type WikiCategory =
  | 'knowledge'      // 知识点
  | 'chapter'        // 章节
  | 'topic'          // 专题
  | 'exam-tip'       // 考试技巧
  | 'mnemonic'       // 记忆口诀
  | 'course'         // 课程
  | 'session-log';   // 会话日志

/** 学科类型 */
export type WikiSubject = 'geography' | 'biology';

/** YAML frontmatter 结构 */
export interface WikiPageFrontmatter {
  /** 页面标题（人类可读） */
  title: string;
  /** 搜索标签 */
  tags: string[];
  /** 创建时间 (ISO) */
  created: string;
  /** 最后更新时间 (ISO) */
  updated: string;
  /** 来源标识（会话 ID 等） */
  sources: string[];
  /** 关联页面文件名（交叉引用） */
  links: string[];
  /** 页面类别 */
  category: WikiCategory;
  /** 知识置信度 */
  confidence: 'high' | 'medium' | 'low';
  /** Schema 版本 */
  schemaVersion: number;
  /** 学科：地理 / 生物 */
  subject: WikiSubject;
  /** 章节 */
  chapter: string;
}

/** Wiki 页面：frontmatter + markdown 内容 + 文件名 */
export interface WikiPage {
  /** 文件名（不含路径，如 "geography-中国的自然资源.md"） */
  filename: string;
  /** 解析后的 YAML frontmatter */
  frontmatter: WikiPageFrontmatter;
  /** Markdown 内容（frontmatter 之后的部分） */
  content: string;
}

// ============================================================================
// 操作类型
// ============================================================================

/** Wiki 操作日志条目 */
export interface WikiLogEntry {
  /** ISO 时间戳 */
  timestamp: string;
  /** 操作类型 */
  operation: 'ingest' | 'query' | 'lint' | 'add' | 'delete';
  /** 受影响的页面文件名 */
  pagesAffected: string[];
  /** 人类可读摘要 */
  summary: string;
}

/** Ingest 操作输入 */
export interface WikiIngestInput {
  /** 页面标题 */
  title: string;
  /** Markdown 内容 */
  content: string;
  /** 搜索标签 */
  tags: string[];
  /** 页面类别 */
  category: WikiCategory;
  /** 来源标识 */
  sources?: string[];
  /** 置信度 */
  confidence?: 'high' | 'medium' | 'low';
  /** 学科 */
  subject?: WikiSubject;
  /** 章节 */
  chapter?: string;
}

/** Ingest 操作结果 */
export interface WikiIngestResult {
  /** 创建的页面 */
  created: string[];
  /** 更新的页面（合并） */
  updated: string[];
  /** 受影响页面总数 */
  totalAffected: number;
}

/** Wiki 查询选项 */
export interface WikiQueryOptions {
  /** 按标签过滤（OR 匹配） */
  tags?: string[];
  /** 按类别过滤 */
  category?: WikiCategory;
  /** 按学科过滤 */
  subject?: WikiSubject;
  /** 最大返回数量 */
  limit?: number;
}

/** 单个查询匹配结果 */
export interface WikiQueryMatch {
  /** 匹配的页面 */
  page: WikiPage;
  /** 相关性摘要 */
  snippet: string;
  /** 匹配分数（越高越相关） */
  score: number;
}

// ============================================================================
// Lint 类型
// ============================================================================

/** Lint 问题严重程度 */
export type WikiLintSeverity = 'error' | 'warning' | 'info';

/** Lint 问题类型 */
export type WikiLintIssueType =
  | 'orphan'
  | 'stale'
  | 'broken-ref'
  | 'low-confidence'
  | 'oversized'
  | 'structural-contradiction';

/** 单个 Lint 问题 */
export interface WikiLintIssue {
  /** 有问题的页面 */
  page: string;
  /** 严重程度 */
  severity: WikiLintSeverity;
  /** 问题类型 */
  type: WikiLintIssueType;
  /** 问题描述 */
  message: string;
}

/** 完整 Lint 报告 */
export interface WikiLintReport {
  /** 所有发现的问题 */
  issues: WikiLintIssue[];
  /** 统计信息 */
  stats: {
    totalPages: number;
    orphanCount: number;
    staleCount: number;
    brokenRefCount: number;
    lowConfidenceCount: number;
    oversizedCount: number;
    contradictionCount: number;
  };
}

// ============================================================================
// 配置
// ============================================================================

/** Wiki 配置 */
export interface WikiConfig {
  /** 会话结束时是否自动捕获（默认 true） */
  autoCapture: boolean;
  /** 页面未更新多少天视为过期（默认 30） */
  staleDays: number;
  /** 页面内容最大字节数警告阈值（默认 10240） */
  maxPageSize: number;
}

/** 默认配置 */
export const DEFAULT_WIKI_CONFIG: WikiConfig = {
  autoCapture: true,
  staleDays: 30,
  maxPageSize: 10_240, // 10KB
};
