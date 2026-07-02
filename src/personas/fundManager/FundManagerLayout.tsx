import { Outlet } from 'react-router-dom';
import { AppShell } from '../../components/AppShell';
import type { NavSection } from '../../components/Sidebar';
import { useAppState } from '../../state/store';

const sections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/fund-manager/dashboard', icon: 'dashboard' },
      { label: 'Portfolio', to: '/fund-manager/portfolio', icon: 'portfolio' },
    ],
  },
  {
    title: 'Capital Activity',
    items: [
      { label: 'Funds', to: '/fund-manager/funds', icon: 'funds' },
      { label: 'Capital Calls', to: '/fund-manager/capital-calls', icon: 'capitalCalls' },
      { label: 'Reviews', to: '/fund-manager/reviews', icon: 'reviews' },
      { label: 'Distributions', to: '/fund-manager/distributions', icon: 'distributions' },
    ],
  },
  {
    items: [
      { label: 'Fund Accounting & Reporting', to: '/fund-manager/fund-accounting', icon: 'fundAccounting' },
      { label: 'Treasury', to: '/fund-manager/treasury', icon: 'treasury' },
      { label: 'Investors', to: '/fund-manager/investors', icon: 'investors' },
      { label: 'Compliance', to: '/fund-manager/compliance', icon: 'compliance' },
      { label: 'Data Room', to: '/fund-manager/data-room', icon: 'dataRoom' },
      { label: 'Tasks', to: '/fund-manager/tasks', icon: 'tasks' },
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
