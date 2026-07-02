import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { FilterChips, ViewToggle } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { TimelineChart, toneColor } from '../../components/TimelineChart';
import { useAppState } from '../../state/store';
import { fmt2, fmtDateShort, investorNoticesAcrossFunds, NOTICE_LABEL } from '../../state/selectors';
import type { NoticeStatus } from '../../data/types';
import tableStyles from '../../components/DataTable.module.css';

// investorNoticesAcrossFunds only ever returns notices that have actually
// been generated, so `status` is always defined here — "Sent"/"Held" are
// re-worded slightly for the LP-facing audience.
function investorNoticeLabel(status: NoticeStatus) {
  if (status === 'sent' || status === 'held_kyc') return 'Awaiting your payment';
  return NOTICE_LABEL[status];
}

export function InvestorCapitalCalls() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const entries = investorNoticesAcrossFunds(state);
  const noticeFor = (call: (typeof entries)[number]['call'], lpId: string) => call.notices.find((n) => n.lpId === lpId)!;

  const filtered = entries.filter(({ call, lpId }) => {
    const notice = noticeFor(call, lpId);
    if (filter === 'pending') return notice.status === 'sent' || notice.status === 'held_kyc';
    if (filter === 'paid') return notice.status === 'paid' || notice.status === 'defaulted_remedied';
    if (filter === 'overdue') return notice.status === 'overdue' || notice.status === 'grace_period' || notice.status === 'in_default';
    return true;
  });

  const counts = {
    all: entries.length,
    pending: entries.filter(({ call, lpId }) => ['sent', 'held_kyc'].includes(noticeFor(call, lpId).status as string)).length,
    paid: entries.filter(({ call, lpId }) => ['paid', 'defaulted_remedied'].includes(noticeFor(call, lpId).status as string)).length,
    overdue: entries.filter(({ call, lpId }) => ['overdue', 'grace_period', 'in_default'].includes(noticeFor(call, lpId).status as string)).length,
  };

  const timelinePoints = entries.map(({ call, lpId }) => {
    const notice = noticeFor(call, lpId);
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
              {filtered.map(({ call, lpId }) => {
                const notice = noticeFor(call, lpId);
                const fund = state.funds[call.fundId];
                return (
                  <tr key={call.id} className={tableStyles.rowClickable} onClick={() => navigate(`/investor/capital-calls/${call.id}`)}>
                    <td style={{ fontWeight: 600 }}>{fund.name}</td>
                    <td>{call.purpose}</td>
                    <td className={tableStyles.numeric}>{fmt2(notice.amountDue, fund.currency)}</td>
                    <td className="muted">{fmtDateShort(call.noticeDate)}</td>
                    <td className="muted">{fmtDateShort(call.dueDate)}</td>
                    <td>
                      <StatusPill label={investorNoticeLabel(notice.status!)} />
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
