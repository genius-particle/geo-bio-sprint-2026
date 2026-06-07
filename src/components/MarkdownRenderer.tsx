import { useMemo, useCallback } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  onWikiLink?: (title: string) => void;
}

/** 预处理 wiki 内容：转换 [[链接]] 为可点击格式，过滤 HTML 注释 */
function preprocessContent(raw: string): string {
  let text = raw;
  // 过滤 HTML 注释
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  // 转换 [[wiki link]] 为 [wiki link](wiki:link)
  text = text.replace(/\[\[([^\]]+)\]\]/g, (_match, title) => {
    return `[${title}](wiki:${encodeURIComponent(title)})`;
  });
  return text;
}

/** 允许 wiki: 内链协议，其余走 react-markdown 默认安全过滤 */
function urlTransform(url: string): string {
  if (url.startsWith('wiki:')) return url;
  return defaultUrlTransform(url);
}

export default function MarkdownRenderer({ content, onWikiLink }: MarkdownRendererProps) {
  const processed = useMemo(() => preprocessContent(content), [content]);

  // 容器级事件委托：拦截所有 wiki: 链接的点击
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;
    const href = target.getAttribute('href') || '';
    if (href.startsWith('wiki:')) {
      e.preventDefault();
      e.stopPropagation();
      const title = decodeURIComponent(href.slice(5));
      onWikiLink?.(title);
    }
  }, [onWikiLink]);

  const components = useMemo(() => ({
    // h1 不渲染（页面标题已单独显示）
    h1: () => null,
    h2: ({ children, ...props }: any) => (
      <h2 {...props} className="text-base font-bold text-green-700 mt-5 mb-2 pb-1 border-b border-green-100">
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 {...props} className="text-sm font-bold text-gray-700 mt-3 mb-1">{children}</h3>
    ),
    p: ({ children, ...props }: any) => (
      <p {...props} className="mb-2 last:mb-0 leading-relaxed text-gray-700 text-sm">{children}</p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul {...props} className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol {...props} className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props} className="text-sm text-gray-700 leading-relaxed">{children}</li>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote {...props} className="border-l-3 border-green-300 bg-green-50 pl-3 py-1 rounded-r mb-2 text-sm text-gray-600 italic">{children}</blockquote>
    ),
    strong: ({ children, ...props }: any) => (
      <strong {...props} className="font-bold text-gray-800">{children}</strong>
    ),
    code: ({ children, ...props }: any) => (
      <code {...props} className="bg-gray-100 text-green-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    ),
    // wiki 链接样式（绿色下划线），点击由容器事件委托处理
    a: ({ href, children, ...props }: any) => {
      if (href?.startsWith('wiki:')) {
        return (
          <a {...props} href={href} className="text-green-600 underline decoration-green-300 underline-offset-2 font-medium">
            {children}
          </a>
        );
      }
      return <a {...props} href={href} className="text-green-600 underline">{children}</a>;
    },
  }), []);

  return (
    <div className="markdown-content" onClick={handleClick}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
