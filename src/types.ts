// 地生冲刺 - 数据类型定义

export type Subject = 'geography' | 'biology';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'unknown';
export type AnalysisStatus = 'pending' | 'analyzed' | 'failed';
export type QuestionType = 'choice' | 'fill' | 'map' | 'judge' | 'essay' | 'mixed' | 'unknown';
export type MistakeType = 'knowledge_gap' | 'careless' | 'misunderstood' | 'other';
export type PracticeStatus = 'unattempted' | 'correct' | 'wrong' | 'skipped';

export type ViewMode = 'home' | 'capture' | 'detail' | 'mistakes' | 'knowledge' | 'practice';

export interface Question {
  id: string;
  subject: Subject;
  chapter: string;
  knowledge_points: string[];
  difficulty: Difficulty;
  question_type: QuestionType;
  ocr_text: string;
  source: string;
  source_detail: string;
  tags: string[];
  is_mistake: boolean;
  analysis_status: AnalysisStatus;
  image_count?: number;
  notes: string;
  created_at: string;
  analysis?: QuestionAnalysis;
}

export interface QuestionAnalysis {
  answer: string;
  explanation: string;
  key_concept: string;
  common_mistakes: string[];
  related_topics: string[];
}

export interface MistakeRecord {
  question_id: string;
  wrong_answer: string;
  correct_answer: string;
  mistake_type: MistakeType;
  review_count: number;
  last_reviewed_at: string | null;
  next_review_at: string;
  is_mastered: boolean;
  user_notes: string;
}

export interface KnowledgeEntry {
  title: string;
  tags: string[];
  subject: Subject;
  chapter: string;
  content: string;
  course_links: CourseLink[];
  created_at: string;
  updated_at: string;
}

export interface CourseLink {
  platform: string;
  title: string;
  url: string;
}

export interface PracticeQuestion {
  id: string;
  source_mistake_id: string;
  subject: Subject;
  chapter: string;
  knowledge_points: string[];
  difficulty: Difficulty;
  question_text: string;
  options?: { label: string; text: string }[];
  correct_answer: string;
  explanation: string;
  practice_status: PracticeStatus;
  user_answer?: string;
}

export interface PracticeSession {
  id: string;
  questions: PracticeQuestion[];
  created_at: string;
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  geography: '地理',
  biology: '生物',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  unknown: '未评估',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  choice: '选择题',
  fill: '填空题',
  map: '读图题',
  judge: '判断题',
  essay: '简答题',
  mixed: '综合题',
  unknown: '未识别',
};
