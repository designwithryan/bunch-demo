import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { Button, Card, KpiStrip } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { useAppState } from '../../state/store';
import { fmt2, investorLp, investorNoticesAcrossFunds, investorPortfolioRows, NOTICE_LABEL } from '../../state/selectors';

export function InvestorDashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const lp = investorLp(state);
  const rows = investorPortfolioRows(state);
  const notices = investorNoticesAcrossFunds(state);
  const pending = notices.filter(({ call }) => {
    const n = call.notices.find((x) => x.lpId === lp.id)!;
    return n.status === 'sent' || n.status === 'not_sent';
  });

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${state.currentUser.investorName.split(' ')[0]}`}
        subtitle="A snapshot of everything you're committed to"
        actions={
          <Button variant="primary" onClick={() => navigate('/investor/capital-calls')}>
            View Capital Calls →
          </Button>
        }
      />
      <KpiStrip
        items={[
          { label: 'Total committed', value: fmt2(rows.reduce((s, r) => s + r.lp.commitment, 0)) },
          { label: 'Total called', value: fmt2(rows.reduce((s, r) => s + r.called, 0)) },
          { label: 'Active funds', value: String(rows.length) },
          { label: 'Awaiting your payment', value: String(pending.length) },
        ]}
      />
      <div style={{ marginTop: 24 }}>
        <Card>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Awaiting your payment</h4>
          {pending.length === 0 && <p className="muted" style={{ fontSize: 12 }}>Nothing due right now.</p>}
          {pending.map(({ call }) => {
            const n = call.notices.find((x) => x.lpId === lp.id)!;
            return (
              <div
                key={call.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--neutral-100)', cursor: 'pointer' }}
                onClick={() => navigate(`/investor/capital-calls/${call.id}`)}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{call.purpose}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {state.funds[call.fundId].name} · Due {new Date(call.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt2(n.amountDue, state.funds[call.fundId].currency)}</span>
                  <StatusPill label={NOTICE_LABEL[n.status]} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
