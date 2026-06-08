// 练习题 API 路由
import type { IncomingMessage, ServerResponse } from 'http';
import { readJson, writeJson, listFiles } from '../utils/fileStore';

function sendJson(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data));
}
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const c: Buffer[] = []; req.on('data', (d: Buffer) => c.push(d));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(c).toString())); } catch { resolve({}); } });
  });
}

export function practiceRoutes() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '', method = req.method || 'GET';

    if (method === 'GET' && (url === '/' || url === '' || url.startsWith('/?'))) {
      const files = listFiles('practice', '.json');
      let sessions = files.map(f => readJson<any>(`practice/${f}`)).filter(Boolean);
      // 支持按学科和模式过滤
      const params = new URL(url, 'http://localhost').searchParams;
      const subjectFilter = params.get('subject');
      const modeFilter = params.get('mode');
      if (subjectFilter) sessions = sessions.filter(s => s.subject === subjectFilter);
      if (modeFilter) sessions = sessions.filter(s => s.mode === modeFilter);
      sendJson(res, sessions); return;
    }

    if (method === 'POST' && (url === '/' || url === '')) {
      const body = await parseBody(req);
      const id = new Date().toISOString().replace(/[T:.]/g, '-').slice(0, 19);
      const session = { id, questions: body.questions || [], created_at: new Date().toISOString() };
      writeJson(`practice/${id}.json`, session);
      sendJson(res, session, 201); return;
    }

    const idMatch = url.match(/^\/([^/]+)$/);
    if (method === 'PUT' && idMatch) {
      const existing = readJson<any>(`practice/${idMatch[1]}.json`);
      if (!existing) { sendJson(res, { error: 'Not found' }, 404); return; }
      const body = await parseBody(req);
      const updated = { ...existing, ...body };
      writeJson(`practice/${idMatch[1]}.json`, updated);
      sendJson(res, updated); return;
    }

    next();
  };
}
