import { useState } from 'react';
import { createQuestion } from '../services/api';
import chaptersData from '../../data/chapters.json';
import { PageContainer } from './Common';

export default function QuestionCaptureView({ imageBase64List, onAddImage, onRemoveImage, onSave, onCancel }: {
  imageBase64List: string[];
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState<'geography' | 'biology'>('geography');
  const [chapter, setChapter] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [isMistake, setIsMistake] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const allChapters = Object.values(chaptersData[subject]).flat().map((item: { chapter: string }) => item.chapter);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await createQuestion({ subject, chapter, source, is_mistake: isMistake, notes, image_base64_list: imageBase64List });
      if (result.error) {
        setSaving(false);
        setError(result.error);
        return;
      }
      setSaving(false);
      setSaved(true);
    } catch {
      setSaving(false);
      setError('保存失败，请检查网络后重试');
    }
  };

  if (saved) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-xl md:text-2xl font-bold text-green-600 mb-2">已保存</div>
          <div className="text-gray-400 md:text-base mb-6">待电脑端分析</div>
          <button onClick={onSave} className="bg-green-500 text-white px-8 py-3 md:py-4 rounded-xl font-medium text-base">返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onCancel} className="text-gray-400 md:text-base">← 取消</button>
        <h2 className="font-bold text-gray-700 md:text-xl">录入题目</h2>
        <div className="w-12"></div>
      </div>

      <div className="bg-white rounded-xl p-2 mb-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageBase64List.map((img, i) => (
            <div key={i} className="relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40">
              <img src={img} alt={`题目 ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
              <button onClick={() => onRemoveImage(i)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none shadow">
                ✕
              </button>
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {i + 1}/{imageBase64List.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onAddImage}
        className="w-full mb-4 py-3 md:py-4 rounded-xl border-2 border-dashed border-green-400 text-green-600 font-medium text-base active:bg-green-50 transition-colors">
        📷 再拍一张（题目跨页时使用）
      </button>

      <div className="mb-4">
        <label className="block text-sm md:text-base font-medium text-gray-600 mb-1">学科</label>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setSubject('geography'); setChapter(''); }}
            className={`py-2.5 md:py-3 rounded-xl font-medium text-base ${subject === 'geography' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            🌍 地理
          </button>
          <button onClick={() => { setSubject('biology'); setChapter(''); }}
            className={`py-2.5 md:py-3 rounded-xl font-medium text-base ${subject === 'biology' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            🔬 生物
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm md:text-base font-medium text-gray-600 mb-1">章节</label>
        <select value={chapter} onChange={e => setChapter(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 md:py-3 text-gray-700 text-base">
          <option value="">选择章节（可选）</option>
          {allChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm md:text-base font-medium text-gray-600 mb-1">来源</label>
        <input type="text" value={source} onChange={e => setSource(e.target.value)}
          placeholder="如：2026年济南地生模拟卷" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 md:py-3 text-gray-700 text-base" />
      </div>

      <div className="mb-4">
        <label className="block text-sm md:text-base font-medium text-gray-600 mb-1">备注</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="这道题为什么做错了..." className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 md:py-3 text-gray-700 text-base" />
      </div>

      <label className="flex items-center gap-2 mb-6">
        <input type="checkbox" checked={isMistake} onChange={e => setIsMistake(e.target.checked)}
          className="w-5 h-5 rounded text-green-500" />
        <span className="text-sm md:text-base text-gray-600">同时加入错题本</span>
      </label>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-green-500 text-white rounded-2xl py-4 md:py-5 text-lg font-bold disabled:bg-gray-300 active:scale-95 transition-transform">
        {saving ? '保存中...' : '💾 保存'}
      </button>

      {error && (
        <div className="mt-3 text-center text-red-500 text-sm md:text-base">{error}</div>
      )}
    </PageContainer>
  );
}
