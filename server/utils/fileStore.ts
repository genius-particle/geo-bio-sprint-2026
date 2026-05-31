// 文件存储工具 - JSON 读写 + 图片存储
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

export function readJson<T>(filePath: string): T | null {
  const full = join(DATA_DIR, filePath);
  if (!existsSync(full)) return null;
  try { return JSON.parse(readFileSync(full, 'utf-8')); } catch { return null; }
}

export function writeJson(filePath: string, data: any): void {
  const full = join(DATA_DIR, filePath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, JSON.stringify(data, null, 2), 'utf-8');
}

export function listDirs(dirPath: string): string[] {
  const full = join(DATA_DIR, dirPath);
  if (!existsSync(full)) return [];
  return readdirSync(full, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
}

export function listFiles(dirPath: string, ext?: string): string[] {
  const full = join(DATA_DIR, dirPath);
  if (!existsSync(full)) return [];
  return readdirSync(full).filter(f => !ext || f.endsWith(ext));
}

export function writeImage(filePath: string, buffer: Buffer): void {
  const full = join(DATA_DIR, filePath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, buffer);
}

export function readImage(filePath: string): Buffer | null {
  const full = join(DATA_DIR, filePath);
  if (!existsSync(full)) return null;
  return readFileSync(full);
}

export function deleteFile(filePath: string): boolean {
  const full = join(DATA_DIR, filePath);
  if (!existsSync(full)) return false;
  unlinkSync(full);
  return true;
}

export function exists(filePath: string): boolean {
  return existsSync(join(DATA_DIR, filePath));
}
