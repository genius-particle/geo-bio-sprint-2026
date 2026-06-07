import { useState, useEffect } from 'react';
import { fetchQuestions } from '../services/api';
import type { Question } from '../types';
import { SUBJECT_LABELS } from '../types';
import { PageContainer } from './Common';

export default function DashboardView({ onCapture, onSelectQuestion, refreshKey }: {
  onCapture: () => void; onSelectQuestion: (id: string) => void; refreshKey: number;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchQuestions().then((q: Question[]) => { setQuestions(q); setLoading(false); });
  }, [refreshKey]);

  const pending = questions.filter(q => q.analysis_status === 'pending').length;
  const mistakes = questions.filter(q => q.is_mistake).length;
  const recent = questions.slice(0, 10);

  return (
    <PageContainer>
      <h1 className="text-2xl md:text-3xl font-bold text-green-600 mb-1">🌍🔬 地生冲刺</h1>
      <p className="text-gray-400 text-sm md:text-base mb-4">八年级地生会考备考工具</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-500">{questions.length}</div>
          <div className="text-xs md:text-sm text-gray-400">总录入</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-500">{pending}</div>
          <div className="text-xs md:text-sm text-gray-400">待分析</div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl font-bold text-red-500">{mistakes}</div>
          <div className="text-xs md:text-sm text-gray-400">错题数</div>
        </div>
      </div>

      <button onClick={onCapture}
        className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl py-5 text-xl font-bold shadow-lg active:scale-95 transition-transform mb-6">
        📸 拍照录入
      </button>

      <h2 className="text-sm md:text-base font-semibold text-gray-500 mb-2">最近录入</h2>
      {loading ? <div className="text-center text-gray-400 py-4">加载中...</div> :
       recent.length === 0 ? <div className="text-center text-gray-300 py-8">还没有录入题目，点击上方按钮开始</div> :
       <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {recent.map(q => (
          <div key={q.id} onClick={() => onSelectQuestion(q.id)}
            className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 active:bg-gray-50 cursor-pointer">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${q.subject === 'geography' ? 'bg-blue-500' : 'bg-green-500'}`}>
              {q.subject === 'geography' ? '地' : '生'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm md:text-base font-medium text-gray-700 truncate">{q.chapter || '未分类'}</div>
              <div className="text-xs md:text-sm text-gray-400">{SUBJECT_LABELS[q.subject]} · {q.analysis_status === 'pending' ? '⏳ 待分析' : '✅ 已分析'}</div>
            </div>
          </div>
        ))}
      </div>
      }
    </PageContainer>
  );
}
