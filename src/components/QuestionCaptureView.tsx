import { useState } from 'react';
import { createQuestion } from '../services/api';
import chaptersData from '../../data/chapters.json';
import { PageContainer, BackLink, PageHeader, PrimaryButton, FormLabel, FormInput, FormSelect, SegmentedControl } from './Common';

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
      <div className="h-full flex items-center justify-center px-8">
        <div className="text-center max-w-xs">
          <p className="text-lg font-medium text-brand mb-2">已保存</p>
          <p className="text-muted text-sm font-light mb-8">待电脑端分析</p>
          <PrimaryButton onClick={onSave}>返回首页</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="overflow-auto">
      <BackLink onClick={onCancel} label="← 取消" />
      <PageHeader title="录入题目" />

      <div className="md:grid md:grid-cols-2 md:gap-8">
        <div className="mb-6 md:mb-0">
          <div className="flex gap-3 flex-wrap pb-2">
            {imageBase64List.map((img, i) => (
              <div key={i} className="relative flex-shrink-0 w-28 h-28 md:w-40 md:h-40">
                <img src={img} alt={`题目 ${i + 1}`} className="w-full h-full object-cover rounded-xl bg-[#E2E8F0]" />
                <button onClick={() => onRemoveImage(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#0A0A0A] text-white text-xs flex items-center justify-center rounded-full">
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] text-center py-0.5 rounded-b-xl">
                  {i + 1}/{imageBase64List.length}
                </div>
              </div>
            ))}
          </div>
          <button onClick={onAddImage}
            className="w-full py-3 border-2 border-dashed border-[#E2E8F0] rounded-xl text-muted text-sm font-semibold active:opacity-60">
            再拍一张（题目跨页时使用）
          </button>
        </div>

        <div>
      <FormLabel>学科</FormLabel>
      <SegmentedControl<'geography' | 'biology'>
        options={[
          { id: 'geography', label: '地理' },
          { id: 'biology', label: '生物' },
        ]}
        value={subject}
        onChange={(s) => { setSubject(s); setChapter(''); }}
      />

      <FormLabel>章节</FormLabel>
      <FormSelect value={chapter} onChange={e => setChapter(e.target.value)}>
        <option value="">选择章节（可选）</option>
        {allChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
      </FormSelect>

      <FormLabel>来源</FormLabel>
      <FormInput type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="如：2026年济南地生模拟卷" />

      <FormLabel>备注</FormLabel>
      <FormInput type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="这道题为什么做错了…" />

      <label className="flex items-center gap-3 mb-8">
        <input type="checkbox" checked={isMistake} onChange={e => setIsMistake(e.target.checked)}
          className="w-4 h-4 accent-[#0077B6]" />
        <span className="text-sm text-muted font-light">同时加入错题本</span>
      </label>

      <PrimaryButton onClick={handleSave} disabled={saving}>
        {saving ? '保存中…' : '保存'}
      </PrimaryButton>

      {error && <div className="mt-4 text-center text-sm text-[#B91C1C]">{error}</div>}
        </div>
      </div>
    </PageContainer>
  );
}
