import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TimelineSidebar } from './components/TimelineSidebar';
import { ChatInterface } from './components/ChatInterface';
import { UploadModal } from './components/UploadModal';
import { SourceSlideout } from './components/SourceSlideout';
import { Course, NoteSource } from './types';
import { fetchSyllabus } from './services/api';
import { Loader2 } from 'lucide-react';

export function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('CSE-212');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [sources, setSources] = useState<NoteSource[]>([]);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [isSlideoutOpen, setIsSlideoutOpen] = useState<boolean>(false);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const syllabusList = await fetchSyllabus();
        setCourses(syllabusList);
        if (syllabusList.length > 0) {
          setSelectedCourseId(syllabusList[0].course_id);
        }
      } catch (err) {
        console.error('Failed to load syllabus outline:', err);
      } finally {
        setIsLoadingSyllabus(false);
      }
    }
    loadData();
  }, []);

  const currentCourse = courses.find((c) => c.course_id === selectedCourseId) || courses[0];

  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
    setSelectedWeek(null); // Return to auto-detect when switching courses
  };

  const handleOpenSources = (newSources: NoteSource[]) => {
    setSources(newSources);
    setActiveSourceIndex(0);
    setIsSlideoutOpen(true);
  };

  if (isLoadingSyllabus || !currentCourse) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading CampusLore Grounding Syllabus...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col text-slate-100">
      
      {/* Top Navigation */}
      <Header
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={handleSelectCourse}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:px-8 flex flex-col lg:flex-row gap-4 relative">
        
        {/* Left: Syllabus Timeline Navigation */}
        <TimelineSidebar
          course={currentCourse}
          selectedWeek={selectedWeek}
          onSelectWeek={(wk) => setSelectedWeek(wk)}
        />

        {/* Center: Contextual Chat Interface */}
        <ChatInterface
          course={currentCourse}
          selectedWeek={selectedWeek}
          onSelectWeek={(wk) => setSelectedWeek(wk)}
          onOpenSources={handleOpenSources}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

      </main>

      {/* Senior Ingestion Upload Modal (Workflow A) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onUploadSuccess={() => {
          // Re-fetch notes or show confirmation
        }}
      />

      {/* Source Slideout Panel (Workflow B) */}
      <SourceSlideout
        isOpen={isSlideoutOpen}
        onClose={() => setIsSlideoutOpen(false)}
        sources={sources}
        activeSourceIndex={activeSourceIndex}
        onSelectSourceIndex={(idx) => setActiveSourceIndex(idx)}
      />

    </div>
  );
}

export default App;
