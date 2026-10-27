import React from 'react';

/**
 * Custom Markdown and Citation Renderer for ResolveIQ AI responses.
 * Renders:
 * - Markdown tables (| col | col |) with sleek, responsive Tailwind formatting
 * - Bulleted and numbered lists
 * - Headers (h2, h3, h4)
 * - Source citations (【Page X】, [Page X], Ref Page X) as stylized badges
 * - Bold text (**text**) and inline code (`code`)
 */
export const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Helper to parse inline markdown (bold, citations, code)
  const renderInline = (text) => {
    if (!text) return null;

    // Regex splits on:
    // 1. 【...】
    // 2. [Page X] or [Ref Page X] or [Document | Page X]
    // 3. Ref Page X or Ref Page X-Y
    // 4. **bold**
    // 5. `code`
    const regex = /(【[^】]+】|\[[^\]]*(?:page|ref)[^\]]*\]|Ref\s+Page\s+\d+(?:[-–—]\d+)?|\*\*[^*]+\*\*|`[^`]+`)/gi;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Handle citation like 【Page 4】 or 【03】
      if (part.startsWith('【') && part.endsWith('】')) {
        const citationVal = part.slice(1, -1);
        return (
          <span
            key={index}
            className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 select-all whitespace-nowrap"
            title={`Source reference ${citationVal}`}
          >
            Ref {citationVal}
          </span>
        );
      }

      // Handle citation like [Page 58] or [Document | Page 4]
      if (part.startsWith('[') && part.endsWith(']') && /(page|ref)/i.test(part)) {
        const citationVal = part.slice(1, -1);
        return (
          <span
            key={index}
            className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 select-all whitespace-nowrap"
            title={`Source reference ${citationVal}`}
          >
            {citationVal.startsWith('Ref') ? citationVal : `Ref ${citationVal}`}
          </span>
        );
      }

      // Handle citation like "Ref Page 58" or "Ref Page 145-55"
      if (/^Ref\s+Page\s+\d+/i.test(part)) {
        return (
          <span
            key={index}
            className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 select-all whitespace-nowrap"
            title={`Source reference ${part}`}
          >
            {part}
          </span>
        );
      }

      // Handle bold **...**
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Handle inline code `...`
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-zinc-800 text-brand-300 font-mono text-xs border border-zinc-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      return part;
    });
  };

  // Table recognition helpers
  const isTableRow = (line) => {
    const t = line.trim();
    return t.startsWith('|') && t.endsWith('|') && t.length > 2;
  };

  const isSeparatorRow = (line) => {
    const t = line.trim();
    if (!isTableRow(t)) return false;
    const inner = t.slice(1, -1);
    return inner.split('|').every((cell) => cell.trim().replace(/[-:\s]/g, '') === '');
  };

  const parseCells = (line) => {
    const trimmed = line.trim();
    const inner = trimmed.startsWith('|') && trimmed.endsWith('|') ? trimmed.slice(1, -1) : trimmed;
    return inner.split('|').map((c) => c.trim());
  };

  const rawLines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2.5 space-y-1.5 pl-5 list-disc text-zinc-300">
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. Table Detection
    if (isTableRow(trimmed)) {
      flushList();
      const tableLines = [];
      while (i < rawLines.length) {
        const cur = rawLines[i].trim();
        if (isTableRow(cur)) {
          tableLines.push(cur);
          i++;
        } else if (cur === '' && i + 1 < rawLines.length && isTableRow(rawLines[i + 1].trim())) {
          // Skip occasional blank line between table rows
          i++;
        } else {
          break;
        }
      }

      if (tableLines.length >= 2 && isSeparatorRow(tableLines[1])) {
        const headers = parseCells(tableLines[0]);
        const dataRows = tableLines.slice(2).map(parseCells);

        elements.push(
          <div
            key={`table-${elements.length}`}
            className="overflow-x-auto my-4 rounded-xl border border-zinc-800 bg-zinc-950/70 shadow-xl"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-900/90 text-zinc-200 border-b border-zinc-800 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-4 py-3 border-r border-zinc-800/80 last:border-r-0">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-900/40 transition">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-4 py-3 border-r border-zinc-800/60 last:border-r-0 leading-relaxed align-top"
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      } else {
        // Fallback: not a recognized table format, treat as regular text
        tableLines.forEach((tl) => {
          elements.push(
            <p key={`p-${elements.length}`} className="my-2 leading-relaxed text-zinc-300">
              {renderInline(tl)}
            </p>
          );
        });
        continue;
      }
    }

    // 2. Empty line triggers paragraph breaks
    if (!trimmed) {
      flushList();
      i++;
      continue;
    }

    // 3. Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      currentList.push(trimmed.slice(2));
      i++;
      continue;
    }

    // 4. Flush lists before headers or standard paragraphs
    flushList();

    // 5. Headers
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${elements.length}`} className="text-sm font-semibold text-zinc-100 mt-4 mb-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-base font-semibold text-zinc-100 mt-5 mb-2">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-lg font-bold text-zinc-100 mt-6 mb-2">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
    } else {
      // 6. Standard paragraph
      elements.push(
        <p key={`p-${elements.length}`} className="my-2 leading-relaxed text-zinc-300">
          {renderInline(trimmed)}
        </p>
      );
    }

    i++;
  }

  flushList();
  return <div className="space-y-1 text-sm leading-relaxed">{elements}</div>;
};
