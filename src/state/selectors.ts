import type { AppState, CapitalCall, Fund, LP, NoticeLine, NoticeStatus } from '../data/types';

export function fundLps(state: AppState, fundId: string): LP[] {
  const fund = state.funds[fundId];
  if (!fund) return [];
  return fund.lpIds.map((id) => state.lps[id]).filter(Boolean);
}

export function callsForFund(state: AppState, fundId: string): CapitalCall[] {
  return state.callOrder.map((id) => state.calls[id]).filter((c) => c && c.fundId === fundId);
}

export function allCallsList(state: AppState): CapitalCall[] {
  return state.callOrder.map((id) => state.calls[id]).filter(Boolean);
}

// Payment-state vocabulary per capital-calls-context.md §21/§22 ("Paid, Sent,
// Overdue, Held" per the redesign vision doc's pill list, plus the fuller
// per-LP default-handling states from the state machine). A notice only gets
// one of these once it has actually been generated (i.e. the call has been
// approved) — see `noticeStatusLabel` below for what shows before that.
export const NOTICE_LABEL: Record<NoticeStatus, string> = {
  held_kyc: 'Held',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  grace_period: 'Overdue — Grace period',
  in_default: 'In default',
  defaulted_remedied: 'Resolved (remedy)',
  disputed: 'Disputed',
  recalled: 'Recalled',
};

// What to show for a given call+notice pair, whether or not the notice has
// been generated yet. Never fabricates a status — before approval there is no
// per-LP state, so this surfaces the call's own review status instead
// (capital-calls-context.md §22: notices are generated at APPROVED).
export function noticeStatusLabel(call: CapitalCall, notice: NoticeLine): string {
  if (notice.status) return NOTICE_LABEL[notice.status];
  if (call.status === 'changes_requested') return 'Changes requested';
  if (call.status === 'draft') return 'Draft';
  return 'Pending review';
}

export const CALL_STATUS_LABEL: Record<CapitalCall['status'], string> = {
  draft: 'Draft',
  calculation: 'Calculating',
  under_review: 'Pending review',
  changes_requested: 'Changes requested',
  bunch_review: 'Bunch review',
  approved: 'Approved',
  approved_partial_hold: 'Approved — Partial hold (KYC)',
  notices_sent: 'Notices sent',
  partially_paid: 'Partially paid',
  fully_paid: 'Fully paid',
  reconciled: 'Reconciled',
  cancelled: 'Cancelled',
};

export function callHasHold(call: CapitalCall): boolean {
  return call.notices.some((n) => n.status === 'held_kyc');
}

export function callDisplayStatus(call: CapitalCall): string {
  if (call.status === 'notices_sent' && callHasHold(call)) return 'Notices sent — Partial hold (KYC)';
  return CALL_STATUS_LABEL[call.status];
}

export function commitmentPctFor(state: AppState, call: CapitalCall, lpId: string): number {
  const lp = state.lps[lpId];
  if (!lp) return 0;
  const totalCommitment = call.recipientLpIds.reduce((sum, id) => sum + (state.lps[id]?.commitment ?? 0), 0);
  if (totalCommitment === 0) return 0;
  return (lp.commitment / totalCommitment) * 100;
}

export function callTotalDue(call: CapitalCall): number {
  return call.notices.reduce((sum, n) => sum + n.amountDue, 0);
}

export function callTotalPaid(call: CapitalCall): number {
  return call.notices
    .filter((n) => n.status === 'paid' || n.status === 'defaulted_remedied')
    .reduce((sum, n) => sum + n.amountDue, 0);
}

export function reviewQueueCalls(state: AppState): CapitalCall[] {
  return allCallsList(state).filter((c) => c.status === 'under_review');
}

export function peerReviewCalls(state: AppState, fundId: string): CapitalCall[] {
  return callsForFund(state, fundId).filter((c) => c.status === 'under_review' || c.status === 'changes_requested' || c.peerStatus === 'approved');
}

// The investor is one person who may hold a separate LP entity per fund (e.g.
// "Cherry Ventures LP" in Cherry Fund II, "Motive Ventures LP" in Motive Fund III).
// LP.userId links each of those per-fund entities back to the same logged-in person.
export function investorUserId(state: AppState): string {
  return state.lps[state.currentUser.investorLpId]?.userId ?? state.currentUser.investorLpId;
}

export function investorLp(state: AppState): LP {
  return state.lps[state.currentUser.investorLpId];
}

export function investorLpForFund(state: AppState, fundId: string): LP | undefined {
  const uid = investorUserId(state);
  return fundLps(state, fundId).find((l) => l.userId === uid);
}

export function investorFunds(state: AppState): Fund[] {
  const uid = investorUserId(state);
  return Object.values(state.funds).filter((f) => f.lpIds.some((id) => state.lps[id]?.userId === uid));
}

const DISPATCHED: NoticeStatus[] = ['sent', 'paid', 'overdue', 'grace_period', 'in_default', 'defaulted_remedied', 'disputed'];

export function investorPortfolioRows(state: AppState) {
  const distributedByFundStatus: Record<Fund['status'], number> = { Investing: 0, Active: 90000, Harvesting: 90000 };
  return investorFunds(state).map((fund) => {
    const lp = investorLpForFund(state, fund.id)!;
    const called = allCallsList(state)
      .filter((c) => c.fundId === fund.id)
      .flatMap((c) => c.notices)
      .filter((n) => n.lpId === lp.id && !!n.status && DISPATCHED.includes(n.status))
      .reduce((s, n) => s + n.amountDue, 0);
    return { fund, lp, called, distributed: distributedByFundStatus[fund.status] };
  });
}

// An LP only ever sees a notice once it has actually been generated (i.e. the
// call has been approved) — never a call that's still being drafted or
// reviewed internally.
export function investorNoticesAcrossFunds(state: AppState) {
  const results: { call: CapitalCall; lpId: string }[] = [];
  for (const fund of investorFunds(state)) {
    const lp = investorLpForFund(state, fund.id);
    if (!lp) continue;
    for (const call of allCallsList(state)) {
      if (call.fundId === fund.id && call.notices.some((n) => n.lpId === lp.id && !!n.status)) {
        results.push({ call, lpId: lp.id });
      }
    }
  }
  return results;
}

export function fmt(amount: number, currency: 'EUR' | 'GBP' = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : '£';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmt2(amount: number, currency: 'EUR' | 'GBP' = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : '£';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
