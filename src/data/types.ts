export type Persona = 'fundManager' | 'bunchAdmin' | 'investor';

export type KycStatus = 'clear' | 'expiring' | 'expired';

export interface LP {
  id: string;
  name: string;
  country: string;
  jurisdictionAuthority: string; // BaFin, FCA, CSSF, AFM
  commitment: number;
  feePct: number;
  kycStatus: KycStatus;
  kycNote?: string;
  sideLetter?: string;
  userId?: string; // links to the logged-in investor persona, if this LP is "you"
}

export interface Fund {
  id: string;
  name: string;
  manager: string;
  vintage: number;
  currency: 'EUR' | 'GBP';
  lpIds: string[];
  aum: number;
  irr: number;
  tvpi: number;
  dpi: number;
  moic: number;
  nav: number;
  momPct: number;
  status: 'Investing' | 'Active' | 'Harvesting';
}

export type CallType = 'one-time' | 'scheduled';

export type CallStatus =
  | 'draft'
  | 'calculation'
  | 'under_review' // internal peer review
  | 'changes_requested'
  | 'bunch_review' // in bunch admin review queue
  | 'approved'
  | 'approved_partial_hold'
  | 'notices_sent'
  | 'partially_paid'
  | 'fully_paid'
  | 'reconciled'
  | 'cancelled';

// A notice has no status at all until the call is approved and notices are
// generated (per capital-calls-context.md §22: notices are "generated" at
// APPROVED, not before). `undefined` means "not generated yet" — the call's
// own review status (Pending review / Changes requested) is what's shown
// for these rows, never a fabricated per-notice status like "Not sent".
export type NoticeStatus =
  | 'held_kyc'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'grace_period'
  | 'in_default'
  | 'defaulted_remedied'
  | 'disputed'
  | 'recalled';

export interface LineItem {
  label: string;
  amount: number;
}

export interface NoticeLine {
  lpId: string;
  commitmentBefore: number;
  commitmentAfter: number;
  capitalCall: number; // pro-rata investment/working-capital draw
  managementFee: number;
  workingCapital: number; // small itemized reserve line, distinct from the capital-call draw
  amountDue: number; // capitalCall + managementFee + workingCapital
  status?: NoticeStatus;
  flagged?: boolean;
  flagReason?: string;
  overrideRationale?: string;
  remedy?: DefaultRemedyChoice;
  receiptConfirmed?: boolean;
  disputeNote?: string;
}

export type DefaultRemedyChoice = 'negotiation' | 'sell_interest' | 'reallocate';

export interface ChecklistItem {
  id: string;
  label: string;
  state: 'pending' | 'clear' | 'escalated';
  note?: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  authorRole: 'fundManager' | 'bunch';
  body: string;
  ts: string;
}

export interface ChatThread {
  id: string;
  callId: string;
  parked: boolean;
  messages: ChatMessage[];
}

export interface RevisionRequest {
  category: 'Amount' | 'Dates' | 'Wording' | 'Line items';
  note: string;
  ts: string;
}

export interface CapitalCall {
  id: string;
  fundId: string;
  type: CallType;
  purpose: string;
  linkedInvestment?: string;
  amount: number;
  noticeDate: string;
  dueDate: string;
  recipientMode: 'all' | 'manual';
  recipientLpIds: string[];
  excludedLpIds: string[];
  excludedReason?: string;
  lineItems: LineItem[];
  notices: NoticeLine[];
  status: CallStatus;
  assignedReviewer?: string;
  peerStatus: 'not_submitted' | 'pending' | 'approved' | 'changes_requested';
  peerApprovedAt?: string;
  reviewNotes: RevisionRequest[];
  bunchChecklist: ChecklistItem[];
  submittedBy?: string;
  submittedAt?: string;
  approvedAt?: string;
  // scheduled-only
  cadence?: 'Monthly' | 'Quarterly' | 'Half-year' | 'Yearly';
  annualFeeRate?: number;
  stepDownTrigger?: string;
  startDate?: string;
}

export interface AppState {
  activePersona: Persona;
  activeFundId: string;
  funds: Record<string, Fund>;
  lps: Record<string, LP>;
  calls: Record<string, CapitalCall>;
  chats: Record<string, ChatThread>;
  callOrder: string[];
  currentUser: {
    fundManagerName: string;
    bunchAdminName: string;
    investorName: string;
    investorLpId: string;
  };
}
