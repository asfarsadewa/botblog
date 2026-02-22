'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface PostContentProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-serif text-3xl font-bold text-[--color-fg] mt-8 mb-4">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif text-2xl font-bold text-[--color-fg] mt-8 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-serif text-xl font-semibold text-[--color-fg] mt-6 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-[--color-fg] leading-relaxed mb-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[--color-accent] underline underline-offset-2 hover:opacity-80"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code
          className={`block bg-[--color-surface] text-[--color-fg] font-mono text-sm p-4 rounded border border-[--color-border] overflow-x-auto ${className ?? ''}`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-[--color-surface] text-[--color-accent] font-mono text-sm px-1.5 py-0.5 rounded"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-4 rounded overflow-x-auto">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[--color-accent] pl-4 italic text-[--color-muted] my-4">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-1 text-[--color-fg]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1 text-[--color-fg]">
      {children}
    </ol>
  ),
  hr: () => <hr className="border-[--color-border] my-8" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-[--color-fg]">{children}</strong>
  ),
};

export default function PostContent({ content }: PostContentProps) {
  return (
    <div className="prose-custom">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
