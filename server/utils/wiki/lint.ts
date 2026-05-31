/**
 * Wiki Lint — 知识库健康检查
 *
 * 检测 6 类问题：
 * 1. 孤儿页面 — 无其他页面链接
 * 2. 过期页面 — 长时间未更新
 * 3. 断裂引用 — 链接指向不存在的页面
 * 4. 低置信度 — confidence 标记为 low
 * 5. 超大页面 — 内容超过阈值
 * 6. 结构矛盾 — 相同主题冲突的 confidence/category
 */
import {
  type WikiLintReport,
  type WikiLintIssue,
  type WikiPage,
  type WikiConfig,
  DEFAULT_WIKI_CONFIG,
} from './types.js';
import {
  readAllPages,
  appendLog,
} from './storage.js';

/**
 * 执行 Wiki 健康检查
 */
export function lintWiki(root: string, config: WikiConfig = DEFAULT_WIKI_CONFIG): WikiLintReport {
  const pages = readAllPages(root);
  const issues: WikiLintIssue[] = [];
  const pageFilenames = new Set(pages.map(p => p.filename));

  // 构建入站链接映射
  const incomingLinks = new Map<string, Set<string>>();
  for (const page of pages) {
    for (const link of page.frontmatter.links) {
      if (!incomingLinks.has(link)) incomingLinks.set(link, new Set());
      incomingLinks.get(link)!.add(page.filename);
    }
  }

  const now = Date.now();
  const staleThresholdMs = config.staleDays * 24 * 60 * 60 * 1000;

  for (const page of pages) {
    // 1. 孤儿检测 — 无入站链接
    if (!incomingLinks.has(page.filename) || incomingLinks.get(page.filename)!.size === 0) {
      issues.push({
        page: page.filename,
        severity: 'info',
        type: 'orphan',
        message: `无其他页面链接到 "${page.frontmatter.title}"`,
      });
    }

    // 2. 过期检测 — 长时间未更新
    const updatedAt = new Date(page.frontmatter.updated).getTime();
    if (now - updatedAt > staleThresholdMs) {
      const daysSince = Math.floor((now - updatedAt) / (24 * 60 * 60 * 1000));
      issues.push({
        page: page.filename,
        severity: 'warning',
        type: 'stale',
        message: `"${page.frontmatter.title}" 已 ${daysSince} 天未更新`,
      });
    }

    // 3. 断裂引用 — 链接到不存在的页面
    for (const link of page.frontmatter.links) {
      if (!pageFilenames.has(link)) {
        issues.push({
          page: page.filename,
          severity: 'error',
          type: 'broken-ref',
          message: `"${page.frontmatter.title}" 中的断裂链接: ${link}`,
        });
      }
    }

    // 4. 低置信度
    if (page.frontmatter.confidence === 'low') {
      issues.push({
        page: page.filename,
        severity: 'info',
        type: 'low-confidence',
        message: `"${page.frontmatter.title}" 置信度低 — 建议验证或移除`,
      });
    }

    // 5. 超大页面
    const contentSize = Buffer.byteLength(page.content, 'utf-8');
    if (contentSize > config.maxPageSize) {
      const sizeKB = (contentSize / 1024).toFixed(1);
      issues.push({
        page: page.filename,
        severity: 'warning',
        type: 'oversized',
        message: `"${page.frontmatter.title}" 大小 ${sizeKB}KB — 建议拆分`,
      });
    }
  }

  // 6. 结构矛盾检测
  detectStructuralContradictions(pages, issues);

  // 统计
  const stats = {
    totalPages: pages.length,
    orphanCount: issues.filter(i => i.type === 'orphan').length,
    staleCount: issues.filter(i => i.type === 'stale').length,
    brokenRefCount: issues.filter(i => i.type === 'broken-ref').length,
    lowConfidenceCount: issues.filter(i => i.type === 'low-confidence').length,
    oversizedCount: issues.filter(i => i.type === 'oversized').length,
    contradictionCount: issues.filter(i => i.type === 'structural-contradiction').length,
  };

  // 记录 lint 日志
  appendLog(root, {
    timestamp: new Date().toISOString(),
    operation: 'lint',
    pagesAffected: [...new Set(issues.map(i => i.page))],
    summary: `Lint: ${issues.length} 个问题（${stats.orphanCount} 孤儿, ${stats.staleCount} 过期, ${stats.brokenRefCount} 断裂, ${stats.contradictionCount} 矛盾）`,
  });

  return { issues, stats };
}

/**
 * 结构矛盾检测：
 * - 相同 slug 前缀但不同 confidence
 * - 相同标签但不同 category
 */
function detectStructuralContradictions(pages: WikiPage[], issues: WikiLintIssue[]): void {
  const slugGroups = new Map<string, WikiPage[]>();
  for (const page of pages) {
    const prefix = page.filename.split('-').slice(0, 2).join('-');
    if (!slugGroups.has(prefix)) slugGroups.set(prefix, []);
    slugGroups.get(prefix)!.push(page);
  }

  for (const [_prefix, group] of slugGroups) {
    if (group.length < 2) continue;

    // 检查相同主题的 confidence 冲突
    const confidences = new Set(group.map(p => p.frontmatter.confidence));
    if (confidences.size > 1 && confidences.has('high') && confidences.has('low')) {
      const titles = group.map(p => `"${p.frontmatter.title}"`).join(', ');
      issues.push({
        page: group[0].filename,
        severity: 'warning',
        type: 'structural-contradiction',
        message: `相关页面置信度冲突: ${titles}`,
      });
    }

    // 检查相同标签不同 category
    const tagCategoryPairs = new Map<string, Set<string>>();
    for (const page of group) {
      for (const tag of page.frontmatter.tags) {
        if (!tagCategoryPairs.has(tag)) tagCategoryPairs.set(tag, new Set());
        tagCategoryPairs.get(tag)!.add(page.frontmatter.category);
      }
    }

    for (const [tag, categories] of tagCategoryPairs) {
      if (categories.size > 1) {
        issues.push({
          page: group[0].filename,
          severity: 'info',
          type: 'structural-contradiction',
          message: `标签 "${tag}" 出现在不同类别的页面中: ${[...categories].join(', ')}`,
        });
        break; // 每组一个问题即可
      }
    }
  }
}
