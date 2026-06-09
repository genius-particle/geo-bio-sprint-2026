import { useState, useEffect } from 'react';
import { fetchMistakes } from '../services/api';
import type { MistakeRecord } from '../types';
import { PageContainer, PageHeader, SegmentedControl, ListCard, ListGrid, ProgressRing } from './Common';

export default function MistakeBookView({ onSelectQuestion }: { onSelectQuestion: (id: string) => void }) {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
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
    <PageContainer className="overflow-auto">
      <PageHeader title="错题本" />
      <div className="md:flex md:gap-4 md:mb-2">
        <SegmentedControl<'all' | 'geography' | 'biology'>
          className="md:flex-1"
          options={[
            { id: 'all', label: '全部' },
            { id: 'geography', label: '地理' },
            { id: 'biology', label: '生物' },
          ]}
          value={subjectFilter}
          onChange={setSubjectFilter}
        />
        <SegmentedControl<'reviewing' | 'mastered'>
          className="md:flex-1"
          options={[
            { id: 'reviewing', label: '攻克中' },
            { id: 'mastered', label: '已掌握' },
          ]}
          value={tab}
          onChange={setTab}
          variant="warn"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-[#94A3B8] text-sm py-12">暂无错题</p>
      ) : (
        <ListGrid>
          {filtered.map((m: any) => m.question && (
            <ListCard
              key={m.question_id}
              leading={<ProgressRing value={m.review_count} color={m.is_mastered ? '#10B981' : '#E63946'} />}
              title={m.question.chapter || '未分类'}
              meta={`复习 ${m.review_count} 次 · ${m.is_mastered ? '已掌握' : '复习中'}`}
              onClick={() => onSelectQuestion(m.question_id)}
            />
          ))}
        </ListGrid>
      )}
    </PageContainer>
  );
}
