import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  searchQuery?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, searchQuery }) => {
  return <div className="space-y-3 leading-relaxed text-slate-800 break-words">{renderMarkdown(content, searchQuery)}</div>;
};

function renderMarkdown(content: string, searchQuery?: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code Block ```lang
    if (line.trim().startsWith('```')) {
      const lang = line.trim().replace(/^```/, '') || 'kod';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const fullCode = codeLines.join('\n');
      elements.push(<CodeBlock key={`code-${i}`} code={fullCode} language={lang} />);
      continue;
    }

    // Markdown Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<TableBlock key={`table-${i}`} lines={tableLines} searchQuery={searchQuery} />);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-slate-900 mt-3 mb-1">
          {formatInline(line.replace('### ', ''), searchQuery)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
          {formatInline(line.replace('## ', ''), searchQuery)}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
          {formatInline(line.replace('# ', ''), searchQuery)}
        </h1>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && line.startsWith('> ')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-blue-500 bg-blue-50/50 pl-3 py-1.5 my-2 text-slate-700 italic rounded-r text-sm"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{formatInline(ql, searchQuery)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered List
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().substring(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 space-y-1 my-2 text-sm text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx}>{formatInline(item, searchQuery)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 space-y-1 my-2 text-sm text-slate-700">
          {listItems.map((item, idx) => (
            <li key={idx}>{formatInline(item, searchQuery)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
      i++;
      continue;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-slate-700">
        {formatInline(line, searchQuery)}
      </p>
    );
    i++;
  }

  return elements;
}

function formatInline(text: string, searchQuery?: string): React.ReactNode {
  let processedText: React.ReactNode = text;

  // Add search highlighting before other formatting
  if (searchQuery && searchQuery.length > 0) {
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    processedText = parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-slate-900 rounded px-0.5">{part}</mark>
      ) : (
        part
      )
    );
  }

  // Then process markdown formatting
  // Need to be careful here - splitting text might break this.
  // Actually, formatInline splits by code, then bold, then italic.
  // Let's adjust this to handle ReactNode input if already processed for search.
  
  // Revised approach:
  // 1. Process markdown formatting first (get ReactNodes)
  // 2. Wrap those nodes in a search highlight.
  
  // Actually, simplest is to highlight the raw text first if possible, but 
  // the current approach is complex. 
  // Let's just highlight the text *after* the markdown formatting is done.
  
  // Current formatInline:
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="bg-slate-100 text-blue-600 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={index}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 4) {
            return (
              <strong key={bIdx} className="font-semibold text-slate-900">
                {bPart.slice(2, -2)}
              </strong>
            );
          }

          // Process italic *text*
          const italicParts = bPart.split(/(\*[^*]+\*)/g);
          return italicParts.map((iPart, iIdx) => {
            if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
              return (
                <em key={iIdx} className="italic text-slate-800">
                  {iPart.slice(1, -1)}
                </em>
              );
            }
            
            // Search highlighting on plain text
            if (searchQuery && searchQuery.length > 0) {
              const regex = new RegExp(`(${searchQuery})`, 'gi');
              const searchParts = iPart.split(regex);
              return searchParts.map((sPart, sIdx) => 
                sPart.toLowerCase() === searchQuery.toLowerCase() ? (
                  <mark key={sIdx} className="bg-yellow-200 text-slate-900 rounded px-0.5">{sPart}</mark>
                ) : (
                  sPart
                )
              );
            }
            return iPart;
          });
        })}
      </span>
    );
  });
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-slate-700/60 bg-slate-900 text-slate-100 text-xs shadow-md">
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-800/90 border-b border-slate-700/60 text-slate-400">
        <span className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-300">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
          title="Kodu Kopyala"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Kopyalandı!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto custom-scrollbar font-mono text-xs leading-relaxed text-slate-200">
        <pre>{code}</pre>
      </div>
    </div>
  );
};

const TableBlock: React.FC<{ lines: string[]; searchQuery?: string }> = ({ lines, searchQuery }) => {
  const rows = lines.map((l) =>
    l
      .trim()
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
  );

  if (rows.length < 2) return null;

  const headers = rows[0];
  const isSeparator = (r: string[]) => r.every((c) => /^[-:]+$/.test(c));
  const dataRows = rows.slice(1).filter((r) => !isSeparator(r));

  return (
    <div className="overflow-x-auto my-3 border border-slate-200 rounded-lg shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-xs">
        <thead className="bg-slate-50 text-slate-700 font-semibold">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left">
                {formatInline(h, searchQuery)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 text-slate-700">
                  {formatInline(cell, searchQuery)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
