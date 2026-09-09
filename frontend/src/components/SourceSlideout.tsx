import React from 'react';
import { NoteSource } from '../types';
import { X, FileText, ExternalLink, BookmarkCheck, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] glass-panel border-l border-campus-border/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-campus-border/60 bg-campus-card/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="font-bold text-sm text-white">Source Attribution</h3>
            <p className="text-[11px] text-slate-400">Zero-Hallucination Grounded Peer Material</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Source Tab Selector */}
      <div className="px-6 py-3 border-b border-campus-border/40 bg-campus-card/30 flex items-center gap-2 overflow-x-auto">
        {sources.map((src, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSourceIndex(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeSourceIndex === idx
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Source {idx + 1}</span>
            {src.similarity && (
              <span className="text-[10px] opacity-80">
                ({Math.round(src.similarity * 100)}%)
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Source Document Details */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        
        {/* Source File Meta */}
        <div className="p-4 rounded-xl bg-campus-card border border-campus-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              {currentSource.file_name}
            </span>
            {currentSource.file_url && (
              <a
                href={currentSource.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <span>Open File</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Topic: <strong className="text-slate-200">{currentSource.topic || 'General'}</strong></span>
            {currentSource.week_number && (
              <span>• Week {currentSource.week_number}</span>
            )}
          </div>
        </div>

        {/* Note Chunk Text */}
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2">
            Retrieved Senior Note Chunk
          </label>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {currentSource.content}
          </div>
        </div>

        {/* Verification guarantee */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            This note chunk was directly referenced by Groq Llama-3.3-70b to formulate your localized answer.
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-campus-border/60 bg-campus-card/50 flex justify-end">
        <button
          onClick={onClose}
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          Close Preview
        </button>
      </div>

    </div>
  );
};
