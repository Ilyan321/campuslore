import React from 'react';
import { Course } from '../types';
import { Layers, UploadCloud, ChevronDown, BookOpen } from 'lucide-react';

interface HeaderProps {
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (id: string) => void;
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  onOpenUpload
}) => {
  const currentCourse = courses.find(c => c.course_id === selectedCourseId) || courses[0];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-blueprint-border bg-blueprint-surface/95 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Brand & Context */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 rounded bg-blueprint-raised border border-blueprint-border flex items-center justify-center text-blueprint-brass flex-shrink-0">
            <BookOpen className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-blueprint-primary">
                CampusLore
              </span>
              <span className="font-mono text-[10px] text-blueprint-muted border-l border-blueprint-border pl-2 uppercase tracking-wider">
                QUEST / MUET Curricula
              </span>
            </div>
            <span className="text-[11px] text-blueprint-secondary hidden sm:inline-block">
              Peer-Verified Syllabus Grounding Workstation
            </span>
          </div>
        </div>

        {/* Right Controls: Course Selector & Action Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          
          {/* Course Selector Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedCourseId}
              onChange={(e) => onSelectCourse(e.target.value)}
              className="w-full sm:w-64 bg-blueprint-raised text-blueprint-primary text-xs font-mono py-1.5 px-3 pr-8 rounded border border-blueprint-border hover:border-blueprint-borderLight focus:border-blueprint-brass focus:outline-none transition appearance-none cursor-pointer"
            >
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id} className="bg-blueprint-surface text-blueprint-primary">
                  {course.course_id} • {course.course_name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-blueprint-muted">
              <ChevronDown className="w-3.5 h-3.5" />
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

      </div>
    </header>
  );
};

