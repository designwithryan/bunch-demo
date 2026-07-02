import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { Button, FilterChips, ViewToggle } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { NoticeDocument } from '../../components/NoticeDocument';
import { TimelineChart, toneColor, type TimelinePoint } from '../../components/TimelineChart';
import { useAppState } from '../../state/store';
import { callsForFund, commitmentPctFor, fmt2, fmtDateShort, NOTICE_LABEL } from '../../state/selectors';
import type { CapitalCall, NoticeLine } from '../../data/types';
import tableStyles from '../../components/DataTable.module.css';

type Row = { call: CapitalCall; notice: NoticeLine };

export function FundManagerCapitalCalls() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState<Row | null>(null);

  const fund = state.funds[state.activeFundId];
  const calls = callsForFund(state, state.activeFundId);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const call of calls) {
      if (filter === 'scheduled' && call.type !== 'scheduled') continue;
      if (filter === 'one-time' && call.type !== 'one-time') continue;
      for (const notice of call.notices) {
        if (filter === 'exceptions' && !['held_kyc', 'overdue', 'grace_period', 'in_default', 'disputed'].includes(notice.status)) continue;
        out.push({ call, notice });
      }
    }
    return out;
  }, [calls, filter]);

  const current = selected ?? rows[0] ?? null;

  const timelinePoints: TimelinePoint[] = calls.map((c) => ({
    date: c.noticeDate,
    label: c.purpose,
    sub: `€${(c.notices.reduce((s, n) => s + n.amountDue, 0) / 1_000_000).toFixed(2)}M`,
    color:
      c.status === 'reconciled' || c.status === 'fully_paid'
        ? toneColor('success')
        : c.status === 'changes_requested'
        ? toneColor('danger')
        : c.type === 'scheduled'
        ? toneColor('neutral')
        : toneColor('info'),
    projected: c.status === 'draft',
  }));

  return (
    <div>
      <PageHeader
        title="Capital Calls"
        subtitle="Everything happening with capital — scheduled and one-time, in one place"
        actions={
          <Button variant="primary" onClick={() => navigate('/fund-manager/capital-calls/new')}>
            + New Capital Call
          </Button>
        }
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: 'All calls' },
            { key: 'scheduled', label: 'Scheduled' },
            { key: 'one-time', label: 'One-time' },
            { key: 'exceptions', label: 'Exceptions' },
          ]}
        />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === 'timeline' ? (
        <TimelineChart
          points={timelinePoints}
          legend={[
            { label: 'Recurring / scheduled', color: toneColor('neutral') },
            { label: 'One-time (realized)', color: toneColor('info') },
            { label: 'One-time (projected)', color: toneColor('info'), projected: true },
          ]}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, alignItems: 'flex-start' }}>
          <div className={tableStyles.wrap}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Call</th>
                  <th>Investor</th>
                  <th>Country</th>
                  <th>Notice → Due</th>
                  <th className={tableStyles.numeric}>Committed</th>
                  <th className={tableStyles.numeric}>Amount Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const lp = state.lps[row.notice.lpId];
                  const isSelected = current && current.call.id === row.call.id && current.notice.lpId === row.notice.lpId;
                  return (
                    <tr
                      key={row.call.id + row.notice.lpId + i}
                      className={`${tableStyles.rowClickable} ${isSelected ? tableStyles.rowSelected : ''} ${row.notice.flagged ? tableStyles.rowFlagged : ''}`}
                      onClick={() => setSelected(row)}
                    >
                      <td>{row.call.type === 'scheduled' ? 'Sched.' : 'One-time'}</td>
                      <td style={{ fontWeight: row.notice.flagged ? 600 : 500 }}>{row.call.purpose}</td>
                      <td>{lp?.name}</td>
                      <td>{lp?.country}</td>
                      <td className="muted">
                        {fmtDateShort(row.call.noticeDate)} → {fmtDateShort(row.call.dueDate)}
                      </td>
                      <td className={tableStyles.numeric}>{fmt2(lp?.commitment ?? 0, fund.currency)}</td>
                      <td className={tableStyles.numeric}>{fmt2(row.notice.amountDue, fund.currency)}</td>
                      <td>
                        <StatusPill label={row.notice.flagged ? 'Held — flagged' : NOTICE_LABEL[row.notice.status]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            {current ? (
              <DetailPanel row={current} />
            ) : (
              <p className="muted" style={{ fontSize: 12 }}>
                No calls match this filter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailPanel({ row }: { row: Row }) {
  const { state } = useAppState();
  const lp = state.lps[row.notice.lpId];
  const fund = state.funds[row.call.fundId];
  const pct = commitmentPctFor(state, row.call, lp.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="eyebrow">Selected</div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginTop: 4 }}>{lp.name}</h3>
        <p className="muted" style={{ fontSize: 12 }}>
          {lp.country} · {row.call.purpose}
        </p>
      </div>
      {row.notice.flagReason && (
        <div style={{ background: 'var(--danger-100)', color: 'var(--danger-600)', padding: 10, borderRadius: 8, fontSize: 12 }}>
          🚩 {row.notice.flagReason}
        </div>
      )}
      <NoticeDocument call={row.call} notice={row.notice} fund={fund} lp={lp} commitmentPct={pct} scale="zoom" />
      <RowActions row={row} />
    </div>
  );
}

function RowActions({ row }: { row: Row }) {
  const { dispatch } = useAppState();
  const navigate = useNavigate();
  const { call, notice } = row;
  const allResolved = call.notices.every((n) => n.status === 'paid' || n.status === 'defaulted_remedied' || n.status === 'held_kyc');

  if (notice.status === 'in_default') {
    return (
      <Button variant="danger" onClick={() => navigate(`/fund-manager/capital-calls/${call.id}/default/${notice.lpId}`)}>
        Resolve Default →
      </Button>
    );
  }
  if (notice.status === 'held_kyc') {
    return (
      <Button variant="secondary" onClick={() => dispatch({ type: 'RESOLVE_KYC', lpId: notice.lpId })}>
        Simulate: Compliance clears KYC
      </Button>
    );
  }
  if (notice.status === 'sent' || notice.status === 'overdue' || notice.status === 'grace_period') {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" onClick={() => dispatch({ type: 'MARK_LP_PAID', callId: call.id, lpId: notice.lpId })}>
          Simulate: Mark Paid
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'ADVANCE_OVERDUE', callId: call.id, lpId: notice.lpId })}>
          Simulate: Advance to next stage
        </Button>
      </div>
    );
  }
  if (allResolved && call.status !== 'reconciled' && (notice.status === 'paid' || notice.status === 'defaulted_remedied')) {
    return (
      <Button variant="primary" onClick={() => navigate(`/fund-manager/capital-calls/${call.id}/reconcile`)}>
        Go to Reconciliation →
      </Button>
    );
  }
  return null;
}
