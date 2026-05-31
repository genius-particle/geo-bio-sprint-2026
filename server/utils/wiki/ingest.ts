/**
 * Wiki Ingest — 知识摄入模块
 *
 * 将知识处理为 Wiki 页面。单次 ingest 可创建新页面或合并到现有页面（追加策略，不覆盖）。
 */
import {
  type WikiIngestInput,
  type WikiIngestResult,
  type WikiPage,
  type WikiPageFrontmatter,
  WIKI_SCHEMA_VERSION,
} from './types.js';
import {
  withWikiLock,
  readPage,
  writePageUnsafe,
  updateIndexUnsafe,
  appendLogUnsafe,
  titleToSlug,
} from './storage.js';

/**
 * 摄入知识到 Wiki
 *
 * 如果相同 slug 的页面已存在，合并内容（追加策略）：
 * - Frontmatter: tags 取并集，追加 sources，更新时间戳，保留更高 confidence
 * - Content: 以时间戳分隔追加新内容（不覆盖）
 */
export function ingestKnowledge(root: string, input: WikiIngestInput): WikiIngestResult {
  const slug = titleToSlug(input.title, input.subject);
  const now = new Date().toISOString();
  const result: WikiIngestResult = { created: [], updated: [], totalAffected: 0 };

  withWikiLock(root, () => {
    const existing = readPage(root, slug);

    if (existing) {
      const merged = mergePage(existing, input, now);
      writePageUnsafe(root, merged);
      result.updated.push(slug);
    } else {
      const page = createPage(slug, input, now);
      writePageUnsafe(root, page);
      result.created.push(slug);
    }

    updateIndexUnsafe(root);

    appendLogUnsafe(root, {
      timestamp: now,
      operation: 'ingest',
      pagesAffected: [...result.created, ...result.updated],
      summary: existing
        ? `更新 "${input.title}" — 追加新内容`
        : `创建新页面 "${input.title}"`,
    });
  });

  result.totalAffected = result.created.length + result.updated.length;
  return result;
}

/** 从输入创建新 Wiki 页面 */
function createPage(slug: string, input: WikiIngestInput, now: string): WikiPage {
  const frontmatter: WikiPageFrontmatter = {
    title: input.title,
    tags: [...new Set(input.tags)],
    created: now,
    updated: now,
    sources: input.sources || [],
    links: extractWikiLinks(input.content),
    category: input.category,
    confidence: input.confidence || 'medium',
    schemaVersion: WIKI_SCHEMA_VERSION,
    subject: input.subject || 'geography',
    chapter: input.chapter || '',
  };

  return {
    filename: slug,
    frontmatter,
    content: `\n# ${input.title}\n\n${input.content}\n`,
  };
}

/**
 * 合并新内容到现有页面（追加策略）
 * - Tags: 并集
 * - Sources: 追加
 * - Confidence: 保留更高
 * - Content: 追加为时间戳分隔的新章节
 */
function mergePage(existing: WikiPage, input: WikiIngestInput, now: string): WikiPage {
  const mergedTags = [...new Set([...existing.frontmatter.tags, ...input.tags])];
  const mergedSources = [...new Set([...existing.frontmatter.sources, ...(input.sources || [])])];
  const mergedLinks = [...new Set([
    ...existing.frontmatter.links,
    ...extractWikiLinks(input.content),
  ])];

  const confidenceRank = { high: 3, medium: 2, low: 1 };
  const existingRank = confidenceRank[existing.frontmatter.confidence] || 2;
  const newRank = confidenceRank[input.confidence || 'medium'] || 2;
  const mergedConfidence = newRank >= existingRank
    ? (input.confidence || 'medium')
    : existing.frontmatter.confidence;

  const appendedContent = existing.content.trimEnd() +
    `\n\n---\n\n## 更新 (${now})\n\n${input.content}\n`;

  return {
    filename: existing.filename,
    frontmatter: {
      ...existing.frontmatter,
      tags: mergedTags,
      updated: now,
      sources: mergedSources,
      links: mergedLinks,
      confidence: mergedConfidence,
      subject: input.subject || existing.frontmatter.subject,
      chapter: input.chapter || existing.frontmatter.chapter,
    },
    content: appendedContent,
  };
}

/** 从内容中提取 [[wiki-link]] 引用 */
function extractWikiLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => {
    const name = m.slice(2, -2).trim();
    return titleToSlug(name);
  }))];
}
