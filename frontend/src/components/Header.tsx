import React from 'react';
import { UploadCloud, BookOpen, Plus, Clock } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenHistory: () => void;
  onNewChat: () => void;
  sessionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenHistory,
  onNewChat,
  sessionCount
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-blueprint-border bg-blueprint-surface/95 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-blueprint-raised border border-blueprint-border flex items-center justify-center text-blueprint-brass flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-blueprint-primary">
              CampusLore
            </span>
            <span className="text-[11px] text-blueprint-muted hidden sm:inline-block border-l border-blueprint-border pl-2 font-mono">
              Universal Academic Assistant
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-blueprint-border hover:border-blueprint-borderLight hover:bg-blueprint-raised text-blueprint-secondary hover:text-blueprint-primary font-mono text-xs transition duration-150 active:translate-y-px"
            title="Start a new academic chat session"
          >
            <Plus className="w-3.5 h-3.5 text-blueprint-brass stroke-[2.5]" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-blueprint-border hover:border-blueprint-borderLight hover:bg-blueprint-raised text-blueprint-secondary hover:text-blueprint-primary font-mono text-xs transition duration-150 active:translate-y-px"
            title="Open saved chat sessions"
          >
            <Clock className="w-3.5 h-3.5 text-blueprint-brass stroke-[2]" />
            <span>History</span>
            {sessionCount > 0 && (
              <span className="text-[10px] bg-blueprint-raised px-1.5 py-0.2 rounded border border-blueprint-border text-blueprint-primary">
                {sessionCount}
              </span>
            )}
          </button>

          {/* Upload Notes Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blueprint-primary hover:bg-white text-blueprint-canvas font-medium text-xs transition duration-150 active:translate-y-px flex-shrink-0 ml-1"
          >
            <UploadCloud className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">Upload Notes</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>

      </div>
    </header>
  );
};

