import { useState, useEffect } from 'react';
import { fetchPractice, updatePractice } from '../services/api';
import { SUBJECT_LABELS, type PracticeSession, type Subject } from '../types';
import { PageContainer, EmptyState } from './Common';

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

  // home
  return (
    <PageContainer>
      <h1 className="text-xl md:text-2xl font-bold text-gray-700 mb-4">✏️ 练习</h1>

      <div className="flex gap-2 mb-4">
        {(['all', 'geography', 'biology'] as const).map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm md:text-base font-medium ${subjectFilter === s ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {s === 'all' ? '全部' : SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">📝</span>}
          message="暂无练习题"
          subMessage="运行 /generate-practice 生成练习题"
        />
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {filtered.map(s => {
            const { total, done } = getProgress(s);
            const completed = isCompleted(s);
            const accuracy = getAccuracy(s);
            return (
              <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.subject === 'geography' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {SUBJECT_LABELS[s.subject as Subject] || '练习'}
                  </span>
                  {s.mode === 'knowledge' && (
                    <span className="text-xs bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded">知识点</span>
                  )}
                </div>
                <div className="font-medium text-gray-700 text-sm md:text-base mb-1">{s.title}</div>
                <div className="text-xs text-gray-400 mb-3">{new Date(s.created_at).toLocaleDateString()} · {total} 题</div>

                {total > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                    <div className={`h-1.5 rounded-full transition-all ${completed ? 'bg-green-400' : 'bg-blue-400'}`}
                      style={{ width: `${(done / total) * 100}%` }} />
                  </div>
                )}

                {completed ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-green-600">正确率 {accuracy}%</span>
                    <button onClick={() => viewResult(s)} className="text-sm text-gray-500 hover:text-gray-700">查看结果 →</button>
                  </div>
                ) : done > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">进度 {done}/{total}</span>
                    <button onClick={() => startQuiz(s)} className="text-sm text-blue-500 hover:text-blue-700 font-medium">继续练习 →</button>
                  </div>
                ) : (
                  <button onClick={() => startQuiz(s)} className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium active:bg-blue-600">
                    开始练习
                  </button>
                )}
              </div>
            );
          })}
        </div>
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
    <PageContainer>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-gray-400 text-sm">← 返回</button>
        <span className="text-sm text-gray-500 font-medium">{idx + 1} / {session.questions.length}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${session.subject === 'geography' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
          {SUBJECT_LABELS[session.subject as Subject] || ''}
        </span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div className="bg-blue-400 h-1.5 rounded-full transition-all" style={{ width: `${((idx + 1) / session.questions.length) * 100}%` }} />
      </div>

      {/* 题目 */}
      <div className="mb-6">
        <div className="text-xs text-gray-400 mb-2">
          {q.knowledge_points?.[0] && <span className="bg-gray-100 px-2 py-0.5 rounded mr-2">{q.knowledge_points[0]}</span>}
          {q.difficulty && <span>{q.difficulty === 'easy' ? '基础' : q.difficulty === 'medium' ? '中等' : q.difficulty === 'hard' ? '挑战' : ''}</span>}
        </div>
        <p className="text-gray-700 text-base md:text-lg leading-relaxed">{q.question_text}</p>
      </div>

      {/* 选项 */}
      <div className="space-y-3 mb-6">
        {options.map(opt => {
          const isThis = q.user_answer === opt.label;
          const isCorrectOpt = opt.label === q.correct_answer;
          let cls = 'border-2 rounded-xl p-3 md:p-4 text-left transition-colors duration-200 w-full ';
          if (!answered) {
            cls += 'border-gray-200 active:scale-[0.98] active:border-blue-300';
          } else if (isCorrectOpt) {
            cls += 'border-green-400 bg-green-50';
          } else if (isThis && !isCorrect) {
            cls += 'border-red-400 bg-red-50';
          } else {
            cls += 'border-gray-100 opacity-50';
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
        <div className={`rounded-xl p-4 mb-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`font-bold text-sm mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {/* 底部按钮 */}
      {answered && (
        <button onClick={onNext}
          className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-medium active:bg-blue-600 transition">
          {isLast ? '查看结果' : '下一题 →'}
        </button>
      )}
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
    <PageContainer>
      <button onClick={onBack} className="text-gray-400 text-sm mb-4 block">← 返回练习</button>

      {/* 正确率 */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold ${accuracy >= 80 ? 'text-green-500' : accuracy >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
          {accuracy}%
        </div>
        <div className="text-gray-400 text-sm mt-1">正确率</div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: '总题数', value: total, color: 'text-gray-700' },
          { label: '正确', value: correct, color: 'text-green-600' },
          { label: '错误', value: wrong, color: 'text-red-600' },
          { label: '跳过', value: skipped, color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 错题回顾 */}
      {wrongQuestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-600 mb-3">❌ 错题回顾</h3>
          <div className="space-y-2">
            {wrongQuestions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  className="w-full p-3 text-left active:bg-gray-50">
                  <p className="text-sm text-gray-700 line-clamp-2">{q.question_text}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    你的答案：{q.user_answer} · 正确答案：{q.correct_answer}
                  </div>
                </button>
                {expandedIdx === i && (
                  <div className="px-3 pb-3 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-2">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onBack}
        className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:bg-gray-200">
        返回练习
      </button>
    </PageContainer>
  );
}
