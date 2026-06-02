// 题目 API 路由
import type { IncomingMessage, ServerResponse } from 'http';
import { readJson, writeJson, listDirs, writeImage, readImage, deleteFile, exists } from '../utils/fileStore';

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

    // POST / — 新增（支持多图）
    if (method === 'POST' && (url === '/' || url === '')) {
      const body = await parseBody(req);
      const id = new Date().toISOString().replace(/[T:.]/g, '-').slice(0, 19);

      // 兼容单图和多图：image_base64_list > image_base64
      const images: string[] = body.image_base64_list || (body.image_base64 ? [body.image_base64] : []);
      if (images.length > 5) { sendJson(res, { error: '最多上传 5 张图片' }, 400); return; }
      const imageCount = images.length;

      const meta = {
        id, subject: body.subject || 'geography', chapter: body.chapter || '',
        knowledge_points: [], difficulty: 'unknown', question_type: 'unknown',
        ocr_text: '', source: body.source || '', source_detail: body.source_detail || '',
        tags: [], is_mistake: body.is_mistake || false, analysis_status: 'pending',
        image_count: imageCount,
        notes: body.notes || '', created_at: new Date().toISOString(),
      };

      // 存储多张图片：image-1.jpg, image-2.jpg, ...
      images.forEach((b64, i) => {
        const raw = b64.includes(',') ? b64.split(',')[1] : b64;
        writeImage(`questions/${id}/image-${i + 1}.jpg`, Buffer.from(raw, 'base64'));
      });

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

    // GET /:id/images — 获取题目图片索引列表
    const imagesMatch = url.match(/^\/([^/]+)\/images$/);
    if (method === 'GET' && imagesMatch) {
      const qid = imagesMatch[1];
      const meta = readJson<any>(`questions/${qid}/meta.json`);
      if (!meta) { sendJson(res, { error: 'Not found' }, 404); return; }

      // 兼容旧数据：优先按 image_count 查找，回退查找 image.jpg
      const count: number = meta.image_count || 0;
      if (count > 0) {
        const indices = [];
        for (let i = 1; i <= count; i++) {
          if (exists(`questions/${qid}/image-${i}.jpg`)) indices.push(i);
        }
        sendJson(res, { images: indices });
      } else if (exists(`questions/${qid}/image.jpg`)) {
        sendJson(res, { images: [1] });
      } else {
        sendJson(res, { images: [] });
      }
      return;
    }

    // GET /:id/image/:index — 获取指定序号的图片
    const imgIdxMatch = url.match(/^\/([^/]+)\/image\/(\d+)$/);
    if (method === 'GET' && imgIdxMatch) {
      const qid = imgIdxMatch[1];
      const idx = parseInt(imgIdxMatch[2], 10);
      // 新格式：image-N.jpg
      let img = readImage(`questions/${qid}/image-${idx}.jpg`);
      // 兼容旧数据：index=1 时回退 image.jpg
      if (!img && idx === 1) {
        img = readImage(`questions/${qid}/image.jpg`);
      }
      if (!img) { sendJson(res, { error: 'Not found' }, 404); return; }
      res.writeHead(200, { 'Content-Type': 'image/jpeg' }); res.end(img); return;
    }

    // GET /:id/image — 获取第一张图片（缩略图兼容）
    const imgMatch = url.match(/^\/([^/]+)\/image$/);
    if (method === 'GET' && imgMatch) {
      const qid = imgMatch[1];
      // 新格式优先
      let img = readImage(`questions/${qid}/image-1.jpg`);
      // 旧格式回退
      if (!img) img = readImage(`questions/${qid}/image.jpg`);
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
      const existing = readJson<any>(`questions/${putMatch[1]}/meta.json`);
      if (!existing) { sendJson(res, { error: 'Not found' }, 404); return; }
      const body = await parseBody(req);
      const updated = { ...(existing as Record<string, any>), ...body, id: putMatch[1] };
      writeJson(`questions/${putMatch[1]}/meta.json`, updated);
      sendJson(res, updated); return;
    }

    // DELETE /:id
    const deleteMatch = url.match(/^\/([^/]+)$/);
    if (method === 'DELETE' && deleteMatch) {
      const meta = readJson<any>(`questions/${deleteMatch[1]}/meta.json`);
      // 删除所有图片文件
      if (meta) {
        const count: number = meta.image_count || 0;
        for (let i = 1; i <= count; i++) {
          deleteFile(`questions/${deleteMatch[1]}/image-${i}.jpg`);
        }
      }
      // 兼容旧格式
      deleteFile(`questions/${deleteMatch[1]}/image.jpg`);
      deleteFile(`questions/${deleteMatch[1]}/meta.json`);
      sendJson(res, { ok: true }); return;
    }

    next();
  };
}
