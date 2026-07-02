import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumb, PageHeader } from '../../components/AppShell';
import { Button } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { NoticeDocument } from '../../components/NoticeDocument';
import { Modal } from '../../components/Modal';
import { useAppState } from '../../state/store';
import { commitmentPctFor, investorLpForFund } from '../../state/selectors';

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function NoticeDetail() {
  const { callId } = useParams();
  const { state, dispatch } = useAppState();
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagNote, setFlagNote] = useState('');

  const call = state.calls[callId!];
  if (!call) return <p className="muted">Notice not found.</p>;
  const fund = state.funds[call.fundId];
  const lp = investorLpForFund(state, call.fundId);
  const notice = lp && call.notices.find((n) => n.lpId === lp.id);
  if (!lp || !notice) return <p className="muted">You are not a recipient of this notice.</p>;

  const days = daysUntil(call.dueDate);
  const statusLabel =
    notice.status === 'paid' || notice.status === 'defaulted_remedied'
      ? 'Paid'
      : notice.status === 'disputed'
      ? 'Disputed — under review'
      : notice.status === 'overdue' || notice.status === 'grace_period' || notice.status === 'in_default'
      ? 'Overdue'
      : `Awaiting your payment — due in ${days} days`;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Capital Calls', to: '/investor/capital-calls' }, { label: call.purpose }]} />
      <div style={{ maxWidth: 620 }}>
        <PageHeader title={call.purpose} pill={<StatusPill label={statusLabel} />} />
        <NoticeDocument call={call} notice={notice} fund={fund} lp={lp} commitmentPct={commitmentPctFor(state, call, lp.id)} scale="full" />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button variant="danger" disabled={notice.status === 'paid'} onClick={() => setFlagOpen(true)}>
            Flag Issue
          </Button>
          <Button
            variant="primary"
            disabled={notice.status === 'paid' || notice.status === 'defaulted_remedied'}
            onClick={() => {
              dispatch({ type: 'LP_CONFIRM_RECEIPT', callId: call.id, lpId: lp.id });
              dispatch({ type: 'MARK_LP_PAID', callId: call.id, lpId: lp.id });
            }}
          >
            {notice.status === 'paid' ? 'Payment Confirmed' : 'Confirm Payment'}
          </Button>
        </div>
        <button className="muted" style={{ fontSize: 12, marginTop: 10, textDecoration: 'underline' }}>
          Download PDF copy ↓
        </button>
      </div>

      <Modal open={flagOpen} onClose={() => setFlagOpen(false)} title="Flag an issue with this notice">
        <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          This pauses only your notice — the fund manager and reviewer will be alerted immediately.
        </p>
        <textarea
          value={flagNote}
          onChange={(e) => setFlagNote(e.target.value)}
          placeholder="e.g. the amount or wire instructions look incorrect…"
          style={{ width: '100%', minHeight: 90, padding: 10, borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Button onClick={() => setFlagOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            disabled={!flagNote.trim()}
            onClick={() => {
              dispatch({ type: 'LP_FLAG_ISSUE', callId: call.id, lpId: lp.id, note: flagNote.trim() });
              setFlagOpen(false);
            }}
          >
            Submit flag
          </Button>
        </div>
      </Modal>
    </div>
  );
}
