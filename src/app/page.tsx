'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import NoticeDashboard from '@/components/NoticeDashboard';
import { Notice2ActionData, sampleNoticeData } from '@/types/notice';
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  UploadCloud,
  X,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [noticeData, setNoticeData] = useState<Notice2ActionData | null>(null);
  const [analyzedText, setAnalyzedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File drag & drop states
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const processFile = async (file: File) => {
    // Clear all prior state for document isolation
    setNoticeData(null);
    setAnalyzedText('');
    setInputText('');
    setError(null);
    setSuccessMessage(null);
    setSelectedFile({ name: file.name, size: formatFileSize(file.size) });

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (isPdf) {
      setLoading(true);
      setLoadingStage('Extracting text from PDF...');
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/extract-pdf', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Failed to extract text from PDF');
        }

        setInputText(json.text);
        setSuccessMessage(`Successfully extracted text from ${file.name}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error processing PDF';
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingStage('');
      }
    } else {
      // Text / Markdown / JSON files
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setInputText(content);
          setSuccessMessage(`Loaded text from ${file.name}`);
        }
      };
      reader.onerror = () => {
        setError('Failed to read text file');
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async (overrideText?: string, isSample = false) => {
    // Clear previous analysis state completely before starting
    setNoticeData(null);
    setAnalyzedText('');

    const textToSubmit = overrideText || inputText;

    if (isSample) {
      setError(null);
      setSuccessMessage(null);
      setLoading(true);
      setLoadingStage('Loading sample audit notice demo data...');
      setTimeout(() => {
        const sampleText = `INTERNAL REVENUE & TAX COMPLIANCE AUTHORITY
NOTICE OF TAX AUDIT & VERIFICATION
Form 1422-B | Notice ID: TX-2026-8891A | Issue Date: August 15, 2026

Dear Taxpayer,

You have been selected for a routine income and deduction verification for the 2025 tax filing period. Immediate submission of supporting financial records and proof of tax exemption eligibility is required to avoid default penalties.

KEY COMPLIANCE REQUIREMENTS:
1. Verification required for Schedule C business deductions and tax credits.
2. Requires proof of income, expense receipts, and bank statements (Jan 2025 - Dec 2025).
3. Failure to respond within 30 days results in a 15% statutory penalty interest fee.
4. Hearing or appeal options are available prior to final assessment (Deadline: October 01, 2026).

CRITICAL DEADLINES:
- Initial Response & Document Submission: September 15, 2026 (17 Days Remaining)
- Formal Review Hearing Request: October 01, 2026 (33 Days Remaining)

REQUIRED DOCUMENTS:
- Form 1040 (2025 Tax Return Copy)
- Schedule C Expense Receipts & Invoices (> $500)
- Bank Statements (Jan 2025 - Dec 2025)
- Proof of Identification & Notice Copy

STATUTORY PENALTY WARNING:
Failure to respond by Sept 15, 2026 results in immediate disallowance of $12,400 in deductions plus a 15% non-compliance penalty.`;

        setAnalyzedText(sampleText);
        setNoticeData(sampleNoticeData);
        setLoading(false);
        setLoadingStage('');
      }, 600);
      return;
    }

    if (!textToSubmit.trim()) {
      setError('Please paste text or upload a document before submitting.');
      return;
    }

    setLoading(true);
    setLoadingStage('Parsing document with Gemini AI...');
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSubmit }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to process document');
      } else {
        setAnalyzedText(textToSubmit);
        setNoticeData(json.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  if (noticeData) {
    return (
      <NoticeDashboard
        data={noticeData}
        documentText={analyzedText}
        onReset={() => {
          setNoticeData(null);
          setAnalyzedText('');
          setError(null);
          setSuccessMessage(null);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Notice2Action AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              Hackathon Edition v1.0
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-12 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Instant Legal & Tax Notice Parsing
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Turn Confusing Official Notices Into{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Clear Action Plans
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Upload a PDF or paste any legal notice, tax letter, or administrative request. Get an instant breakdown of summary, deadlines, eligibility, required documents, and a prioritized checklist.
        </p>

        {/* Input & Upload Container */}
        <div className="mt-8 text-left bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.json"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3 max-w-md mx-auto">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">{selectedFile.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-blue-400 hover:underline">Click to upload</span> or drag and drop your PDF / Text document here
                </div>
                <p className="text-[11px] text-slate-500">Supports PDF, TXT, MD documents up to 10MB</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Or Paste Notice Text</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste notice text here (e.g. IRS tax audit notice, court summons, license renewal request, regulatory compliance notice)..."
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono leading-relaxed"
            />
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => handleAnalyze('', true)}
              type="button"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Try Sample Audit Notice Demo
            </button>

            <button
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{loadingStage || 'Processing...'}</span>
                </>
              ) : (
                <>
                  Analyze Notice
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">1</div>
          <h3 className="font-semibold text-slate-200">Instant PDF Extraction</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Extracts and parses text directly from uploaded PDFs or pasted text documents.</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm">2</div>
          <h3 className="font-semibold text-slate-200">Deadline & Risk Guardrails</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Categorizes statutory deadlines and critical warnings to prevent missed actions.</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm">3</div>
          <h3 className="font-semibold text-slate-200">Action Checklist</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Converts dense legal jargon into clear step-by-step tasks with document requirements.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Notice2Action AI — Built with Next.js, Tailwind CSS & AI SDK Gemini</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero External Database / Pure Local Processing</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
