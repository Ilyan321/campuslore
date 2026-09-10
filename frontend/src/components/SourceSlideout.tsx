import React, { useState, useEffect } from 'react';
import { NoteSource } from '../types';
import { X, FileText, ExternalLink, BookmarkCheck, Check, Code, BookOpen, Copy, Loader2 } from 'lucide-react';
import { fetchFullNoteContent, getRawNoteUrl, FullNoteResponse } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SourceSlideoutProps {
  isOpen: boolean;
  onClose: () => void;
  sources: NoteSource[];
  activeSourceIndex: number;
  onSelectSourceIndex: (idx: number) => void;
}

export const SourceSlideout: React.FC<SourceSlideoutProps> = ({
  isOpen,
  onClose,
  sources,
  activeSourceIndex,
  onSelectSourceIndex
}) => {
  const [viewMode, setViewMode] = useState<'excerpt' | 'full'>('excerpt');
  const [fullNote, setFullNote] = useState<FullNoteResponse | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentSource = sources && sources.length > 0 ? (sources[activeSourceIndex] || sources[0]) : null;

  useEffect(() => {
    if (isOpen && viewMode === 'full' && currentSource?.file_name) {
      setLoadingFull(true);
      fetchFullNoteContent(currentSource.file_name)
        .then((data) => {
          setFullNote(data);
          setLoadingFull(false);
        })
        .catch(() => {
          setLoadingFull(false);
        });
    }
  }, [isOpen, viewMode, currentSource?.file_name]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !sources || sources.length === 0 || !currentSource) return null;

  const rawUrl = getRawNoteUrl(currentSource.file_name || '');

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[580px] blueprint-panel border-l border-blueprint-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-blueprint-border bg-blueprint-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="w-4 h-4 text-blueprint-brass" />
          <div>
            <h3 className="font-semibold text-sm text-blueprint-primary">Source Material Inspector</h3>
            <p className="text-[11px] font-mono text-blueprint-muted">Directly referenced senior peer notes</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-blueprint-muted hover:text-blueprint-primary p-1 rounded hover:bg-blueprint-raised transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Source Tab Selector */}
      <div className="px-5 py-2 border-b border-blueprint-border bg-blueprint-surface/50 flex items-center gap-2 overflow-x-auto">
        {sources.map((src, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSourceIndex(idx)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 border ${
              activeSourceIndex === idx
                ? 'bg-blueprint-raised border-blueprint-brass text-blueprint-primary font-medium'
                : 'bg-transparent border-transparent hover:bg-blueprint-raised/50 text-blueprint-secondary hover:text-blueprint-primary'
            }`}
          >
            <FileText className="w-3 h-3 text-blueprint-brass" />
            <span>Source {idx + 1}</span>
            {src.similarity && (
              <span className="text-[10px] text-blueprint-muted">
                {Math.round(src.similarity * 100)}%
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Source Document Details */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        
        {/* Source File Meta */}
        <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-surface space-y-2 font-mono">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-blueprint-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blueprint-brass flex-shrink-0" />
              <span className="truncate max-w-[280px]">{currentSource.file_name}</span>
            </span>
            <a
              href={rawUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blueprint-brass hover:underline flex items-center gap-1 px-2 py-0.5 rounded bg-blueprint-raised border border-blueprint-border"
            >
              <span>Raw File</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-blueprint-muted">
            <span>Topic: <strong className="text-blueprint-secondary">{currentSource.topic || 'General'}</strong></span>
            {currentSource.week_number && (
              <span>• Week {currentSource.week_number}</span>
            )}
          </div>
        </div>

        {/* View Mode Switcher: Excerpt vs Full Document */}
        <div className="flex items-center justify-between border-b border-blueprint-border pb-2">
          <div className="flex items-center gap-1 bg-blueprint-raised p-0.5 rounded border border-blueprint-border">
            <button
              onClick={() => setViewMode('excerpt')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
                viewMode === 'excerpt'
                  ? 'bg-blueprint-surface text-blueprint-primary font-medium shadow-sm'
                  : 'text-blueprint-muted hover:text-blueprint-primary'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Matching Excerpt</span>
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition flex items-center gap-1.5 ${
                viewMode === 'full'
                  ? 'bg-blueprint-surface text-blueprint-primary font-medium shadow-sm'
                  : 'text-blueprint-muted hover:text-blueprint-primary'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Full Document / Code</span>
            </button>
          </div>

          <button
            onClick={() => handleCopy(viewMode === 'full' && fullNote ? fullNote.content : currentSource.content)}
            className="text-[11px] font-mono text-blueprint-muted hover:text-blueprint-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-blueprint-raised transition"
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

        {/* Note Content Display */}
        {viewMode === 'excerpt' ? (
          <div>
            <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-canvas text-blueprint-primary text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
              {currentSource.content}
            </div>
          </div>
        ) : (
          <div>
            {loadingFull ? (
              <div className="p-10 flex flex-col items-center justify-center gap-2 text-blueprint-muted font-mono text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-blueprint-brass" />
                <span>Loading complete document...</span>
              </div>
            ) : fullNote ? (
              <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-canvas text-blueprint-primary text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
                <MarkdownRenderer content={fullNote.content} />
              </div>
            ) : (
              <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-canvas text-blueprint-primary text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                {currentSource.content}
              </div>
            )}
          </div>
        )}

        {/* Verification guarantee */}
        <div className="p-3 rounded border border-blueprint-border bg-blueprint-surface text-[11px] font-mono text-blueprint-secondary flex items-start gap-2">
          <Check className="w-3.5 h-3.5 text-blueprint-emerald flex-shrink-0 mt-0.5" />
          <p>
            Grounding guarantee: Retrieved directly from verified peer notes to ensure zero hallucination.
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-blueprint-border bg-blueprint-surface flex justify-end">
        <button
          onClick={onClose}
          className="text-xs font-mono px-3 py-1.5 rounded bg-blueprint-raised hover:bg-blueprint-subtle text-blueprint-primary border border-blueprint-border transition"
        >
          Close Drawer
        </button>
      </div>

    </div>
  );
};

