import type { CapitalCall, ChatMessage, DefaultRemedyChoice, Persona, RevisionRequest } from '../data/types';

export type Action =
  | { type: 'SET_PERSONA'; persona: Persona }
  | { type: 'SET_ACTIVE_FUND'; fundId: string }
  | { type: 'CREATE_CALL'; call: CapitalCall }
  | { type: 'SUBMIT_FOR_REVIEW'; callId: string; reviewer: string }
  | { type: 'PEER_APPROVE'; callId: string }
  | { type: 'PEER_REQUEST_REVISION'; callId: string; revision: RevisionRequest }
  | { type: 'RESUBMIT_AFTER_REVISION'; callId: string }
  | { type: 'BUNCH_RESOLVE_CHECKLIST_ITEM'; callId: string; itemId: string; state: 'clear' | 'escalated'; note?: string }
  | { type: 'BUNCH_APPROVE'; callId: string }
  | { type: 'RESOLVE_KYC'; lpId: string }
  | { type: 'MARK_LP_PAID'; callId: string; lpId: string }
  | { type: 'ADVANCE_OVERDUE'; callId: string; lpId: string }
  | { type: 'SELECT_DEFAULT_REMEDY'; callId: string; lpId: string; remedy: DefaultRemedyChoice }
  | { type: 'CONFIRM_RECONCILIATION'; callId: string }
  | { type: 'SEND_CHAT_MESSAGE'; callId: string; message: ChatMessage; park: boolean }
  | { type: 'BUNCH_REPLY_CHAT'; callId: string; message: ChatMessage }
  | { type: 'LP_CONFIRM_RECEIPT'; callId: string; lpId: string }
  | { type: 'LP_FLAG_ISSUE'; callId: string; lpId: string; note: string }
  | { type: 'RESET_DEMO' };
