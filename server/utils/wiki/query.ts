/**
 * Wiki 查询 — 关键词 + 标签搜索
 *
 * 纯关键词搜索（无向量嵌入），返回匹配页面及相关性摘要。
 */
import {
  type WikiQueryOptions,
  type WikiQueryMatch,
} from './types.js';
import {
  readAllPages,
  appendLog,
} from './storage.js';

/**
 * 对文本进行分词，支持 CJK 二元组
 *
 * 三层策略：
 * 1. Latin/数字: 完整单词 lowercase
 * 2. CJK 字符（平假名、片假名、CJK 统一表意文字、韩文）: 单字 + 二元组
 * 3. 其他文字（西里尔、阿拉伯、泰文等）: 空白分词 fallback
 */
export function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens: string[] = [];

  // Latin/数字匹配（含重音字符）
  const latinMatches = lower.match(/[a-z0-9À-ɏ]+/g);
  if (latinMatches) tokens.push(...latinMatches);

  // CJK 匹配
  const cjkPattern = /[぀-ゟ゠-ヿ一-鿿가-힯]+/g;
  const cjkMatches = lower.match(cjkPattern);
  if (cjkMatches) {
    for (const segment of cjkMatches) {
      // 单字
      for (let i = 0; i < segment.length; i++) {
        tokens.push(segment[i]);
      }
      // 二元组（相邻字符对）
      for (let i = 0; i < segment.length - 1; i++) {
        tokens.push(segment.slice(i, i + 2));
      }
    }
  }

  // Fallback: 其他文字（西里尔、阿拉伯、泰文、天城文等）
  const remaining = lower
    .replace(/[a-z0-9À-ɏ]+/g, ' ')
    .replace(cjkPattern, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0 && /\p{L}/u.test(t));
  if (remaining.length > 0) tokens.push(...remaining);

  return tokens;
}

/**
 * 搜索 Wiki 页面
 *
 * 评分规则:
 *   - 标题完全包含查询: +5
 *   - 标题包含分词结果: +2/词
 *   - Tag 匹配查询标签: +3/标签
 *   - Tag 包含分词结果: +2/词
 *   - 内容包含分词结果: +1/词
 */
export function queryWiki(
  root: string,
  queryText: string,
  options: WikiQueryOptions = {},
): WikiQueryMatch[] {
  const { tags: filterTags, category, subject, limit = 20 } = options;
  const pages = readAllPages(root);
  const queryLower = queryText.toLowerCase();
  const queryTerms = tokenize(queryText);

  const matches: WikiQueryMatch[] = [];

  for (const page of pages) {
    // 类别过滤
    if (category && page.frontmatter.category !== category) continue;
    // 学科过滤
    if (subject && page.frontmatter.subject !== subject) continue;

    let score = 0;
    let snippet = '';

    // 标签匹配（查询标签 vs 页面标签，权重 3）
    if (filterTags && filterTags.length > 0) {
      const tagOverlap = filterTags.filter(t =>
        page.frontmatter.tags.some(pt => pt.toLowerCase() === t.toLowerCase())
      );
      score += tagOverlap.length * 3;
    }

    // 查询分词匹配页面标签（权重 2）
    for (const term of queryTerms) {
      if (page.frontmatter.tags.some(t => t.toLowerCase().includes(term))) {
        score += 2;
      }
    }

    // 标题匹配（权重 5）
    const titleLower = page.frontmatter.title.toLowerCase();
    if (titleLower.includes(queryLower)) {
      score += 5;
    } else {
      for (const term of queryTerms) {
        if (titleLower.includes(term)) score += 2;
      }
    }

    // 内容匹配（权重 1/词）
    const contentLower = page.content.toLowerCase();
    for (const term of queryTerms) {
      const idx = contentLower.indexOf(term);
      if (idx !== -1) {
        score += 1;
        // 提取第一个匹配位置周围的 snippet
        if (!snippet) {
          const start = Math.max(0, idx - 40);
          const end = Math.min(contentLower.length, idx + term.length + 80);
          const raw = page.content.slice(start, end).replace(/\n+/g, ' ').trim();
          snippet = (start > 0 ? '...' : '') + raw + (end < contentLower.length ? '...' : '');
        }
      }
    }

    if (score > 0) {
      if (!snippet) {
        snippet = page.content.split('\n').find(l => l.trim().length > 0)?.trim() || '';
        if (snippet.length > 120) snippet = snippet.slice(0, 117) + '...';
      }
      matches.push({ page, snippet, score });
    }
  }

  // 按分数降序排列
  matches.sort((a, b) => b.score - a.score);
  const limited = matches.slice(0, limit);

  // 记录查询日志
  appendLog(root, {
    timestamp: new Date().toISOString(),
    operation: 'query',
    pagesAffected: limited.map(m => m.page.filename),
    summary: `查询 "${queryText}" → ${limited.length} 条结果（共 ${matches.length} 条匹配）`,
  });

  return limited;
}
