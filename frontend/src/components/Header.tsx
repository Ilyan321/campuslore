import React from 'react';
import { Course } from '../types';
import { BookOpen, UploadCloud, Sparkles, GraduationCap } from 'lucide-react';

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
    <header className="sticky top-0 z-30 w-full border-b border-campus-border/60 bg-campus-bg/85 backdrop-blur-xl px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
            <BookOpen className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                Campus<span className="text-amber-400">Lore</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                QUEST / MUET
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Your Campus. Your Notes. Your AI.
            </p>
          </div>
        </div>

        {/* Course Switcher & Upload Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Course Selector Dropdown */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={selectedCourseId}
              onChange={(e) => onSelectCourse(e.target.value)}
              className="w-full md:w-72 bg-campus-card/90 text-slate-200 text-xs font-semibold py-2.5 px-3.5 pr-8 rounded-xl border border-campus-border/80 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition appearance-none cursor-pointer"
            >
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id} className="bg-campus-panel py-2 text-slate-200">
                  {course.course_id}: {course.course_name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          {/* Senior Upload Notes Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Senior Notes</span>
          </button>
        </div>

      </div>
    </header>
  );
};
