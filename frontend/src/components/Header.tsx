import React from 'react';
import { UploadCloud, BookOpen } from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload
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

        {/* Action Trigger */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blueprint-primary hover:bg-white text-blueprint-canvas font-medium text-xs transition duration-150 active:translate-y-px flex-shrink-0"
        >
          <UploadCloud className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Upload Notes</span>
        </button>

      </div>
    </header>
  );
};

