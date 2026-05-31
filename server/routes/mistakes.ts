// 错题 API 路由
import type { IncomingMessage, ServerResponse } from 'http';
import { readJson, writeJson, listFiles, deleteFile } from '../utils/fileStore';

function sendJson(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data));
}
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const c: Buffer[] = []; req.on('data', (d: Buffer) => c.push(d));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(c).toString())); } catch { resolve({}); } });
  });
}

export function mistakeRoutes() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '', method = req.method || 'GET';

    if (method === 'GET' && (url === '/' || url === '')) {
      const files = listFiles('mistakes', '.json');
      const mistakes = files.map(f => {
        const id = f.replace('.json', '');
        const m = readJson<any>(`mistakes/${f}`);
        const q = readJson<any>(`questions/${id}/meta.json`);
        return q ? { ...m, question: q } : null;
      }).filter(Boolean);
      sendJson(res, mistakes); return;
    }

    if (method === 'POST' && (url === '/' || url === '')) {
      const body = await parseBody(req);
      const id = body.question_id;
      const mistake = {
        question_id: id, wrong_answer: body.wrong_answer || '', correct_answer: body.correct_answer || '',
        mistake_type: body.mistake_type || 'other', review_count: 0, last_reviewed_at: null,
        next_review_at: new Date(Date.now() + 86400000).toISOString(), is_mastered: false, user_notes: body.user_notes || '',
      };
      writeJson(`mistakes/${id}.json`, mistake);
      const meta = readJson<any>(`questions/${id}/meta.json`);
      if (meta) { meta.is_mistake = true; writeJson(`questions/${id}/meta.json`, meta); }
      sendJson(res, mistake, 201); return;
    }

    const idMatch = url.match(/^\/([^/]+)$/);
    if (method === 'PUT' && idMatch) {
      const existing = readJson<any>(`mistakes/${idMatch[1]}.json`);
      if (!existing) { sendJson(res, { error: 'Not found' }, 404); return; }
      const body = await parseBody(req);
      const updated = { ...existing, ...body };
      writeJson(`mistakes/${idMatch[1]}.json`, updated);
      sendJson(res, updated); return;
    }
    if (method === 'DELETE' && idMatch) {
      deleteFile(`mistakes/${idMatch[1]}.json`);
      const meta = readJson<any>(`questions/${idMatch[1]}/meta.json`);
      if (meta) { meta.is_mistake = false; writeJson(`questions/${idMatch[1]}/meta.json`, meta); }
      sendJson(res, { ok: true }); return;
    }

    next();
  };
}
