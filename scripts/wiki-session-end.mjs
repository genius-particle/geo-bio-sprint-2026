#!/usr/bin/env node
/**
 * Wiki SessionEnd 钩子
 *
 * 追加会话日志到 data/wiki/log.md。
 * 纯 JS 脚本，不做重量级操作，保持快速。
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const WIKI_DIR = join(process.cwd(), 'data', 'wiki');

try {
  if (!existsSync(WIKI_DIR)) {
    // Wiki 不存在，直接退出
    process.exit(0);
  }

  const now = new Date().toISOString();
  const dateSlug = now.split('T')[0]; // YYYY-MM-DD

  // 追加简单的会话日志
  const logEntry = `## [${now}] session-end\n` +
    `- **页面:** 无\n` +
    `- **摘要:** 会话结束 ${dateSlug}\n\n`;

  const logPath = join(WIKI_DIR, 'log.md');
  let existing = '';
  if (existsSync(logPath)) {
    existing = readFileSync(logPath, 'utf-8');
  } else {
    existing = '# Wiki 日志\n\n';
  }

  writeFileSync(logPath, existing + logEntry, 'utf-8');
} catch {
  // 静默失败 — SessionEnd 不应阻塞
}
