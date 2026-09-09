import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TimelineSidebar } from './components/TimelineSidebar';
import { ChatInterface } from './components/ChatInterface';
import { UploadModal } from './components/UploadModal';
import { SourceSlideout } from './components/SourceSlideout';
import { Course, NoteSource } from './types';
import { fetchSyllabus, DEFAULT_COURSES } from './services/api';

export function App() {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('CSE-212');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [sources, setSources] = useState<NoteSource[]>([]);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);
  const [isSlideoutOpen, setIsSlideoutOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const syllabusList = await fetchSyllabus();
        if (syllabusList && syllabusList.length > 0) {
          setCourses(syllabusList);
        }
      } catch (err) {
        console.error('Failed to sync live syllabus:', err);
      }
    }
    loadData();
  }, []);

  const currentCourse = courses.find((c) => c.course_id === selectedCourseId) || courses[0] || DEFAULT_COURSES[0];

  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
    setSelectedWeek(null);
  };

  const handleOpenSources = (newSources: NoteSource[]) => {
    setSources(newSources);
    setActiveSourceIndex(0);
    setIsSlideoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-blueprint-canvas flex flex-col text-blueprint-primary selection:bg-blueprint-brass/30 selection:text-amber-200">
      
      {/* Top Navigation */}
      <Header
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={handleSelectCourse}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 lg:p-4 flex flex-col lg:flex-row gap-3 relative">
        
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
