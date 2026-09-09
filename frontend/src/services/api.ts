import { Course, AnalysisResult, NoteSource, WeekNoteInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://campuslore-backend.onrender.com');

export const DEFAULT_COURSES: Course[] = [
  {
    course_id: "CSE-212",
    course_name: "Data Structures & Algorithms",
    department: "Computer Systems Engineering",
    syllabus_timeline: [
      { week: 1, core_topic: "Pointers & Dynamic Memory", grounding_keywords: ["malloc", "pointers", "arrays"] },
      { week: 3, core_topic: "Linked Lists (Singly & Doubly)", grounding_keywords: ["node", "head", "tail", "linked list"] },
      { week: 4, core_topic: "Stack Data Structure & Expression Parsing", grounding_keywords: ["stack", "push", "pop", "lifo"] },
      { week: 5, core_topic: "Queue Data Structure & Circular Implementations", grounding_keywords: ["queue", "enqueue", "dequeue", "circular queue", "modulo"] },
      { week: 8, core_topic: "Binary Search Trees & Traversals", grounding_keywords: ["bst", "inorder", "preorder", "postorder"] },
      { week: 12, core_topic: "Graph Traversals and Shortest Path", grounding_keywords: ["graph", "bfs", "dfs", "dijkstra"] },
      { week: 14, core_topic: "Sorting, Searching & Time Complexity", grounding_keywords: ["quicksort", "binary search", "big o"] }
    ]
  },
  {
    course_id: "CSE-305",
    course_name: "Data & Computer Networks",
    department: "Computer Systems Engineering",
    syllabus_timeline: [
      { week: 2, core_topic: "OSI 7-Layer Architecture & TCP/IP", grounding_keywords: ["osi", "transport", "network", "datalink"] },
      { week: 5, core_topic: "IP Addressing, CIDR & Subnetting", grounding_keywords: ["ipv4", "cidr", "subnet mask", "usable hosts"] },
      { week: 9, core_topic: "Routing Protocols (OSPF & RIP)", grounding_keywords: ["routing", "ospf", "rip", "distance vector"] },
      { week: 11, core_topic: "Transport Layer: TCP vs UDP Handshake", grounding_keywords: ["tcp", "udp", "three way handshake", "syn ack"] }
    ]
  }
];

export async function fetchSyllabus(): Promise<Course[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/api/syllabus`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_COURSES;
  } catch (err) {
    return DEFAULT_COURSES;
  }
}

export async function analyzeFile(file: File, courseId: string): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('course_id', courseId);

  const res = await fetch(`${API_BASE_URL}/api/ingest/analyze`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to analyze note' }));
    throw new Error(errorData.detail || 'Analysis request failed');
  }

  return await res.json();
}

export async function confirmIngest(payload: {
  file_name: string;
  file_url?: string;
  course_id: string;
  week_number: number;
  topic: string;
  content: string;
}): Promise<{ success: boolean; message: string; inserted_count: number }> {
  const res = await fetch(`${API_BASE_URL}/api/ingest/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to confirm ingestion' }));
    throw new Error(err.detail || 'Ingestion confirmation failed');
  }

  return await res.json();
}

export async function queryRAG(payload: {
  query: string;
  week_number?: number | null;
  course_id?: string | null;
}): Promise<{
  answer: string;
  week_number?: number | null;
  course_id?: string | null;
  sources: NoteSource[];
  agentic_meta?: {
    auto_detected_week?: number;
    detected_topic?: string;
    language_mode?: string;
    expanded_queries?: string[];
    relevance_grade?: string;
    latency_seconds?: number;
  };
}> {
  const res = await fetch(`${API_BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to query RAG' }));
    throw new Error(err.detail || 'Query failed');
  }

  return await res.json();
}

export async function triggerSeed(): Promise<{ success: boolean; message: string; seeded_topics: string[]; total_chunks: number }> {
  const res = await fetch(`${API_BASE_URL}/api/seed`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to seed notes database');
  return await res.json();
}

export async function fetchWeekNotes(courseId: string, weekNumber: number): Promise<WeekNoteInfo[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/notes?course_id=${encodeURIComponent(courseId)}&week_number=${weekNumber}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Error fetching week notes:', err);
    return [];
  }
}
