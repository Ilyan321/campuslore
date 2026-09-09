import React, { useState, useRef } from 'react';
import { Course, AnalysisResult } from '../types';
import { analyzeFile, confirmIngest } from '../services/api';
import {
  UploadCloud,
  X,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  courses,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.course_id || 'CSE-212');
  const [overrideWeek, setOverrideWeek] = useState<number>(1);
  const [overrideTopic, setOverrideTopic] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCourse = courses.find((c) => c.course_id === selectedCourseId) || courses[0];

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
    setStatusMessage('Extracting text, handwriting, and analyzing curriculum alignment...');

    try {
      const result = await analyzeFile(selectedFile, selectedCourseId);
      setAnalysis(result);
      
      const detectedCourse = result.classification.course_id || selectedCourseId;
      setSelectedCourseId(detectedCourse);
      setOverrideWeek(result.classification.assigned_week || 1);
      
      const matchedCourse = courses.find(c => c.course_id === detectedCourse) || courses[0];
      const matchedWeek = matchedCourse?.syllabus_timeline.find(w => w.week === (result.classification.assigned_week || 1));
      setOverrideTopic(result.classification.topic || matchedWeek?.core_topic || 'General Academic Topic');
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
        course_id: selectedCourseId,
        week_number: Number(overrideWeek),
        topic: overrideTopic,
        content: analysis.extracted_text
      });

      setSuccessMessage(resp.message || 'Notes successfully indexed into the knowledge base.');
      setTimeout(() => {
        onUploadSuccess();
        handleReset();
        onClose();
      }, 1400);
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
            <div className="w-7 h-7 rounded bg-blueprint-raised border border-blueprint-border flex items-center justify-center text-blueprint-brass flex-shrink-0">
              <UploadCloud className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-blueprint-primary">Upload Study Material</h3>
              <p className="text-[11px] font-mono text-blueprint-muted">Autonomous OCR, parsing, and syllabus alignment</p>
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
              className={`border border-dashed rounded p-9 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-blueprint-brass bg-blueprint-raised'
                  : 'border-blueprint-border hover:border-blueprint-borderLight bg-blueprint-surface hover:bg-blueprint-raised/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.py,.cpp,.c,.txt,.md"
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-blueprint-raised border border-blueprint-border flex items-center justify-center text-blueprint-brass">
                <UploadCloud className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="font-medium text-xs lg:text-sm text-blueprint-primary">
                  Drag & drop lecture notes, PDF slides, or code files
                </p>
                <p className="text-[11px] font-mono text-blueprint-muted mt-1.5">
                  Supported formats: PDF, PNG, JPG (handwritten notes), PY, CPP, C, TXT
                </p>
              </div>
              <button
                type="button"
                className="mt-1 px-3 py-1.5 rounded bg-blueprint-raised hover:bg-blueprint-subtle text-blueprint-primary border border-blueprint-border font-mono text-xs transition"
              >
                Select File
              </button>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 font-mono">
              <Loader2 className="w-7 h-7 text-blueprint-brass animate-spin" />
              <div>
                <p className="text-xs text-blueprint-primary font-semibold">ANALYZING DOCUMENT...</p>
                <p className="text-[11px] text-blueprint-muted mt-1">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* Classification Review & Alignment */}
          {analysis && !loading && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-surface space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-blueprint-brass font-semibold">
                    SYLLABUS ALIGNMENT
                  </span>
                  <span className="text-blueprint-muted">
                    Confidence: {Math.round(analysis.classification.confidence * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Subject / Course Selector */}
                  <div>
                    <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                      Subject / Course
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        const newCourseId = e.target.value;
                        setSelectedCourseId(newCourseId);
                        const c = courses.find(course => course.course_id === newCourseId);
                        if (c && c.syllabus_timeline.length > 0) {
                          setOverrideWeek(c.syllabus_timeline[0].week);
                          setOverrideTopic(c.syllabus_timeline[0].core_topic);
                        }
                      }}
                      className="w-full bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs font-mono py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none"
                    >
                      {courses.map((c) => (
                        <option key={c.course_id} value={c.course_id}>
                          {c.course_name} ({c.course_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned Week */}
                  <div>
                    <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                      Target Syllabus Week
                    </label>
                    <select
                      value={overrideWeek}
                      onChange={(e) => {
                        const wk = Number(e.target.value);
                        setOverrideWeek(wk);
                        const matched = activeCourse?.syllabus_timeline.find((t) => t.week === wk);
                        if (matched) setOverrideTopic(matched.core_topic);
                      }}
                      className="w-full bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs font-mono py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none"
                    >
                      {activeCourse?.syllabus_timeline.map((w) => (
                        <option key={w.week} value={w.week}>
                          Week {w.week}: {w.core_topic}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* Topic Label */}
                <div>
                  <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    value={overrideTopic}
                    onChange={(e) => setOverrideTopic(e.target.value)}
                    className="w-full bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none font-sans"
                  />
                </div>

                {/* Reasoning Note */}
                <p className="text-[11px] font-mono text-blueprint-secondary bg-blueprint-raised p-2 rounded border border-blueprint-border">
                  Classification insight: {analysis.classification.reasoning}
                </p>
              </div>

              {/* Extracted Text Preview */}
              <div>
                <label className="text-[11px] font-mono text-blueprint-muted block mb-1">
                  Extracted Content Preview ({analysis.file_name})
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
                Upload Another File
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
                    <span>Confirm & Index</span>
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


