import React, { useState, useRef } from 'react';
import { Course, AnalysisResult } from '../types';
import { analyzeFile, confirmIngest } from '../services/api';
import {
  UploadCloud,
  X,
  FileCode,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  selectedCourseId: string;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  courses,
  selectedCourseId,
  onUploadSuccess
}) => {
  const [courseId, setCourseId] = useState(selectedCourseId);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [overrideWeek, setOverrideWeek] = useState<number>(1);
  const [overrideTopic, setOverrideTopic] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentCourse = courses.find((c) => c.course_id === courseId) || courses[0];

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setStatusMessage('Multimodal OCR extracting handwriting, diagrams & text...');

    try {
      // Step 1: Analyze with Gemini OCR + Groq Classifier
      const result = await analyzeFile(selectedFile, courseId);
      setAnalysis(result);
      setOverrideWeek(result.classification.assigned_week || 1);
      setOverrideTopic(result.classification.topic || currentCourse.syllabus_timeline[0]?.core_topic || 'General Topic');
    } catch (err: any) {
      setError(err.message || 'Failed to process document.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!analysis || !file) return;
    setIsSaving(true);
    setError(null);

    try {
      const resp = await confirmIngest({
        file_name: analysis.file_name,
        file_url: analysis.file_url,
        course_id: courseId,
        week_number: Number(overrideWeek),
        topic: overrideTopic,
        content: analysis.extracted_text
      });

      setSuccessMessage(resp.message || 'Notes successfully indexed in Supabase pgvector!');
      setTimeout(() => {
        onUploadSuccess();
        handleReset();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to save notes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setSuccessMessage(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-campus-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-campus-border/60 bg-campus-card/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Upload Senior Note / Lab Code</h3>
              <p className="text-xs text-slate-400">Automatic Multimodal OCR & Syllabus Week Mapping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Target Course Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Target Course Outline
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={loading || analysis !== null}
              className="w-full bg-campus-card text-slate-200 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-campus-border/80 focus:ring-2 focus:ring-amber-500/40 outline-none disabled:opacity-60"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_id} — {c.course_name}
                </option>
              ))}
            </select>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold">Indexed Successfully!</p>
                <p className="text-slate-300 text-[11px]">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <div>
                <p className="font-bold">Action Failed</p>
                <p className="text-slate-300 text-[11px]">{error}</p>
              </div>
            </div>
          )}

          {/* Dropzone View (Initial State) */}
          {!analysis && !loading && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                  : 'border-campus-border/80 hover:border-amber-500/50 bg-campus-card/30 hover:bg-campus-card/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.py,.cpp,.c,.txt,.md"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
                <UploadCloud className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-200">
                  Drag & Drop senior handwritten notes, PDFs, or lab scripts
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports <span className="text-amber-300">.pdf</span>, <span className="text-amber-300">.png, .jpg</span> (handwriting OCR), <span className="text-amber-300">.py, .cpp</span>
                </p>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-200">Processing Senior Note...</p>
                <p className="text-xs text-slate-400 mt-1">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* AI Confirmation Card (Workflow A Step 5) */}
          {analysis && !loading && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-campus-card border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    AI Syllabus Classification
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Confidence: {Math.round(analysis.classification.confidence * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  
                  {/* Assigned Week with Dropdown Override */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                      Target Week Number (Manual Override)
                    </label>
                    <select
                      value={overrideWeek}
                      onChange={(e) => {
                        const wk = Number(e.target.value);
                        setOverrideWeek(wk);
                        const matched = currentCourse.syllabus_timeline.find((t) => t.week === wk);
                        if (matched) setOverrideTopic(matched.core_topic);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg focus:ring-1 focus:ring-amber-400 outline-none"
                    >
                      {currentCourse.syllabus_timeline.map((w) => (
                        <option key={w.week} value={w.week}>
                          Week {w.week}: {w.core_topic}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic Title */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                      Topic Label
                    </label>
                    <input
                      type="text"
                      value={overrideTopic}
                      onChange={(e) => setOverrideTopic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg focus:ring-1 focus:ring-amber-400 outline-none"
                    />
                  </div>

                </div>

                {/* Reasoning Quote */}
                <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  💡 Reasoning: {analysis.classification.reasoning}
                </p>
              </div>

              {/* Extracted Text Preview */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Extracted Content Preview ({analysis.file_name})
                </label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-xs font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {analysis.extracted_text}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-campus-border/60 bg-campus-card/50">
          {analysis ? (
            <>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold px-3 py-2 rounded-lg hover:bg-slate-800 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload Another
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Chunking & Indexing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Publish Note</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
