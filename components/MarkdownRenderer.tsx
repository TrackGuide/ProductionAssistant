import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './Button.tsx';
import { DownloadIcon, CopyIcon } from './icons.tsx';
import { copyToClipboard } from '../utils/copyUtils.ts';

interface MarkdownRendererProps {
  content: string;
  title?: string;
  onExportPDF?: () => void;
  onCopy?: () => void;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onExportPDF,
  onCopy,
  className = ''
}) => {
  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
      return;
    }

    const result = await copyToClipboard(content);
    setCopyStatus(result.message);
    setTimeout(() => setCopyStatus(''), 3000);
  };
  const customComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-purple-300 mb-6 border-b border-gray-600 pb-3">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold text-purple-200 mt-8 mb-4 border-l-4 border-purple-500 pl-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold text-purple-100 mt-6 mb-3 flex items-center">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-medium text-gray-200 mt-4 mb-2">
        {children}
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-300 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1 ml-4">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-300 mb-1">
        {children}
      </li>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-100">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-200">
        {children}
      </em>
    ),
    code: ({ children, className }: any) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-gray-700 text-purple-300 px-2 py-1 rounded text-sm font-mono">
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-800 border border-gray-600 rounded-lg p-4 overflow-x-auto mb-4">
          <code className="text-green-300 text-sm font-mono">
            {children}
          </code>
        </pre>
      );
    },
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-purple-500 bg-gray-800/50 pl-4 py-2 mb-4 italic text-gray-300">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-gray-800 border border-gray-600 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gray-700">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-gray-600">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-gray-700/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-purple-300 border-b border-gray-600">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-sm text-gray-300">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="border-gray-600 my-8" />
    ),
    a: ({ href, children }: any) => (
      <a 
        href={href} 
        className="text-purple-400 hover:text-purple-300 underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  };

  return (
    <div className={`markdown-content ${className}`}>
      <div className="flex justify-end gap-2 mb-4 pb-4 border-b border-gray-700">
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          leftIcon={<CopyIcon className="w-4 h-4" />}
        >
          Copy Content
        </Button>
        {onExportPDF && (
          <Button
            onClick={onExportPDF}
            variant="secondary"
            size="sm"
            leftIcon={<DownloadIcon className="w-4 h-4" />}
          >
            Export PDF
          </Button>
        )}
      </div>
      
      {copyStatus && (
        <div className={`text-sm mb-4 p-2 rounded ${
          copyStatus.includes("Failed") ? "text-red-400 bg-red-900/20" : "text-green-400 bg-green-900/20"
        }`}>
          {copyStatus}
        </div>
      )}
      
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown 
          components={customComponents}
          remarkPlugins={[remarkGfm]}
        >
          {content}
        </ReactMarkdown>
      </div>

    </div>
  );
};