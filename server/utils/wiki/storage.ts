/**
 * Wiki 存储层
 *
 * 文件 I/O 层，所有写操作通过 withWikiLock 跨进程互斥。
 *
 * 存储布局:
 *   data/wiki/
 *   ├── index.md      (自动维护的目录)
 *   ├── log.md         (追加式操作日志)
 *   ├── subject-标题.md (知识页面)
 *   └── ...
 */
import { existsSync, readFileSync, readdirSync, unlinkSync, mkdirSync } from 'fs';
import { join, resolve, sep } from 'path';
import { atomicWriteFileSync } from '../atomic-write.js';
import { ensureDirSync } from '../atomic-write.js';
import { lockPathFor, withFileLockSync } from '../file-lock.js';
import {
  type WikiPage,
  type WikiPageFrontmatter,
  type WikiLogEntry,
  WIKI_SCHEMA_VERSION,
} from './types.js';

// ============================================================================
// 常量
// ============================================================================

const WIKI_DIR_NAME = 'wiki';
const INDEX_FILE = 'index.md';
const LOG_FILE = 'log.md';
const RESERVED_FILES = new Set([INDEX_FILE, LOG_FILE]);

// ============================================================================
// 路径工具
// ============================================================================

/** 获取项目根目录下的 wiki 目录路径 */
export function getWikiDir(root: string): string {
  return join(root, 'data', WIKI_DIR_NAME);
}

/** 确保 wiki 目录存在 */
export function ensureWikiDir(root: string): string {
  const wikiDir = getWikiDir(root);
  if (!existsSync(wikiDir)) {
    mkdirSync(wikiDir, { recursive: true });
  }
  return wikiDir;
}

// ============================================================================
// 互斥边界
// ============================================================================

/**
 * 在 wiki 文件锁保护下执行函数。
 * 所有写操作必须通过此边界。
 */
export function withWikiLock<T>(root: string, fn: () => T): T {
  const wikiDir = ensureWikiDir(root);
  const lockPath = lockPathFor(join(wikiDir, '.wiki-lock'));
  return withFileLockSync(lockPath, fn, { timeoutMs: 5_000, retryDelayMs: 50 });
}

// ============================================================================
// Frontmatter 解析
// ============================================================================

/**
 * 从 Markdown 内容解析 YAML frontmatter。
 * 期望格式: `---\n...\n---\n`
 */
export function parseFrontmatter(raw: string): { frontmatter: WikiPageFrontmatter; content: string } | null {
  const normalized = raw.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const yamlBlock = match[1];
  const content = match[2];

  try {
    const fm = parseSimpleYaml(yamlBlock);
    const frontmatter: WikiPageFrontmatter = {
      title: String(fm.title || ''),
      tags: parseYamlArray(fm.tags),
      created: String(fm.created || new Date().toISOString()),
      updated: String(fm.updated || new Date().toISOString()),
      sources: parseYamlArray(fm.sources),
      links: parseYamlArray(fm.links),
      category: (fm.category || 'knowledge') as WikiPageFrontmatter['category'],
      confidence: (fm.confidence || 'medium') as WikiPageFrontmatter['confidence'],
      schemaVersion: Number(fm.schemaVersion) || WIKI_SCHEMA_VERSION,
      subject: (fm.subject || 'geography') as WikiPageFrontmatter['subject'],
      chapter: String(fm.chapter || ''),
    };
    return { frontmatter, content };
  } catch {
    return null;
  }
}

/** 简单 YAML 解析器（仅支持 key: value，无嵌套） */
function parseSimpleYaml(yaml: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // 去除引号并反转义
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\(\\|"|n|r)/g, (_, ch) => {
        if (ch === 'n') return '\n'; if (ch === 'r') return '\r'; return ch;
      });
    }
    if (key) result[key] = value;
  }
  return result;
}

/** 解析 YAML 数组: [item1, item2] 或纯字符串 -> string[] */
function parseYamlArray(value: string | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, '').replace(/\\(\\|"|n|r)/g, (_, ch) => {
        if (ch === 'n') return '\n'; if (ch === 'r') return '\r'; return ch;
      }))
      .filter(Boolean);
  }
  return trimmed ? [trimmed] : [];
}

/** YAML 双引号内转义 */
function escapeYaml(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

/**
 * 将 frontmatter + 内容序列化为 Markdown 字符串
 */
export function serializePage(page: WikiPage): string {
  const fm = page.frontmatter;
  const yaml = [
    `title: "${escapeYaml(fm.title)}"`,
    `tags: [${fm.tags.map(t => `"${escapeYaml(t)}"`).join(', ')}]`,
    `created: ${fm.created}`,
    `updated: ${fm.updated}`,
    `sources: [${fm.sources.map(s => `"${escapeYaml(s)}"`).join(', ')}]`,
    `links: [${fm.links.map(l => `"${escapeYaml(l)}"`).join(', ')}]`,
    `category: ${fm.category}`,
    `confidence: ${fm.confidence}`,
    `schemaVersion: ${fm.schemaVersion}`,
    `subject: ${fm.subject}`,
    `chapter: "${escapeYaml(fm.chapter)}"`,
  ].join('\n');

  return `---\n${yaml}\n---\n${page.content}`;
}

// ============================================================================
// 路径安全
// ============================================================================

/**
 * 验证文件名安全（防止路径遍历）
 */
function safeWikiPath(wikiDir: string, filename: string): string | null {
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return null;
  }
  const filePath = join(wikiDir, filename);
  const resolved = resolve(filePath);
  if (!resolved.startsWith(resolve(wikiDir) + sep)) {
    return null;
  }
  return filePath;
}

// ============================================================================
// 读操作（无需锁）
// ============================================================================

/** 按文件名读取单个 Wiki 页面，不存在或无法解析返回 null */
export function readPage(root: string, filename: string): WikiPage | null {
  const wikiDir = getWikiDir(root);
  const filePath = safeWikiPath(wikiDir, filename);
  if (!filePath) return null;
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = parseFrontmatter(raw);
    if (!parsed) return null;
    return { filename, frontmatter: parsed.frontmatter, content: parsed.content };
  } catch {
    return null;
  }
}

/** 列出所有 Wiki 页面文件名（排除 index.md 和 log.md） */
export function listPages(root: string): string[] {
  const wikiDir = getWikiDir(root);
  if (!existsSync(wikiDir)) return [];
  return readdirSync(wikiDir)
    .filter(f => f.endsWith('.md') && !RESERVED_FILES.has(f))
    .sort();
}

/** 读取所有 Wiki 页面 */
export function readAllPages(root: string): WikiPage[] {
  return listPages(root)
    .map(f => readPage(root, f))
    .filter((p): p is WikiPage => p !== null);
}

/** 读取 index.md 内容，不存在返回 null */
export function readIndex(root: string): string | null {
  const indexPath = join(getWikiDir(root), INDEX_FILE);
  if (!existsSync(indexPath)) return null;
  return readFileSync(indexPath, 'utf-8');
}

/** 读取 log.md 内容，不存在返回 null */
export function readLog(root: string): string | null {
  const logPath = join(getWikiDir(root), LOG_FILE);
  if (!existsSync(logPath)) return null;
  return readFileSync(logPath, 'utf-8');
}

// ============================================================================
// 写操作（必须在 withWikiLock 内调用）
// ============================================================================

/** 写入 Wiki 页面。必须在 withWikiLock 内调用 */
export function writePageUnsafe(root: string, page: WikiPage): void {
  if (RESERVED_FILES.has(page.filename)) {
    throw new Error(`不能写入保留文件: ${page.filename}`);
  }
  const wikiDir = ensureWikiDir(root);
  const filePath = safeWikiPath(wikiDir, page.filename);
  if (!filePath) throw new Error(`无效的 Wiki 文件名: ${page.filename}`);
  atomicWriteFileSync(filePath, serializePage(page));
}

/** 删除 Wiki 页面。必须在 withWikiLock 内调用 */
export function deletePageUnsafe(root: string, filename: string): boolean {
  const wikiDir = getWikiDir(root);
  const filePath = safeWikiPath(wikiDir, filename);
  if (!filePath) return false;
  if (!existsSync(filePath)) return false;
  unlinkSync(filePath);
  return true;
}

/**
 * 从所有页面重新生成 index.md。必须在 withWikiLock 内调用。
 * 按学科（地理/生物）分组
 */
export function updateIndexUnsafe(root: string): void {
  const pages = readAllPages(root);

  // 按学科分组
  const bySubject = new Map<string, WikiPage[]>();
  const subjectLabels: Record<string, string> = {
    geography: '地理',
    biology: '生物',
  };

  for (const page of pages) {
    const subj = page.frontmatter.subject || 'geography';
    if (!bySubject.has(subj)) bySubject.set(subj, []);
    bySubject.get(subj)!.push(page);
  }

  const lines: string[] = [
    '# Wiki 索引', '',
    `> ${pages.length} 个页面 | 更新时间: ${new Date().toISOString()}`, '',
  ];

  const sortedSubjects = [...bySubject.keys()].sort();
  for (const subj of sortedSubjects) {
    const label = subjectLabels[subj] || subj;
    lines.push(`## ${label}`, '');
    for (const page of bySubject.get(subj)!) {
      const summary = page.content.split('\n').find(l => l.trim().length > 0)?.trim() || '';
      const truncated = summary.length > 80 ? summary.slice(0, 77) + '...' : summary;
      lines.push(`- [${page.frontmatter.title}](${page.filename}) — ${truncated}`);
    }
    lines.push('');
  }

  const wikiDir = ensureWikiDir(root);
  atomicWriteFileSync(join(wikiDir, INDEX_FILE), lines.join('\n'));
}

/** 追加日志条目到 log.md。必须在 withWikiLock 内调用 */
export function appendLogUnsafe(root: string, entry: WikiLogEntry): void {
  const wikiDir = ensureWikiDir(root);
  const logPath = join(wikiDir, LOG_FILE);

  const logLine = `## [${entry.timestamp}] ${entry.operation}\n` +
    `- **页面:** ${entry.pagesAffected.join(', ') || '无'}\n` +
    `- **摘要:** ${entry.summary}\n\n`;

  let existing = '';
  if (existsSync(logPath)) {
    existing = readFileSync(logPath, 'utf-8');
  } else {
    existing = '# Wiki 日志\n\n';
  }

  atomicWriteFileSync(logPath, existing + logLine);
}

// ============================================================================
// 安全写操作（内部获取锁）
// ============================================================================

/** 写入页面并自动加锁、更新索引 */
export function writePage(root: string, page: WikiPage): void {
  withWikiLock(root, () => {
    writePageUnsafe(root, page);
    updateIndexUnsafe(root);
  });
}

/** 删除页面并自动加锁、更新索引 */
export function deletePage(root: string, filename: string): boolean {
  return withWikiLock(root, () => {
    const result = deletePageUnsafe(root, filename);
    if (result) updateIndexUnsafe(root);
    return result;
  });
}

/** 追加日志并自动加锁 */
export function appendLog(root: string, entry: WikiLogEntry): void {
  withWikiLock(root, () => {
    appendLogUnsafe(root, entry);
  });
}

// ============================================================================
// Slug 工具
// ============================================================================

/**
 * 将标题转为文件名 slug。
 * 保留 CJK 字符（如 geography-中国的自然资源.md）。
 * 对纯 CJK 标题不使用 hash fallback，而是用 subject-标题.md 格式。
 */
export function titleToSlug(title: string, subject?: string): string {
  // 保留 CJK、字母、数字、空格、连字符
  const cleaned = title
    .replace(/[^\w぀-ゟ゠-ヿ一-鿿가-힯\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  if (!cleaned) {
    // 纯特殊字符标题，使用时间戳 fallback
    return `page-${Date.now()}.md`;
  }

  // 如果有学科前缀且标题不含学科前缀，添加之
  const prefix = subject ? `${subject}-` : '';
  const result = prefix + cleaned;

  return result.endsWith('.md') ? result : `${result}.md`;
}
