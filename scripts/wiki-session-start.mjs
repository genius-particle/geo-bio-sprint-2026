#!/usr/bin/env node
/**
 * Wiki SessionStart 钩子
 *
 * 检查 data/wiki/ 目录，读取索引或扫描页面生成上下文摘要。
 * 纯 JS 脚本，不依赖 TypeScript 编译。
 * 超时保护：3 秒内完成。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const WIKI_DIR = join(process.cwd(), 'data', 'wiki');
const TIMEOUT_MS = 3000;
const startTime = Date.now();

try {
  if (!existsSync(WIKI_DIR)) {
    // Wiki 不存在，静默退出
    process.exit(0);
  }

  // 检查超时
  if (Date.now() - startTime > TIMEOUT_MS) process.exit(0);

  // 读取页面文件列表
  const files = readdirSync(WIKI_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.md' && f !== 'log.md')
    .sort();

  if (files.length === 0) {
    process.exit(0);
  }

  // 尝试读取索引
  const indexPath = join(WIKI_DIR, 'index.md');
  let indexContent = '';
  if (existsSync(indexPath)) {
    try {
      indexContent = readFileSync(indexPath, 'utf-8');
    } catch {
      // 读取失败，忽略
    }
  }

  // 如果没有索引，从页面提取标题列表
  if (!indexContent) {
    const titles = [];
    for (const f of files.slice(0, 30)) {
      if (Date.now() - startTime > TIMEOUT_MS) break;
      try {
        const raw = readFileSync(join(WIKI_DIR, f), 'utf-8');
        const match = raw.match(/^---\n[\s\S]*?\ntitle:\s*"?([^"\n]+)"?/);
        if (match) titles.push(match[1]);
        else titles.push(f.replace(/\.md$/, ''));
      } catch {
        titles.push(f.replace(/\.md$/, ''));
      }
    }
    indexContent = titles.map(t => `- ${t}`).join('\n');
  }

  // 输出上下文摘要（Claude Code 会捕获 stdout）
  const lines = [
    `[地生冲刺 Wiki: ${files.length} 个知识点]`,
    '',
    '使用知识库 API 搜索和浏览知识点。',
    '',
    indexContent.split('\n').slice(0, 30).join('\n'),
  ];

  console.log(lines.join('\n'));
} catch {
  // 静默失败 — SessionStart 不应阻塞
}
