import React from 'react';
import { Course, SyllabusWeek } from '../types';
import { Compass, ChevronRight, FileText, Check } from 'lucide-react';

interface TimelineSidebarProps {
  course: Course;
  selectedWeek: number | null;
  onSelectWeek: (week: number | null) => void;
  noteCounts?: Record<number, number>;
  isLoading?: boolean;
}

export const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  course,
  selectedWeek,
  onSelectWeek,
  noteCounts = {},
  isLoading = false
}) => {
  const weeks = course.syllabus_timeline;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col blueprint-panel rounded h-[calc(100vh-6.2rem)] overflow-hidden">
      
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-blueprint-border bg-blueprint-surface">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blueprint-muted">
            Syllabus Outline
          </span>
          <span className="font-mono text-[10px] text-blueprint-muted">
            {isLoading ? '...' : `${weeks.length} WEEKS`}
          </span>
        </div>
        <p className="text-[11px] text-blueprint-secondary mt-1">
          Select target week or use automatic semantic routing.
        </p>
      </div>

      {/* Global / Auto-Detect Option */}
      <div className="p-2 border-b border-blueprint-border bg-blueprint-surface/50">
        <button
          onClick={() => onSelectWeek(null)}
          className={`w-full text-left p-2.5 rounded transition-colors duration-100 flex items-center justify-between border ${
            selectedWeek === null
              ? 'bg-blueprint-raised border-l-2 border-l-blueprint-brass border-blueprint-borderLight text-blueprint-primary font-medium'
              : 'bg-transparent border-transparent hover:bg-blueprint-raised/50 text-blueprint-secondary hover:text-blueprint-primary'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-blueprint-brass font-semibold">
              AUTO
            </span>
            <div>
              <div className="text-xs font-semibold">All Weeks / Auto-Detect</div>
              <p className="text-[10px] font-mono text-blueprint-muted">Autonomous semantic routing</p>
            </div>
          </div>
          {selectedWeek === null && (
            <span className="font-mono text-[10px] text-blueprint-brass">
              [ACTIVE]
            </span>
          )}
        </button>
      </div>

      {/* Week Timeline List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-2.5 rounded border border-blueprint-border/40 bg-blueprint-surface space-y-2 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-10 bg-blueprint-raised rounded" />
                <div className="h-3 w-32 bg-blueprint-raised rounded" />
              </div>
              <div className="h-2 w-24 bg-blueprint-raised/60 rounded" />
            </div>
          ))
        ) : (
          weeks.map((item: SyllabusWeek) => {
          const isSelected = selectedWeek === item.week;
          const count = noteCounts[item.week] || 0;
          const weekPadded = String(item.week).padStart(2, '0');

          return (
            <button
              key={item.week}
              onClick={() => onSelectWeek(item.week)}
              className={`w-full text-left p-2.5 rounded transition-colors duration-100 flex flex-col gap-1.5 border ${
                isSelected
                  ? 'bg-blueprint-raised border-l-2 border-l-blueprint-brass border-blueprint-borderLight text-blueprint-primary font-medium'
                  : 'bg-transparent border-transparent hover:bg-blueprint-raised/50 text-blueprint-secondary hover:text-blueprint-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[11px] font-semibold ${isSelected ? 'text-blueprint-brass' : 'text-blueprint-muted'}`}>
                    W{weekPadded}
                  </span>
                  <span className="text-xs font-medium text-blueprint-primary truncate max-w-[180px]">
                    {item.core_topic}
                  </span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isSelected ? 'text-blueprint-brass' : 'text-blueprint-muted/50'
                  }`}
                />
              </div>

              {/* Keywords as clean inline metadata */}
              <div className="text-[10px] font-mono text-blueprint-muted truncate pl-6">
                {item.grounding_keywords.join(' · ')}
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between pt-1 border-t border-blueprint-border/40 text-[10px] font-mono pl-6">
                <span className="flex items-center gap-1 text-blueprint-emerald">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  Grounded
                </span>
                <span className="text-blueprint-muted">
                  {count > 0 ? `${count} peer notes` : 'Indexed'}
                </span>
              </div>
            </button>
          );
        }))}
      </div>
    </aside>
  );
};
