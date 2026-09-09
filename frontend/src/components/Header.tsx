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
              Academic Peer Assistant
            </span>
          </div>
        </div>

        {/* Right Controls: Course Selector & Action Button */}
        <div className="flex items-center gap-2.5">
          
          {/* Course Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => onSelectCourse(e.target.value)}
              className="w-48 sm:w-72 md:w-80 bg-blueprint-raised text-blueprint-primary text-xs font-mono py-1.5 px-3 pr-8 rounded border border-blueprint-border hover:border-blueprint-borderLight focus:border-blueprint-brass focus:outline-none transition appearance-none cursor-pointer truncate"
            >
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id} className="bg-blueprint-surface text-blueprint-primary font-mono">
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
            <span className="hidden sm:inline">Upload Notes</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>

      </div>
    </header>
  );
};

