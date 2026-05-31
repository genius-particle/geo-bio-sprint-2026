import { mkdirSync } from 'fs';
import { join } from 'path';
import os from 'os';
import type { ViteDevServer } from 'vite';
import { questionRoutes } from './routes/questions';
import { mistakeRoutes } from './routes/mistakes';
import { knowledgeRoutes } from './routes/knowledge';
import { practiceRoutes } from './routes/practice';

export function registerApiRoutes(server: ViteDevServer) {
  const dataDir = join(process.cwd(), 'data');
  for (const d of ['questions', 'mistakes', 'wiki', 'practice', 'reports']) {
    mkdirSync(join(dataDir, d), { recursive: true });
  }

  server.middlewares.use('/api/questions', questionRoutes());
  server.middlewares.use('/api/mistakes', mistakeRoutes());
  server.middlewares.use('/api/knowledge', knowledgeRoutes());
  server.middlewares.use('/api/practice', practiceRoutes());

  // 打印局域网 IP
  const nets = os.networkInterfaces();
  const addrs = Object.values(nets).flat().filter((a: any) => a?.family === 'IPv4' && !a?.internal).map((a: any) => a.address);
  if (addrs.length) console.log(`\n📱 手机访问: http://${addrs[0]}:3000\n`);
}
