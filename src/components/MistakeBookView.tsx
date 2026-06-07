import { useState, useEffect } from 'react';
import { fetchMistakes } from '../services/api';
import { SUBJECT_LABELS } from '../types';
import { PageContainer } from './Common';

export default function MistakeBookView({ onSelectQuestion }: { onSelectQuestion: (id: string) => void }) {
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [tab, setTab] = useState<'reviewing' | 'mastered'>('reviewing');
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'geography' | 'biology'>('all');

  useEffect(() => { fetchMistakes().then(setMistakes); }, []);

  const filtered = mistakes.filter(m => {
    if (tab === 'reviewing' && m.is_mastered) return false;
    if (tab === 'mastered' && !m.is_mastered) return false;
    if (subjectFilter !== 'all' && m.question?.subject !== subjectFilter) return false;
    return true;
  });

  return (
    <PageContainer>
      <h1 className="text-xl md:text-2xl font-bold text-gray-700 mb-4">📋 错题本</h1>
      {/* Subject Tabs */}
      <div className="flex gap-2 mb-3">
        {(['all', 'geography', 'biology'] as const).map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm md:text-base font-medium ${subjectFilter === s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {s === 'all' ? '全部' : SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>
      {/* Status Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('reviewing')} className={`px-4 py-1.5 rounded-full text-sm md:text-base font-medium ${tab === 'reviewing' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>攻克中</button>
        <button onClick={() => setTab('mastered')} className={`px-4 py-1.5 rounded-full text-sm md:text-base font-medium ${tab === 'mastered' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>已掌握</button>
      </div>
      {/* List */}
      {filtered.length === 0 ? <div className="text-center text-gray-300 py-12">暂无错题</div> : (
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {filtered.map((m: any) => m.question && (
            <div key={m.question_id} onClick={() => onSelectQuestion(m.question_id)}
              className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 active:bg-gray-50 cursor-pointer">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${m.question.subject === 'geography' ? 'bg-blue-500' : 'bg-green-500'}`}>
                {m.question.subject === 'geography' ? '地' : '生'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm md:text-base font-medium text-gray-700 truncate">{m.question.chapter || '未分类'}</div>
                <div className="text-xs md:text-sm text-gray-400">复习 {m.review_count} 次 · {m.is_mastered ? '✅ 已掌握' : '🔄 复习中'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
