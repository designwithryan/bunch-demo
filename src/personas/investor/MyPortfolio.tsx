import { PageHeader } from '../../components/AppShell';
import { KpiStrip } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { useAppState } from '../../state/store';
import { fmt, investorPortfolioRows } from '../../state/selectors';
import tableStyles from '../../components/DataTable.module.css';

export function MyPortfolio() {
  const { state } = useAppState();
  const rows = investorPortfolioRows(state);
  const totalCommitted = rows.reduce((s, r) => s + r.lp.commitment, 0);
  const totalCalled = rows.reduce((s, r) => s + r.called, 0);
  const totalDistributed = rows.reduce((s, r) => s + r.distributed, 0);

  return (
    <div>
      <PageHeader title="My Portfolio" subtitle="Every fund and deal you're committed to, across every manager" />
      <KpiStrip
        items={[
          { label: 'Total committed', value: fmt(totalCommitted) },
          { label: 'Total called to date', value: fmt(totalCalled) },
          { label: 'Total distributed', value: fmt(totalDistributed) },
          { label: 'Active funds', value: String(rows.length) },
        ]}
      />
      <div style={{ marginTop: 24 }} className={tableStyles.wrap}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Fund</th>
              <th>Manager</th>
              <th>Vintage</th>
              <th className={tableStyles.numeric}>Committed</th>
              <th className={tableStyles.numeric}>Called</th>
              <th className={tableStyles.numeric}>Distributed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.fund.id}>
                <td style={{ fontWeight: 600 }}>{r.fund.name}</td>
                <td className="muted">{r.fund.manager}</td>
                <td className="muted">{r.fund.vintage}</td>
                <td className={tableStyles.numeric}>{fmt(r.lp.commitment, r.fund.currency)}</td>
                <td className={tableStyles.numeric}>{r.called ? fmt(r.called, r.fund.currency) : '—'}</td>
                <td className={tableStyles.numeric}>{r.distributed ? fmt(r.distributed, r.fund.currency) : '—'}</td>
                <td>
                  <StatusPill label={r.fund.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
