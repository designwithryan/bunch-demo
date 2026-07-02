import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { Button, FilterChips, ViewToggle } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { NoticeDocument } from '../../components/NoticeDocument';
import { InfoCard, InfoRow, InfoLink, downloadTextFile } from '../../components/InfoCard';
import { TimelineChart, toneColor, type TimelinePoint } from '../../components/TimelineChart';
import { useAppState } from '../../state/store';
import { callsForFund, commitmentPctFor, fmt2, fmtDate, fmtDateShort, noticeStatusLabel } from '../../state/selectors';
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
        const isException = !!notice.status && ['held_kyc', 'overdue', 'grace_period', 'in_default', 'disputed'].includes(notice.status);
        if (filter === 'exceptions' && !isException) continue;
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
                        <StatusPill label={noticeStatusLabel(row.call, row.notice)} />
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

function sideTextFor(call: CapitalCall, notice: NoticeLine): { title: string; body: string } {
  switch (notice.status) {
    case 'held_kyc':
      return { title: 'Held pending KYC renewal', body: 'Will auto-dispatch once cleared by Compliance.' };
    case 'sent':
      return { title: 'Sent — awaiting payment', body: `Payment due ${fmtDate(call.dueDate)}.` };
    case 'paid':
      return { title: 'Paid', body: 'Payment received and matched.' };
    case 'overdue':
      return { title: 'Overdue', body: `Payment was due ${fmtDate(call.dueDate)} — cure period has started.` };
    case 'grace_period':
      return { title: 'Grace period', body: 'Default interest is accruing per the LPA cure period.' };
    case 'in_default':
      return { title: 'In default', body: 'Cure period closed with no payment — a remedy is required.' };
    case 'defaulted_remedied':
      return { title: 'Resolved via remedy', body: 'This LP’s default was resolved — see the audit trail for details.' };
    case 'disputed':
      return { title: 'Disputed', body: 'This LP has flagged an issue — notice is paused pending investigation.' };
    case 'recalled':
      return { title: 'Recalled', body: 'Notice recalled pending correction and resubmission.' };
    default:
      return { title: noticeStatusLabel(call, notice), body: 'Notice will generate once this call is approved.' };
  }
}

function DetailPanel({ row }: { row: Row }) {
  const { state } = useAppState();
  const lp = state.lps[row.notice.lpId];
  const fund = state.funds[row.call.fundId];
  const pct = commitmentPctFor(state, row.call, lp.id);
  const side = sideTextFor(row.call, row.notice);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div className="eyebrow" style={{ color: 'var(--danger-600)' }}>
          Selected
        </div>
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

      <InfoCard
        title="Calculation"
        onDownload={() =>
          downloadTextFile(
            `${lp.name.replace(/\s+/g, '-')}-calculation.txt`,
            `Capital call (pro-rata): ${fmt2(row.notice.capitalCall, fund.currency)}\nManagement fee: ${fmt2(row.notice.managementFee, fund.currency)}\nWorking capital: ${fmt2(row.notice.workingCapital, fund.currency)}\nTotal amount due: ${fmt2(row.notice.amountDue, fund.currency)}`
          )
        }
      >
        {row.notice.capitalCall > 0 && <InfoRow label="Capital call (pro-rata)" value={fmt2(row.notice.capitalCall, fund.currency)} />}
        {row.notice.managementFee > 0 && <InfoRow label="Management fee" value={fmt2(row.notice.managementFee, fund.currency)} />}
        {row.notice.workingCapital > 0 && <InfoRow label="Working capital" value={fmt2(row.notice.workingCapital, fund.currency)} />}
        <InfoRow label="Total amount due" value={fmt2(row.notice.amountDue, fund.currency)} total />
      </InfoCard>

      <InfoCard title="Notice" onDownload={() => downloadTextFile(`${lp.name.replace(/\s+/g, '-')}-notice.txt`, `Capital Call Notice — ${fund.name}\nTo: ${lp.name}\nAmount due: ${fmt2(row.notice.amountDue, fund.currency)}\nNotice date: ${fmtDate(row.call.noticeDate)}\nPayment deadline: ${fmtDate(row.call.dueDate)}`)}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <NoticeDocument call={row.call} notice={row.notice} fund={fund} lp={lp} commitmentPct={pct} scale="compact" />
          <div style={{ width: 140 }}>
            <p style={{ fontSize: 11, fontWeight: 500, marginBottom: 6 }}>{side.title}</p>
            <p className="muted" style={{ fontSize: 10, lineHeight: 1.5 }}>
              {side.body}
            </p>
          </div>
        </div>
      </InfoCard>

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
      <Button variant="primary" style={{ borderRadius: 999, width: '100%' }} onClick={() => dispatch({ type: 'RESOLVE_KYC', lpId: notice.lpId })}>
        Notify Compliance Officer
      </Button>
    );
  }
  if (allResolved && call.status !== 'reconciled' && (notice.status === 'paid' || notice.status === 'defaulted_remedied')) {
    return (
      <InfoLink onClick={() => navigate(`/fund-manager/capital-calls/${call.id}/reconcile`)}>
        All LPs resolved — go to Reconciliation →
      </InfoLink>
    );
  }
  return null;
}
