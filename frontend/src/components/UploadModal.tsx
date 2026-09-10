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
  Tag,
  BookOpen,
  Calendar,
  Layers
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
  
  // Universal Tagging & Alignment States
  const [topicTag, setTopicTag] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('Data Structures & Algorithms');
  const [courseId, setCourseId] = useState<string>('CSE-212');
  const [linkToSyllabus, setLinkToSyllabus] = useState<boolean>(false);
  const [assignedWeek, setAssignedWeek] = useState<number | null>(null);
  
  // Ingestion Stages
  const [isSaving, setIsSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setStatusMessage('Stage 1/2: Extracting text, code AST, and handwriting via OCR...');

    try {
      const result = await analyzeFile(selectedFile);
      setAnalysis(result);
      
      const detectedCourse = result.classification.course_id || 'CSE-212';
      const detectedTopic = result.classification.topic || selectedFile.name.replace(/\.[^/.]+$/, '');
      const detectedWeek = result.classification.assigned_week || null;

      setCourseId(detectedCourse);
      setTopicTag(detectedTopic);
      
      const matchedCourse = courses.find(c => c.course_id === detectedCourse);
      setSubjectName(matchedCourse ? matchedCourse.course_name : detectedCourse);

      if (detectedWeek && detectedWeek > 0) {
        setLinkToSyllabus(true);
        setAssignedWeek(detectedWeek);
      } else {
        setLinkToSyllabus(false);
        setAssignedWeek(null);
      }
    } catch (err: any) {
      const errMsg = err?.message === 'Failed to fetch' 
        ? 'Could not connect to backend server. The server might be waking up; please retry in a moment.' 
        : (err?.message || 'Failed to process document.');
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!analysis || !file) return;
    setIsSaving(true);
    setError(null);

    try {
      setSaveStep('Stage 1/3: AST & Boundary-Aware Chunking...');
      await new Promise(r => setTimeout(r, 200));

      setSaveStep('Stage 2/3: Generating 384-dim FastEmbed Embeddings...');
      await new Promise(r => setTimeout(r, 200));

      setSaveStep('Stage 3/3: Indexing Vector Chunks in Database...');
      
      const resp = await confirmIngest({
        file_name: analysis.file_name,
        file_url: analysis.file_url,
        course_id: courseId || subjectName || 'General',
        week_number: linkToSyllabus ? assignedWeek : null,
        topic: topicTag || 'General Academic',
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
      setSaveStep('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setSuccessMessage(null);
    setLoading(false);
    setIsSaving(false);
    setSaveStep('');
    setLinkToSyllabus(false);
    setAssignedWeek(null);
  };

  const activeCourse = courses.find((c) => c.course_id === courseId);

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
              <p className="text-[11px] font-mono text-blueprint-muted">Universal topic tagging, AST chunking, and FastEmbed vectors</p>
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
                  Drag & drop lecture notes, PDF slides, Python scripts, or code files
                </p>
                <p className="text-[11px] font-mono text-blueprint-muted mt-1.5">
                  Supported: PDF, Python (.py), C/C++ (.cpp), Markdown (.md), Images (.png/.jpg)
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

          {/* Granular Loading Animation */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 font-mono">
              <Loader2 className="w-7 h-7 text-blueprint-brass animate-spin" />
              <div>
                <p className="text-xs text-blueprint-primary font-semibold">ANALYZING DOCUMENT...</p>
                <p className="text-[11px] text-blueprint-muted mt-1">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* Granular Ingestion Saving Progress */}
          {isSaving && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 font-mono bg-blueprint-surface p-4 rounded border border-blueprint-border">
              <Loader2 className="w-6 h-6 text-blueprint-brass animate-spin" />
              <div>
                <p className="text-xs text-blueprint-primary font-semibold">PROCESSING & INDEXING...</p>
                <p className="text-[11px] text-blueprint-brass mt-1 font-mono">{saveStep}</p>
              </div>
            </div>
          )}

          {/* Universal Tagging Review & Customization */}
          {analysis && !loading && !isSaving && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded border border-blueprint-border bg-blueprint-surface space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-blueprint-brass font-semibold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    UNIVERSAL DOCUMENT TAGGING
                  </span>
                  <span className="text-blueprint-muted">
                    AI Match: {Math.round(analysis.classification.confidence * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Subject / Course Input */}
                  <div>
                    <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                      Subject / Course Tag
                    </label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => {
                        setSubjectName(e.target.value);
                        setCourseId(e.target.value);
                      }}
                      placeholder="e.g. Python, Machine Learning, CSE-212"
                      className="w-full bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none font-sans"
                    />
                  </div>

                  {/* Free-form Topic Title */}
                  <div>
                    <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                      Topic / Concept Title
                    </label>
                    <input
                      type="text"
                      value={topicTag}
                      onChange={(e) => setTopicTag(e.target.value)}
                      placeholder="e.g. Circular Queue Implementation, FastAPI Setup"
                      className="w-full bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none font-sans"
                    />
                  </div>

                </div>

                {/* Optional Syllabus Week Alignment Toggle */}
                <div className="pt-2 border-t border-blueprint-border/60">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-blueprint-primary">
                    <input
                      type="checkbox"
                      checked={linkToSyllabus}
                      onChange={(e) => {
                        setLinkToSyllabus(e.target.checked);
                        if (e.target.checked && !assignedWeek) {
                          setAssignedWeek(1);
                        }
                      }}
                      className="rounded border-blueprint-border text-blueprint-brass focus:ring-0"
                    />
                    <span>Align with specific university syllabus week (Optional)</span>
                  </label>

                  {linkToSyllabus && (
                    <div className="mt-2 pl-5">
                      <label className="text-[11px] font-mono text-blueprint-muted mb-1 block">
                        Target Syllabus Week (1–16)
                      </label>
                      <select
                        value={assignedWeek || 1}
                        onChange={(e) => setAssignedWeek(Number(e.target.value))}
                        className="w-full sm:w-64 bg-blueprint-raised border border-blueprint-border text-blueprint-primary text-xs font-mono py-1.5 px-2.5 rounded focus:border-blueprint-brass outline-none"
                      >
                        {Array.from({ length: 16 }, (_, i) => i + 1).map((wk) => (
                          <option key={wk} value={wk}>
                            Week {wk} {activeCourse?.syllabus_timeline.find(t => t.week === wk)?.core_topic ? `(${activeCourse.syllabus_timeline.find(t => t.week === wk)?.core_topic})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* AI Reasoning Insight */}
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



