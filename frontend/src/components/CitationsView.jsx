import React, { useState } from 'react';
import { FileText, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Renders verified citation cards and referenced source chunks
 * directly after AI text generation.
 */
export const CitationsView = ({ evidence, citations = [] }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!evidence && (!citations || citations.length === 0)) return null;

  // Parse evidence chunks from the standard delimiter
  // Our backend separates chunks with "\n\n---\n\n"
  const rawChunks = evidence ? evidence.split(/\n\n---\n\n/) : [];

  const parsedChunks = rawChunks.map((chunk, idx) => {
    const trimmed = chunk.trim();
    // Check if chunk starts with [Filename | Page X]:
    const headerMatch = trimmed.match(/^\[([^\]|]+)\s*\|\s*([^\]]+)\]:\n([\s\S]*)$/);
    if (headerMatch) {
      return {
        id: idx + 1,
        filename: headerMatch[1].trim(),
        page: headerMatch[2].trim(),
        content: headerMatch[3].trim(),
      };
    }

    // Fallback if older format without [File | Page] header
    return {
      id: idx + 1,
      filename: `Knowledge Source ${idx + 1}`,
      page: null,
      content: trimmed,
    };
  });

  return (
    <div className="mt-5 pt-5 border-t border-zinc-800/80 space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-brand-400" />
          <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Verified Citations & Grounded Sources
          </h4>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {parsedChunks.length} {parsedChunks.length === 1 ? 'Source chunk' : 'Source chunks'}
        </span>
      </div>

      {/* Source Cards Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {parsedChunks.map((source, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={source.id}
              className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3.5 hover:border-zinc-700/80 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {source.filename}
                      </span>
                      {source.page && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30 shrink-0">
                          {source.page}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-zinc-800/60 transition shrink-0"
                >
                  <span>{isExpanded ? 'Collapse' : 'Inspect Excerpt'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Source Snippet */}
              <div className="mt-2 text-xs text-zinc-400 font-sans leading-relaxed">
                {isExpanded ? (
                  <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-normal mt-2 max-h-60 overflow-y-auto">
                    {source.content}
                  </div>
                ) : (
                  <p className="line-clamp-2 text-zinc-400 italic">
                    "{source.content.slice(0, 180)}..."
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

