#!/usr/bin/env node
/**
 * 从 data/books-raw 合并结构化文本 + OCR 缓存，输出规范 Markdown 到 data/books/
 * 用法：
 *   node scripts/clean-books.mjs              # 合并输出
 *   node scripts/clean-books.mjs --list-pending  # 列出待 OCR 图片
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, 'data/books-raw');
const OUT_DIR = path.join(ROOT, 'data/books');
const CACHE_DIR = path.join(ROOT, 'data/books/.ocr-cache');

/** raw 目录名关键词 → { slug, output } */
const BOOK_MAP = [
  { match: '生物七年级上册', slug: 'bio-7a', output: '人教版初中生物七年级上册知识点.md' },
  { match: '生物七年级下册', slug: 'bio-7b', output: '人教版初中生物七年级下册知识点.md' },
  { match: '生物八年级上册', slug: 'bio-8a', output: '人教版初中生物八年级上册知识点.md' },
  { match: '生物八年级下册', slug: 'bio-8b', output: '人教版初中生物八年级下册知识点.md' },
  { match: '地理七年级上册', slug: 'geo-7a', output: '人教版初中地理七年级上册知识点.md' },
  { match: '地理七年级下册', slug: 'geo-7b', output: '人教版初中地理七年级下册知识点.md' },
  { match: '地理八年级上册', slug: 'geo-8a', output: '人教版初中地理八年级上册知识点.md' },
  { match: '地理八年级下册', slug: 'geo-8b', output: '人教版初中地理八年级下册知识点.md' },
];

function resolveBook(dirName) {
  const entry = BOOK_MAP.find(b => dirName.includes(b.match));
  if (!entry) throw new Error(`无法映射书籍目录: ${dirName}`);
  return entry;
}

function findModelJson(bookDir) {
  const files = fs.readdirSync(bookDir);
  const model = files.find(f => f.endsWith('_model.json'));
  if (!model) throw new Error(`缺少 model.json: ${bookDir}`);
  return path.join(bookDir, model);
}

/** 从 full.md 按文档顺序提取图片文件名 */
function imageRefsFromFull(bookDir) {
  const fullPath = path.join(bookDir, 'full.md');
  if (!fs.existsSync(fullPath)) return [];
  const text = fs.readFileSync(fullPath, 'utf8');
  return [...text.matchAll(/!\[\]\(images\/([^)]+)\)/g)].map(m => m[1]);
}

function loadBlocks(bookDir) {
  const raw = JSON.parse(fs.readFileSync(findModelJson(bookDir), 'utf8'));
  return Array.isArray(raw[0]) ? raw[0] : raw;
}

/** 剥离 HTML / Word 导出标签，转为 Markdown 片段 */
function htmlToMarkdown(html) {
  if (!html || typeof html !== 'string') return '';
  let s = html;

  s = s.replace(/<text\s+style=["']bold["']>([\s\S]*?)<\/text>/gi, '**$1**');

  if (/<table[\s>]/i.test(s)) return htmlTableToMd(s);

  s = s.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
  s = s.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
  s = s.replace(/<u>([\s\S]*?)<\/u>/gi, '$1');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>\s*<p[^>]*>/gi, '\n');
  s = s.replace(/<\/?p[^>]*>/gi, '');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/g, ' ');
  s = s.replace(/\u00a0/g, ' ');
  return s.trim();
}

function stripTags(cell) {
  return htmlToMarkdown(cell).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
}

function htmlTableToMd(html) {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (!rows.length) return stripTags(html);

  const mdRows = rows.map(row => {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
    if (!cells.length) return '';
    const parts = cells.map(c => stripTags(c[1]));
    return '| ' + parts.join(' | ') + ' |';
  }).filter(r => r.replace(/\|/g, '').trim().length > 0);

  if (!mdRows.length) return '';
  const colCount = mdRows[0].split('|').length - 2;
  const sep = '|' + Array(colCount).fill(' --- ').join('|') + '|';
  return [mdRows[0], sep, ...mdRows.slice(1)].join('\n');
}

/** 识别章/节标题并加 Markdown 层级 */
function normalizeHeading(text) {
  const t = text.trim();
  if (!t) return '';

  if (/^#{1,6}\s/.test(t)) return t;

  const inner = t.replace(/^\*\*(.+)\*\*$/, '$1').trim();

  if (/^第[一二三四五六七八九十\d]+章/.test(inner)) return `## ${inner}`;
  if (/^第[一二三四五六七八九十\d]+节/.test(inner)) return `### ${inner}`;
  if (/^[一二三四五六七八九十]+、/.test(inner)) return `## ${inner}`;
  if (/^（[一二三四五六七八九十]+）/.test(inner)) return `### ${inner}`;

  return t;
}

function blockToMarkdown(block) {
  const type = block.type;
  const content = block.content;

  if (type === 'table') {
    return htmlTableToMd(typeof content === 'string' ? content : '');
  }

  if (type === 'title') {
    const titleContent = content?.title_content;
    if (Array.isArray(titleContent)) {
      const text = titleContent.map(p => p.content || '').join('');
      const level = content?.level || 1;
      const hashes = '#'.repeat(Math.min(level + 1, 4));
      return `${hashes} ${htmlToMarkdown(text)}`;
    }
    return normalizeHeading(htmlToMarkdown(String(content || '')));
  }

  if (type === 'list') {
    const items = content?.list_items || content?.items || [];
    if (!Array.isArray(items)) return htmlToMarkdown(String(content || ''));
    return items.map((item, i) => {
      const parts = item?.item_content || item?.paragraph_content || [];
      const text = Array.isArray(parts)
        ? parts.map(p => {
            const c = p.content || '';
            return p.style?.includes?.('bold') || (Array.isArray(p.style) && p.style.includes('bold'))
              ? `**${c}**` : c;
          }).join('')
        : String(item);
      return `${i + 1}. ${htmlToMarkdown(text)}`;
    }).join('\n');
  }

  if (type === 'text' || type === 'paragraph') {
    if (typeof content === 'object' && content?.paragraph_content) {
      const text = content.paragraph_content.map(p => {
        const c = p.content || '';
        const bold = Array.isArray(p.style) && p.style.includes('bold');
        return bold ? `**${c}**` : c;
      }).join('');
      return normalizeHeading(htmlToMarkdown(text));
    }
    return normalizeHeading(htmlToMarkdown(String(content || '')));
  }

  return '';
}

function getTextSnippet(block) {
  const md = blockToMarkdown(block);
  return md.replace(/\*\*/g, '').trim().slice(0, 200);
}

function loadOcrCache(slug, filename) {
  const p = path.join(CACHE_DIR, slug, filename + '.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function postProcess(text) {
  return text
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}

/** 收集每本书的图片任务（含上下文） */
function collectImageTasks(bookDir, slug) {
  const blocks = loadBlocks(bookDir);
  const imageRefs = imageRefsFromFull(bookDir);
  let imageIdx = 0;
  const tasks = [];
  const recentText = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'image') {
      const filename = imageRefs[imageIdx];
      imageIdx++;
      if (!filename) continue;

      const before = recentText.slice(-2);
      const after = [];
      for (let j = i + 1; j < blocks.length && after.length < 2; j++) {
        if (blocks[j].type === 'text' || blocks[j].type === 'title' || blocks[j].type === 'paragraph') {
          const snip = getTextSnippet(blocks[j]);
          if (snip) after.push(snip);
        } else if (blocks[j].type === 'image') break;
      }

      const cached = loadOcrCache(slug, filename);
      tasks.push({ filename, before, after, cached: !!cached, bookDir, slug });
    } else if (['text', 'title', 'paragraph', 'table', 'list'].includes(block.type)) {
      const snip = getTextSnippet(block);
      if (snip) {
        recentText.push(snip);
        if (recentText.length > 4) recentText.shift();
      }
    }
  }
  return tasks;
}

function mergeBook(bookDir, slug, outputName) {
  const blocks = loadBlocks(bookDir);
  const imageRefs = imageRefsFromFull(bookDir);
  let imageIdx = 0;
  const parts = [];
  const stats = { text: 0, table: 0, image: 0, extracted: 0, skipped: 0, missing: [] };

  for (const block of blocks) {
    if (block.type === 'image') {
      stats.image++;
      const filename = imageRefs[imageIdx++];
      if (!filename) continue;

      const cache = loadOcrCache(slug, filename);
      if (!cache) {
        stats.missing.push(filename);
        continue;
      }
      if (cache.action === 'skip') {
        stats.skipped++;
        continue;
      }
      if (cache.markdown?.trim()) {
        parts.push(cache.markdown.trim());
        stats.extracted++;
      }
      continue;
    }

    if (block.type === 'table') stats.table++;
    else if (['text', 'title', 'paragraph', 'list'].includes(block.type)) stats.text++;

    const md = blockToMarkdown(block);
    if (md) parts.push(md);
  }

  const content = postProcess(parts.join('\n\n'));
  return { content, stats, outputName };
}

function discoverBooks() {
  return fs.readdirSync(RAW_DIR)
    .filter(name => fs.statSync(path.join(RAW_DIR, name)).isDirectory())
    .map(name => ({ name, dir: path.join(RAW_DIR, name), ...resolveBook(name) }));
}

function cmdListPending() {
  const books = discoverBooks();
  let total = 0;
  for (const book of books) {
    const tasks = collectImageTasks(book.dir, book.slug);
    const pending = tasks.filter(t => !t.cached);
    if (!tasks.length) continue;
    console.log(`\n## ${book.output} (${book.slug}) — ${pending.length}/${tasks.length} 待 OCR`);
    for (const t of pending) {
      total++;
      console.log(`  - images/${t.filename}`);
      if (t.before.length) console.log(`    前文: ${t.before.join(' | ').slice(0, 120)}`);
      if (t.after.length) console.log(`    后文: ${t.after.join(' | ').slice(0, 120)}`);
    }
  }
  console.log(`\n合计待 OCR: ${total} 张`);
  return total;
}

function cmdMerge() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const books = discoverBooks();
  const report = ['# books 清洗报告', '', `生成时间: ${new Date().toISOString()}`, ''];

  let hasMissing = false;

  for (const book of books) {
    const { content, stats, outputName } = mergeBook(book.dir, book.slug, book.output);
    const outPath = path.join(OUT_DIR, outputName);
    fs.writeFileSync(outPath, content, 'utf8');

    report.push(`## ${outputName}`);
    report.push(`- 文本块: ${stats.text}`);
    report.push(`- 表格块: ${stats.table}`);
    report.push(`- 图片块: ${stats.image}（提取 ${stats.extracted}，跳过 ${stats.skipped}）`);
    report.push(`- 输出行数: ${content.split('\n').length}`);
    if (stats.missing.length) {
      hasMissing = true;
      report.push(`- ⚠️ 缺少 OCR 缓存: ${stats.missing.join(', ')}`);
    }
    report.push('');

    console.log(`✓ ${outputName} (${content.split('\n').length} 行)`);
    if (stats.missing.length) {
      console.warn(`  ⚠️ 缺少 ${stats.missing.length} 张图片 OCR 缓存`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'clean-report.md'), report.join('\n'), 'utf8');
  console.log('\n报告: data/books/clean-report.md');

  if (hasMissing) {
    console.error('\n存在未 OCR 图片，请先运行 --list-pending 并完成 OCR');
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.includes('--list-pending')) {
  const n = cmdListPending();
  process.exit(n > 0 ? 2 : 0);
} else {
  cmdMerge();
}
