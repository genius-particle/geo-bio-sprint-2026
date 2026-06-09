import { useState, useEffect } from 'react';
import { fetchQuestions } from '../services/api';
import type { Question } from '../types';
import { SUBJECT_LABELS } from '../types';
import { PageContainer, HeroCard, PrimaryButton, SectionLabel, ListRow, ListGrid, LoadingSpinner } from './Common';

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
  const analyzed = questions.length - pending;
  const recent = questions.slice(0, 12);

  return (
    <PageContainer className="overflow-auto">
      <HeroCard analyzed={analyzed} total={questions.length} pending={pending} mistakes={mistakes} />
      <PrimaryButton onClick={onCapture} className="mb-6 md:hidden">拍照录入</PrimaryButton>

      <SectionLabel>最近录入</SectionLabel>
      {loading ? (
        <LoadingSpinner text="加载中…" />
      ) : recent.length === 0 ? (
        <p className="text-center text-[#94A3B8] text-sm py-8">还没有录入题目</p>
      ) : (
        <ListGrid>
          {recent.map(q => (
            <ListRow
              key={q.id}
              subject={q.subject}
              title={q.chapter || '未分类'}
              meta={`${SUBJECT_LABELS[q.subject]} · ${q.analysis_status === 'pending' ? '待分析' : '已分析'}`}
              onClick={() => onSelectQuestion(q.id)}
            />
          ))}
        </ListGrid>
      )}
    </PageContainer>
  );
}
