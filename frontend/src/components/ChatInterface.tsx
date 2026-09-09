import React, { useState, useRef, useEffect } from 'react';
import { Course, SyllabusWeek, ChatMessage, NoteSource } from '../types';
import { queryRAG } from '../services/api';
import {
  Send,
  Sparkles,
  User,
  Bot,
  Layers,
  FileText,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface ChatInterfaceProps {
  course: Course;
  selectedWeek: number | null;
  onSelectWeek?: (week: number) => void;
  onOpenSources: (sources: NoteSource[]) => void;
  onOpenUpload: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  course,
  selectedWeek,
  onSelectWeek,
  onOpenSources,
  onOpenUpload
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentWeekInfo = selectedWeek !== null 
    ? course.syllabus_timeline.find((w) => w.week === selectedWeek)
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Reset or initialize welcoming greeting when changing week or going to global
  useEffect(() => {
    const isGlobal = selectedWeek === null;
    const welcomeMsg: ChatMessage = {
      id: `welcome-${selectedWeek ?? 'global'}`,
      role: 'assistant',
      content: isGlobal
        ? `Salam! Main aapka Senior AI assistant hoon 🎓.\n\nAapko yaad rakhne ki zaroorat nahi ke kaunsa topic kis week mein hai. **Roman Urdu ya English** mein koi bhi engineering topic poochhein — hamara Agentic Router khud syllabus week map karke accurate peer notes se answer karega!`
        : `Salam! Main aapka Senior AI assistant hoon. Abhi hum **${course.course_id} — Week ${selectedWeek}: ${currentWeekInfo?.core_topic || 'Syllabus Topic'}** ke context mein hain.\n\nAap Roman Urdu ya English mein jo bhi lab code ya theory ka sawal poochna chahein, pooch sakte hain. Hamare answers strictly seniors ke notes par based hain! 🎓`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
    setRateLimitError(null);
  }, [selectedWeek, course.course_id]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);
    setRateLimitError(null);

    try {
      const response = await queryRAG({
        query: textToSend.trim(),
        week_number: selectedWeek,
        course_id: course.course_id
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

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setRateLimitError('Hamara AI abhi thoda busy hai ya rate limit hit hui hai. Please take a breath and try in 5 seconds!');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sample quick questions customized per week or global
  const samplePrompts = selectedWeek !== null ? [
    `Yaar ${currentWeekInfo?.core_topic || 'is topic'} ka main exam concept Roman Urdu mein samjha do`,
    `Bhai lab test ke liye iska working code snippet aur edge cases bata do`,
    `Is topic mein seniors ne past papers ke kon se important questions highlight kiye hain?`
  ] : [
    `Queue underflow aur circular modulo logic kya hota hai?`,
    `Dijkstra shortest path algorithm ka exam concept Roman Urdu mein samjha do`,
    `CIDR /26 subnetting mein usable host IPs kaise calculate karte hain?`
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-6.5rem)] glass-panel rounded-2xl border border-campus-border/60 overflow-hidden">
      
      {/* Context Bar */}
      <div className="px-6 py-3 border-b border-campus-border/60 bg-campus-card/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          {selectedWeek !== null ? (
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold">
              Week {selectedWeek}
            </span>
          ) : (
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-950" />
              Auto-Detect
            </span>
          )}
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              {selectedWeek !== null ? (currentWeekInfo?.core_topic || 'Syllabus Topic') : 'Universal Semester Knowledge Base'}
            </h2>
            <p className="text-[10px] text-slate-400">
              {selectedWeek !== null ? `Sandboxed knowledge base • ${course.course_name}` : `Agentic Week Discovery • Multi-hop retrieval • ${course.course_name}`}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Contribute Notes</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 stroke-[2.5]" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1.5 max-w-[85%] md:max-w-[90%]">
                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-blue-600/20 border-blue-500/30 text-blue-50 rounded-tr-none'
                      : 'bg-campus-card/90 border-campus-border/70 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {/* Auto-routed Week Badge for Assistant messages in global mode or auto-detected */}
                  {!isUser && msg.auto_detected_week && (
                    <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>📍 Auto-routed to <strong>Week {msg.auto_detected_week}</strong>{msg.detected_topic ? `: ${msg.detected_topic}` : ''}</span>
                      {onSelectWeek && selectedWeek !== msg.auto_detected_week && (
                        <button
                          onClick={() => onSelectWeek(msg.auto_detected_week!)}
                          className="ml-1 underline text-[10px] text-amber-400 hover:text-amber-200 font-bold"
                        >
                          (View Week)
                        </button>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Sources button if assistant cited sources */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-campus-border/50 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Sourced from {msg.sources.length} peer note{msg.sources.length > 1 ? 's' : ''}</span>
                      </div>
                      <button
                        onClick={() => onOpenSources(msg.sources!)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1"
                      >
                        <span>View Verified Source</span>
                        <Sparkles className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Message Meta & Copy */}
                <div
                  className={`flex items-center gap-2 px-1 text-[10px] text-slate-500 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-slate-300 flex items-center gap-1 transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-campus-card/90 border border-campus-border/70 text-slate-300 text-xs flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              </div>
              <span className="text-slate-400 font-medium text-xs">
                Routing topic across syllabus & querying Groq Qwen-27B...
              </span>
            </div>
          </div>
        )}

        {/* Rate Limit / Error Banner */}
        {rateLimitError && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{rateLimitError}</span>
            </div>
            <button
              onClick={() => handleSend()}
              className="flex items-center gap-1 font-bold text-amber-400 hover:text-amber-200 px-2 py-1 rounded bg-amber-500/20"
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
        <div className="px-6 py-2 bg-campus-card/30 border-t border-campus-border/30 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
            Quick Prompts:
          </span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-amber-300 border border-slate-700/60 px-3 py-1 rounded-lg whitespace-nowrap transition"
            >
              "{prompt.slice(0, 48)}..."
            </button>
          ))}
        </div>
      )}

      {/* Query Input Box */}
      <div className="p-4 border-t border-campus-border/60 bg-campus-card/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-950/80 rounded-xl border border-campus-border/80 p-1.5 focus-within:border-amber-400/60 focus-within:ring-2 focus-within:ring-amber-500/20 transition"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedWeek !== null
                ? `Ask about Week ${selectedWeek} in Roman Urdu or English (e.g. "Yaar pointer reset logic samjha do")...`
                : `Ask any engineering question in Roman Urdu or English (AI will auto-route to syllabus week)...`
            }
            className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>

    </div>
  );
};
