import React, { useState, useRef, useEffect } from 'react';
import { Course, SyllabusWeek, ChatMessage, NoteSource, ChatSession } from '../types';
import { queryRAG, streamQueryRAG, QueryMeta } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';
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
  Loader2,
  Sparkles,
  ChevronDown
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  const currentCourse = courses.find((c) => c.course_id === selectedCourseId);
  const currentWeekInfo = (currentCourse && selectedWeek !== null)
    ? currentCourse.syllabus_timeline.find((w) => w.week === selectedWeek)
    : null;

  const messages = activeSession?.messages || [];

  const handleContainerScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only scroll on initial welcome greeting load if needed
  useEffect(() => {
    if (messages.length <= 1) {
      scrollToBottom();
    }
  }, [activeSession?.id]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading || isStreaming || !activeSession) return;

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

    // Prepare multi-turn conversation memory (last 4 turns)
    const historyPayload = newMessagesWithUser
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-4)
      .map(m => ({ role: m.role, content: m.content }));

    onUpdateSessionMessages(activeSession.id, newMessagesWithUser, sessionTitle);
    if (!queryText) setInput('');
    setLoading(true);
    setRateLimitError(null);

    // Smoothly scroll to the new question so reading begins naturally from the top of the answer
    setTimeout(() => {
      lastUserMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);

    const assistantMsgId = `ai-${Date.now()}`;
    let accumulatedContent = '';
    let streamMeta: QueryMeta = {};

    try {
      setIsStreaming(true);
      
      // Stream tokens via SSE endpoint (/api/query/stream)
      await streamQueryRAG(
        {
          query: textToSend.trim(),
          week_number: selectedWeek,
          course_id: selectedCourseId || undefined,
          history: historyPayload
        },
        // onToken callback
        (token: string) => {
          accumulatedContent += token;
          setLoading(false); // Stop skeleton as soon as first token arrives
          
          const assistantMessage: ChatMessage = {
            id: assistantMsgId,
            role: 'assistant',
            content: accumulatedContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: streamMeta.sources || [],
            auto_detected_week: streamMeta.auto_detected_week,
            detected_topic: streamMeta.detected_topic,
            language_mode: streamMeta.language_mode,
            isStreaming: true
          };
          onUpdateSessionMessages(activeSession.id, [...newMessagesWithUser, assistantMessage]);
        },
        // onMeta callback
        (meta: QueryMeta) => {
          streamMeta = meta;
        }
      );

      // Finalize message once stream completes
      const finalAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: accumulatedContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: streamMeta.sources || [],
        auto_detected_week: streamMeta.auto_detected_week,
        detected_topic: streamMeta.detected_topic,
        language_mode: streamMeta.language_mode,
        isStreaming: false
      };
      onUpdateSessionMessages(activeSession.id, [...newMessagesWithUser, finalAssistantMessage]);

    } catch (streamErr: any) {
      console.warn('Streaming error, falling back to sync RAG query:', streamErr);
      
      // Graceful fallback to standard /api/query POST
      try {
        const response = await queryRAG({
          query: textToSend.trim(),
          week_number: selectedWeek,
          course_id: selectedCourseId || undefined,
          history: historyPayload
        });

        const assistantMessage: ChatMessage = {
          id: assistantMsgId,
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: response.sources,
          auto_detected_week: response.agentic_meta?.auto_detected_week || response.week_number || undefined,
          detected_topic: response.agentic_meta?.detected_topic,
          language_mode: response.agentic_meta?.language_mode,
          isStreaming: false
        };

        onUpdateSessionMessages(activeSession.id, [...newMessagesWithUser, assistantMessage]);
      } catch (err: any) {
        console.error('Chat query error:', err);
        setRateLimitError('Server rate limit or connection issue. Please retry in a moment.');
      }
    } finally {
      setLoading(false);
      setIsStreaming(false);
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
      </div>

      {/* Messages Feed */}
      <div
        ref={messagesContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 relative"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLastUser = isUser && idx === messages.map(m => m.role).lastIndexOf('user');

          return (
            <div
              key={msg.id}
              ref={isLastUser ? lastUserMsgRef : undefined}
              className="max-w-4xl space-y-1"
            >
              
              {/* Header Meta / Sender */}
              <div className="flex items-center justify-between text-[11px] font-mono text-blueprint-muted px-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isUser ? 'text-blueprint-cobalt' : 'text-blueprint-brass'}`}>
                    {isUser ? 'Student' : 'CampusLore'}
                  </span>
                  {!isUser && msg.auto_detected_week && msg.detected_topic && (
                    <span className="text-blueprint-muted">
                      [ROUTED: W{String(msg.auto_detected_week).padStart(2, '0')} // {msg.detected_topic}]
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
                {/* Notice when answering via General AI parametric knowledge without local peer notes */}
                {!isUser && typeof msg?.id === 'string' && !msg.id.startsWith('msg-welcome') && (!msg.sources || msg.sources.length === 0) && msg.content && !msg.isStreaming && (
                  <div className="mb-3.5 pb-2.5 border-b border-blueprint-border/60 flex items-center justify-between gap-2 text-[11px] font-mono bg-blueprint-raised/50 px-3 py-2 rounded">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blueprint-brass flex-shrink-0" />
                      <span className="text-blueprint-brass font-medium">Quick AI Overview</span>
                      <span className="text-blueprint-muted">· No matching peer notes found</span>
                    </div>
                    <span className="text-[10px] text-blueprint-muted hidden sm:inline font-mono">General Knowledge</span>
                  </div>
                )}

                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans text-blueprint-primary">{msg.content}</div>
                ) : (
                  <MarkdownRenderer content={msg.content} />
                )}

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

        {/* Floating Jump to Latest Button */}
        {showScrollBottom && (
          <div className="sticky bottom-2 flex justify-end pointer-events-none z-20">
            <button
              type="button"
              onClick={scrollToBottom}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blueprint-raised/95 hover:bg-blueprint-subtle text-blueprint-primary border border-blueprint-brass/50 shadow-xl text-xs font-mono transition-all duration-150 backdrop-blur"
            >
              <span>Jump to latest</span>
              <ChevronDown className="w-3.5 h-3.5 text-blueprint-brass" />
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
