import { useState, useEffect } from 'react';
import { fetchQuestion } from '../services/api';
import type { Question } from '../types';
import { SUBJECT_LABELS, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../types';

export default function QuestionDetailView({ questionId, onBack }: {
  questionId: string; onBack: () => void;
}) {
  const [q, setQ] = useState<Question | null>(null);
  // fullscreen overlay for image zoom
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);

  useEffect(() => { fetchQuestion(questionId).then(setQ); }, [questionId]);

  // 全屏查看时禁止背景滚动
  useEffect(() => {
    if (zoomIdx !== null) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [zoomIdx]);

  if (!q) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>;

  // 确定图片数量：新数据用 image_count，旧数据（无此字段）假设 1 张旧格式图
  const imageCount = q.image_count;
  const isOldFormat = !('image_count' in q);
  const totalImages = imageCount != null ? imageCount : (isOldFormat ? 1 : 0);

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
        {totalImages > 1 && <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{totalImages} 张图</span>}
        {q.confidence === 'low' && <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">低置信度</span>}
        {q.confidence === 'medium' && <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">需关注</span>}
      </div>

      {/* Images */}
      {totalImages > 0 && (
        <div className="bg-white rounded-xl p-2 mb-4 shadow-sm">
          <div className="flex flex-col gap-2">
            {Array.from({ length: totalImages }, (_, i) => i + 1).map(idx => (
              <img key={idx}
                src={imageCount != null && imageCount > 0
                  ? `/api/questions/${q.id}/image/${idx}`
                  : `/api/questions/${q.id}/image`}
                alt={`题目图 ${idx}`}
                className="w-full rounded-lg cursor-pointer max-h-80 object-contain"
                onClick={() => setZoomIdx(idx)}
              />
            ))}
          </div>
        </div>
      )}

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

      {/* Verification Notes */}
      {q.verification_notes && (
        <div className={`rounded-xl p-4 mb-4 shadow-sm ${q.confidence === 'low' ? 'bg-red-50' : 'bg-yellow-50'}`}>
          <h3 className={`text-sm font-semibold mb-1 ${q.confidence === 'low' ? 'text-red-600' : 'text-yellow-600'}`}>
            {q.confidence === 'low' ? '⚠️ 校验提示' : 'ℹ️ 校验修正'}
          </h3>
          <p className={`text-sm whitespace-pre-wrap ${q.confidence === 'low' ? 'text-red-800' : 'text-yellow-800'}`}>
            {q.verification_notes}
          </p>
        </div>
      )}

      {/* Notes */}
      {q.notes && (
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-yellow-600 mb-1">📝 备注</h3>
          <p className="text-yellow-800 text-sm">{q.notes}</p>
        </div>
      )}

      {/* 全屏查看大图 */}
      {zoomIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setZoomIdx(null)}>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={imageCount > 0
                ? `/api/questions/${q.id}/image/${zoomIdx}`
                : `/api/questions/${q.id}/image`}
              alt={`题目图 ${zoomIdx}`}
              className="max-w-full max-h-full object-contain"
            />
            {/* 多图左右切换 */}
            {totalImages > 1 && (
              <>
                {zoomIdx > 1 && (
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 text-white w-10 h-10 rounded-full text-xl"
                    onClick={e => { e.stopPropagation(); setZoomIdx(zoomIdx - 1); }}>‹</button>
                )}
                {zoomIdx < totalImages && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 text-white w-10 h-10 rounded-full text-xl"
                    onClick={e => { e.stopPropagation(); setZoomIdx(zoomIdx + 1); }}>›</button>
                )}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                  {zoomIdx} / {totalImages}
                </div>
              </>
            )}
            <button className="absolute top-4 right-4 text-white/70 text-2xl"
              onClick={() => setZoomIdx(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
