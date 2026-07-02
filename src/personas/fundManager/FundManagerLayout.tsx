import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import { useAppState } from '../../state/store';

const sections = [
  { items: [{ label: 'Dashboard', to: '/fund-manager/dashboard' }, { label: 'Portfolio', to: '/fund-manager/portfolio' }] },
  {
    title: 'Capital Activity',
    items: [
      { label: 'Funds', to: '/fund-manager/funds' },
      { label: 'Capital Calls', to: '/fund-manager/capital-calls' },
      { label: 'Reviews', to: '/fund-manager/reviews' },
      { label: 'Distributions', to: '/fund-manager/distributions' },
    ],
  },
  {
    items: [
      { label: 'Fund Accounting & Reporting', to: '/fund-manager/fund-accounting' },
      { label: 'Treasury', to: '/fund-manager/treasury' },
      { label: 'Investors', to: '/fund-manager/investors' },
      { label: 'Compliance', to: '/fund-manager/compliance' },
      { label: 'Data Room', to: '/fund-manager/data-room' },
      { label: 'Tasks', to: '/fund-manager/tasks' },
    ],
  },
];

export function FundManagerLayout() {
  const { state } = useAppState();
  return (
    <AppShell sections={sections} showFundSwitcher footerName={state.currentUser.fundManagerName} footerRole="Fund Manager">
      <Outlet />
    </AppShell>
  );
}
