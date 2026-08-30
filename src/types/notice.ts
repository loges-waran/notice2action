import { z } from 'zod';

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'document' | 'payment' | 'form' | 'communication' | 'other';
  completed?: boolean;
}

export interface EligibilityCriterion {
  criterion: string;
  status: 'eligible' | 'ineligible' | 'action_required' | 'unknown';
  details: string;
}

export interface NoticeDeadline {
  title: string;
  date: string;
  timeRemaining?: string;
  urgency: 'critical' | 'upcoming' | 'flexible';
  description: string;
}

export interface DocumentRequired {
  name: string;
  description: string;
  status: 'needed' | 'ready' | 'optional';
  format?: string;
}

export interface NoticeWarning {
  type: 'penalty' | 'legal' | 'deadline' | 'financial' | 'general';
  severity: 'high' | 'medium' | 'low';
  message: string;
  consequence: string;
}

export interface NoticeSummary {
  title: string;
  issuer: string;
  noticeNumber?: string;
  issueDate?: string;
  overallSummary: string;
  keyPoints: string[];
}

export interface Notice2ActionData {
  summary: NoticeSummary;
  eligibility: EligibilityCriterion[];
  deadlines: NoticeDeadline[];
  documents: DocumentRequired[];
  checklist: ActionItem[];
  warnings: NoticeWarning[];
}

// Mock fallback sample data for hackathon demo
export const sampleNoticeData: Notice2ActionData = {
  summary: {
    title: "Tax Audit & Verification Notice (Form 1422-B)",
    issuer: "Internal Revenue & Tax Compliance Authority",
    noticeNumber: "TX-2026-8891A",
    issueDate: "August 15, 2026",
    overallSummary: "You have been selected for a routine income and deduction verification for the 2025 tax filing period. Immediate submission of supporting financial records and proof of tax exemption eligibility is required to avoid default penalties.",
    keyPoints: [
      "Verification required for Schedule C business deductions and tax credits.",
      "Requires proof of income, expense receipts, and bank statements.",
      "Failure to respond within 30 days results in a 15% statutory penalty interest fee.",
      "Hearing or appeal options are available prior to final assessment."
    ]
  },
  eligibility: [
    {
      criterion: "Small Business Deduction Exemption",
      status: "action_required",
      details: "Requires submittal of Form 1099-MISC receipts for qualifying sub-contractor expenses."
    },
    {
      criterion: "Late Submission Fee Waiver Eligibility",
      status: "eligible",
      details: "First-time audit compliance request grants automatic 14-day extension waiver upon written request."
    },
    {
      criterion: "Digital Response Portal Access",
      status: "eligible",
      details: "Notice ID TX-2026-8891A qualifies for express e-Filing submission."
    }
  ],
  deadlines: [
    {
      title: "Initial Response & Document Submission",
      date: "September 15, 2026",
      timeRemaining: "17 Days",
      urgency: "critical",
      description: "Submit initial response packet with proof of expenses to avoid automatic disallowance."
    },
    {
      title: "Formal Review Hearing Request",
      date: "October 01, 2026",
      timeRemaining: "33 Days",
      urgency: "upcoming",
      description: "Deadline to file Form AP-102 if disputing the auditor's initial findings."
    }
  ],
  documents: [
    {
      name: "Form 1040 (2025 Tax Return Copy)",
      description: "Signed original copy of 2025 income tax filing.",
      status: "ready",
      format: "PDF"
    },
    {
      name: "Schedule C Expense Receipts & Invoices",
      description: "Itemized receipts exceeding $500 for office operations and vendor services.",
      status: "needed",
      format: "PDF / Images"
    },
    {
      name: "Bank Statements (Jan 2025 - Dec 2025)",
      description: "Official bank statements highlighting gross income receipts.",
      status: "needed",
      format: "PDF"
    },
    {
      name: "Proof of Identification & Notice Copy",
      description: "Government ID alongside original Notice 1422-B.",
      status: "ready",
      format: "PDF"
    }
  ],
  checklist: [
    {
      id: "1",
      task: "Gather 2025 bank statements and itemize top 10 expenses",
      owner: "Taxpayer / Accountant",
      deadline: "2026-09-05",
      priority: "high",
      category: "document",
      completed: false
    },
    {
      id: "2",
      task: "Fill out Response Cover Form 1422-B-Resp",
      owner: "Taxpayer",
      deadline: "2026-09-10",
      priority: "high",
      category: "form",
      completed: false
    },
    {
      id: "3",
      task: "Submit digital packet via online portal",
      owner: "Taxpayer",
      deadline: "2026-09-15",
      priority: "high",
      category: "other",
      completed: false
    },
    {
      id: "4",
      task: "Confirm receipt confirmation email from IRS compliance department",
      owner: "Taxpayer",
      deadline: "2026-09-18",
      priority: "medium",
      category: "communication",
      completed: false
    }
  ],
  warnings: [
    {
      type: "penalty",
      severity: "high",
      message: "15% Non-Compliance Statutory Penalty",
      consequence: "Failure to respond by Sept 15, 2026 results in immediate disallowance of $12,400 in deductions plus 15% interest."
    },
    {
      type: "legal",
      severity: "medium",
      message: "Loss of Dispute Appeal Rights",
      consequence: "Missing the 30-day window waives statutory rights to pre-assessment administrative review."
    }
  ]
};
