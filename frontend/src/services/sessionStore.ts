import { ChatSession, ChatMessage } from '../types';

const SESSIONS_STORAGE_KEY = 'campuslore_chat_sessions';
const ACTIVE_SESSION_ID_KEY = 'campuslore_active_session_id';

export function getStoredSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored chat sessions:', err);
    return [];
  }
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save chat sessions to localStorage:', err);
  }
}

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveSessionId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    }
  } catch (err) {
    console.error('Failed to set active session ID:', err);
  }
}

export function createNewSession(
  courseId: string | null = null,
  weekNumber: number | null = null,
  initialMessages: ChatMessage[] = []
): ChatSession {
  const newSession: ChatSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'New Academic Inquiry',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    course_id: courseId,
    week_number: weekNumber,
    messages: initialMessages
  };

  const sessions = getStoredSessions();
  sessions.unshift(newSession);
  saveStoredSessions(sessions);
  setActiveSessionId(newSession.id);
  return newSession;
}

export function updateSession(
  sessionId: string,
  updates: Partial<Omit<ChatSession, 'id' | 'created_at'>>
): void {
  const sessions = getStoredSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = {
      ...sessions[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    saveStoredSessions(sessions);
  }
}

export function deleteStoredSession(sessionId: string): ChatSession[] {
  const sessions = getStoredSessions().filter(s => s.id !== sessionId);
  saveStoredSessions(sessions);
  if (getActiveSessionId() === sessionId) {
    setActiveSessionId(sessions[0]?.id || null);
  }
  return sessions;
}

export function clearAllSessions(): void {
  try {
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  } catch (err) {
    console.error('Failed to clear sessions:', err);
  }
}
