import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { Button, Card, KpiStrip, Segmented } from '../../components/ui';
import { BarList } from '../../components/BarList';
import { useAppState } from '../../state/store';
import { callsForFund, fmt, fundLps } from '../../state/selectors';
import styles from './Dashboard.module.css';

export function FundManagerDashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [perfTab, setPerfTab] = useState<'top' | 'low'>('top');

  const funds = Object.values(state.funds);
  const totalAum = funds.reduce((s, f) => s + f.aum, 0);
  const allLpsAcrossFunds = funds.flatMap((f) => f.lpIds);
  const activeFund = state.funds[state.activeFundId];
  const activeCalls = callsForFund(state, state.activeFundId);
  const activeLps = fundLps(state, state.activeFundId);

  const calledToDate = useMemo(() => {
    const totalCommitment = activeLps.reduce((s, l) => s + l.commitment, 0);
    const called = activeCalls
      .filter((c) => c.status !== 'draft' && c.status !== 'cancelled')
      .reduce((s, c) => s + c.notices.reduce((s2, n) => s2 + n.amountDue, 0), 0);
    return totalCommitment ? Math.round((called / totalCommitment) * 100) : 0;
  }, [activeCalls, activeLps]);

  const kycFlags = activeLps.filter((l) => l.kycStatus !== 'clear');
  const underReviewCount = activeCalls.filter((c) => c.status === 'under_review').length;
  const changesRequestedCount = activeCalls.filter((c) => c.status === 'changes_requested').length;
  const overdueCount = activeCalls.reduce(
    (s, c) => s + c.notices.filter((n) => n.status === 'overdue' || n.status === 'grace_period' || n.status === 'in_default').length,
    0
  );
  const openChat = Object.values(state.chats).find((c) => c.callId in state.calls && state.calls[c.callId].fundId === state.activeFundId);

  const attention: { color: string; body: string; sub: string; action: string; to: string }[] = [];
  const seriesB = state.calls['call-series-b'];
  if (seriesB && seriesB.fundId === state.activeFundId && seriesB.status === 'under_review') {
    attention.push({
      color: 'var(--color-primary)',
      body: `${seriesB.purpose} — needs your review`,
      sub: `Capital Call · ${activeFund.name} · assigned to ${seriesB.assignedReviewer}`,
      action: 'Review →',
      to: '/fund-manager/reviews',
    });
  }
  if (kycFlags.length) {
    attention.push({
      color: 'var(--warning-600)',
      body: `${kycFlags.length} LP${kycFlags.length > 1 ? 's have' : ' has'} KYC expiring or expired`,
      sub: `Compliance · ${activeFund.name}`,
      action: 'View →',
      to: '/fund-manager/compliance',
    });
  }
  const bridge = state.calls['call-bridge-financing'];
  if (bridge && bridge.fundId === state.activeFundId && bridge.status === 'changes_requested') {
    attention.push({
      color: 'var(--danger-600)',
      body: `${bridge.purpose} — changes requested`,
      sub: `Capital Call · reviewer left a note`,
      action: 'Resolve →',
      to: '/fund-manager/reviews',
    });
  }
  if (openChat && openChat.messages.some((m) => m.authorRole === 'bunch') && !openChat.parked) {
    attention.push({
      color: 'var(--success-600)',
      body: 'Bunch replied on your capital call question',
      sub: 'Fund Admin Service · 1 unread',
      action: 'Open chat →',
      to: '/fund-manager/reviews',
    });
  }

  const fundPerf = [...funds]
    .sort((a, b) => (perfTab === 'top' ? b.momPct - a.momPct : a.momPct - b.momPct))
    .map((f) => ({ label: f.name, value: Math.abs(f.momPct), display: `${f.momPct >= 0 ? '+' : ''}${(f.momPct * 100).toFixed(1)}%` }));

  const myTasks = [
    { label: 'Review LPA amendment', meta: 'Assigned by Legal · Due Jul 5' },
    { label: 'Confirm Q2 NAV figures', meta: 'Assigned by CFO · Due Jul 3' },
    { label: 'Sign off default remedy plan', meta: 'Assigned by Ops · Due Jul 6' },
    { label: 'Approve new LP onboarding doc', meta: 'Assigned by Compliance · Due Jul 10' },
  ];

  return (
    <div>
      <PageHeader
        title={`Good afternoon, ${state.currentUser.fundManagerName.split(' ')[0]}`}
        subtitle={`Here's what's happening across your funds today · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/fund-manager/distributions')}>
              + New Distribution
            </Button>
            <Button variant="primary" onClick={() => navigate('/fund-manager/capital-calls/new')}>
              + New Capital Call
            </Button>
          </>
        }
      />

      <KpiStrip
        items={[
          { label: 'Total AUM', value: fmt(totalAum) },
          { label: 'Active Vehicles', value: String(funds.length) },
          { label: 'Total LPs', value: String(allLpsAcrossFunds.length) },
          { label: 'Called-to-Date %', value: `${calledToDate}%` },
          { label: 'Blended NAV', value: fmt(funds.reduce((s, f) => s + f.nav, 0)) },
        ]}
      />

      <div className={styles.grid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div className={styles.cardTitle}>
              <span>
                Needs Your Attention <span style={{ color: 'var(--danger-600)' }}>{attention.length}</span>
              </span>
              <a onClick={() => navigate('/fund-manager/tasks')}>Show all →</a>
            </div>
            {attention.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>Nothing needs your attention right now.</p>}
            {attention.map((a, i) => (
              <div className={styles.attentionItem} key={i}>
                <span className={styles.dot} style={{ background: a.color }} />
                <div className={styles.attentionBody}>
                  {a.body}
                  <div className={styles.attentionSub}>{a.sub}</div>
                </div>
                <button className={styles.attentionAction} onClick={() => navigate(a.to)}>
                  {a.action}
                </button>
              </div>
            ))}
          </Card>

          <div className={styles.row2}>
            <Card>
              <div className={styles.cardTitle}>
                <span>Capital Calls</span>
                <a onClick={() => navigate('/fund-manager/capital-calls')}>View all →</a>
              </div>
              <div className={styles.statRow}>
                <span>Under Review</span>
                <span style={{ color: 'var(--warning-600)' }}>{underReviewCount}</span>
              </div>
              <div className={styles.statRow}>
                <span>Changes Requested</span>
                <span style={{ color: 'var(--danger-600)' }}>{changesRequestedCount}</span>
              </div>
              <div className={styles.statRow}>
                <span>Overdue LPs</span>
                <span style={{ color: 'var(--danger-600)' }}>{overdueCount}</span>
              </div>
            </Card>
            <Card>
              <div className={styles.cardTitle}>
                <span>Distributions</span>
                <a onClick={() => navigate('/fund-manager/distributions')}>View all →</a>
              </div>
              <div className={styles.statRow}>
                <span>Distributed YTD</span>
                <span>{fmt(activeFund.dpi * 1_000_000 * 0.02)}</span>
              </div>
              <div className={styles.statRow}>
                <span>DPI</span>
                <span>{activeFund.dpi.toFixed(1)}x</span>
              </div>
              <div className={styles.statRow}>
                <span>Next Distribution</span>
                <span>Jul 20</span>
              </div>
            </Card>
          </div>

          <div className={styles.row2}>
            <Card>
              <div className={styles.cardTitle}>
                <span>My Fund Performance</span>
                <Segmented value={perfTab} onChange={(v) => setPerfTab(v as 'top' | 'low')} options={[{ key: 'top', label: 'Top' }, { key: 'low', label: 'Low' }]} />
              </div>
              <BarList items={fundPerf} />
            </Card>
            <Card>
              <div className={styles.cardTitle}>
                <span>Fund Performance</span>
                <a onClick={() => navigate('/fund-manager/fund-accounting')}>View all →</a>
              </div>
              <div className={styles.statRow}>
                <span>Blended NAV</span>
                <span>{fmt(activeFund.nav)}</span>
              </div>
              <div className={styles.statRow}>
                <span>IRR</span>
                <span>{(activeFund.irr * 100).toFixed(1)}%</span>
              </div>
              <div className={styles.statRow}>
                <span>TVPI</span>
                <span>{activeFund.tvpi.toFixed(1)}x</span>
              </div>
              <div className={styles.statRow}>
                <span>DPI</span>
                <span>{activeFund.dpi.toFixed(1)}x</span>
              </div>
              <div className={styles.statRow}>
                <span>MOIC</span>
                <span>{activeFund.moic.toFixed(1)}x</span>
              </div>
            </Card>
          </div>

          <div className={styles.row3}>
            <Card>
              <div className={styles.cardTitle}>
                <span>Fund Accounting</span>
                <a onClick={() => navigate('/fund-manager/fund-accounting')}>View all →</a>
              </div>
              <p style={{ fontSize: 12 }} className="muted">Q2 Close Progress</p>
              <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: '80%' }} />
              </div>
              <div className={styles.statRow}>
                <span>Last reconciliation</span>
                <span>3 days ago</span>
              </div>
              <div className={styles.statRow}>
                <span>Auditor access</span>
                <span style={{ color: 'var(--success-600)' }}>Active</span>
              </div>
            </Card>
            <Card>
              <div className={styles.cardTitle}>
                <span>Compliance</span>
                <a onClick={() => navigate('/fund-manager/compliance')}>View all →</a>
              </div>
              <div className={styles.statRow}>
                <span>KYC Expiring (30d)</span>
                <span style={{ color: 'var(--warning-600)' }}>{kycFlags.length} LPs</span>
              </div>
              <div className={styles.statRow}>
                <span>Outstanding Filings</span>
                <span>2</span>
              </div>
              <p style={{ fontSize: 11 }} className="muted">LEI Renewal — CSSF · Due Aug 1</p>
            </Card>
            <Card>
              <div className={styles.cardTitle}>
                <span>Investors</span>
                <a onClick={() => navigate('/fund-manager/investors')}>View all →</a>
              </div>
              <div className={styles.statRow}>
                <span>Portal Logins (7d)</span>
                <span>34</span>
              </div>
              <div className={styles.statRow}>
                <span>Pending e-Signatures</span>
                <span>1</span>
              </div>
              <div className={styles.statRow}>
                <span>New LP Onboarding</span>
                <span>1 in progress</span>
              </div>
            </Card>
          </div>

          <div className={styles.row3}>
            <Card>
              <div className={styles.cardTitle}>
                <span>Treasury</span>
                <a onClick={() => navigate('/fund-manager/treasury')}>View all →</a>
              </div>
              <div className={styles.statRow}>
                <span>Total Cash Balance</span>
                <span>{fmt(activeFund.aum * 0.03)}</span>
              </div>
              <div className={styles.statRow}>
                <span>Pending Wires</span>
                <span>3</span>
              </div>
            </Card>
            <Card>
              <div className={styles.cardTitle}>
                <span>Bunch Support</span>
              </div>
              <p style={{ fontSize: 12.5, fontWeight: 600 }}>Aylin Üzsal</p>
              <p style={{ fontSize: 11 }} className="muted">Your Key Account Manager</p>
              <div className={styles.statRow}>
                <span>Open Threads</span>
                <span>{Object.values(state.chats).filter((c) => c.parked).length}</span>
              </div>
            </Card>
            <Card>
              <div className={styles.cardTitle}>
                <span>bunch tax</span>
                <a onClick={() => navigate('/fund-manager/fund-accounting')}>View all →</a>
              </div>
              <div className={styles.statRow}>
                <span>Next Filing</span>
                <span>Aug 31</span>
              </div>
              <div className={styles.statRow}>
                <span>Investor Tax Reports</span>
                <span style={{ color: 'var(--success-600)' }}>On track</span>
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <RightPanel myTasks={myTasks} />
        </Card>
      </div>
    </div>
  );
}

function RightPanel({ myTasks }: { myTasks: { label: string; meta: string }[] }) {
  const [tab, setTab] = useState<'tasks' | 'activity'>('tasks');
  return (
    <div>
      <div className={styles.tabRow}>
        <button className={`${styles.tabBtn} ${tab === 'tasks' ? styles.tabBtnActive : ''}`} onClick={() => setTab('tasks')}>
          My Tasks
        </button>
        <button className={`${styles.tabBtn} ${tab === 'activity' ? styles.tabBtnActive : ''}`} onClick={() => setTab('activity')}>
          Activity
        </button>
      </div>
      {tab === 'tasks' ? (
        myTasks.map((t) => (
          <div className={styles.taskItem} key={t.label}>
            {t.label}
            <div className={styles.taskMeta}>{t.meta}</div>
          </div>
        ))
      ) : (
        <p className="muted" style={{ fontSize: 12 }}>
          Activity log is coming in a future pass — this tab is spec'd but not content-designed yet.
        </p>
      )}
    </div>
  );
}
