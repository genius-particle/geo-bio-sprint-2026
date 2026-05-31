#!/usr/bin/env node
/**
 * Wiki PreCompact 钩子
 *
 * 读取 wiki 页面数和最新更新时间，输出紧凑摘要。
 * 纯 JS 脚本。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const WIKI_DIR = join(process.cwd(), 'data', 'wiki');

try {
  if (!existsSync(WIKI_DIR)) {
    process.exit(0);
  }

  const files = readdirSync(WIKI_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.md' && f !== 'log.md');

  if (files.length === 0) {
    process.exit(0);
  }

  // 查找最新更新时间
  let latestUpdate = '';
  for (const f of files) {
    try {
      const stat = statSync(join(WIKI_DIR, f));
      const mtime = stat.mtime.toISOString().split('T')[0];
      if (mtime > latestUpdate) latestUpdate = mtime;
    } catch {
      // 忽略
    }
  }

  console.log(`[Wiki: ${files.length} 页 | 最新更新: ${latestUpdate || '未知'}]`);
} catch {
  // 静默失败
}
