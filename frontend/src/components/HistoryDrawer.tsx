import React from 'react';
import { ChatSession } from '../types';
import {
  X,
  MessageSquare,
  Trash2,
  Plus,
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll
}) => {
  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] blueprint-panel border-l border-blueprint-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-blueprint-border bg-blueprint-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blueprint-brass" />
          <div>
            <h3 className="font-semibold text-sm text-blueprint-primary">Saved Chat Sessions</h3>
            <p className="text-[11px] font-mono text-blueprint-muted">
              {sessions.length} recorded session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blueprint-primary hover:bg-white text-blueprint-canvas font-medium text-xs transition duration-150 active:translate-y-px"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>New Chat</span>
          </button>
          <button
            onClick={onClose}
            className="text-blueprint-muted hover:text-blueprint-primary p-1 rounded hover:bg-blueprint-raised transition ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sessions.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-blueprint-muted font-mono">
            <MessageSquare className="w-8 h-8 text-blueprint-border mb-2 stroke-[1.5]" />
            <p className="text-xs text-blueprint-secondary">No saved chat sessions yet.</p>
            <p className="text-[11px] text-blueprint-muted mt-1">
              Your inquiries and code solutions will automatically save here.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            const messageCount = session.messages.filter(m => m.role === 'user').length;

            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session);
                  onClose();
                }}
                className={`group p-3 rounded border transition-colors cursor-pointer flex flex-col gap-1.5 ${
                  isActive
                    ? 'bg-blueprint-raised border-l-2 border-l-blueprint-brass border-blueprint-borderLight'
                    : 'bg-blueprint-surface border-blueprint-border hover:border-blueprint-borderLight hover:bg-blueprint-raised/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blueprint-brass' : 'text-blueprint-muted'}`} />
                    <span className="text-xs font-medium text-blueprint-primary truncate">
                      {session.title || 'Untitled Session'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-blueprint-muted hover:text-blueprint-ruby p-1 rounded transition"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metadata row */}
                <div className="flex items-center justify-between text-[10px] font-mono text-blueprint-muted pl-5">
                  <div className="flex items-center gap-2">
                    <span>{formatDate(session.updated_at || session.created_at)}</span>
                    {session.week_number && (
                      <span className="text-blueprint-secondary">• W{String(session.week_number).padStart(2, '0')}</span>
                    )}
                  </div>
                  <span className="text-blueprint-muted">
                    {messageCount} question{messageCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-blueprint-border bg-blueprint-surface flex items-center justify-between">
          <button
            onClick={onClearAll}
            className="text-[11px] font-mono text-blueprint-muted hover:text-blueprint-ruby transition flex items-center gap-1 px-2 py-1 rounded"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All History</span>
          </button>
          <button
            onClick={onClose}
            className="text-xs font-mono text-blueprint-secondary hover:text-blueprint-primary px-3 py-1 rounded bg-blueprint-raised border border-blueprint-border transition"
          >
            Close
          </button>
        </div>
      )}

    </div>
  );
};
