import { useState, useEffect } from 'react';
import { fetchPractice } from '../services/api';

export default function PracticeView() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => { fetchPractice().then(setSessions); }, []);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-700 mb-4">✏️ 练习</h1>
      {sessions.length === 0 ? (
        <div className="text-center text-gray-300 py-12">
          暂无练习题<br />
          <span className="text-xs">运行 /generate-practice 生成练习题</span>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-medium text-gray-700 text-sm">{s.questions?.length || 0} 道练习题</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(s.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
