import { useState, useEffect } from 'react';
import { fetchPractice } from '../services/api';
import { PageContainer } from './Common';

export default function PracticeView() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => { fetchPractice().then(setSessions); }, []);

  return (
    <PageContainer>
      <h1 className="text-xl md:text-2xl font-bold text-gray-700 mb-4">✏️ 练习</h1>
      {sessions.length === 0 ? (
        <div className="text-center text-gray-300 py-12 text-sm md:text-base">
          暂无练习题<br />
          <span className="text-xs md:text-sm">运行 /generate-practice 生成练习题</span>
        </div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {sessions.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="font-medium text-gray-700 text-sm md:text-base">{s.questions?.length || 0} 道练习题</div>
              <div className="text-xs md:text-sm text-gray-400 mt-1">{new Date(s.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
