import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { Button, Card, KpiStrip } from '../../components/ui';
import { useAppState } from '../../state/store';
import { allCallsList, fmt2 } from '../../state/selectors';

export function BunchAdminDashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const calls = allCallsList(state);
  const queue = calls.filter((c) => c.status === 'under_review');
  const escalated = calls.filter((c) => c.bunchChecklist.some((i) => i.state === 'escalated'));
  const openThreads = Object.values(state.chats).filter((c) => c.parked);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${state.currentUser.bunchAdminName.split(' ')[0]}`}
        subtitle="Your cross-fund operations snapshot"
        actions={
          <Button variant="primary" onClick={() => navigate('/bunch-admin/review-queue')}>
            Go to Review Queue →
          </Button>
        }
      />
      <KpiStrip
        items={[
          { label: 'Pending Review', value: String(queue.length) },
          { label: 'Escalated', value: String(escalated.length) },
          { label: 'Open Support Threads', value: String(openThreads.length) },
          { label: 'Client Funds', value: String(Object.keys(state.funds).length) },
          { label: 'Total Value in Queue', value: fmt2(queue.reduce((s, c) => s + c.notices.reduce((s2, n) => s2 + n.amountDue, 0), 0)) },
        ]}
      />
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Queue by fund</h4>
          {Object.values(state.funds).map((f) => {
            const count = queue.filter((c) => c.fundId === f.id).length;
            return (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 0' }}>
                <span>{f.name}</span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </div>
            );
          })}
        </Card>
        <Card>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Open support threads</h4>
          {openThreads.length === 0 && <p className="muted" style={{ fontSize: 12 }}>No parked chats right now.</p>}
          {openThreads.map((t) => (
            <div key={t.id} style={{ fontSize: 12.5, padding: '6px 0' }}>
              {state.calls[t.callId]?.purpose ?? t.callId}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
