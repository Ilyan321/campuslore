import React from 'react';
import { Course, SyllabusWeek } from '../types';
import { Calendar, CheckCircle2, ChevronRight, FileText, Layers, Sparkles, Compass } from 'lucide-react';

interface TimelineSidebarProps {
  course: Course;
  selectedWeek: number | null;
  onSelectWeek: (week: number | null) => void;
  noteCounts?: Record<number, number>;
}

export const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  course,
  selectedWeek,
  onSelectWeek,
  noteCounts = {}
}) => {
  const weeks = course.syllabus_timeline;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col glass-panel rounded-2xl p-4 h-[calc(100vh-6.5rem)] overflow-hidden border border-campus-border/60">
      
      {/* Sidebar Header */}
      <div className="pb-3 mb-2 border-b border-campus-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-sm tracking-tight">Syllabus Timeline</h2>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-campus-card px-2 py-0.5 rounded-md border border-campus-border/40">
            {weeks.length} Key Weeks
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Select a week or use Universal AI routing across the whole semester.
        </p>
      </div>

      {/* Global / Auto-Detect Option */}
      <div className="mb-3">
        <button
          onClick={() => onSelectWeek(null)}
          className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 border flex items-center justify-between ${
            selectedWeek === null
              ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
              : 'bg-campus-card/60 hover:bg-campus-card border-campus-border/40 text-slate-300 hover:border-campus-border/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${selectedWeek === null ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
              <Compass className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1">
                <span>All Weeks / Auto-Detect</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-[10px] text-slate-400">Agentic week discovery</p>
            </div>
          </div>
          {selectedWeek === null && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
              ACTIVE
            </span>
          )}
        </button>
      </div>

      {/* Week Timeline List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {weeks.map((item: SyllabusWeek) => {
          const isSelected = selectedWeek === item.week;
          const count = noteCounts[item.week] || 0;

          return (
            <button
              key={item.week}
              onClick={() => onSelectWeek(item.week)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-150 border flex flex-col gap-2 relative ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-sm shadow-amber-500/10'
                  : 'bg-campus-card/50 hover:bg-campus-card border-campus-border/40 hover:border-campus-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    Week {item.week}
                  </span>
                  <span className="text-[11px] font-medium text-slate-300 line-clamp-1">
                    {item.core_topic}
                  </span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-500'
                  }`}
                />
              </div>

              {/* Grounding Keywords Pills */}
              <div className="flex flex-wrap gap-1">
                {item.grounding_keywords.slice(0, 3).map((kw, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-400 border border-slate-700/40"
                  >
                    #{kw}
                  </span>
                ))}
                {item.grounding_keywords.length > 3 && (
                  <span className="text-[10px] text-slate-500 self-center">
                    +{item.grounding_keywords.length - 3} more
                  </span>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-1 border-t border-campus-border/30 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Grounded
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-slate-500" />
                  {count > 0 ? `${count} peer notes` : 'Syllabus Ready'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
