import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, PageHeader } from '../../components/AppShell';
import { Button, Card } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { useAppState } from '../../state/store';
import { fmt2 } from '../../state/selectors';

export function Reconciliation() {
  const { callId } = useParams();
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  const call = state.calls[callId!];
  if (!call) return <p className="muted">Call not found.</p>;
  const fund = state.funds[call.fundId];

  const expected = call.notices.reduce((s, n) => s + n.amountDue, 0);
  const resolved = call.notices.filter((n) => n.status === 'paid' || n.status === 'defaulted_remedied');
  const received = resolved.reduce((s, n) => s + n.amountDue, 0);
  const unresolved = call.notices.filter((n) => n.status !== 'paid' && n.status !== 'defaulted_remedied' && n.status !== 'held_kyc');
  const remedied = call.notices.filter((n) => n.status === 'defaulted_remedied');
  const allResolved = unresolved.length === 0;

  function confirm() {
    dispatch({ type: 'CONFIRM_RECONCILIATION', callId: call.id });
    navigate('/fund-manager/capital-calls');
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Capital Calls', to: '/fund-manager/capital-calls' }, { label: call.purpose }]} />
      <PageHeader
        title="Reconciliation"
        pill={<StatusPill label={allResolved ? 'Fully paid — ready to reconcile' : `${resolved.length} of ${call.notices.length} paid`} />}
        subtitle={`${resolved.length} of ${call.notices.length} LPs paid`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, maxWidth: 900 }}>
        <Card>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Call summary</h4>
          <Row label="Total expected" value={fmt2(expected, fund.currency)} />
          <Row label="Total received" value={fmt2(received, fund.currency)} valueColor="var(--success-600)" />
          <Row label="Shortfall / overpayment" value={fmt2(expected - received, fund.currency) + (expected === received ? ' (fully matched)' : '')} />
          <Row label="FX mismatches" value="None" />
          <Row
            label="Remedied defaults"
            value={remedied.length ? `${remedied.length} — ${remedied.map((n) => state.lps[n.lpId].name).join(', ')}` : 'None'}
          />
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Button onClick={() => navigate('/fund-manager/capital-calls')}>View Audit Trail</Button>
            <Button variant="primary" disabled={!allResolved || call.status === 'reconciled'} onClick={confirm}>
              {call.status === 'reconciled' ? 'Reconciled' : 'Confirm Reconciliation'}
            </Button>
          </div>
        </Card>
        <Card style={{ background: 'var(--color-primary-tint-weak)', border: 'none' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>What happens when you confirm</h4>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', lineHeight: 1.6, marginBottom: 10 }}>
            Capital accounts update for all {call.notices.length} LPs. This call's total becomes the "previously drawn capital" figure
            feeding into the fund's next capital call calculation.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', lineHeight: 1.6 }}>
            The call becomes read-only afterward — only the permanent audit trail remains editable-free and visible.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '7px 0', borderBottom: '1px solid var(--neutral-100)' }}>
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 600, color: valueColor }}>{value}</span>
    </div>
  );
}
