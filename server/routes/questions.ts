// 题目 API 路由
import type { IncomingMessage, ServerResponse } from 'http';
import { readJson, writeJson, listDirs, writeImage, readImage, deleteFile } from '../utils/fileStore';

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, data: any, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function questionRoutes() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '';
    const method = req.method || 'GET';

    // GET / — 列表
    if (method === 'GET' && (url === '/' || url === '' || url.startsWith('/?'))) {
      const dirs = listDirs('questions');
      const questions = dirs.map(id => readJson<any>(`questions/${id}/meta.json`)).filter(Boolean);
      sendJson(res, questions);
      return;
    }

    // POST / — 新增
    if (method === 'POST' && (url === '/' || url === '')) {
      const body = await parseBody(req);
      const id = new Date().toISOString().replace(/[T:.]/g, '-').slice(0, 19);
      const meta = {
        id, subject: body.subject || 'geography', chapter: body.chapter || '',
        knowledge_points: [], difficulty: 'unknown', question_type: 'unknown',
        ocr_text: '', source: body.source || '', source_detail: body.source_detail || '',
        tags: [], is_mistake: body.is_mistake || false, analysis_status: 'pending',
        notes: body.notes || '', created_at: new Date().toISOString(),
      };
      if (body.image_base64) {
        const b64 = body.image_base64.includes(',') ? body.image_base64.split(',')[1] : body.image_base64;
        writeImage(`questions/${id}/image.jpg`, Buffer.from(b64, 'base64'));
      }
      writeJson(`questions/${id}/meta.json`, meta);
      if (body.is_mistake) {
        writeJson(`mistakes/${id}.json`, {
          question_id: id, wrong_answer: '', correct_answer: '', mistake_type: 'other',
          review_count: 0, last_reviewed_at: null,
          next_review_at: new Date(Date.now() + 86400000).toISOString(),
          is_mastered: false, user_notes: '',
        });
      }
      sendJson(res, meta, 201);
      return;
    }

    // GET /:id/image
    const imgMatch = url.match(/^\/([^/]+)\/image$/);
    if (method === 'GET' && imgMatch) {
      const img = readImage(`questions/${imgMatch[1]}/image.jpg`);
      if (!img) { sendJson(res, { error: 'Not found' }, 404); return; }
      res.writeHead(200, { 'Content-Type': 'image/jpeg' }); res.end(img); return;
    }

    // GET /:id
    const idMatch = url.match(/^\/([^/?]+)(?:\?.*)?$/);
    if (method === 'GET' && idMatch && !url.includes('search')) {
      const meta = readJson(`questions/${idMatch[1]}/meta.json`);
      if (!meta) { sendJson(res, { error: 'Not found' }, 404); return; }
      sendJson(res, meta); return;
    }

    // PUT /:id
    const putMatch = url.match(/^\/([^/]+)$/);
    if (method === 'PUT' && putMatch) {
      const existing = readJson(`questions/${putMatch[1]}/meta.json`);
      if (!existing) { sendJson(res, { error: 'Not found' }, 404); return; }
      const body = await parseBody(req);
      const updated = { ...(existing as Record<string, any>), ...body, id: putMatch[1] };
      writeJson(`questions/${putMatch[1]}/meta.json`, updated);
      sendJson(res, updated); return;
    }

    // DELETE /:id
    if (method === 'DELETE' && putMatch) {
      deleteFile(`questions/${putMatch[1]}/meta.json`);
      deleteFile(`questions/${putMatch[1]}/image.jpg`);
      sendJson(res, { ok: true }); return;
    }

    next();
  };
}
