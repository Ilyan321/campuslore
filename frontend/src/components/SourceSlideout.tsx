import React from 'react';
import { NoteSource } from '../types';
import { X, FileText, ExternalLink, BookmarkCheck, Check } from 'lucide-react';

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
  if (!isOpen || sources.length === 0) return null;

  const currentSource = sources[activeSourceIndex] || sources[0];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[500px] blueprint-panel border-l border-blueprint-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
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
      <div className="px-5 py-2.5 border-b border-blueprint-border bg-blueprint-surface/50 flex items-center gap-2 overflow-x-auto">
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
        <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-surface space-y-1.5 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blueprint-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blueprint-brass" />
              {currentSource.file_name}
            </span>
            {currentSource.file_url && (
              <a
                href={currentSource.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blueprint-brass hover:underline flex items-center gap-1"
              >
                <span>Raw File</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-blueprint-muted">
            <span>Topic: <strong className="text-blueprint-secondary">{currentSource.topic || 'General'}</strong></span>
            {currentSource.week_number && (
              <span>• Week {currentSource.week_number}</span>
            )}
          </div>
        </div>

        {/* Note Chunk Text */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-blueprint-muted block mb-1.5">
            Indexed Note Excerpt
          </label>
          <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-canvas text-blueprint-primary text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {currentSource.content}
          </div>
        </div>

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

