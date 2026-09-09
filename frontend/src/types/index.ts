export interface SyllabusWeek {
  week: number;
  core_topic: string;
  grounding_keywords: string[];
}

export interface Course {
  course_id: string;
  course_name: string;
  department: string;
  syllabus_timeline: SyllabusWeek[];
}

export interface AnalysisResult {
  file_name: string;
  file_url: string;
  extracted_text: string;
  preview: string;
  classification: {
    course_id: string;
    assigned_week: number;
    topic: string;
    confidence: number;
    reasoning: string;
  };
}

export interface NoteSource {
  id?: string;
  file_name: string;
  file_url?: string;
  topic?: string;
  week_number?: number;
  similarity?: number;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: NoteSource[];
  isStreaming?: boolean;
}

export interface WeekNoteInfo {
  file_name: string;
  file_url: string;
  topic: string;
  created_at: string;
}
