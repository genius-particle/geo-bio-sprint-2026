import { useState, useEffect } from 'react';
import { fetchQuestion } from '../services/api';
import type { Question } from '../types';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../types';
import { PageContainer, BackLink, PageHeader, StatusBadge, SubjectLabel, SectionLabel, ParseBlock } from './Common';

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

  if (!q) return <div className="flex items-center justify-center h-full text-muted font-light">加载中…</div>;

  // 确定图片数量：新数据用 image_count，旧数据（无此字段）假设 1 张旧格式图
  const imageCount = q.image_count;
  const isOldFormat = !('image_count' in q);
  const totalImages = imageCount != null ? imageCount : (isOldFormat ? 1 : 0);

  return (
    <PageContainer className="overflow-auto">
      <BackLink onClick={onBack} />
      <PageHeader title="题目详情" />

      <div className="flex flex-wrap mb-6">
        <StatusBadge variant="ok">{q.analysis_status === 'pending' ? '待分析' : '已分析'}</StatusBadge>
        <SubjectLabel subject={q.subject} />
        {q.is_mistake && <StatusBadge variant="err">错题</StatusBadge>}
        {totalImages > 1 && <StatusBadge>{totalImages} 张图</StatusBadge>}
        {q.confidence === 'low' && <StatusBadge variant="warn">低置信度</StatusBadge>}
        {q.confidence === 'medium' && <StatusBadge variant="warn">需关注</StatusBadge>}
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start space-y-8 md:space-y-0">
        <div className="space-y-6">
          {totalImages > 0 && (
            <div className="bg-[#E2E8F0] rounded-xl p-1">
              <div className="flex flex-col gap-2">
                {Array.from({ length: totalImages }, (_, i) => i + 1).map(idx => (
                  <img key={idx}
                    src={imageCount != null && imageCount > 0
                      ? `/api/questions/${q.id}/image/${idx}`
                      : `/api/questions/${q.id}/image`}
                    alt={`题目图 ${idx}`}
                    className="w-full rounded-lg cursor-pointer max-h-80 md:max-h-[75vh] object-contain"
                    onClick={() => setZoomIdx(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 py-4 border-t border-[#E2E8F0] text-sm md:border-t-0 md:pt-0">
            <div className="flex justify-between"><span className="text-muted">章节</span><span>{q.chapter || '未分类'}</span></div>
            <div className="flex justify-between"><span className="text-muted">题型</span><span>{QUESTION_TYPE_LABELS[q.question_type]}</span></div>
            <div className="flex justify-between"><span className="text-muted">难度</span><span>{DIFFICULTY_LABELS[q.difficulty]}</span></div>
            {q.source_detail && <div className="flex justify-between"><span className="text-muted">来源</span><span>{q.source_detail}</span></div>}
          </div>
        </div>

        <div className="space-y-8">
          {q.ocr_text && (
            <div>
              <SectionLabel>题目文字</SectionLabel>
              <p className="text-sm font-light whitespace-pre-wrap leading-relaxed">{q.ocr_text}</p>
            </div>
          )}

          {q.analysis && (
            <div>
              <SectionLabel>解析</SectionLabel>
              <ParseBlock>
                <div className="font-semibold mb-2">答案：{q.analysis.answer}</div>
                <div className="whitespace-pre-wrap">{q.analysis.explanation}</div>
                {q.analysis.common_mistakes?.length > 0 && (
                  <div className="mt-3">
                    <span className="font-semibold text-muted">常见错误</span>
                    <ul className="list-disc ml-4 mt-1 space-y-1">{q.analysis.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </div>
                )}
              </ParseBlock>
            </div>
          )}

          {q.verification_notes && (
            <div className="border-l-2 border-[#D4D4D4] pl-4">
              <SectionLabel>{q.confidence === 'low' ? '校验提示' : '校验修正'}</SectionLabel>
              <p className="text-sm font-light whitespace-pre-wrap text-muted">{q.verification_notes}</p>
            </div>
          )}

          {q.notes && (
            <div>
              <SectionLabel>备注</SectionLabel>
              <p className="text-sm font-light">{q.notes}</p>
            </div>
          )}
        </div>
      </div>

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
    </PageContainer>
  );
}
