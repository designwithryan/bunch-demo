import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb, PageHeader } from '../../components/AppShell';
import { Button } from '../../components/ui';
import { useAppState } from '../../state/store';
import { fmt2 } from '../../state/selectors';
import type { DefaultRemedyChoice } from '../../data/types';

const REMEDIES: { key: DefaultRemedyChoice; title: string; body: string; consequence: (name: string, amount: string) => string }[] = [
  {
    key: 'negotiation',
    title: 'Direct Negotiation',
    body: 'Work with the LP directly on a revised payment timeline.',
    consequence: (name) => `No structural change to the cap table. Payment terms with ${name} are logged and tracked as a manual exception.`,
  },
  {
    key: 'sell_interest',
    title: 'Sell Interest',
    body: 'Sell the defaulting LP’s interest to another LP or third party at the LPA-specified discount.',
    consequence: (name, amount) => `${name}'s ${amount} commitment transfers to the buyer. Discount and buyer are logged to the audit trail.`,
  },
  {
    key: 'reallocate',
    title: 'Reallocate Commitment',
    body: 'Split the uncalled commitment pro-rata across the remaining LPs, who receive a preferred interest.',
    consequence: (name, amount) => `Reallocates ${amount} pro-rata across the other LPs — each sees an additional line item on their next call.`,
  },
];

export function DefaultRemedy() {
  const { callId, lpId } = useParams();
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [chosen, setChosen] = useState<DefaultRemedyChoice>('reallocate');

  const call = state.calls[callId!];
  const lp = state.lps[lpId!];
  const notice = call?.notices.find((n) => n.lpId === lpId);
  const otherCount = call ? call.notices.length - 1 : 0;

  if (!call || !lp || !notice) {
    return <p className="muted">Call not found.</p>;
  }

  const remedy = REMEDIES.find((r) => r.key === chosen)!;

  function confirm() {
    dispatch({ type: 'SELECT_DEFAULT_REMEDY', callId: call.id, lpId: lp.id, remedy: chosen });
    navigate('/fund-manager/capital-calls');
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Capital Calls', to: '/fund-manager/capital-calls' }, { label: call.purpose }]} />
      <PageHeader title={`Payment Default — ${lp.name}`} subtitle={`${fmt2(notice.amountDue, state.funds[call.fundId].currency)} owed · Cure period closed with no payment · ${lp.country}`} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 12 }}>
        {['Notice sent', 'Overdue', 'Grace period', 'In Default'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: i === 3 ? 'var(--danger-600)' : 'var(--success-600)',
                display: 'inline-block',
              }}
            />
            <span style={{ color: i === 3 ? 'var(--danger-600)' : 'var(--color-ink)', fontWeight: i === 3 ? 600 : 400 }}>{label}</span>
            {i < 3 && <span style={{ width: 24, height: 1, background: 'var(--color-border)' }} />}
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Choose a remedy</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 900 }}>
        {REMEDIES.map((r) => (
          <button
            key={r.key}
            onClick={() => setChosen(r.key)}
            style={{
              textAlign: 'left',
              border: `1.5px solid ${chosen === r.key ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: chosen === r.key ? 'var(--color-primary-tint-weak)' : 'var(--color-surface)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{r.title}</h4>
            <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 10 }}>{r.body}</p>
            <div style={{ background: 'var(--neutral-100)', borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
              <b style={{ display: 'block', color: 'var(--color-ink)', fontWeight: 500, marginBottom: 2 }}>What happens</b>
              {r.consequence(lp.name, fmt2(notice.amountDue, state.funds[call.fundId].currency))}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Button onClick={() => navigate('/fund-manager/capital-calls')}>Cancel</Button>
        <Button variant="primary" onClick={confirm}>
          Confirm {remedy.title}
        </Button>
      </div>
      <p className="faint" style={{ fontSize: 11, marginTop: 12 }}>
        This action is logged with timestamp and authorization. The other {otherCount} LPs are unaffected until reallocation is confirmed.
      </p>
    </div>
  );
}
