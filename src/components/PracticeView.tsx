import { useState, useEffect } from 'react';
import { fetchPractice, updatePractice } from '../services/api';
import { SUBJECT_LABELS, type PracticeSession, type Subject } from '../types';
import { PageContainer, EmptyState, PageHeader, SegmentedControl, BackLink, SubjectLabel, ListGrid } from './Common';

type SubView = 'home' | 'quiz' | 'result';
type SubjectFilter = 'all' | 'geography' | 'biology';

export default function PracticeView() {
  const [subView, setSubView] = useState<SubView>('home');
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');

  useEffect(() => { fetchPractice().then((data: PracticeSession[]) => setSessions(data)); }, []);

  // ─── 辅助函数 ───

  /** 旧数据兼容 */
  function safeSession(s: any): PracticeSession {
    return {
      ...s,
      title: s.title || '练习',
      mode: s.mode || 'mistake',
      subject: s.subject || 'geography',
      questions: (s.questions || []).map((q: any) => ({
        ...q,
        question_type: q.question_type || 'choice',
      })),
    };
  }

  function getProgress(s: PracticeSession) {
    const total = s.questions.length;
    const done = s.questions.filter(q => q.practice_status !== 'unattempted').length;
    return { total, done };
  }

  function getAccuracy(s: PracticeSession) {
    const done = s.questions.filter(q => q.practice_status !== 'unattempted');
    if (done.length === 0) return 0;
    return Math.round((done.filter(q => q.practice_status === 'correct').length / done.length) * 100);
  }

  function isCompleted(s: PracticeSession) {
    return s.questions.length > 0 && s.questions.every(q => q.practice_status !== 'unattempted');
  }

  // ─── 事件处理 ───

  function startQuiz(s: PracticeSession) {
    const safe = safeSession(s);
    setActiveSession(safe);
    const first = safe.questions.findIndex(q => q.practice_status === 'unattempted');
    setCurrentIdx(first >= 0 ? first : 0);
    setAnswered(first < 0 || safe.questions[first]?.practice_status !== 'unattempted');
    setSubView('quiz');
  }

  function viewResult(s: PracticeSession) {
    setActiveSession(safeSession(s));
    setSubView('result');
  }

  async function handleAnswer(label: string) {
    if (!activeSession || answered) return;
    const q = activeSession.questions[currentIdx];
    const isCorrect = label === q.correct_answer;
    const updated = { ...activeSession, questions: [...activeSession.questions] };
    updated.questions[currentIdx] = {
      ...q,
      practice_status: isCorrect ? 'correct' as const : 'wrong' as const,
      user_answer: label,
    };
    setActiveSession(updated);
    setAnswered(true);
    try { await updatePractice(updated.id, updated); } catch { /* 静默 */ }
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  function handleNext() {
    if (!activeSession) return;
    if (currentIdx < activeSession.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setAnswered(false);
    } else {
      setSubView('result');
    }
  }

  function goHome() {
    setActiveSession(null);
    setCurrentIdx(0);
    setAnswered(false);
    setSubView('home');
  }

  // ─── 过滤 ───

  const filtered = sessions
    .map(safeSession)
    .filter(s => subjectFilter === 'all' || s.subject === subjectFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // ─── 渲染 ───

  if (subView === 'quiz' && activeSession) {
    return <QuizView session={activeSession} idx={currentIdx} answered={answered} onAnswer={handleAnswer} onNext={handleNext} onBack={goHome} />;
  }

  if (subView === 'result' && activeSession) {
    return <ResultView session={activeSession} onBack={goHome} />;
  }

  return (
    <PageContainer className="overflow-auto">
      <PageHeader title="练习" />
      <SegmentedControl<SubjectFilter>
        options={[
          { id: 'all', label: '全部' },
          { id: 'geography', label: '地理' },
          { id: 'biology', label: '生物' },
        ]}
        value={subjectFilter}
        onChange={setSubjectFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState message="暂无练习题" subMessage="运行 /generate-practice 生成练习题" />
      ) : (
        <ListGrid>
        {filtered.map(s => {
          const { total, done } = getProgress(s);
          const completed = isCompleted(s);
          const accuracy = getAccuracy(s);
          return (
            <div key={s.id} className="p-4 bg-[#F8FAFC] rounded-[14px]">
              <div className="flex items-center gap-2 mb-2">
                <SubjectLabel subject={s.subject as Subject} />
                {s.mode === 'knowledge' && <span className="text-[10px] text-muted font-semibold">知识点</span>}
              </div>
              <div className="font-semibold text-sm mb-1">{s.title}</div>
              <div className="text-xs text-muted mb-3">{new Date(s.created_at).toLocaleDateString()} · {total} 题</div>

              {total > 0 && (
                <div className="w-full bg-[#E2E8F0] h-2 rounded mb-3 overflow-hidden">
                  <div className="h-full bg-brand rounded transition-all"
                    style={{ width: `${(done / total) * 100}%` }} />
                </div>
              )}

              {completed ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand">正确率 {accuracy}%</span>
                  <button onClick={() => viewResult(s)} className="text-sm font-semibold text-muted active:opacity-60">查看结果</button>
                </div>
              ) : done > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">进度 {done}/{total}</span>
                  <button onClick={() => startQuiz(s)} className="text-sm font-semibold text-brand active:opacity-60">继续练习</button>
                </div>
              ) : (
                <button onClick={() => startQuiz(s)} className="text-sm font-semibold text-brand active:opacity-60">
                  开始练习 →
                </button>
              )}
            </div>
          );
        })}
        </ListGrid>
      )}
    </PageContainer>
  );
}

// ─── 做题界面 ───

function QuizView({ session, idx, answered, onAnswer, onNext, onBack }: {
  session: PracticeSession;
  idx: number;
  answered: boolean;
  onAnswer: (label: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const q = session.questions[idx];
  if (!q) return null;

  const isLast = idx === session.questions.length - 1;
  const isCorrect = answered && q.user_answer === q.correct_answer;

  const judgeOptions = [{ label: 'A', text: '正确' }, { label: 'B', text: '错误' }];
  const options = q.question_type === 'judge' ? judgeOptions : (q.options || []);

  return (
    <PageContainer className="overflow-auto">
      <div className="md:max-w-3xl md:mx-auto">
      <BackLink onClick={onBack} />
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs md:text-sm text-muted font-semibold">{idx + 1} / {session.questions.length}</span>
        <SubjectLabel subject={session.subject as Subject} />
      </div>

      <div className="w-full bg-[#E2E8F0] h-2 md:h-3 rounded mb-6 overflow-hidden">
        <div className="h-full bg-brand rounded transition-all" style={{ width: `${((idx + 1) / session.questions.length) * 100}%` }} />
      </div>

      <div className="mb-6">
        <div className="text-xs text-gray-400 mb-2">
          {q.knowledge_points?.[0] && <span className="bg-gray-100 px-2 py-0.5 rounded mr-2">{q.knowledge_points[0]}</span>}
          {q.difficulty && <span>{q.difficulty === 'easy' ? '基础' : q.difficulty === 'medium' ? '中等' : q.difficulty === 'hard' ? '挑战' : ''}</span>}
        </div>
        <p className="text-base md:text-lg leading-relaxed font-medium">{q.question_text}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {options.map(opt => {
          const isThis = q.user_answer === opt.label;
          const isCorrectOpt = opt.label === q.correct_answer;
          let cls = 'border-2 border-[#E2E8F0] rounded-xl px-4 py-4 text-left transition-all w-full ';
          if (!answered) {
            cls += 'active:opacity-70 bg-[#F8FAFC]';
          } else if (isCorrectOpt) {
            cls += 'border-[#10B981] bg-[#F0FDF4] text-[#047857]';
          } else if (isThis && !isCorrect) {
            cls += 'border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]';
          } else {
            cls += 'opacity-40';
          }
          return (
            <button key={opt.label} onClick={() => !answered && onAnswer(opt.label)} className={cls}>
              <span className="font-bold text-sm mr-2">{opt.label}.</span>
              <span className="text-sm md:text-base">{opt.text}</span>
              {answered && isCorrectOpt && <span className="float-right text-green-500">✓</span>}
              {answered && isThis && !isCorrect && <span className="float-right text-red-500">✗</span>}
            </button>
          );
        })}
      </div>

      {/* 答题反馈 */}
      {answered && (
        <div className="bg-[#F0FDF4] border-l-4 border-[#10B981] pl-3 py-3 rounded-r-lg mb-6">
          <p className="text-xs font-semibold text-muted mb-2">{isCorrect ? '✓ 回答正确' : '✗ 回答错误'}</p>
          <p className="text-sm leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {answered && (
        <button onClick={onNext}
          className="w-full md:max-w-sm md:mx-auto block py-4 bg-[#58CC02] text-white text-base font-bold rounded-2xl active:translate-y-0.5"
          style={{ boxShadow: '0 4px 0 #46A302' }}>
          {isLast ? '查看结果' : '下一题'}
        </button>
      )}
      </div>
    </PageContainer>
  );
}

// ─── 结果统计页 ───

function ResultView({ session, onBack }: {
  session: PracticeSession;
  onBack: () => void;
}) {
  const questions = session.questions;
  const total = questions.length;
  const correct = questions.filter(q => q.practice_status === 'correct').length;
  const wrong = questions.filter(q => q.practice_status === 'wrong').length;
  const skipped = questions.filter(q => q.practice_status === 'skipped').length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongQuestions = questions.filter(q => q.practice_status === 'wrong');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <PageContainer className="overflow-auto">
      <div className="md:max-w-2xl md:mx-auto">
      <BackLink onClick={onBack} label="← 返回练习" />

      <div className="text-center mb-8 py-6 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #0077B6 0%, #38BDF8 100%)' }}>
        <div className="text-4xl font-bold tabular-nums text-white">{accuracy}%</div>
        <div className="text-xs text-white/80 font-semibold mt-2">正确率</div>
      </div>

      <div className="flex justify-between mb-10 text-center">
        {[
          { label: '总题数', value: total },
          { label: '正确', value: correct },
          { label: '错误', value: wrong },
          { label: '跳过', value: skipped },
        ].map(s => (
          <div key={s.label} className="flex-1">
            <div className="text-lg font-light tabular-nums">{s.value}</div>
            <div className="text-[10px] text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {wrongQuestions.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] tracking-widest text-muted mb-4">错题回顾</p>
          {wrongQuestions.map((q, i) => (
            <div key={q.id} className="p-3.5 bg-[#F8FAFC] rounded-[14px] mb-2">
              <button onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full text-left active:opacity-60">
                <p className="text-sm font-semibold line-clamp-2">{q.question_text}</p>
                <div className="text-xs text-muted mt-2">
                  你的答案 {q.user_answer} · 正确 {q.correct_answer}
                </div>
              </button>
              {expandedIdx === i && (
                <p className="text-sm leading-relaxed pt-3 text-muted border-t border-[#E2E8F0] mt-3">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={onBack}
        className="w-full py-4 border-2 border-[#E2E8F0] rounded-2xl text-sm font-semibold text-muted active:opacity-60">
        返回练习
      </button>
      </div>
    </PageContainer>
  );
}
