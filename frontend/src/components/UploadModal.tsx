import React, { useState, useRef } from 'react';
import { Course, AnalysisResult } from '../types';
import { analyzeFile, confirmIngest } from '../services/api';
import {
  UploadCloud,
  X,
  FileCode,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw
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
    setStatusMessage('Extracting text, handwriting and code via local parser & OCR...');

    try {
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

      setSuccessMessage(resp.message || 'Notes successfully indexed into vector database.');
      setTimeout(() => {
        onUploadSuccess();
        handleReset();
        onClose();
      }, 1500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150">
      <div className="blueprint-panel w-full max-w-2xl rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-blueprint-border bg-blueprint-surface">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-blueprint-brass font-bold">[INGEST]</span>
            <div>
              <h3 className="font-semibold text-sm text-blueprint-primary">Contribute Senior Note / Lab Code</h3>
              <p className="text-[11px] font-mono text-blueprint-muted">Syllabus classification & vector indexing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blueprint-muted hover:text-blueprint-primary p-1 rounded hover:bg-blueprint-raised transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Target Course Selector */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-blueprint-muted mb-1">
              Target Course Syllabus
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={loading || analysis !== null}
              className="w-full bg-blueprint-raised text-blueprint-primary text-xs font-mono py-2 px-3 rounded border border-blueprint-border focus:border-blueprint-brass outline-none disabled:opacity-50"
            >
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_id} • {c.course_name}
                </option>
              ))}
            </select>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded border border-blueprint-emerald/40 bg-blueprint-surface text-blueprint-emerald text-xs flex items-center gap-2.5 font-mono">
              <Check className="w-4 h-4 stroke-[2.5]" />
              <div>
                <p className="font-bold">INDEXED SUCCESSFULLY</p>
                <p className="text-blueprint-primary text-[11px]">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded border border-blueprint-ruby/40 bg-blueprint-surface text-blueprint-ruby text-xs flex items-center gap-2.5 font-mono">
              <AlertCircle className="w-4 h-4 stroke-[2]" />
              <div>
                <p className="font-bold">PROCESSING ERROR</p>
                <p className="text-blueprint-primary text-[11px]">{error}</p>
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
              className={`border border-dashed rounded p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2.5 ${
                isDragging
                  ? 'border-blueprint-brass bg-blueprint-raised'
                  : 'border-blueprint-border hover:border-blueprint-borderLight bg-blueprint-surface hover:bg-blueprint-raised'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.py,.cpp,.c,.txt,.md"
                onChange={handleFileChange}
              />
              <UploadCloud className="w-8 h-8 text-blueprint-brass stroke-[1.8]" />
              <div>
                <p className="font-medium text-xs text-blueprint-primary">
                  Drag & drop peer handwritten notes, PDF slides, or lab code files
                </p>
                <p className="text-[11px] font-mono text-blueprint-muted mt-1">
                  Format: .pdf, .png, .jpg (handwriting), .py, .cpp, .c, .txt
                </p>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 font-mono">
              <Loader2 className="w-6 h-6 text-blueprint-brass animate-spin" />
              <div>
                <p className="text-xs text-blueprint-primary font-semibold">PARSING DOCUMENT...</p>
                <p className="text-[11px] text-blueprint-muted mt-0.5">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* Classification Review & Override */}
          {analysis && !loading && (
            <div className="space-y-3">
              <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-surface space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-blueprint-brass font-semibold">
                    CLASSIFICATION RESULT
                  </span>
                  <span className="text-blueprint-muted">
                    Confidence: {Math.round(analysis.classification.confidence * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Assigned Week */}
                  <div>
                    <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                      Target Week (Override)
                    </label>
                    <select
                      value={overrideWeek}
                      onChange={(e) => {
                        const wk = Number(e.target.value);
                        setOverrideWeek(wk);
                        const matched = currentCourse.syllabus_timeline.find((t) => t.week === wk);
                        if (matched) setOverrideTopic(matched.core_topic);
                      }}
                      className="w-full bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs font-mono py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none"
                    >
                      {currentCourse.syllabus_timeline.map((w) => (
                        <option key={w.week} value={w.week}>
                          W{String(w.week).padStart(2, '0')}: {w.core_topic}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic Title */}
                  <div>
                    <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                      Topic Label
                    </label>
                    <input
                      type="text"
                      value={overrideTopic}
                      onChange={(e) => setOverrideTopic(e.target.value)}
                      className="w-full bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none"
                    />
                  </div>

                </div>

                {/* Reasoning Note */}
                <p className="text-[11px] font-mono text-blueprint-secondary bg-blueprint-raised p-2 rounded border border-blueprint-border">
                  Classification note: {analysis.classification.reasoning}
                </p>
              </div>

              {/* Extracted Text Preview */}
              <div>
                <label className="text-[11px] font-mono text-blueprint-muted block mb-1">
                  Extracted Preview ({analysis.file_name})
                </label>
                <div className="bg-blueprint-canvas p-3 rounded border border-blueprint-border text-blueprint-secondary text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {analysis.extracted_text}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-blueprint-border bg-blueprint-surface">
          {analysis ? (
            <>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="flex items-center gap-1 text-xs font-mono text-blueprint-secondary hover:text-blueprint-primary px-2.5 py-1.5 rounded transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blueprint-primary hover:bg-white text-blueprint-canvas font-medium text-xs transition duration-150 active:translate-y-px disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Indexing Vectors...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Ingest</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="text-xs font-mono text-blueprint-secondary hover:text-blueprint-primary px-3 py-1.5 rounded transition"
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

