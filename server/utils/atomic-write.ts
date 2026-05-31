/**
 * 原子文件写入 — temp file + rename + fsync 保证持久性
 * 仅保留同步版本，无外部依赖
 */
import {
  openSync,
  closeSync,
  writeSync,
  fsyncSync,
  renameSync,
  unlinkSync,
  mkdirSync,
  existsSync,
} from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * 递归创建目录（内联实现，确保父目录存在）
 */
export function ensureDirSync(dir: string): void {
  if (existsSync(dir)) return;
  try {
    mkdirSync(dir, { recursive: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') return;
    throw err;
  }
}

/**
 * 原子写入文件（同步版本）
 * 使用临时文件 + rename 模式确保原子性
 *
 * @param filePath 目标文件路径
 * @param content 要写入的文本内容
 */
export function atomicWriteFileSync(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tempPath = path.join(dir, `.${base}.tmp.${crypto.randomUUID()}`);

  let fd: number | null = null;
  let success = false;

  try {
    ensureDirSync(dir);

    // 独占创建临时文件 (O_CREAT | O_EXCL | O_WRONLY)
    fd = openSync(tempPath, 'wx', 0o600);
    writeSync(fd, content, 0, 'utf-8');
    fsyncSync(fd);
    closeSync(fd);
    fd = null;

    // 原子 rename 替换目标文件
    renameSync(tempPath, filePath);
    success = true;

    // 最佳努力：同步目录以确保 rename 持久化
    try {
      const dirFd = openSync(dir, 'r');
      try { fsyncSync(dirFd); } finally { closeSync(dirFd); }
    } catch {
      // 部分平台不支持目录 fsync，忽略
    }
  } finally {
    if (fd !== null) {
      try { closeSync(fd); } catch { /* 忽略 */ }
    }
    if (!success) {
      try { unlinkSync(tempPath); } catch { /* 忽略 */ }
    }
  }
}
