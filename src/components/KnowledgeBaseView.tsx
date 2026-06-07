import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchKnowledge, fetchKnowledgePage } from '../services/api';
import { PageContainer } from './Common';
import MarkdownRenderer from './MarkdownRenderer';

export default function KnowledgeBaseView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchKnowledge().then(setEntries); }, []);

  // 切换页面时滚动到顶部（通过 ref 定位，不依赖父组件 class）
  useEffect(() => {
    const el = containerRef.current?.closest('.overflow-auto');
    if (el) el.scrollTop = 0;
  }, [selected]);

  // 安全地加载页面：处理 null 返回值
  const loadPage = useCallback(async (slug: string) => {
    try {
      const data = await fetchKnowledgePage(slug);
      if (data) {
        setSelected(data);
      }
    } catch {
      // 网络错误静默忽略，保持当前页面
    }
  }, []);

  // wiki 内链跳转：根据标题匹配 slug，不匹配时降级搜索
  const handleWikiLink = useCallback((title: string) => {
    const match = entries.find((e: any) => e.title === title);
    if (match) {
      loadPage(match.slug);
    }
    // 不匹配时不跳转，wiki 链接保持可点击外观但无副作用
  }, [entries, loadPage]);

  if (selected) {
    return (
      <PageContainer>
        <div ref={containerRef}>
          <button onClick={() => setSelected(null)} className="text-gray-400 md:text-base mb-3 block">← 返回</button>
          <h2 className="text-lg md:text-xl font-bold text-gray-700 mb-3">{selected.title || selected.slug}</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <MarkdownRenderer content={selected.content || ''} onWikiLink={handleWikiLink} />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div ref={containerRef}>
        <h1 className="text-xl md:text-2xl font-bold text-gray-700 mb-4">📚 知识库</h1>
        {entries.length === 0 ? <div className="text-center text-gray-300 py-12">暂无知识点<br /><span className="text-xs md:text-sm">运行 /import-knowledge 初始化</span></div> : (
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {entries.map((e: any) => (
              <div key={e.slug} onClick={() => loadPage(e.slug)}
                className="bg-white rounded-xl p-3 shadow-sm active:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-700 text-sm md:text-base">{e.title}</div>
                <div className="text-xs md:text-sm text-gray-400 mt-1">{e.subject === 'geography' ? '地理' : '生物'} · {e.chapter}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
