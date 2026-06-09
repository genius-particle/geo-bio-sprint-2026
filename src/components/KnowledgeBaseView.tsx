import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchKnowledge, fetchKnowledgePage } from '../services/api';
import { SUBJECT_LABELS } from '../types';
import type { Subject, KnowledgeEntry } from '../types';
import { PageHeader, BackLink, SearchField, ListRow } from './Common';
import MarkdownRenderer from './MarkdownRenderer';

export default function KnowledgeBaseView() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [selected, setSelected] = useState<KnowledgeEntry | null>(null);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchKnowledge().then(setEntries); }, []);

  useEffect(() => {
    const el = containerRef.current?.closest('.overflow-auto, .overflow-y-auto');
    if (el) el.scrollTop = 0;
  }, [selected]);

  const loadPage = useCallback(async (slug: string) => {
    try {
      const data = await fetchKnowledgePage(slug);
      if (data) setSelected(data);
    } catch {
      // 静默忽略
    }
  }, []);

  const handleWikiLink = useCallback((title: string) => {
    const match = entries.find(e => e.title === title);
    if (match) loadPage(match.slug);
  }, [entries, loadPage]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.chapter?.toLowerCase().includes(q) ||
      SUBJECT_LABELS[e.subject as Subject]?.includes(q)
    );
  }, [entries, search]);

  const listPanel = (
    <>
      <PageHeader title="知识库" />
      <SearchField value={search} onChange={setSearch} />
      {entries.length === 0 ? (
        <p className="text-center text-[#94A3B8] text-sm py-12">
          暂无知识点<br />
          <span className="text-xs">运行 /import-knowledge 初始化</span>
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-[#94A3B8] text-sm py-12">没有匹配的知识点</p>
      ) : (
        filtered.map(e => (
          <ListRow
            key={e.slug}
            subject={e.subject}
            title={e.title}
            meta={`${SUBJECT_LABELS[e.subject] || ''} · ${e.chapter}`}
            onClick={() => loadPage(e.slug)}
          />
        ))
      )}
    </>
  );

  const detailPanel = selected ? (
    <div ref={containerRef} className="px-4 py-2 md:px-8 md:py-6 lg:px-10">
      <BackLink onClick={() => setSelected(null)} />
      <PageHeader title={selected.title || selected.slug} />
      <div className="wiki-content text-sm md:text-base max-w-3xl">
        <MarkdownRenderer content={selected.content || ''} onWikiLink={handleWikiLink} />
      </div>
    </div>
  ) : (
    <div className="hidden md:flex flex-1 items-center justify-center text-[#94A3B8] text-sm">
      选择左侧知识点查看详情
    </div>
  );

  if (selected) {
    return (
      <>
        <div className="md:hidden h-full overflow-auto">{detailPanel}</div>
        <div className="hidden md:flex h-full min-h-0">
          <aside className="w-[360px] shrink-0 border-r border-[#E2E8F0] overflow-y-auto px-4 py-2 md:px-6 md:py-6">
            {listPanel}
          </aside>
          <main className="flex-1 overflow-y-auto min-w-0">{detailPanel}</main>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="md:hidden h-full overflow-auto px-4 py-2">
        <div ref={containerRef}>{listPanel}</div>
      </div>
      <div className="hidden md:flex h-full min-h-0">
        <aside className="w-[360px] shrink-0 border-r border-[#E2E8F0] overflow-y-auto px-4 py-2 md:px-6 md:py-6">
          <div ref={containerRef}>{listPanel}</div>
        </aside>
        <main className="flex-1 overflow-y-auto min-w-0">{detailPanel}</main>
      </div>
    </>
  );
}
