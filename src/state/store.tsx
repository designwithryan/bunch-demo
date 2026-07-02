import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { AppState, CapitalCall, NoticeLine } from '../data/types';
import { initialState } from '../data/fixtures';
import type { Action } from './actions';

const STORAGE_KEY = 'bunch-demo-state-v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // fall through to fixtures
  }
  return structuredClone(initialState);
}

function recomputeCallStatus(call: CapitalCall): CapitalCall {
  if (call.status === 'reconciled' || call.status === 'cancelled') return call;
  const active = call.notices.filter((n) => n.status !== 'held_kyc');
  if (active.length === 0) return call;
  const allPaid = active.every((n) => n.status === 'paid' || n.status === 'defaulted_remedied');
  const somePaid = active.some((n) => n.status === 'paid' || n.status === 'defaulted_remedied');
  if (allPaid && call.status !== 'fully_paid') return { ...call, status: 'fully_paid' };
  if (!allPaid && somePaid) return { ...call, status: 'partially_paid' };
  return call;
}

function updateNotice(call: CapitalCall, lpId: string, patch: Partial<NoticeLine>): CapitalCall {
  return {
    ...call,
    notices: call.notices.map((n) => (n.lpId === lpId ? { ...n, ...patch } : n)),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PERSONA':
      return { ...state, activePersona: action.persona };

    case 'SET_ACTIVE_FUND':
      return { ...state, activeFundId: action.fundId };

    case 'CREATE_CALL':
      return {
        ...state,
        calls: { ...state.calls, [action.call.id]: action.call },
        callOrder: [action.call.id, ...state.callOrder],
      };

    case 'SUBMIT_FOR_REVIEW': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated: CapitalCall = {
        ...call,
        status: 'under_review',
        peerStatus: 'pending',
        assignedReviewer: action.reviewer,
        submittedBy: state.currentUser.fundManagerName,
        submittedAt: new Date().toISOString(),
      };
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'PEER_APPROVE': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated: CapitalCall = { ...call, peerStatus: 'approved', peerApprovedAt: new Date().toISOString() };
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'PEER_REQUEST_REVISION': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated: CapitalCall = {
        ...call,
        peerStatus: 'changes_requested',
        status: 'changes_requested',
        reviewNotes: [...call.reviewNotes, action.revision],
      };
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'RESUBMIT_AFTER_REVISION': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated: CapitalCall = { ...call, peerStatus: 'pending', status: 'under_review' };
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'BUNCH_RESOLVE_CHECKLIST_ITEM': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated: CapitalCall = {
        ...call,
        bunchChecklist: call.bunchChecklist.map((item) =>
          item.id === action.itemId ? { ...item, state: action.state, note: action.note ?? item.note } : item
        ),
      };
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'BUNCH_APPROVE': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const notices = call.notices.map((n) =>
        n.status === 'not_sent' ? { ...n, status: 'sent' as const } : n
      );
      const updated: CapitalCall = { ...call, notices, status: 'notices_sent', approvedAt: new Date().toISOString() };
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'RESOLVE_KYC': {
      const lp = state.lps[action.lpId];
      if (!lp) return state;
      const lps = { ...state.lps, [lp.id]: { ...lp, kycStatus: 'clear' as const, kycNote: undefined } };
      const calls = { ...state.calls };
      for (const callId of Object.keys(calls)) {
        const call = calls[callId];
        const hasHeld = call.notices.some((n) => n.lpId === action.lpId && n.status === 'held_kyc');
        if (hasHeld) {
          calls[callId] = updateNotice(call, action.lpId, { status: 'sent', flagged: false });
        }
      }
      return { ...state, lps, calls };
    }

    case 'MARK_LP_PAID': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated = recomputeCallStatus(updateNotice(call, action.lpId, { status: 'paid' }));
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'ADVANCE_OVERDUE': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const notice = call.notices.find((n) => n.lpId === action.lpId);
      if (!notice) return state;
      const next: Record<string, NoticeLine['status']> = {
        sent: 'overdue',
        overdue: 'grace_period',
        grace_period: 'in_default',
      };
      const nextStatus = next[notice.status] ?? notice.status;
      const updated = updateNotice(call, action.lpId, { status: nextStatus });
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'SELECT_DEFAULT_REMEDY': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated = recomputeCallStatus(
        updateNotice(call, action.lpId, { status: 'defaulted_remedied', remedy: action.remedy })
      );
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'CONFIRM_RECONCILIATION': {
      const call = state.calls[action.callId];
      if (!call) return state;
      return { ...state, calls: { ...state.calls, [call.id]: { ...call, status: 'reconciled' } } };
    }

    case 'SEND_CHAT_MESSAGE': {
      const existing = state.chats[action.callId];
      const thread = existing
        ? { ...existing, messages: [...existing.messages, action.message], parked: action.park }
        : { id: `chat-${action.callId}`, callId: action.callId, parked: action.park, messages: [action.message] };
      return { ...state, chats: { ...state.chats, [action.callId]: thread } };
    }

    case 'BUNCH_REPLY_CHAT': {
      const existing = state.chats[action.callId];
      if (!existing) return state;
      return {
        ...state,
        chats: { ...state.chats, [action.callId]: { ...existing, messages: [...existing.messages, action.message], parked: false } },
      };
    }

    case 'LP_CONFIRM_RECEIPT': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated = updateNotice(call, action.lpId, { receiptConfirmed: true });
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'LP_FLAG_ISSUE': {
      const call = state.calls[action.callId];
      if (!call) return state;
      const updated = updateNotice(call, action.lpId, { status: 'disputed', disputeNote: action.note });
      return { ...state, calls: { ...state.calls, [call.id]: updated } };
    }

    case 'RESET_DEMO':
      return structuredClone(initialState);

    default:
      return state;
  }
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
