import { useState, useEffect } from 'react';
import { fetchKnowledge, fetchKnowledgePage } from '../services/api';

export default function KnowledgeBaseView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchKnowledge().then(setEntries); }, []);

  if (selected) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <button onClick={() => setSelected(null)} className="text-gray-400 mb-3 block">← 返回</button>
        <h2 className="text-lg font-bold text-gray-700 mb-3">{selected.title || selected.slug}</h2>
        <div className="bg-white rounded-xl p-4 shadow-sm prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">{selected.content}</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-700 mb-4">📚 知识库</h1>
      {entries.length === 0 ? <div className="text-center text-gray-300 py-12">暂无知识点<br /><span className="text-xs">运行 /import-knowledge 初始化</span></div> : (
        <div className="space-y-2">
          {entries.map((e: any) => (
            <div key={e.slug} onClick={() => fetchKnowledgePage(e.slug).then(setSelected)}
              className="bg-white rounded-xl p-3 shadow-sm active:bg-gray-50 cursor-pointer">
              <div className="font-medium text-gray-700 text-sm">{e.title}</div>
              <div className="text-xs text-gray-400 mt-1">{e.subject === 'geography' ? '地理' : '生物'} · {e.chapter}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
