import React, { useState, useMemo } from 'react';
import { Course, SyllabusWeek } from '../types';
import { ChevronRight, ChevronDown, BookOpen, Search, X } from 'lucide-react';

interface TimelineSidebarProps {
  courses: Course[];
  selectedCourseId: string | null;
  selectedWeek: number | null;
  onSelectTopic: (courseId: string | null, week: number | null) => void;
  isLoading?: boolean;
}

export const TimelineSidebar: React.FC<TimelineSidebarProps> = ({
  courses,
  selectedCourseId,
  selectedWeek,
  onSelectTopic,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({
    'CSE-212': true,
    'CSE-305': true
  });

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const totalWeeks = courses.reduce((acc, c) => acc + (c.syllabus_timeline?.length || 0), 0);

  // Live filter computation across courses, weeks, and keywords
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courses;

    return courses.map(course => {
      const courseMatch = course.course_id.toLowerCase().includes(q) || course.course_name.toLowerCase().includes(q);
      const matchingWeeks = course.syllabus_timeline.filter(w => 
        w.core_topic.toLowerCase().includes(q) ||
        w.grounding_keywords.some(kw => kw.toLowerCase().includes(q))
      );

      if (courseMatch) {
        return course;
      }

      if (matchingWeeks.length > 0) {
        return {
          ...course,
          syllabus_timeline: matchingWeeks
        };
      }

      return null;
    }).filter(Boolean) as Course[];
  }, [courses, searchQuery]);

  const matchingWeeksCount = useMemo(() => {
    return filteredCourses.reduce((acc, c) => acc + c.syllabus_timeline.length, 0);
  }, [filteredCourses]);

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col blueprint-panel rounded h-[calc(100vh-6.2rem)] overflow-hidden">
      
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-blueprint-border bg-blueprint-surface">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blueprint-muted">
            Universal Knowledge Index
          </span>
          <span className="font-mono text-[10px] text-blueprint-muted">
            {courses.length} COURSES • {totalWeeks} WEEKS
          </span>
        </div>
        <p className="text-[11px] text-blueprint-secondary mt-1">
          Universal multi-subject grounding index.
        </p>
      </div>

      {/* Live Syllabus Search Bar */}
      <div className="p-2 border-b border-blueprint-border bg-blueprint-surface/70">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-blueprint-muted absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter topics (e.g. Dijkstra, Queue, CIDR)..."
            className="w-full bg-blueprint-raised text-blueprint-primary text-xs font-mono py-1.5 pl-8 pr-7 rounded border border-blueprint-border focus:border-blueprint-brass focus:outline-none placeholder:text-blueprint-muted/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-blueprint-muted hover:text-blueprint-primary p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <div className="flex items-center justify-between text-[10px] font-mono text-blueprint-muted px-1 mt-1.5">
            <span>Filter results:</span>
            <span className="text-blueprint-brass">{matchingWeeksCount} week{matchingWeeksCount !== 1 ? 's' : ''} found</span>
          </div>
        )}
      </div>

      {/* Global / Auto-Detect Option */}
      {!searchQuery && (
        <div className="p-2 border-b border-blueprint-border bg-blueprint-surface/50">
          <button
            onClick={() => onSelectTopic(null, null)}
            className={`w-full text-left p-2 rounded transition-colors duration-100 flex items-center justify-between border ${
              selectedCourseId === null && selectedWeek === null
                ? 'bg-blueprint-raised border-l-2 border-l-blueprint-brass border-blueprint-borderLight text-blueprint-primary font-medium'
                : 'bg-transparent border-transparent hover:bg-blueprint-raised/50 text-blueprint-secondary hover:text-blueprint-primary'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-blueprint-brass font-semibold">
                AUTO
              </span>
              <div>
                <div className="text-xs font-semibold">All Subjects / Auto-Detect</div>
                <p className="text-[10px] font-mono text-blueprint-muted">Universal cross-course routing</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Multi-Course Timeline List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
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
        ) : filteredCourses.length === 0 ? (
          <div className="p-6 text-center text-blueprint-muted font-mono text-xs">
            No matching topics found for "{searchQuery}".
          </div>
        ) : (
          filteredCourses.map((course) => {
            const isExpanded = Boolean(searchQuery.trim()) || (expandedCourses[course.course_id] ?? true);

            return (
              <div key={course.course_id} className="space-y-1">
                {/* Course Accordion Header */}
                <button
                  onClick={() => toggleCourse(course.course_id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-left text-xs font-mono font-semibold text-blueprint-secondary hover:text-blueprint-primary hover:bg-blueprint-raised/40 rounded transition"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <BookOpen className="w-3.5 h-3.5 text-blueprint-brass flex-shrink-0" />
                    <span className="text-blueprint-primary font-semibold">{course.course_id}</span>
                    <span className="text-blueprint-muted truncate font-sans text-[11px]">• {course.course_name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-blueprint-muted flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-blueprint-muted flex-shrink-0" />
                  )}
                </button>

                {/* Course Weeks */}
                {isExpanded && (
                  <div className="space-y-1 pl-1">
                    {course.syllabus_timeline.map((item: SyllabusWeek) => {
                      const isSelected = selectedCourseId === course.course_id && selectedWeek === item.week;
                      const weekPadded = String(item.week).padStart(2, '0');

                      return (
                        <button
                          key={item.week}
                          onClick={() => onSelectTopic(course.course_id, item.week)}
                          className={`w-full text-left p-2 rounded transition-colors duration-100 flex flex-col gap-1 border ${
                            isSelected
                              ? 'bg-blueprint-raised border-l-2 border-l-blueprint-brass border-blueprint-borderLight text-blueprint-primary font-medium'
                              : 'bg-transparent border-transparent hover:bg-blueprint-raised/50 text-blueprint-secondary hover:text-blueprint-primary'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-[10px] font-semibold ${isSelected ? 'text-blueprint-brass' : 'text-blueprint-muted'}`}>
                                W{weekPadded}
                              </span>
                              <span className="text-xs font-medium text-blueprint-primary truncate max-w-[170px]">
                                {item.core_topic}
                              </span>
                            </div>
                            <ChevronRight
                              className={`w-3 h-3 transition-transform ${
                                isSelected ? 'text-blueprint-brass' : 'text-blueprint-muted/40'
                              }`}
                            />
                          </div>

                          {/* Keywords */}
                          <div className="text-[10px] font-mono text-blueprint-muted truncate pl-5">
                            {item.grounding_keywords.slice(0, 3).join(' · ')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
