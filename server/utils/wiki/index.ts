/**
 * Wiki 模块 — 公共 API 导出
 *
 * 地生会考知识库：持久化、自维护的 Markdown 知识库
 */

// 类型导出
export type {
  WikiPage,
  WikiPageFrontmatter,
  WikiLogEntry,
  WikiIngestInput,
  WikiIngestResult,
  WikiQueryOptions,
  WikiQueryMatch,
  WikiLintIssue,
  WikiLintReport,
  WikiCategory,
  WikiSubject,
  WikiConfig,
} from './types.js';

export { WIKI_SCHEMA_VERSION, DEFAULT_WIKI_CONFIG } from './types.js';

// 存储层导出
export {
  getWikiDir,
  ensureWikiDir,
  withWikiLock,
  readPage,
  listPages,
  readAllPages,
  readIndex,
  readLog,
  writePage,
  deletePage,
  appendLog,
  titleToSlug,
  parseFrontmatter,
  serializePage,
  writePageUnsafe,
  deletePageUnsafe,
  updateIndexUnsafe,
  appendLogUnsafe,
} from './storage.js';

// 操作导出
export { ingestKnowledge } from './ingest.js';
export { queryWiki, tokenize } from './query.js';
export { lintWiki } from './lint.js';
