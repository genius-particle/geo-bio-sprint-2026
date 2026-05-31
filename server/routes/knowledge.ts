// 知识库 API 路由 — 使用 wiki 模块
import type { IncomingMessage, ServerResponse } from 'http';
import {
  readPage,
  listPages,
  ingestKnowledge,
  queryWiki,

  type WikiIngestInput,
  type WikiCategory,
  type WikiSubject,
} from '../utils/wiki/index.js';

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const c: Buffer[] = []; req.on('data', (d: Buffer) => c.push(d));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(c).toString())); } catch { resolve({}); } });
  });
}

/** 项目根目录 */
const ROOT = process.cwd();

export function knowledgeRoutes() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '', method = req.method || 'GET';

    // GET / — 列表
    if (method === 'GET' && (url === '/' || url === '' || url.startsWith('/?'))) {
      const filenames = listPages(ROOT);
      const pages = filenames.map(f => {
        const page = readPage(ROOT, f);
        if (!page) return null;
        return {
          slug: f.replace(/\.md$/, ''),
          title: page.frontmatter.title,
          tags: page.frontmatter.tags,
          subject: page.frontmatter.subject,
          chapter: page.frontmatter.chapter,
          category: page.frontmatter.category,
          confidence: page.frontmatter.confidence,
          updated: page.frontmatter.updated,
          content_preview: page.content.split('\n').find(l => l.trim().length > 0)?.trim().slice(0, 200) || '',
        };
      }).filter(Boolean);

      sendJson(res, pages);
      return;
    }

    // GET /search?q=关键词 — 加权搜索
    if (method === 'GET' && url.startsWith('/search')) {
      const q = new URL(url, 'http://localhost').searchParams.get('q') || '';
      if (!q.trim()) { sendJson(res, []); return; }
      const results = queryWiki(ROOT, q);
      sendJson(res, results.map(r => ({
        slug: r.page.filename.replace(/\.md$/, ''),
        title: r.page.frontmatter.title,
        tags: r.page.frontmatter.tags,
        subject: r.page.frontmatter.subject,
        chapter: r.page.frontmatter.chapter,
        category: r.page.frontmatter.category,
        confidence: r.page.frontmatter.confidence,
        score: r.score,
        snippet: r.snippet,
      })));
      return;
    }

    // GET /:slug — 读取页面
    const slugMatch = url.match(/^\/([^/?]+)(?:\?.*)?$/);
    if (method === 'GET' && slugMatch && !url.startsWith('/search')) {
      const slug = slugMatch[1];
      const filename = slug.endsWith('.md') ? slug : `${slug}.md`;
      const page = readPage(ROOT, filename);
      if (!page) { sendJson(res, { error: 'Not found' }, 404); return; }
      sendJson(res, {
        slug: slug,
        meta: {
          title: page.frontmatter.title,
          tags: page.frontmatter.tags,
          subject: page.frontmatter.subject,
          chapter: page.frontmatter.chapter,
          category: page.frontmatter.category,
          confidence: page.frontmatter.confidence,
          created: page.frontmatter.created,
          updated: page.frontmatter.updated,
          sources: page.frontmatter.sources,
          links: page.frontmatter.links,
          schemaVersion: page.frontmatter.schemaVersion,
        },
        content: page.content,
      });
      return;
    }

    // POST / — 新增/追加（使用 ingestKnowledge）
    if (method === 'POST' && (url === '/' || url === '')) {
      const body = await parseBody(req);

      const input: WikiIngestInput = {
        title: body.title || `knowledge-${Date.now()}`,
        content: body.content || '',
        tags: body.tags || [],
        category: (body.category || 'knowledge') as WikiCategory,
        sources: body.sources || [],
        confidence: body.confidence || 'medium',
        subject: (body.subject || 'geography') as WikiSubject,
        chapter: body.chapter || '',
      };

      const result = ingestKnowledge(ROOT, input);
      const slug = [...result.created, ...result.updated][0]?.replace(/\.md$/, '') || '';
      sendJson(res, { slug, ok: true, created: result.created, updated: result.updated }, 201);
      return;
    }

    next();
  };
}
