/**
 * 跨进程文件锁 — 使用 O_CREAT|O_EXCL 原子获取 + PID 过期检测
 * 仅保留同步版本
 */
import {
  openSync,
  closeSync,
  unlinkSync,
  writeSync,
  readFileSync,
  statSync,
  constants as fsConstants,
} from 'fs';
import * as path from 'path';
import { ensureDirSync } from './atomic-write.js';

// ============================================================================
// 类型定义
// ============================================================================

/** 锁句柄，传给 release 释放 */
export interface FileLockHandle {
  fd: number;
  path: string;
}

/** 锁获取选项 */
export interface FileLockOptions {
  /** 最大等待时间 (ms)，0 = 单次尝试。默认 0 */
  timeoutMs?: number;
  /** 重试间隔 (ms)。默认 50 */
  retryDelayMs?: number;
  /** 锁文件过期时间 (ms)。默认 30000 */
  staleLockMs?: number;
}

// ============================================================================
// 常量
// ============================================================================

const DEFAULT_STALE_LOCK_MS = 30_000;
const DEFAULT_RETRY_DELAY_MS = 50;

// ============================================================================
// 内部工具
// ============================================================================

/**
 * 检查进程是否存活（使用 Node.js 内置信号 0 检测）
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查现有锁文件是否过期
 * 超过 staleLockMs 且持有者 PID 已死亡则视为过期
 */
function isLockStale(lockPath: string, staleLockMs: number): boolean {
  try {
    const stat = statSync(lockPath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs < staleLockMs) return false;

    try {
      const raw = readFileSync(lockPath, 'utf-8');
      const payload = JSON.parse(raw) as { pid?: number };
      if (payload.pid && isProcessAlive(payload.pid)) return false;
    } catch {
      // 格式异常或不可读 — 超龄即过期
    }
    return true;
  } catch {
    // 锁文件已消失 — 不是过期，只是不存在
    return false;
  }
}

/**
 * 从数据文件路径推导锁文件路径
 * 例如 /path/to/data.json -> /path/to/data.json.lock
 */
export function lockPathFor(filePath: string): string {
  return filePath + '.lock';
}

// ============================================================================
// 同步 API
// ============================================================================

/**
 * 单次尝试获取文件锁（同步）
 */
function tryAcquireSync(
  lockPath: string,
  staleLockMs: number,
): FileLockHandle | null {
  ensureDirSync(path.dirname(lockPath));

  try {
    const fd = openSync(
      lockPath,
      fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
      0o600,
    );
    try {
      const payload = JSON.stringify({ pid: process.pid, timestamp: Date.now() });
      writeSync(fd, payload, null, 'utf-8');
    } catch (writeErr) {
      try { closeSync(fd); } catch { /* 已关闭 */ }
      try { unlinkSync(lockPath); } catch { /* 最佳努力 */ }
      throw writeErr;
    }
    return { fd, path: lockPath };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'EEXIST'
    ) {
      // 锁文件存在 — 检查是否过期
      if (isLockStale(lockPath, staleLockMs)) {
        try { unlinkSync(lockPath); } catch { /* 另一个进程已清理 */ }
        // 清理后立即重试一次
        try {
          const fd = openSync(
            lockPath,
            fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY,
            0o600,
          );
          try {
            const payload = JSON.stringify({ pid: process.pid, timestamp: Date.now() });
            writeSync(fd, payload, null, 'utf-8');
          } catch (writeErr) {
            try { closeSync(fd); } catch { /* 已关闭 */ }
            try { unlinkSync(lockPath); } catch { /* 最佳努力 */ }
            throw writeErr;
          }
          return { fd, path: lockPath };
        } catch {
          return null; // 另一个进程赢得了竞争
        }
      }
      return null;
    }
    throw err;
  }
}

/**
 * 获取文件锁（同步，支持超时重试）
 */
export function acquireFileLockSync(
  lockPath: string,
  opts?: FileLockOptions,
): FileLockHandle | null {
  const staleLockMs = opts?.staleLockMs ?? DEFAULT_STALE_LOCK_MS;
  const timeoutMs = opts?.timeoutMs ?? 0;
  const retryDelayMs = opts?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  const handle = tryAcquireSync(lockPath, staleLockMs);
  if (handle || timeoutMs <= 0) return handle;

  // 重试循环
  const deadline = Date.now() + timeoutMs;
  const sharedBuf = new SharedArrayBuffer(4);
  const sharedArr = new Int32Array(sharedBuf);

  while (Date.now() < deadline) {
    const waitMs = Math.min(retryDelayMs, deadline - Date.now());
    try {
      Atomics.wait(sharedArr, 0, 0, waitMs);
    } catch {
      // 主线程不支持 Atomics.wait，短暂自旋
      const waitUntil = Date.now() + waitMs;
      while (Date.now() < waitUntil) { /* 自旋 */ }
    }
    const retryHandle = tryAcquireSync(lockPath, staleLockMs);
    if (retryHandle) return retryHandle;
  }

  return null;
}

/**
 * 释放文件锁（同步）
 */
export function releaseFileLockSync(handle: FileLockHandle): void {
  try { closeSync(handle.fd); } catch { /* 已关闭 */ }
  try { unlinkSync(handle.path); } catch { /* 已移除 */ }
}

/**
 * 在文件锁保护下执行函数（同步）
 */
export function withFileLockSync<T>(
  lockPath: string,
  fn: () => T,
  opts?: FileLockOptions,
): T {
  const handle = acquireFileLockSync(lockPath, opts);
  if (!handle) {
    throw new Error(`无法获取文件锁: ${lockPath}`);
  }
  try {
    return fn();
  } finally {
    releaseFileLockSync(handle);
  }
}
