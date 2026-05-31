import { useState, useEffect } from 'react';
import { fetchQuestion } from '../services/api';
import type { Question } from '../types';
import { SUBJECT_LABELS, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../types';

export default function QuestionDetailView({ questionId, onBack }: {
  questionId: string; onBack: () => void;
}) {
  const [q, setQ] = useState<Question | null>(null);

  useEffect(() => { fetchQuestion(questionId).then(setQ); }, [questionId]);

  if (!q) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-gray-400">← 返回</button>
        <h2 className="font-bold text-gray-700">题目详情</h2>
        <div className="w-12"></div>
      </div>

      {/* Status Badge */}
      <div className="flex gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${q.analysis_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {q.analysis_status === 'pending' ? '⏳ 待分析' : '✅ 已分析'}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${q.subject === 'geography' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
          {SUBJECT_LABELS[q.subject]}
        </span>
        {q.is_mistake && <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">错题</span>}
      </div>

      {/* Image */}
      <div className="bg-white rounded-xl p-2 mb-4 shadow-sm">
        <img src={`/api/questions/${q.id}/image`} alt="题目" className="w-full rounded-lg" />
      </div>

      {/* Meta */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm space-y-2">
        <div className="flex justify-between text-sm"><span className="text-gray-400">章节</span><span className="text-gray-700">{q.chapter || '未分类'}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">题型</span><span className="text-gray-700">{QUESTION_TYPE_LABELS[q.question_type]}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">难度</span><span className="text-gray-700">{DIFFICULTY_LABELS[q.difficulty]}</span></div>
        {q.source_detail && <div className="flex justify-between text-sm"><span className="text-gray-400">来源</span><span className="text-gray-700">{q.source_detail}</span></div>}
      </div>

      {/* OCR Text */}
      {q.ocr_text && (
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">题目文字</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{q.ocr_text}</p>
        </div>
      )}

      {/* Analysis */}
      {q.analysis && (
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">📖 解析</h3>
          <div className="text-gray-700 text-sm space-y-3">
            <div><strong>答案：</strong>{q.analysis.answer}</div>
            <div><strong>解析：</strong><div className="mt-1 whitespace-pre-wrap">{q.analysis.explanation}</div></div>
            {q.analysis.common_mistakes?.length > 0 && (
              <div><strong>常见错误：</strong><ul className="list-disc ml-4 mt-1">{q.analysis.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {q.notes && (
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-yellow-600 mb-1">📝 备注</h3>
          <p className="text-yellow-800 text-sm">{q.notes}</p>
        </div>
      )}
    </div>
  );
}
