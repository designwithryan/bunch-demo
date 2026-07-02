import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { FilterChips, ViewToggle } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { TimelineChart, toneColor } from '../../components/TimelineChart';
import { useAppState } from '../../state/store';
import { fmt2, fmtDateShort, investorLp, investorNoticesAcrossFunds, NOTICE_LABEL } from '../../state/selectors';
import tableStyles from '../../components/DataTable.module.css';

function investorNoticeLabel(status: string) {
  if (status === 'not_sent' || status === 'held_kyc') return 'Awaiting your payment';
  if (status === 'sent' || status === 'overdue' || status === 'grace_period') return status === 'sent' ? 'Awaiting your payment' : NOTICE_LABEL[status as keyof typeof NOTICE_LABEL];
  return NOTICE_LABEL[status as keyof typeof NOTICE_LABEL] ?? status;
}

export function InvestorCapitalCalls() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const lp = investorLp(state);
  const entries = investorNoticesAcrossFunds(state);

  const filtered = entries.filter(({ call }) => {
    const notice = call.notices.find((n) => n.lpId === lp.id)!;
    if (filter === 'pending') return notice.status === 'sent' || notice.status === 'not_sent';
    if (filter === 'paid') return notice.status === 'paid' || notice.status === 'defaulted_remedied';
    if (filter === 'overdue') return notice.status === 'overdue' || notice.status === 'grace_period' || notice.status === 'in_default';
    return true;
  });

  const counts = {
    all: entries.length,
    pending: entries.filter(({ call }) => ['sent', 'not_sent'].includes(call.notices.find((n) => n.lpId === lp.id)!.status)).length,
    paid: entries.filter(({ call }) => ['paid', 'defaulted_remedied'].includes(call.notices.find((n) => n.lpId === lp.id)!.status)).length,
    overdue: entries.filter(({ call }) => ['overdue', 'grace_period', 'in_default'].includes(call.notices.find((n) => n.lpId === lp.id)!.status)).length,
  };

  const timelinePoints = entries.map(({ call }) => {
    const notice = call.notices.find((n) => n.lpId === lp.id)!;
    const tone = notice.status === 'paid' ? 'success' : notice.status === 'overdue' || notice.status === 'in_default' ? 'danger' : 'warning';
    return {
      date: call.noticeDate,
      label: call.purpose,
      sub: fmt2(notice.amountDue, state.funds[call.fundId].currency),
      color: toneColor(tone),
    };
  });

  return (
    <div>
      <PageHeader title="Capital Calls" subtitle="Every call you've received, across every fund you're committed to" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'pending', label: `Pending payment (${counts.pending})` },
            { key: 'paid', label: `Paid (${counts.paid})` },
            { key: 'overdue', label: `Overdue (${counts.overdue})` },
          ]}
        />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === 'timeline' ? (
        <TimelineChart
          points={timelinePoints}
          legend={[
            { label: 'Paid', color: toneColor('success') },
            { label: 'Awaiting your payment', color: toneColor('warning') },
            { label: 'Overdue', color: toneColor('danger') },
          ]}
        />
      ) : (
        <div className={tableStyles.wrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Fund</th>
                <th>Call</th>
                <th className={tableStyles.numeric}>Amount</th>
                <th>Notice date</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ call }) => {
                const notice = call.notices.find((n) => n.lpId === lp.id)!;
                const fund = state.funds[call.fundId];
                return (
                  <tr key={call.id} className={tableStyles.rowClickable} onClick={() => navigate(`/investor/capital-calls/${call.id}`)}>
                    <td style={{ fontWeight: 600 }}>{fund.name}</td>
                    <td>{call.purpose}</td>
                    <td className={tableStyles.numeric}>{fmt2(notice.amountDue, fund.currency)}</td>
                    <td className="muted">{fmtDateShort(call.noticeDate)}</td>
                    <td className="muted">{fmtDateShort(call.dueDate)}</td>
                    <td>
                      <StatusPill label={investorNoticeLabel(notice.status)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
