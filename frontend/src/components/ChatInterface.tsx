import React, { useState, useRef, useEffect } from 'react';
import { Course, SyllabusWeek, ChatMessage, NoteSource, ChatSession } from '../types';
import { queryRAG } from '../services/api';
import {
  Send,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowUpRight,
  Terminal,
  Loader2
} from 'lucide-react';

interface ChatInterfaceProps {
  courses: Course[];
  selectedCourseId: string | null;
  selectedWeek: number | null;
  activeSession: ChatSession | null;
  onUpdateSessionMessages: (sessionId: string, newMessages: ChatMessage[], title?: string) => void;
  onSelectTopic: (courseId: string | null, week: number | null) => void;
  onOpenSources: (sources: NoteSource[]) => void;
  onOpenUpload: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  courses,
  selectedCourseId,
  selectedWeek,
  activeSession,
  onUpdateSessionMessages,
  onSelectTopic,
  onOpenSources,
  onOpenUpload
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentCourse = courses.find((c) => c.course_id === selectedCourseId);
  const currentWeekInfo = (currentCourse && selectedWeek !== null)
    ? currentCourse.syllabus_timeline.find((w) => w.week === selectedWeek)
    : null;

  const messages = activeSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading || !activeSession) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessagesWithUser = [...messages, userMessage];
    const isFirstQuestion = messages.filter(m => m.role === 'user').length === 0;
    const sessionTitle = isFirstQuestion 
      ? (textToSend.trim().length > 38 ? `${textToSend.trim().slice(0, 38)}...` : textToSend.trim())
      : undefined;

    onUpdateSessionMessages(activeSession.id, newMessagesWithUser, sessionTitle);
    if (!queryText) setInput('');
    setLoading(true);
    setRateLimitError(null);

    try {
      const response = await queryRAG({
        query: textToSend.trim(),
        week_number: selectedWeek,
        course_id: selectedCourseId || "CSE-212"
      });

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
        auto_detected_week: response.agentic_meta?.auto_detected_week || response.week_number,
        detected_topic: response.agentic_meta?.detected_topic,
        language_mode: response.agentic_meta?.language_mode
      };

      const finalMessages = [...newMessagesWithUser, assistantMessage];
      onUpdateSessionMessages(activeSession.id, finalMessages);
    } catch (err: any) {
      console.error('Chat error:', err);
      setRateLimitError('Server rate limit or temporary latency hit. Please retry in a few seconds.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = selectedWeek !== null ? [
    `Explain the core exam concept and implementation details for this topic`,
    `Provide a working code snippet with edge cases and time complexity`,
    `What are the most frequent past paper questions highlighted by seniors?`
  ] : [
    `How do queue underflow and circular modulo arithmetic work in C++?`,
    `Explain Dijkstra's shortest path algorithm with a trace example`,
    `How do you calculate usable host IPs and subnets in CIDR /26?`
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-6.2rem)] blueprint-panel rounded overflow-hidden">
      
      {/* Context Top Bar */}
      <div className="px-4 py-2.5 border-b border-blueprint-border bg-blueprint-surface flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] font-semibold text-blueprint-brass px-1.5 py-0.5 border border-blueprint-border bg-blueprint-raised rounded">
            {selectedWeek !== null ? `W${String(selectedWeek).padStart(2, '0')}` : 'UNIVERSAL'}
          </span>
          <div>
            <h2 className="text-xs font-semibold text-blueprint-primary flex items-center gap-1.5">
              {selectedWeek !== null ? (currentWeekInfo?.core_topic || 'Syllabus Topic') : 'Universal Academic Knowledge Base'}
            </h2>
            <p className="text-[10px] font-mono text-blueprint-muted">
              {selectedWeek !== null ? `Scope: ${currentCourse?.course_id || 'Course'} • Week ${selectedWeek}` : 'Autonomous cross-course semantic discovery & grounding'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="text-[11px] font-mono text-blueprint-secondary hover:text-blueprint-primary flex items-center gap-1 px-2 py-1 rounded border border-blueprint-border hover:bg-blueprint-raised transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-blueprint-brass" />
          <span>Contribute Notes</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div key={msg.id} className="max-w-4xl space-y-1">
              
              {/* Header Meta / Sender */}
              <div className="flex items-center justify-between text-[11px] font-mono text-blueprint-muted px-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isUser ? 'text-blueprint-cobalt' : 'text-blueprint-brass'}`}>
                    {isUser ? '❯ STUDENT QUERY' : '❯ SENIOR PEER GROUNDING'}
                  </span>
                  {!isUser && msg.auto_detected_week && (
                    <span className="text-blueprint-muted">
                      [ROUTED: W{String(msg.auto_detected_week).padStart(2, '0')}{msg.detected_topic ? ` // ${msg.detected_topic}` : ''}]
                    </span>
                  )}
                </div>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Body */}
              <div
                className={`p-4 rounded border text-xs lg:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blueprint-surface border-blueprint-border text-blueprint-primary'
                    : 'bg-blueprint-surface/90 border-blueprint-border text-blueprint-primary'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-blueprint-primary">{msg.content}</div>

                {/* Sources & Citations */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-blueprint-border flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-blueprint-muted">
                      <FileText className="w-3.5 h-3.5 text-blueprint-secondary" />
                      <span>Referenced {msg.sources.length} senior peer source{msg.sources.length > 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => onOpenSources(msg.sources!)}
                      className="text-[11px] font-mono font-medium px-2.5 py-1 rounded bg-blueprint-raised hover:bg-blueprint-subtle text-blueprint-primary border border-blueprint-border hover:border-blueprint-borderLight transition flex items-center gap-1"
                    >
                      <span>Inspect Notes</span>
                      <ArrowUpRight className="w-3 h-3 text-blueprint-brass" />
                    </button>
                  </div>
                )}
              </div>

              {/* Message Utilities */}
              <div className="flex items-center justify-end px-1 text-[10px] font-mono text-blueprint-muted">
                {!isUser && (
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="hover:text-blueprint-primary flex items-center gap-1 transition"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-blueprint-emerald" />
                        <span className="text-blueprint-emerald">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          );
        })}

        {/* Structured Workstation Skeleton Screen */}
        {loading && (
          <div className="max-w-4xl space-y-2 animate-pulse" aria-busy="true" aria-label="Loading grounding answer">
            {/* Skeleton Header */}
            <div className="flex items-center justify-between text-[11px] font-mono px-1">
              <div className="flex items-center gap-2">
                <span className="text-blueprint-brass font-semibold">❯ RETRIEVING PEER GROUNDING...</span>
                <div className="h-3 w-32 bg-blueprint-raised rounded border border-blueprint-border" />
              </div>
              <div className="h-3 w-12 bg-blueprint-raised rounded" />
            </div>

            {/* Skeleton Response Card */}
            <div className="p-4 rounded border border-blueprint-border bg-blueprint-surface/90 space-y-3">
              {/* Content skeleton lines */}
              <div className="space-y-2">
                <div className="h-3.5 bg-blueprint-raised rounded w-full border border-blueprint-border/40" />
                <div className="h-3.5 bg-blueprint-raised rounded w-11/12 border border-blueprint-border/40" />
                <div className="h-3.5 bg-blueprint-raised rounded w-4/5 border border-blueprint-border/40" />
                <div className="h-3.5 bg-blueprint-raised rounded w-3/4 border border-blueprint-border/40" />
              </div>

              {/* Code Block Skeleton Placeholder */}
              <div className="p-3 bg-blueprint-canvas rounded border border-blueprint-border space-y-2 my-2 font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-blueprint-border/50">
                  <div className="h-2.5 w-24 bg-blueprint-raised rounded" />
                  <div className="h-2.5 w-10 bg-blueprint-raised rounded" />
                </div>
                <div className="h-3 bg-blueprint-raised/80 rounded w-2/3" />
                <div className="h-3 bg-blueprint-raised/80 rounded w-1/2" />
                <div className="h-3 bg-blueprint-raised/80 rounded w-3/5" />
              </div>

              {/* Citations Footer Skeleton */}
              <div className="pt-3 border-t border-blueprint-border flex items-center justify-between">
                <div className="h-3 w-44 bg-blueprint-raised rounded" />
                <div className="h-6 w-24 bg-blueprint-raised rounded border border-blueprint-border" />
              </div>
            </div>
          </div>
        )}

        {/* Rate Limit Error Banner */}
        {rateLimitError && (
          <div className="p-3 rounded border border-blueprint-ruby/40 bg-blueprint-surface text-blueprint-ruby text-xs flex items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{rateLimitError}</span>
            </div>
            <button
              onClick={() => handleSend()}
              className="flex items-center gap-1 font-semibold text-blueprint-primary hover:underline px-2 py-1 rounded bg-blueprint-raised border border-blueprint-border"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-blueprint-surface border-t border-blueprint-border flex items-center gap-3 overflow-x-auto text-[11px] font-mono text-blueprint-secondary">
          <span className="text-blueprint-muted uppercase text-[10px] flex-shrink-0 font-semibold">Suggested:</span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap hover:text-blueprint-primary hover:underline transition flex-shrink-0"
            >
              {idx + 1}. {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Command Dock */}
      <div className="p-3 border-t border-blueprint-border bg-blueprint-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any computer science or engineering question (e.g. Explain circular queue modulo arithmetic)..."
              disabled={loading}
              className="w-full bg-blueprint-raised text-blueprint-primary text-xs lg:text-sm py-2.5 px-3 rounded border border-blueprint-border focus:border-blueprint-brass focus:outline-none placeholder:text-blueprint-muted/60 transition disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded bg-blueprint-primary hover:bg-white disabled:opacity-40 disabled:hover:bg-blueprint-primary text-blueprint-canvas font-medium text-xs transition duration-150 flex-shrink-0 active:translate-y-px"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </form>
      </div>

    </div>
  );
};
