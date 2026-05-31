import { useState } from 'react';
import { createQuestion } from '../services/api';
import { CHAPTERS } from '../data/chapters';

export default function QuestionCaptureView({ imageBase64, onSave, onCancel }: {
  imageBase64: string; onSave: () => void; onCancel: () => void;
}) {
  const [subject, setSubject] = useState<'geography' | 'biology'>('geography');
  const [chapter, setChapter] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [isMistake, setIsMistake] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const chapters = CHAPTERS[subject];
  const allChapters = Object.values(chapters).flat();

  const handleSave = async () => {
    setSaving(true);
    await createQuestion({ subject, chapter, source, is_mistake: isMistake, notes, image_base64: imageBase64 });
    setSaving(false);
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-xl font-bold text-green-600 mb-2">已保存</div>
          <div className="text-gray-400 mb-6">待电脑端分析</div>
          <button onClick={onSave} className="bg-green-500 text-white px-8 py-3 rounded-xl font-medium">返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onCancel} className="text-gray-400">← 取消</button>
        <h2 className="font-bold text-gray-700">录入题目</h2>
        <div className="w-12"></div>
      </div>

      {/* Image Preview */}
      <div className="bg-white rounded-xl p-2 mb-4 shadow-sm">
        <img src={imageBase64} alt="题目" className="w-full rounded-lg max-h-48 object-contain" />
      </div>

      {/* Subject */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">学科</label>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setSubject('geography'); setChapter(''); }}
            className={`py-2.5 rounded-xl font-medium ${subject === 'geography' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            🌍 地理
          </button>
          <button onClick={() => { setSubject('biology'); setChapter(''); }}
            className={`py-2.5 rounded-xl font-medium ${subject === 'biology' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            🔬 生物
          </button>
        </div>
      </div>

      {/* Chapter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">章节</label>
        <select value={chapter} onChange={e => setChapter(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700">
          <option value="">选择章节（可选）</option>
          {allChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
      </div>

      {/* Source */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">来源</label>
        <input type="text" value={source} onChange={e => setSource(e.target.value)}
          placeholder="如：2026年济南地生模拟卷" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700" />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">备注</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="这道题为什么做错了..." className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700" />
      </div>

      {/* Mistake toggle */}
      <label className="flex items-center gap-2 mb-6">
        <input type="checkbox" checked={isMistake} onChange={e => setIsMistake(e.target.checked)}
          className="w-5 h-5 rounded text-green-500" />
        <span className="text-sm text-gray-600">同时加入错题本</span>
      </label>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-green-500 text-white rounded-2xl py-4 text-lg font-bold disabled:bg-gray-300 active:scale-95 transition-transform">
        {saving ? '保存中...' : '💾 保存'}
      </button>
    </div>
  );
}
