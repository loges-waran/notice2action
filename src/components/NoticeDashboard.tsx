'use client';

import { Notice2ActionData } from '@/types/notice';
import {
  FileText,
  AlertTriangle,
  Calendar,
  CheckSquare,
  FolderCheck,
  ShieldAlert,
  Info,
  UserCheck,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  FileCode,
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface DashboardProps {
  data: Notice2ActionData;
  documentText?: string;
  onReset: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function NoticeDashboard({ data, documentText, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'summary' | 'eligibility' | 'deadlines' | 'documents' | 'checklist' | 'warnings' | 'qa'
  >('summary');
  const [checklist, setChecklist] = useState(data.checklist || []);

  // Q&A Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your Notice2Action AI Assistant. Ask me any question about this document, such as deadlines, penalties, requirements, or dispute procedures.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'qa') {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleSendQuestion = async (questionToSubmit?: string) => {
    const q = questionToSubmit || inputQuestion;
    if (!q.trim() || isAsking) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: documentText || '',
          question: q,
          chatHistory: history,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to get answer');
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: json.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error retrieving answer';
      const errorMsgObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I ran into an error: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsgObj]);
    } finally {
      setIsAsking(false);
    }
  };

  const completedCount = checklist.filter((c) => c.completed).length;
  const totalChecklist = checklist.length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'medium':
      case 'upcoming':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
    }
  };

  const getEligibilityBadge = (status: string) => {
    switch (status) {
      case 'eligible':
        return {
          style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
          icon: CheckCircle,
          label: 'Eligible',
        };
      case 'action_required':
        return {
          style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
          icon: AlertCircle,
          label: 'Action Required / Needs Review',
        };
      case 'ineligible':
        return {
          style: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50',
          icon: XCircle,
          label: 'Not Eligible',
        };
      default:
        return {
          style: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
          icon: HelpCircle,
          label: 'Unknown',
        };
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
      case 'needed':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={onReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-2 text-xs font-medium shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">New Upload</span>
            </button>
            <div className="h-5 w-px bg-slate-800 shrink-0" />
            <div className="truncate">
              <h1 className="text-sm md:text-base font-bold truncate text-slate-100">
                {data.summary.title || 'Official Notice Analysis'}
              </h1>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                <span>{data.summary.issuer || 'Issuer N/A'}</span>
                {data.summary.noticeNumber && (
                  <>
                    <span>•</span>
                    <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      {data.summary.noticeNumber}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-medium px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Notice2Action AI Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Dashboard Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Document Preview Area (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Extracted Document Preview
              </span>
            </div>
            {documentText && (
              <span className="text-[11px] text-slate-500 font-mono">
                {documentText.length} chars
              </span>
            )}
          </div>

          <div className="p-4 md:p-6 flex-1 bg-slate-950/40 overflow-y-auto max-h-[500px] lg:max-h-[780px] font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-text">
            {documentText ? (
              <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl shadow-inner space-y-2">
                <div className="text-[10px] text-slate-500 pb-2 border-b border-slate-800/60 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Official Text Content</span>
                  <span>Extracted text</span>
                </div>
                <div>{documentText}</div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12 space-y-3">
                <FileText className="w-10 h-10 text-slate-700" />
                <p className="text-xs">No raw document text loaded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tabbed Structured Dashboard & Q&A (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Dashboard Navigation Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex overflow-x-auto gap-1 no-scrollbar">
            {[
              { id: 'summary', label: 'Summary', icon: Info },
              { id: 'eligibility', label: 'Eligibility', icon: UserCheck },
              { id: 'deadlines', label: 'Deadlines', icon: Calendar },
              { id: 'documents', label: 'Documents', icon: FolderCheck },
              { id: 'checklist', label: `Checklist (${completedCount}/${totalChecklist})`, icon: CheckSquare },
              { id: 'warnings', label: 'Warnings', icon: ShieldAlert },
              { id: 'qa', label: 'Document Q&A', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
            {/* 1. Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" /> Executive Overview
                  </h2>
                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    {data.summary.overallSummary || 'No summary available.'}
                  </p>
                </div>

                {/* Primary Deadline Banner */}
                {data.deadlines && data.deadlines.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                        Next Critical Deadline
                      </span>
                      <p className="text-sm font-bold text-slate-100">{data.deadlines[0].title}</p>
                      <p className="text-xs text-slate-400">{data.deadlines[0].description}</p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-base font-extrabold text-amber-400">{data.deadlines[0].date}</p>
                      {data.deadlines[0].timeRemaining && (
                        <span className="text-xs font-medium text-amber-300">
                          {data.deadlines[0].timeRemaining}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-2">Key Takeaways</h3>
                  {data.summary.keyPoints && data.summary.keyPoints.length > 0 ? (
                    <ul className="space-y-2">
                      {data.summary.keyPoints.map((pt, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No key takeaways listed.</p>
                  )}
                </div>
              </div>
            )}

            {/* 2. Eligibility Tab */}
            {activeTab === 'eligibility' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" /> Eligibility Criteria Breakdown
                </h2>

                {data.eligibility && data.eligibility.length > 0 ? (
                  <div className="space-y-3">
                    {data.eligibility.map((item, idx) => {
                      const badge = getEligibilityBadge(item.status);
                      const BadgeIcon = badge.icon;
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-xs md:text-sm text-slate-200">
                              {item.criterion}
                            </h3>
                            <span
                              className={`text-[11px] px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 shrink-0 ${badge.style}`}
                            >
                              <BadgeIcon className="w-3.5 h-3.5" />
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.details}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                    Not enough information in the document.
                  </div>
                )}
              </div>
            )}

            {/* 3. Deadlines Tab */}
            {activeTab === 'deadlines' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" /> Statutory & Response Deadlines
                </h2>

                {data.deadlines && data.deadlines.length > 0 ? (
                  <div className="space-y-3">
                    {data.deadlines.map((dl, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800 gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-xs md:text-sm text-slate-200">
                              {dl.title}
                            </h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${getSeverityBadge(
                                dl.urgency
                              )}`}
                            >
                              {dl.urgency}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{dl.description}</p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-sm font-bold text-slate-100">{dl.date}</div>
                          {dl.timeRemaining && (
                            <div className="text-xs text-amber-400 font-medium">{dl.timeRemaining}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                    Not specified in the document.
                  </div>
                )}
              </div>
            )}

            {/* 4. Required Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-indigo-400" /> Required Documents & Materials
                </h2>

                {data.documents && data.documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {data.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800 gap-3"
                      >
                        <div className="space-y-1">
                          <h3 className="font-semibold text-xs md:text-sm text-slate-200">
                            {doc.name}
                          </h3>
                          <p className="text-xs text-slate-400">{doc.description}</p>
                          {doc.format && (
                            <span className="inline-block text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded mt-1">
                              Format: {doc.format}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold capitalize shrink-0 ${getDocumentStatusBadge(
                            doc.status
                          )}`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                    Not specified in the document.
                  </div>
                )}
              </div>
            )}

            {/* 5. Checklist Tab */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-400" /> Interactive Action Checklist
                  </h2>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono">
                    {completedCount} / {totalChecklist} Done
                  </span>
                </div>

                {checklist && checklist.length > 0 ? (
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleChecklist(item.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          item.completed
                            ? 'bg-slate-950/30 border-slate-800/60 opacity-60'
                            : 'bg-slate-950/60 border-slate-800 hover:border-blue-500/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!item.completed}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <p
                            className={`text-xs md:text-sm font-medium ${
                              item.completed ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {item.task}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            {item.owner && <span>Owner: {item.owner}</span>}
                            {item.deadline && <span>• Due: {item.deadline}</span>}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${getSeverityBadge(
                                item.priority
                              )}`}
                            >
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                    Not specified in the document.
                  </div>
                )}
              </div>
            )}

            {/* 6. Warnings Tab */}
            {activeTab === 'warnings' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Risk & Compliance Warnings
                </h2>

                {data.warnings && data.warnings.length > 0 ? (
                  <div className="space-y-3">
                    {data.warnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-xs md:text-sm text-red-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            {warn.message}
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                            {warn.severity} Severity
                          </span>
                        </div>
                        <p className="text-xs text-red-200/80 leading-relaxed">{warn.consequence}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                    Not specified in the document.
                  </div>
                )}
              </div>
            )}

            {/* 7. Q&A Tab */}
            {activeTab === 'qa' && (
              <div className="flex flex-col h-[520px] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" /> Grounded Document Q&A
                  </h2>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    Strict Local Context
                  </span>
                </div>

                {/* Suggested Questions */}
                <div className="flex flex-wrap gap-2">
                  {[
                    'What is the primary deadline?',
                    'What penalties apply if I miss the response date?',
                    'Which specific documents must I submit?',
                  ].map((sQ, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendQuestion(sQ)}
                      disabled={isAsking}
                      className="text-[11px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" /> {sQ}
                    </button>
                  ))}
                </div>

                {/* Messages Box */}
                <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-wrap'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <span className="block text-[9px] text-slate-400/70 mt-1 text-right font-mono">
                          {msg.timestamp}
                        </span>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isAsking && (
                    <div className="flex gap-2.5 items-center text-slate-400 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                        <Bot className="w-4 h-4 animate-bounce" />
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>Finding answer grounded in document text...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendQuestion();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    placeholder="Ask any question about this notice..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !inputQuestion.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
