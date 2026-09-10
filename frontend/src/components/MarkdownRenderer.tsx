import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Normalizes various LaTeX math delimiters (\[ ... \], \( ... \), and raw equation brackets)
 * into standard $$ ... $$ and $ ... $ so remark-math and KaTeX parse them reliably.
 */
function normalizeLatexDelimiters(text: string): string {
  if (!text) return '';
  // 1. Convert \[ ... \] display math to $$ ... $$
  let res = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  // 2. Convert \( ... \) inline math to $ ... $
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);
  // 3. Convert standalone bracketed equations containing LaTeX commands [ T = \prod ... ] to $$ ... $$
  res = res.replace(/(^|\n)\[\s*([\s\S]*?(\\prod|\\sum|\\begin\{|\\frac|\\underbrace|\\int|\\theta|\\alpha|\\beta|\\partial)[\s\S]*?)\s*\](?:\n|$)/g, '$1\n$$\n$2\n$$\n');
  return res;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const processedContent = useMemo(() => normalizeLatexDelimiters(content), [content]);

  return (
    <div className="markdown-content text-xs lg:text-sm leading-relaxed space-y-2.5 font-sans text-blueprint-primary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Bold formatting
          strong: ({ children }) => (
            <strong className="font-semibold text-blueprint-primary">{children}</strong>
          ),
          // Italic formatting
          em: ({ children }) => (
            <em className="italic text-blueprint-secondary">{children}</em>
          ),
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-blueprint-primary mt-3 mb-1.5 border-b border-blueprint-border pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-blueprint-primary mt-2.5 mb-1 text-blueprint-brass">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-blueprint-primary mt-2 mb-1">
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed text-blueprint-primary last:mb-0">
              {children}
            </p>
          ),
          // Unordered Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-blueprint-secondary">
              {children}
            </ul>
          ),
          // Ordered Lists
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-blueprint-secondary">
              {children}
            </ol>
          ),
          // List Items
          li: ({ children }) => (
            <li className="leading-relaxed text-blueprint-primary">
              {children}
            </li>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-blueprint-brass pl-3 my-2 text-blueprint-secondary italic bg-blueprint-raised/40 py-1 rounded-r">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-blueprint-border rounded">
              <table className="min-w-full divide-y divide-blueprint-border text-left font-mono text-[11px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-blueprint-raised text-blueprint-secondary uppercase tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-blueprint-border bg-blueprint-surface">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-blueprint-raised/50 transition">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-blueprint-primary">{children}</td>
          ),
          // Code rendering
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={language} code={codeString} />;
            }

            return (
              <code
                className="bg-blueprint-raised text-amber-200 font-mono text-[11px] px-1.5 py-0.5 rounded border border-blueprint-border"
                {...props}
              >
                {children}
              </code>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded border border-blueprint-border bg-blueprint-canvas overflow-hidden font-mono text-[11px]">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-blueprint-surface border-b border-blueprint-border text-blueprint-muted">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-blueprint-brass" />
          <span className="uppercase text-[10px] font-semibold text-blueprint-secondary">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-blueprint-muted hover:text-blueprint-primary transition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-blueprint-emerald" />
              <span className="text-blueprint-emerald">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3 overflow-x-auto text-blueprint-primary leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};
