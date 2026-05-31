// 前端 API 调用层
const BASE = '/api';

export async function fetchQuestions() {
  const res = await fetch(`${BASE}/questions`);
  return res.json();
}

export async function fetchQuestion(id: string) {
  const res = await fetch(`${BASE}/questions/${id}`);
  return res.json();
}

export async function createQuestion(data: {
  subject: string; chapter: string; source?: string; source_detail?: string;
  notes?: string; is_mistake?: boolean; image_base64?: string;
}) {
  const res = await fetch(`${BASE}/questions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateQuestion(id: string, data: any) {
  const res = await fetch(`${BASE}/questions/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteQuestion(id: string) {
  const res = await fetch(`${BASE}/questions/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchMistakes() {
  const res = await fetch(`${BASE}/mistakes`);
  return res.json();
}

export async function addMistake(data: { question_id: string; wrong_answer?: string; correct_answer?: string; user_notes?: string }) {
  const res = await fetch(`${BASE}/mistakes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMistake(id: string, data: any) {
  const res = await fetch(`${BASE}/mistakes/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return res.json();
}

export async function removeMistake(id: string) {
  const res = await fetch(`${BASE}/mistakes/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchKnowledge() {
  const res = await fetch(`${BASE}/knowledge`);
  return res.json();
}

export async function fetchKnowledgePage(slug: string) {
  const res = await fetch(`${BASE}/knowledge/${slug}`);
  return res.json();
}

export async function searchKnowledge(q: string) {
  const res = await fetch(`${BASE}/knowledge/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function fetchPractice() {
  const res = await fetch(`${BASE}/practice`);
  return res.json();
}

export async function createPractice(questions: any[]) {
  const res = await fetch(`${BASE}/practice`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questions }),
  });
  return res.json();
}
